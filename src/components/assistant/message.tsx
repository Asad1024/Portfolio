"use client";

import { memo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Compass, Copy, Download, Mail, Navigation, RotateCcw } from "lucide-react";
import { parseReply, type ButtonKind } from "@/lib/assistant/protocol";
import { ROLE_MATCH } from "@/lib/assistant/knowledge";
import type { ChatMessage } from "./use-chat";
import { ContactCard, FitGauge, Markdown, ProjectCard } from "./rich";

/* One turn of the conversation. A reply is parsed on every render (it is
   short, and while streaming it changes every frame anyway): prose, then the
   cards it asked for, then its buttons; the newest reply also offers its
   follow-up questions. */

export type Act = {
  button: (kind: ButtonKind, arg?: string) => void;
  open: (href: string) => void;
  email: () => void;
  ask: (q: string) => void;
};

const BUTTON_ICON: Record<ButtonKind, typeof Mail> = {
  open: ArrowUpRight,
  scroll: Navigation,
  email: Mail,
  resume: Download,
  tour: Compass,
};

export const UserMessage = memo(function UserMessage({ m }: { m: ChatMessage }) {
  const [more, setMore] = useState(false);
  const isMatch = m.content.toLowerCase().startsWith(ROLE_MATCH.toLowerCase());
  const body = isMatch ? m.content.slice(ROLE_MATCH.length).trim() : m.content;
  const long = body.length > 280;
  return (
    <div className="flex justify-end">
      <div className="max-w-[86%] rounded-2xl rounded-br-md border border-accent/25 bg-gradient-to-br from-cyan-400/20 to-sky-500/10 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-fg shadow-[0_10px_30px_-18px_rgba(34,211,238,0.8)]">
        {isMatch && (
          <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-accent">Role match · job description</p>
        )}
        <p className="whitespace-pre-wrap break-words">{long && !more ? `${body.slice(0, 260).trimEnd()}…` : body}</p>
        {long && (
          <button type="button" onClick={() => setMore((v) => !v)} className="mt-1 text-[11px] text-accent hover:underline">
            {more ? "Show less" : "Show all"}
          </button>
        )}
      </div>
    </div>
  );
});

export const AssistantMessage = memo(function AssistantMessage({
  m,
  last,
  thinking,
  act,
  onRegenerate,
}: {
  m: ChatMessage;
  last: boolean;
  thinking: string;
  act: Act;
  onRegenerate: () => void;
}) {
  const reduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const streaming = m.status === "streaming";
  const r = parseReply(m.content, streaming);
  const settled = !streaming;
  // the contact card has its own email button; a second one is just noise
  const buttons = r.contact ? r.buttons.filter((b) => b.kind !== "email") : r.buttons;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(r.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div className="group/msg relative">

      {r.fit && <div className="mb-2.5"><FitGauge score={r.fit.score} label={r.fit.label} /></div>}

      {r.text ? (
        <Markdown text={r.text} caret={streaming} />
      ) : streaming ? (
        <p className="flex items-center gap-2 text-[12.5px]">
          <span className="as-shimmer font-medium">{thinking}</span>
        </p>
      ) : m.status === "stopped" ? (
        <p className="text-[12.5px] italic text-muted">Stopped.</p>
      ) : null}

      {settled && m.status === "stopped" && r.text && <p className="mt-1.5 text-[11px] italic text-muted">Stopped early.</p>}
      {settled && last && m.status === "error" && (
        <p className="mt-2 flex items-center gap-2 text-[12px] text-amber-300/90">
          The connection dropped mid-answer.
          <button type="button" onClick={onRegenerate} className="underline underline-offset-2 hover:text-amber-200">
            Try again
          </button>
        </p>
      )}

      {settled && (r.projects.length > 0 || r.contact) && (
        <div className="mt-3 grid gap-2" style={{ perspective: 800 }}>
          {r.projects.map((slug, i) => (
            <ProjectCard key={slug} slug={slug} index={i} onOpen={act.open} />
          ))}
          {r.contact && <ContactCard onEmail={act.email} />}
        </div>
      )}

      {settled && buttons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {buttons.map((b) => {
            const Icon = BUTTON_ICON[b.kind];
            return (
              <button key={b.kind + (b.arg ?? "")} type="button" onClick={() => act.button(b.kind, b.arg)} className="as-btn">
                <Icon className="size-3.5" />
                {b.label}
              </button>
            );
          })}
        </div>
      )}

      {settled && last && r.followUps.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {/* two at most: a choice, not a menu */}
          {r.followUps.slice(0, 2).map((q, i) => (
            <motion.button
              key={q}
              type="button"
              onClick={() => act.ask(q)}
              initial={reduced ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="as-chip"
            >
              {q}
            </motion.button>
          ))}
        </div>
      )}

      {settled && r.text && (
        <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover/msg:opacity-100 [@media(hover:none)]:opacity-100">
          <button type="button" onClick={copy} className="as-icon-btn !size-7" aria-label="Copy reply">
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </button>
          {last && (
            <button type="button" onClick={onRegenerate} className="as-icon-btn !size-7" aria-label="Regenerate reply">
              <RotateCcw className="size-3.5" />
            </button>
          )}
          {m.source === "offline" && <span className="ml-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted/60">from notes</span>}
        </div>
      )}
    </div>
  );
});
