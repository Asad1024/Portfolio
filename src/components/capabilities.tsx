"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { pillars, projects, type Pillar } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { SkillDemo } from "./skill-demos";
import { TechIcon } from "./tech-icon";

/* ── Capabilities ───────────────────────────────────────────────────────────
   Four equal cards, one per kind of work, each built the same way: its
   tools as two even rows of named tiles, a light that glides from tile to
   tile, and under them a small live demo of the tool in the light at work
   (see skill-demos), beside its name, a ring counting down its turn, and a
   plain line on what that tool does in this kind of work. So the animation is the explanation: you watch the skills
   one by one and learn what each is for. Pointing at a tile jumps to it. */

const COLOR = ["#22d3ee", "#818cf8", "#f59e0b", "#34d399"];
/** one short line under each card's title */
const LINE = [
  "LLMs doing real work, behind real guardrails.",
  "Whole products, from the database to the screen.",
  "Getting paid, getting deployed, and staying up.",
  "Apps beyond the browser, on the same API as the web.",
];
/** how long each tool stays in the light, in seconds */
const STEP = 4.2;

/** what each tool does, in this kind of work */
const ROLE: Record<string, string> = {
  OpenAI: "The models that write, reason and reply inside the products.",
  Gemini: "A second model, used for AI matchmaking and scoring.",
  ElevenLabs: "Natural, human-sounding voices for the phone agents.",
  Twilio: "Phone numbers and live calls the voice agents answer.",
  HeyGen: "Talking-avatar videos generated from a script.",
  LiveKit: "Real-time audio rooms for live AI conversations.",
  "RAG · embeddings": "Answers grounded in your own documents, not guesses.",
  MCP: "Servers that let AI agents operate the product themselves.",
  "Next.js": "The web apps and dashboards people use every day.",
  React: "Fast, interactive interfaces.",
  TypeScript: "One typed language from the database to the screen.",
  NestJS: "Structured APIs with roles, permissions and tenants.",
  "Node.js": "The server runtime underneath it all.",
  FastAPI: "Python services and APIs.",
  PostgreSQL: "Relational data, kept separate for every tenant.",
  Redis: "Queues, caching and realtime updates.",
  Stripe: "Subscriptions, payouts, deposits and credits.",
  JazzCash: "Mobile-wallet payments for customers in Pakistan.",
  PayFast: "Card and bank payments in Pakistan.",
  Docker: "The whole stack in containers, on one server.",
  Vercel: "Frontends deployed on every push.",
  Sentry: "Errors caught and traced in production.",
  Playwright: "End-to-end tests that click through a real browser.",
  Cloudinary: "Image and video uploads, storage and resizing.",
  Electron: "Desktop apps for Windows.",
  "React Native": "iOS and Android apps from one codebase.",
  Expo: "Mobile builds and over-the-air updates.",
  Flutter: "Cross-platform apps with a native feel.",
  SQLite: "Local data that never leaves the device.",
};

function SkillBox({ techs, id }: { techs: string[]; id: number }) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const [inView, setInView] = useState(false);
  const running = !reduced && inView && !held;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tech = techs[active];
  // always two even rows of tiles, whatever the count
  const cols = Math.ceil(techs.length / 2);
  const hold = (i: number) => {
    setActive(i);
    setHeld(true);
  };

  return (
    <div
      ref={box}
      onPointerLeave={() => setHeld(false)}
      className="cap-box relative overflow-hidden rounded-2xl border border-white/[0.08] p-3"
    >
      <ul className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {techs.map((t, i) => {
          const on = i === active;
          return (
            <motion.li
              key={t}
              initial={reduced ? false : { opacity: 0, y: 10, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <button
                type="button"
                onPointerEnter={() => hold(i)}
                onFocus={() => hold(i)}
                onBlur={() => setHeld(false)}
                aria-pressed={on}
                className="cap-tile relative flex h-full min-h-[4.5rem] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-1.5 py-2.5 text-center"
              >
                {/* the light, gliding from tile to tile */}
                {on && (
                  <motion.span
                    layoutId={`cap-light-${id}`}
                    aria-hidden
                    className="cap-light absolute inset-0 rounded-xl"
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  />
                )}
                <span className={`relative transition-transform duration-500 ${on ? "scale-110" : ""}`}>
                  <TechIcon name={t} size={22} />
                </span>
                <span className={`relative text-[11.5px] leading-tight transition-colors duration-300 ${on ? "text-fg" : "text-fg/55"}`}>{t}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_11.5rem]">
        {/* the tool in the light, at work */}
        <div className="cap-demo relative h-[11rem] overflow-hidden rounded-xl border border-white/[0.06]">
          <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-1.5">
            <span className="size-1.5 rounded-full bg-white/15" />
            <span className="size-1.5 rounded-full bg-white/15" />
            <span className="size-1.5 rounded-full bg-white/15" />
            <span className="ml-1.5 font-sans text-[9.5px] text-muted">{tech.toLowerCase()} · live</span>
          </div>
          <div key={tech} className="dm dm-scene absolute inset-x-0 bottom-0 top-7 overflow-hidden px-3.5 py-3">
            <SkillDemo tech={tech} />
          </div>
        </div>

        {/* what it is, what it does, and the time left in the light */}
        <div className="cap-spot relative flex items-center gap-3 overflow-hidden rounded-xl border border-white/[0.06] p-3 sm:flex-col sm:items-start sm:gap-2.5">
          <div className="relative size-12 shrink-0">
            <svg aria-hidden viewBox="0 0 64 64" className="absolute inset-0 size-full -rotate-90">
              <circle cx="32" cy="32" r="29" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
              <circle
                key={active}
                cx="32"
                cy="32"
                r="29"
                fill="none"
                stroke="var(--c)"
                strokeWidth="2.5"
                strokeLinecap="round"
                pathLength={100}
                onAnimationEnd={() => setActive((x) => (x + 1) % techs.length)}
                className="cap-ring-run"
                style={{ animationDuration: `${STEP}s`, animationPlayState: running ? "running" : "paused" }}
              />
            </svg>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0.5, rotate: -40 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 40 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <TechIcon name={tech} size={22} />
              </motion.span>
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tech}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
              className="min-w-0"
            >
              <p className="text-[14px] font-semibold text-fg">{tech}</p>
              <p className="mt-1 text-[12px] leading-snug text-fg/65">{ROLE[tech] ?? ""}</p>
            </motion.div>
          </AnimatePresence>
          <p className="ml-auto shrink-0 self-start whitespace-nowrap font-sans text-[10px] tabular-nums text-muted sm:ml-0 sm:mt-auto">
            <span className="text-[var(--c)]">{String(active + 1).padStart(2, "0")}</span> / {String(techs.length).padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}

function Proof({ slugs }: { slugs: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
      <span className="font-sans text-[10.5px] uppercase tracking-[0.18em] text-muted">Shipped in</span>
      {slugs.map((slug) => {
        const project = projects.find((x) => x.slug === slug);
        if (!project) return null;
        return (
          <Link
            key={slug}
            href={`/work/${slug}`}
            className="group/proof inline-flex items-center gap-1 text-[13px] text-fg/85 transition-colors hover:text-[var(--c)]"
          >
            {project.title}
            <ArrowUpRight
              aria-hidden
              className="size-3.5 text-muted transition-transform duration-300"
            />
          </Link>
        );
      })}
    </div>
  );
}

function PillarCard({ pillar: p, i }: { pillar: Pillar; i: number }) {
  return (
    <article
      className="cap-card relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 p-5 sm:p-6"
      style={{ ["--c" as string]: COLOR[i] }}
    >
      <span aria-hidden className="cap-card-glow pointer-events-none absolute inset-0" />
      <header className="relative">
        <p className="font-sans text-[11px] text-[var(--c)]">
          {String(i + 1).padStart(2, "0")} <span className="text-muted">· {p.techs.length} skills</span>
        </p>
        <h3 className="mt-1.5 font-sans text-2xl font-semibold tracking-[-0.03em] sm:text-[1.75rem]">
          {p.title} <span className="text-[var(--c)]">{p.accent}</span>
        </h3>
        <p className="mt-1.5 text-[14.5px] text-fg/65">{LINE[i]}</p>
      </header>

      <div className="relative mt-5">
        <SkillBox techs={p.techs} id={i} />
      </div>

      <div className="relative mt-auto pt-5">
        <Proof slugs={p.proof} />
      </div>
    </article>
  );
}

export function Capabilities() {
  return (
    <section id="capabilities" className="scroll-mt-24 pt-16 sm:pt-24">
      <div className="mx-auto max-w-shell px-6">
        <SectionHeading index="02" label="Capabilities" title="What I" accent="build with." />

        <div className="grid gap-5 lg:grid-cols-2">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={(i % 2) * 0.08} className="h-full">
              <PillarCard pillar={p} i={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
