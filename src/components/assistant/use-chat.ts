"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { contact, experience, pillars, projects } from "@/lib/data";
import { offlineAnswer, type Kb } from "@/lib/assistant/knowledge";
import { parseReply } from "@/lib/assistant/protocol";

/* ── the conversation ───────────────────────────────────────────────────────
   Owns the thread and talks to /api/guide. A reply streams in token by token;
   it can be stopped, retried, or regenerated. When the live model can't
   answer (no key, rate limited, provider down, network gone) the offline
   engine answers instead, in the same protocol, and `mode` says which is
   speaking so the panel can be honest about it.

   The thread survives a reload for the rest of the session, so a visitor who
   opens a case study and comes back still has their conversation. */

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** assistant only: still arriving, finished, cut short, or failed */
  status?: "streaming" | "done" | "stopped" | "error";
  /** assistant only: who answered */
  source?: "live" | "offline";
};

/** live: the model is answering. offline: no model on this deployment.
 *  limited: the visitor hit the rate limit; offline answers until it lifts. */
export type Mode = "unknown" | "live" | "offline" | "limited";

const KB: Kb = { projects, experience, pillars, contact };
const STORE = "assistant-thread";
const MAX_STORED = 40;
const WAIT_MS = 20_000;
/** how often streamed text is handed to React, at most */
const FLUSH_MS = 50;

let seq = 0;
const uid = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

function load(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORE);
    const parsed = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    // a reply that was streaming when the page went away is as far as it got
    return Array.isArray(parsed)
      ? parsed.map((m) => (m.status === "streaming" ? { ...m, status: m.content ? "stopped" : "error" } : m))
      : [];
  } catch {
    return [];
  }
}

/** The project a conversation is about, so "what was the hardest part?"
 *  can be answered without naming it again. */
export function focusOf(messages: ChatMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "assistant") continue;
    const r = parseReply(m.content);
    const slug = r.projects[0] ?? r.buttons.find((b) => b.kind === "open")?.arg?.split("/")[2];
    if (slug) return slug;
  }
  return undefined;
}

export function useChat({ page, section }: { page: string; section: () => string | undefined }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<Mode>("unknown");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Stop for the reply in flight (set by run, so it knows the reply's own state)
  const haltRef = useRef<(() => void) | null>(null);
  // a question asked while a reply is still arriving waits its turn
  const queuedRef = useRef<string | null>(null);
  // nothing is written back until the saved thread has been read, or the
  // first (empty) render would erase it
  const [hydrated, setHydrated] = useState(false);
  // the latest thread, for callbacks that run after a render has committed
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /* eslint-disable react-hooks/set-state-in-effect -- restoring this session's thread after mount */
  useEffect(() => {
    setMessages(load());
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated || busy) return; // write once a reply settles, not on every token
    try {
      if (messages.length) sessionStorage.setItem(STORE, JSON.stringify(messages.slice(-MAX_STORED)));
      else sessionStorage.removeItem(STORE);
    } catch {}
  }, [messages, busy, hydrated]);


  /** Answer the last user message in `thread`. */
  const run = useCallback(
    async (thread: ChatMessage[]) => {
      const question = thread[thread.length - 1].content;
      const reply: ChatMessage = { id: uid(), role: "assistant", content: "", status: "streaming" };
      setMessages([...thread, reply]);
      setBusy(true);
      // a reply only ever changes itself: after "new conversation" mid-answer
      // its last few writes find nothing and do nothing
      const patchLast = (fn: (m: ChatMessage) => ChatMessage) =>
        setMessages((all) => all.map((m) => (m.id === reply.id ? fn(m) : m)));
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      // the visitor pressing Stop, as distinct from the watchdog giving up
      let userStopped = false;
      haltRef.current = () => {
        userStopped = true;
        ctrl.abort();
      };
      // how much of this reply has arrived, kept here rather than read back
      // from state, which may not have caught up yet when an error lands
      let received = 0;
      /* Text is gathered and handed to React at most every FLUSH_MS, not on
         every chunk: a live stream can deliver dozens a second and the
         offline answer arrives a word every 14ms, and each hand-over
         re-renders the assistant and re-parses the reply's markdown. A few
         words at a time still reads as typing. */
      let pending = "";
      let flushTimer: ReturnType<typeof setTimeout> | undefined;
      const flush = () => {
        clearTimeout(flushTimer);
        flushTimer = undefined;
        if (!pending) return;
        const text = pending;
        pending = "";
        patchLast((m) => ({ ...m, content: m.content + text }));
      };
      const append = (chunk: string) => {
        received += chunk.length;
        pending += chunk;
        flushTimer ??= setTimeout(flush, FLUSH_MS);
      };
      const focus = focusOf(thread);
      // no reply at all within WAIT_MS: give up on the live model and answer
      // from notes, rather than leave the visitor watching a spinner
      const watchdog = setTimeout(() => ctrl.abort(), WAIT_MS);
      const stopped = () => userStopped;

      const offline = async (why: Mode) => {
        setMode(why);
        patchLast((m) => ({ ...m, source: "offline" }));
        const text = offlineAnswer(question, KB, { page, focus });
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        // the built-in answer arrives in short runs rather than all at once
        for (const piece of text.match(/\S+\s*|\s+/g) ?? []) {
          if (stopped()) return;
          append(piece);
          if (!reduced) await new Promise((r) => setTimeout(r, 14));
        }
      };

      try {
        const history = thread
          .filter((m) => m.content.trim() && m.status !== "error")
          .slice(-12)
          .map((m) => ({ role: m.role, content: m.content }));
        const res = await fetch("/api/guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, page, section: section(), focus }),
          signal: ctrl.signal,
        });
        clearTimeout(watchdog);
        if (!res.ok || !res.body) {
          const info = (await res.json().catch(() => ({}))) as { reason?: string };
          await offline(info.reason === "rate-limit" ? "limited" : "offline");
        } else {
          setMode("live");
          patchLast((m) => ({ ...m, source: "live" }));
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            append(decoder.decode(value, { stream: true }));
          }
        }
        flush();
        patchLast((m) => ({ ...m, status: stopped() ? "stopped" : "done" }));
      } catch {
        clearTimeout(watchdog);
        flush();
        if (stopped()) {
          patchLast((m) => ({ ...m, status: "stopped" }));
        } else {
          // the network went mid-reply: keep what arrived, or answer offline
          if (received) patchLast((m) => ({ ...m, status: "error" }));
          else {
            await offline("offline");
            flush();
            patchLast((m) => ({ ...m, status: stopped() ? "stopped" : "done" }));
          }
        }
      } finally {
        flush();
        if (abortRef.current === ctrl) {
          abortRef.current = null;
          haltRef.current = null;
        }
        setBusy(false);
      }
    },
    [page, section],
  );

  const send = useCallback(
    (text: string) => {
      const q = text.trim().slice(0, 4000);
      if (!q) return;
      if (abortRef.current) {
        queuedRef.current = q;
        return;
      }
      run([...messagesRef.current, { id: uid(), role: "user", content: q }]);
    },
    [run],
  );

  const stop = useCallback(() => {
    queuedRef.current = null;
    haltRef.current?.();
  }, []);

  // the queued question goes as soon as the reply before it has settled
  useEffect(() => {
    if (busy || !queuedRef.current) return;
    const q = queuedRef.current;
    queuedRef.current = null;
    send(q);
  }, [busy, send]);

  /** Ask the last question again, replacing its answer. */
  const regenerate = useCallback(() => {
    if (abortRef.current) return;
    const all = messagesRef.current;
    const lastUser = all.findLastIndex((m) => m.role === "user");
    if (lastUser !== -1) run(all.slice(0, lastUser + 1));
  }, [run]);

  const reset = useCallback(() => {
    queuedRef.current = null;
    haltRef.current?.();
    setMessages([]);
  }, []);

  // a closed tab mid-answer shouldn't keep a request open
  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, mode, busy, send, stop, regenerate, reset };
}
