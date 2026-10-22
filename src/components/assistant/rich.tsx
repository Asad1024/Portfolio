"use client";

import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Copy, Download, Mail } from "lucide-react";
import { contact, profile, projects } from "@/lib/data";
import { parseMarkdown, type Inline } from "@/lib/assistant/markdown";
import { siGithub } from "simple-icons";
import { TechIcon } from "@/components/tech-icon";

const LINKEDIN =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";

function Brand({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden>
      <path d={path} />
    </svg>
  );
}

/* ── what a reply can contain besides words ─────────────────────────────────
   Prose (safe markdown, rendered as React, never as HTML), and the cards the
   reply protocol asks for: a project, the contact card, a fit gauge. */

export function Markdown({ text, caret }: { text: string; caret?: boolean }) {
  // mid-stream, a bold or code mark whose other half hasn't arrived yet is
  // held back, so the visitor never sees raw asterisks flicker past
  const shown = caret ? closeOpenMarks(text) : text;
  const blocks = parseMarkdown(shown);
  return (
    <div className="as-prose">
      {blocks.map((b, i) => {
        const last = i === blocks.length - 1;
        if (b.t === "p")
          return (
            <p key={i}>
              <Inlines nodes={b.c} />
              {last && caret && <span className="as-caret" />}
            </p>
          );
        const items = b.items.map((it, j) => (
          <li key={j}>
            <Inlines nodes={it} />
            {last && caret && j === b.items.length - 1 && <span className="as-caret" />}
          </li>
        ));
        return b.t === "ul" ? <ul key={i}>{items}</ul> : <ol key={i} start={b.start}>{items}</ol>;
      })}
      {!blocks.length && caret && <span className="as-caret" />}
    </div>
  );
}

function closeOpenMarks(text: string) {
  let t = text;
  for (const mark of ["**", "`"]) {
    if (t.split(mark).length % 2 === 0) {
      const at = t.lastIndexOf(mark);
      t = t.slice(0, at) + t.slice(at + mark.length);
    }
  }
  return t;
}

function Inlines({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.t) {
          case "text":
            return <Fragment key={i}>{n.v}</Fragment>;
          case "strong":
            return (
              <strong key={i}>
                <Inlines nodes={n.c} />
              </strong>
            );
          case "em":
            return (
              <em key={i}>
                <Inlines nodes={n.c} />
              </em>
            );
          case "code":
            return <code key={i}>{n.v}</code>;
          case "link":
            return n.href.startsWith("/") || n.href.startsWith("#") ? (
              <Link key={i} href={n.href}>
                <Inlines nodes={n.c} />
              </Link>
            ) : (
              <a key={i} href={n.href} target={n.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">
                <Inlines nodes={n.c} />
              </a>
            );
        }
      })}
    </>
  );
}

/** A project as a holographic card: the screen, the pitch, the stack. */
export function ProjectCard({ slug, index, onOpen }: { slug: string; index: number; onOpen: (href: string) => void }) {
  const p = projects.find((x) => x.slug === slug);
  const reduced = useReducedMotion();
  if (!p) return null;
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(`/work/${p.slug}`)}
      initial={reduced ? false : { opacity: 0, y: 10, rotateX: -12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.08 * index, type: "spring", stiffness: 260, damping: 24 }}
      className="as-card group flex w-full items-stretch gap-3 p-2.5 text-left"
      aria-label={`${p.title}: ${p.tagline}. Open case study`}
    >
      <span className="relative block w-[5.5rem] shrink-0 overflow-hidden rounded-[0.6rem] border border-white/10 bg-[#070b16]">
        {p.image ? (
          <Image
            src={p.image}
            alt=""
            fill
            sizes="88px"
            className="object-cover object-top opacity-90 transition duration-500 group-hover:scale-[1.06] group-hover:opacity-100"
          />
        ) : (
          <span className="flex size-full items-center justify-center font-mono text-[11px] text-accent/80">{p.index}</span>
        )}
      </span>
      <span className="min-w-0 flex-1 py-0.5">
        <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent/80">
          {[p.company, p.year].filter(Boolean).join(" · ")}
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-[13.5px] font-semibold tracking-tight text-fg">
          <span className="truncate">{p.title}</span>
          <ArrowUpRight className="size-3.5 shrink-0 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
        </span>
        <span className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-muted">{p.tagline}</span>
        <span className="mt-1.5 flex flex-wrap gap-1">
          {p.keyStack.slice(0, 3).map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-fg/70">
              <TechIcon name={t} size={10} />
              {t}
            </span>
          ))}
        </span>
      </span>
    </motion.button>
  );
}

/** Who Asad is and every way to reach him, one tap each. */
export function ContactCard({ onEmail }: { onEmail: () => void }) {
  const [copied, setCopied] = useState(false);
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit" });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="as-card p-3">
      <div className="flex items-center gap-3">
        <span className="relative size-11 shrink-0">
          {profile.photo ? (
            <Image src={profile.photo} alt="" fill sizes="44px" className="rounded-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">AS</span>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#070b16] bg-emerald-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold tracking-tight text-fg">{profile.name}</p>
          <p className="text-[11px] text-muted">
            Open to work · Lahore{time && <span className="text-fg/70"> · {time} there</span>}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-black/30 py-1 pl-3 pr-1">
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-fg/85">{contact.email}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted transition hover:bg-white/5 hover:text-fg"
          aria-label="Copy email address"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        <button type="button" onClick={onEmail} className="as-tile as-tile-primary">
          <Mail className="size-3.5" /> Email
        </button>
        <a href={contact.linkedin} target="_blank" rel="noreferrer" className="as-tile">
          <Brand path={LINKEDIN} /> LinkedIn
        </a>
        <a href={contact.github} target="_blank" rel="noreferrer" className="as-tile">
          <Brand path={siGithub.path} /> GitHub
        </a>
        <a href="/Asad-Shah-Resume.pdf" target="_blank" className="as-tile">
          <Download className="size-3.5" /> Résumé
        </a>
      </div>
    </div>
  );
}

/** A role-match score as an arc that fills to the number. */
export function FitGauge({ score, label }: { score: number; label: string }) {
  const reduced = useReducedMotion();
  const r = 26;
  const arc = Math.PI * r; // a half circle
  const tone = score >= 85 ? "#34d399" : score >= 70 ? "#22d3ee" : score >= 50 ? "#fbbf24" : "#f97316";
  return (
    <div className="as-card flex items-center gap-4 p-3">
      <svg viewBox="0 0 64 38" className="w-24 shrink-0" aria-hidden>
        <path d="M6 34 A26 26 0 0 1 58 34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round" />
        <motion.path
          d="M6 34 A26 26 0 0 1 58 34"
          fill="none"
          stroke={tone}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={arc}
          initial={{ strokeDashoffset: reduced ? arc * (1 - score / 100) : arc }}
          animate={{ strokeDashoffset: arc * (1 - score / 100) }}
          transition={{ duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${tone})` }}
        />
        <text x="32" y="33" textAnchor="middle" fill="#e8ecf5" fontSize="13" fontWeight="700" fontFamily="var(--font-geist)">
          {score}
        </text>
      </svg>
      <div>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted">Role match</p>
        <p className="text-[15px] font-semibold tracking-tight" style={{ color: tone }}>
          {label} <span className="sr-only">, {score} out of 100</span>
        </p>
        <p className="text-[11px] text-muted">From shipped work on this site</p>
      </div>
    </div>
  );
}
