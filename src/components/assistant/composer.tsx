"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ArrowUp, Briefcase, Mic, Square, X } from "lucide-react";
import { ROLE_MATCH } from "@/lib/assistant/knowledge";

/* The input: a textarea that grows with what's typed (Enter sends,
   Shift+Enter breaks a line), a microphone where the browser can listen, and
   a stop button while a reply is arriving. In role-match mode it becomes a
   paste box for a job description. */

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function recognizer(): Recognition | null {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

/* What's typed survives the panel closing (Esc, or a tap on a card that
   navigates): a pasted job description shouldn't vanish. One composer on
   the page, so one place to keep it. */
const kept = { draft: "", match: false };

export type ComposerHandle = { focus: () => void; roleMatch: () => void };

const LIMIT = 4000;

export const Composer = forwardRef<
  ComposerHandle,
  { busy: boolean; onSend: (text: string) => void; onStop: () => void; autoFocus: boolean }
>(function Composer({ busy, onSend, onStop, autoFocus }, ref) {
  const [draft, setDraft] = useState(kept.draft);
  const [match, setMatch] = useState(kept.match);
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const rec = useRef<Recognition | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => area.current?.focus(),
    roleMatch: () => {
      setMatch(true);
      requestAnimationFrame(() => area.current?.focus());
    },
  }));

  // feature detection needs the browser
  useEffect(() => {
    setCanListen(!!recognizer());
  }, []);

  useEffect(() => {
    if (autoFocus) area.current?.focus();
  }, [autoFocus]);

  // grow with the text, up to a limit, then scroll
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, match ? 220 : 132)}px`;
  }, [draft, match]);

  useEffect(() => () => rec.current?.stop(), []);

  useEffect(() => {
    kept.draft = draft;
    kept.match = match;
  }, [draft, match]);

  const submit = useCallback(() => {
    const text = draft.trim();
    if (!text || busy) return;
    // a recogniser still delivers its last result after stop(); it mustn't
    // put the question just sent back in the box
    if (rec.current) rec.current.onresult = null;
    rec.current?.stop();
    onSend(match ? `${ROLE_MATCH}\n${text}` : text);
    setDraft("");
    setMatch(false);
  }, [busy, draft, match, onSend]);

  const listen = () => {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const r = recognizer();
    if (!r) return;
    const before = draft ? `${draft.trimEnd()} ` : "";
    r.lang = navigator.language || "en-US";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      let said = "";
      for (let i = 0; i < e.results.length; i++) said += e.results[i][0].transcript;
      setDraft((before + said).slice(0, LIMIT));
    };
    r.onend = () => {
      setListening(false);
      rec.current = null;
      area.current?.focus();
    };
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="relative px-3 pb-3 pt-2"
    >
      {match && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2">
          <p className="flex items-center gap-2 text-[11.5px] text-violet-200">
            <Briefcase className="size-3.5" />
            <span>
              <strong className="font-semibold">Role match</strong> — paste a job description; I&apos;ll map it to Asad&apos;s shipped work.
            </span>
          </p>
          <button type="button" onClick={() => setMatch(false)} aria-label="Leave role match" className="as-icon-btn !size-6">
            <X className="size-3.5" />
          </button>
        </div>
      )}
      <div
        className={`flex items-end gap-1.5 rounded-2xl border bg-black/35 p-1.5 pl-3.5 transition-[border-color,box-shadow] focus-within:shadow-[0_0_0_4px_rgba(34,211,238,0.08)] ${
          listening ? "border-rose-400/60" : "border-white/10 focus-within:border-accent/55"
        }`}
      >
        <textarea
          ref={area}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, LIMIT))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={listening ? "Listening…" : match ? "Paste the job description here…" : "Ask anything about Asad…"}
          aria-label={match ? "Job description" : "Ask Asad's Assistant"}
          className="max-h-[220px] min-h-[36px] w-full resize-none bg-transparent [scrollbar-width:thin] py-2 text-[13.5px] leading-relaxed text-fg outline-none placeholder:text-muted/60"
        />
        {canListen && !busy && (
          <button
            type="button"
            onClick={listen}
            aria-label={listening ? "Stop listening" : "Speak your question"}
            aria-pressed={listening}
            className={`relative flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
              listening ? "bg-rose-500/20 text-rose-300" : "text-muted hover:bg-white/5 hover:text-fg"
            }`}
          >
            {listening && <span aria-hidden className="absolute inset-0 animate-ping rounded-xl bg-rose-400/20 motion-reduce:animate-none" />}
            <Mic className="relative size-4" />
          </button>
        )}
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop the answer"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-fg transition-colors hover:bg-white/10"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send"
            className="as-btn-solid flex size-9 shrink-0 items-center justify-center rounded-xl transition-opacity disabled:opacity-25 disabled:shadow-none"
          >
            <ArrowUp className="size-4" strokeWidth={2.5} />
          </button>
        )}
      </div>
      {draft.length > LIMIT * 0.8 && (
        <p className="mt-1 px-1 text-right font-sans text-[10px] tabular-nums text-muted/60">
          {draft.length}/{LIMIT}
        </p>
      )}
    </form>
  );
});
