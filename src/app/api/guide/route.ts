import { guideSystemPrompt } from "@/lib/guide-context";

/* ── the guide's brain ──────────────────────────────────────────────────────
   POST a short conversation, get the reply back as a plain text stream.

   The OpenAI key lives only on the server (OPENAI_KEY, or OPENAI_API_KEY).
   Without one, or if OpenAI refuses, this answers 503 and the guide falls back
   to its built-in answers — the site never breaks because of the model.

   Guard rails, because this spends real money on a public page: a short
   history, short messages, a small reply budget, and a per-visitor rate
   limit. The limiter is in memory, which on a serverless host is per
   instance; it stops a casual loop, not a determined attacker, so keep a
   spending cap on the OpenAI account as well. */

// a small, fast model: a guide answers in seconds or it isn't a guide
const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const MAX_TURNS = 10;
const MAX_CHARS = 600;
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 20;

const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

type Turn = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const key = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ fallback: true, reason: "no-key" }, { status: 503 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ fallback: true, reason: "rate-limit" }, { status: 429 });

  let body: { messages?: unknown; page?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad-json" }, { status: 400 });
  }
  const page = typeof body.page === "string" ? body.page.slice(0, 80) : "/";
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter(
      (m): m is Turn =>
        !!m &&
        typeof m === "object" &&
        ((m as Turn).role === "user" || (m as Turn).role === "assistant") &&
        typeof (m as Turn).content === "string",
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "no-question" }, { status: 400 });
  }

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      // GPT-5 models take a completion budget (reasoning included) and an
      // effort level rather than temperature / max_tokens
      reasoning_effort: "low",
      max_completion_tokens: 900,
      messages: [{ role: "system", content: guideSystemPrompt(page) }, ...messages],
    }),
  }).catch(() => null);

  if (!upstream || !upstream.ok || !upstream.body) {
    return Response.json({ fallback: true, reason: `upstream-${upstream?.status ?? "down"}` }, { status: 503 });
  }

  // OpenAI streams server-sent events; pass on only the text
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const data = line.replace(/^data:\s*/, "").trim();
        if (!data || data === "[DONE]") continue;
        try {
          const delta = JSON.parse(data).choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        } catch {
          // a partial or keep-alive line; the next chunk completes it
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
