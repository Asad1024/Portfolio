import { guideSystemPrompt, SECTIONS } from "@/lib/assistant/prompt";
import { projects } from "@/lib/data";

/* ── the guide's brain ──────────────────────────────────────────────────────
   POST a short conversation and where the visitor is on the site; get the
   reply back as a plain text stream in the reply protocol
   (src/lib/assistant/protocol.ts).

   The OpenAI key lives only on the server (OPENAI_KEY, or OPENAI_API_KEY).
   Without one, or if OpenAI refuses, this answers with a JSON `fallback` and
   a reason, and the guide answers from its offline engine instead — the site
   never breaks because of the model.

   Guard rails, because this spends real money on a public page: a short
   history, short messages, a small reply budget, and a per-visitor rate
   limit. The limiter is in memory, which on a serverless host is per
   instance; it stops a casual loop, not a determined attacker, so keep a
   spending cap on the OpenAI account as well. A visitor who closes the panel
   mid-answer cancels the upstream request too, so an abandoned answer
   stops costing tokens. */

// a small, fast model: a guide answers in seconds or it isn't a guide
const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const MAX_TURNS = 12;
// a pasted job description is long; earlier turns are trimmed harder
const MAX_QUESTION = 4000;
const MAX_CHARS = 1500;
const MAX_TOTAL = 9000;
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 24;
const FIRST_MS = 12_000;
const IDLE_MS = 15_000;

const hits = new Map<string, number[]>();

/** Returns the seconds until the visitor may ask again, or 0. */
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return Math.ceil((recent[0] + WINDOW_MS - now) / 1000);
  recent.push(now);
  hits.set(ip, recent);
  // bounded memory, without wiping everyone's count at once: the oldest
  // visitors (first in the map) make room
  if (hits.size > 5000) [...hits.keys()].slice(0, 1000).forEach((k) => hits.delete(k));
  return 0;
}

/* Who's asking, from headers the visitor can't set: the platform's own
   client-IP header first (Vercel sets x-real-ip), else the hop the nearest
   proxy appended to x-forwarded-for — the leftmost entry is whatever the
   client chose to send. */
function clientIp(request: Request) {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const hops = request.headers.get("x-forwarded-for")?.split(",").map((h) => h.trim()).filter(Boolean);
  return hops?.at(-1) || "local";
}

type Turn = { role: "user" | "assistant"; content: string };

const fallback = (reason: string, status: number, extra: Record<string, unknown> = {}) =>
  Response.json({ fallback: true, reason, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const key = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
  if (!key) return fallback("no-key", 503);

  const ip = clientIp(request);
  const wait = limited(ip);
  if (wait) return fallback("rate-limit", 429, { retryAfter: wait });

  let body: { messages?: unknown; page?: unknown; section?: unknown; focus?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad-json" }, { status: 400 });
  }

  // where the visitor is, reduced to values the prompt already knows about
  const page = typeof body.page === "string" && /^\/[\w\-/]{0,80}$/.test(body.page) ? body.page : "/";
  const section = typeof body.section === "string" && body.section in SECTIONS ? body.section : undefined;
  const focus = typeof body.focus === "string" && projects.some((p) => p.slug === body.focus) ? body.focus : undefined;

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter(
      (m): m is Turn =>
        !!m &&
        typeof m === "object" &&
        ((m as Turn).role === "user" || (m as Turn).role === "assistant") &&
        typeof (m as Turn).content === "string" &&
        !!(m as Turn).content.trim(),
    )
    .slice(-MAX_TURNS)
    .map((m, i, all) => ({ role: m.role, content: m.content.slice(0, i === all.length - 1 ? MAX_QUESTION : MAX_CHARS) }));
  // a ceiling on the whole history too, so a forged one can't turn this into
  // a long-context proxy on the site's key: oldest turns go first
  while (messages.length > 1 && messages.reduce((n, m) => n + m.content.length, 0) > MAX_TOTAL) messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "no-question" }, { status: 400 });
  }

  /* One controller for the whole upstream call: the visitor leaving aborts
     it, and so does OpenAI going quiet. "Quiet" is measured in words, not
     bytes — a stream can stay open on keep-alives while saying nothing. So
     the reply isn't committed to until its first words arrive (FIRST_MS);
     until then a stall still falls back cleanly to the offline engine. After
     that, IDLE_MS without a word ends the reply. A guide that hangs is worse
     than one that answers from notes. */
  const upstreamCtrl = new AbortController();
  const abort = () => upstreamCtrl.abort();
  request.signal.addEventListener("abort", abort);
  const done = () => request.signal.removeEventListener("abort", abort);
  const roleMatch = /^role match:/i.test(messages[messages.length - 1].content);
  const started = Date.now();
  let watchdog = setTimeout(abort, FIRST_MS);

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      // GPT-5 models take a completion budget (reasoning included) and an
      // effort level rather than temperature / max_tokens. A guide answers
      // from facts it is handed, so it skips reasoning and starts talking in
      // about a second; a role match is worth a little thought.
      reasoning_effort: process.env.OPENAI_REASONING || (roleMatch ? "low" : "none"),
      max_completion_tokens: 1100,
      messages: [{ role: "system", content: guideSystemPrompt({ page, section, focus }) }, ...messages],
    }),
    signal: upstreamCtrl.signal,
  }).catch(() => null);

  if (!upstream || !upstream.ok || !upstream.body) {
    clearTimeout(watchdog);
    upstream?.body?.cancel().catch(() => {});
    done();
    return fallback(`upstream-${upstream?.status ?? (upstreamCtrl.signal.aborted ? "timeout" : "down")}`, 503);
  }

  // OpenAI streams server-sent events; only the text is passed on
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let finished = false;
  const words: string[] = [];
  const parse = (line: string) => {
    const data = line.replace(/^data:\s*/, "").trim();
    if (!data || data === "[DONE]") return;
    try {
      const delta = JSON.parse(data).choices?.[0]?.delta?.content;
      if (delta) words.push(delta);
    } catch {
      // a partial or keep-alive line; the next chunk completes it
    }
  };
  const readMore = async () => {
    const { done: end, value } = await reader.read();
    if (end) {
      if (buffer) parse(buffer);
      buffer = "";
      finished = true;
      return;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(parse);
  };

  // hold the reply until it has something to say
  try {
    while (!words.length && !finished) await readMore();
  } catch {
    // aborted: the first words didn't come in time, or the visitor left
  }
  clearTimeout(watchdog);
  if (!words.length) {
    reader.cancel().catch(() => {});
    done();
    const slow = Date.now() - started >= FIRST_MS;
    return fallback(slow ? "upstream-stalled" : "upstream-empty", 503);
  }

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        if (words.length) {
          controller.enqueue(encoder.encode(words.splice(0).join("")));
          return;
        }
        if (finished) {
          done();
          controller.close();
          return;
        }
        watchdog = setTimeout(abort, IDLE_MS);
        while (!words.length && !finished) await readMore();
        clearTimeout(watchdog);
      } catch (err) {
        clearTimeout(watchdog);
        done();
        controller.error(err);
      }
    },
    cancel() {
      clearTimeout(watchdog);
      done();
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
