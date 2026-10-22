"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Briefcase, Compass, Mail, Trophy } from "lucide-react";
import { projects } from "@/lib/data";

/* The first screen, kept quiet: who this is, four starting points that cover
   what most visitors came for, and three questions picked for wherever they
   are on the site. */

export type Mission = "tour" | "match" | "best" | "contact";

const MISSIONS: { id: Mission; title: string; body: string; Icon: typeof Compass; tone: string }[] = [
  { id: "tour", title: "Guided tour", body: "Fly through the site in a minute", Icon: Compass, tone: "#22d3ee" },
  { id: "match", title: "Role match", body: "Paste a job, get a fit score", Icon: Briefcase, tone: "#a78bfa" },
  { id: "best", title: "Best work", body: "The one project to see first", Icon: Trophy, tone: "#fbbf24" },
  { id: "contact", title: "Hire Asad", body: "Availability and contact", Icon: Mail, tone: "#34d399" },
];

/** Questions worth asking from where the visitor is right now. */
export function suggestionsFor(page: string, section?: string): string[] {
  if (page.startsWith("/work/")) {
    const p = projects.find((x) => x.slug === page.split("/")[2]);
    if (p) return [`Explain ${p.title} in 30 seconds`, "What was the hardest part?", `What stack did ${p.title} use?`];
  }
  switch (section) {
    case "work":
      return ["Which project should I open first?", "What AI products has he shipped?", "Show me his desktop apps"];
    case "capabilities":
      return ["Has he used Redis in production?", "What's his strongest area?", "Has he built with Stripe?"];
    case "experience":
      return ["What did he build at Spark AI?", "How many years of experience?", "Tell me about his experience"];
    case "about":
      return ["Where is Asad based?", "Is Asad available?", "How do I reach him?"];
    case "contact":
      return ["Is Asad available?", "How do I reach him?", "Can I see his résumé?"];
    default:
      return ["What's his best project?", "What AI products has he shipped?", "Is Asad available?"];
  }
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Working late?" : h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening.";
}

export function Welcome({
  page,
  section,
  onMission,
  onAsk,
}: {
  page: string;
  section?: string;
  onMission: (m: Mission) => void;
  onAsk: (q: string) => void;
}) {
  const reduced = useReducedMotion();
  const [hello, setHello] = useState("Hello.");
  /* eslint-disable react-hooks/set-state-in-effect -- the visitor's clock, read after mount */
  useEffect(() => setHello(greeting()), []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // one quick fade for the whole screen: a staggered cascade looked
  // half-drawn on a busy phone, and was motion nobody needed
  const rise = (i: number) =>
    reduced || i > 0 ? {} : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } };

  return (
    <div className="flex min-h-full flex-col px-5 pb-4 pt-6">
      <motion.div {...rise(0)}>
        <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-fg">{hello}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          I&apos;m Asad&apos;s assistant. Ask me anything about his work, or pick a starting point.
        </p>
      </motion.div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {MISSIONS.map((m, i) => (
          <motion.button
            key={m.id}
            {...rise(i + 1)}
            type="button"
            onClick={() => onMission(m.id)}
            title={m.body}
            className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 text-left text-[13px] font-medium text-fg/90 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-fg"
          >
            <m.Icon className="size-4 shrink-0" style={{ color: m.tone }} />
            {m.title}
          </motion.button>
        ))}
      </div>

      <motion.div {...rise(5)} className="mt-6">
        <p className="mb-2 text-[11px] text-muted/80">Try asking</p>
        <div className="flex flex-col items-start gap-1.5">
          {suggestionsFor(page, section).map((q) => (
            <button key={q} type="button" onClick={() => onAsk(q)} className="as-chip">
              {q}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
