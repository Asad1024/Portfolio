"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { projects, showcase } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { ProjectVisual } from "./work-preview";
import { TechIcon } from "./tech-icon";

/* ── Selected Work, as a showcase ───────────────────────────────────────────
   One stage and a programme. The stage holds the project in front: its
   screen edge to edge at its own proportions, a soft light following the
   pointer across it, lit in the project's own colour, with its story and
   numbers beneath. Each project wipes in over the last behind a line of
   light. The programme beside it lists every project, nine rows to the
   stage's height and the rest a scroll (or the button under it) away; the
   one on stage runs a line of light, and when the line fills the next
   project turns onto the stage. Pointing at the stage pauses it, and
   choosing a project puts it on stage at once.

   It is one screen tall and never takes over the page's scroll. */

/** Each project's own light, taken from its interface. */
const TINT: Record<string, string> = {
  "video-funnels": "#e879f9",
  leadgen: "#14b8a6",
  "matching-app": "#fb7185",
  "avatar-studio": "#c084fc",
  ghertak: "#328fb8",
  insyncx: "#a78bfa",
  "outbound-copilot": "#fb923c",
  sparkcue: "#38bdf8",
  "voice-agents": "#a3e635",
  "booking-platform": "#818cf8",
  "sales-crm": "#f43f5e",
  siteharvest: "#3b82f6",
  codevault: "#22c55e",
  mailforge: "#f59e0b",
};

/** how long each project holds the stage, in seconds */
const HOLD = 10;

/** the showcase first, then the rest, those with real screenshots ahead */
const all = [
  ...showcase.flatMap((slug) => projects.filter((p) => p.slug === slug)),
  ...projects.filter((p) => !showcase.includes(p.slug)).sort((a, b) => Number(!!b.image) - Number(!!a.image)),
];
/** how many rows the list shows at the stage's height */
const VISIBLE = 9;
const ease = [0.2, 0.7, 0.2, 1] as const;

export function Work() {
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(false);
  const p = all[active];
  const tint = TINT[p.slug] ?? "#22d3ee";
  const running = !reduced && inView && !hover;

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // a soft light follows the pointer across the screen
  const glare = useRef<HTMLSpanElement>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || !glare.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    glare.current.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
    glare.current.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const ratio = p.image ? `${p.image.width} / ${p.image.height}` : "16 / 10";

  // auto-play walks the nine in view and loops back to the first; the rest
  // are only ever put on stage by choice
  const next = () => setActive((a) => (a + 1 >= VISIBLE ? 0 : a + 1));

  // the list: where it is scrolled, and keeping the project on stage in view
  // (scrolling the list itself, never the page)
  const list = useRef<HTMLOListElement>(null);
  const [atEnd, setAtEnd] = useState(false);
  const onListScroll = () => {
    const l = list.current;
    if (!l) return;
    setAtEnd(l.scrollTop + l.clientHeight >= l.scrollHeight - 4);
  };
  useEffect(() => {
    const l = list.current;
    const item = l?.children[active] as HTMLElement | undefined;
    if (!l || !item) return;
    if (l.scrollHeight > l.clientHeight + 4) {
      if (item.offsetTop < l.scrollTop || item.offsetTop + item.offsetHeight > l.scrollTop + l.clientHeight)
        l.scrollTo({ top: item.offsetTop - l.clientHeight / 2 + item.offsetHeight / 2, behavior: "smooth" });
    } else if (l.scrollWidth > l.clientWidth + 4) {
      l.scrollTo({ left: item.offsetLeft - 24, behavior: "smooth" });
    }
  }, [active]);

  return (
    <section
      ref={section}
      id="work"
      className="scroll-mt-24 pt-4 sm:pt-12"
      style={{ ["--tint" as string]: tint }}
    >
      <div className="mx-auto max-w-shell px-6">
        <SectionHeading index="01" label="Work" title="Selected" accent="work." />

        <Reveal>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] lg:gap-8">
            {/* the stage */}
            <div
              className="sw-panel relative overflow-hidden rounded-[1.25rem] border border-white/10"
              onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
              onPointerLeave={() => setHover(false)}
            >
              {/* the screen, edge to edge at the screenshot's own proportions;
                  each project wipes in over the last behind a line of light */}
              <div onPointerMove={onMove} className="sw-stage relative overflow-hidden bg-[#05070d]" style={{ aspectRatio: ratio }}>
                <AnimatePresence initial={false}>
                  <motion.div
                    key={p.slug}
                    className="absolute inset-0"
                    initial={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 0 100%)", scale: 1.08, filter: "brightness(1.6) blur(4px)" }}
                    animate={{ opacity: 1, clipPath: "inset(0 0 0 0%)", scale: 1, filter: "brightness(1) blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 1 } }}
                    transition={{ duration: 1.05, ease: [0.7, 0, 0.2, 1] }}
                  >
                    <Link href={`/work/${p.slug}`} aria-label={`${p.title}: read the case study`} className="group absolute inset-0 block">
                      <ProjectVisual slug={p.slug} variant="hero" sizes="(max-width: 1024px) 92vw, 52rem" />
                    </Link>
                  </motion.div>
                </AnimatePresence>
                {!reduced && (
                  <motion.span
                    key={`edge-${p.slug}`}
                    aria-hidden
                    className="sw-edge pointer-events-none absolute inset-y-0 w-px"
                    initial={{ left: "100%", opacity: 1 }}
                    animate={{ left: "0%", opacity: 0 }}
                    transition={{ duration: 1.05, ease: [0.7, 0, 0.2, 1], opacity: { duration: 1.05, ease: [0.9, 0, 1, 1] } }}
                  />
                )}
                <span ref={glare} aria-hidden className="sw-glare pointer-events-none absolute inset-0" />
                {p.link && (
                  <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 font-sans text-[10px] text-white/90 backdrop-blur-md">
                    <span className="size-1.5 animate-pulse rounded-full bg-[var(--tint)] shadow-[0_0_8px_var(--tint)]" />
                    live
                  </span>
                )}
              </div>

              {/* the story of the project on stage */}
              <div className="relative border-t border-white/[0.07] bg-black/20 px-5 py-5 backdrop-blur-sm sm:px-8 sm:py-6">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={p.slug}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease }}
                    className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-8"
                  >
                    <div className="min-w-0">
                      <p className="font-sans text-[10.5px] uppercase tracking-[0.2em] text-muted">
                        <span className="text-[var(--tint)]">{String(active + 1).padStart(2, "0")}</span>
                        <span className="text-muted/60"> / {String(all.length).padStart(2, "0")}</span>
                        {"  ·  "}
                        {[p.company, p.year].filter(Boolean).join(" · ")}
                      </p>
                      <h3 className="mt-1.5 font-sans text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{p.title}</h3>
                      <p className="mt-1.5 max-w-lg text-[14.5px] leading-relaxed text-fg/65">{p.tagline}</p>
                      <ul className="mt-3.5 flex flex-wrap gap-1.5">
                        {p.keyStack.slice(0, 4).map((s) => (
                          <li key={s} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11.5px] text-fg/80">
                            <TechIcon name={s} size={12} />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex shrink-0 items-end justify-between gap-6 md:flex-col md:items-end">
                      <dl className="flex gap-6">
                        {p.outcome.slice(0, 2).map((o) => (
                          <div key={o.label} className="max-w-[8.5rem] md:text-right">
                            <dt className="sr-only">{o.label}</dt>
                            <dd className="sw-num font-sans text-2xl font-semibold leading-none tracking-tight sm:text-3xl">{o.value}</dd>
                            <dd className="mt-1.5 text-[11.5px] leading-snug text-muted">{o.label}</dd>
                          </div>
                        ))}
                      </dl>
                      <Link
                        href={`/work/${p.slug}`}
                        className="group flex shrink-0 items-center gap-2 rounded-full bg-fg px-4 py-2 text-[13px] font-medium text-bg transition-colors hover:bg-[var(--tint)]"
                      >
                        Case study
                        <ArrowRight aria-hidden className="size-3.5 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* the programme: every project, nine to the stage's height and the
                rest a scroll away */}
            <div className="relative min-w-0">
              <div className="flex flex-col lg:absolute lg:inset-0">
                <ol
                  ref={list}
                  onScroll={onListScroll}
                  data-lenis-prevent
                  className="sw-list relative flex min-h-0 snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:block lg:flex-1 lg:snap-y lg:overflow-y-auto lg:overflow-x-visible lg:pb-0"
                >
                  {all.map((q, i) => {
                    const on = i === active;
                    const c = TINT[q.slug] ?? "#22d3ee";
                    return (
                      <li key={q.slug} className="shrink-0 snap-start lg:h-[calc(100%/9)] lg:py-[2px]">
                        <button
                          type="button"
                          onClick={() => setActive(i)}
                          aria-current={on || undefined}
                          style={{ ["--c" as string]: c }}
                          className={`group relative flex h-full w-full items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all duration-500 lg:py-0 ${
                            on ? "border-white/12 bg-white/[0.05]" : "border-transparent hover:bg-white/[0.03]"
                          }`}
                        >
                          <span className={`font-sans text-[11px] tabular-nums transition-colors ${on ? "text-[var(--c)]" : "text-muted/60"}`}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-[14.5px] font-medium transition-colors ${on ? "text-fg" : "text-fg/55 group-hover:text-fg/85"}`}
                            >
                              {q.title}
                            </span>
                            <span className="hidden truncate text-[11.5px] text-muted lg:block">
                              {[q.company, q.year].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          <span
                            aria-hidden
                            className={`size-1.5 shrink-0 rounded-full bg-[var(--c)] transition-all duration-500 ${
                              on ? "opacity-100 shadow-[0_0_10px_var(--c)]" : "opacity-0"
                            }`}
                          />
                          {/* the time left on stage */}
                          {on && (
                            <span
                              key={active}
                              aria-hidden
                              onAnimationEnd={next}
                              className="sw-progress absolute inset-x-0 bottom-0 h-px origin-left bg-[var(--c)]"
                              style={{ animationDuration: `${HOLD}s`, animationPlayState: running ? "running" : "paused" }}
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ol>

                {/* the way to the rest of the list, and back */}
                <button
                  type="button"
                  onClick={() => {
                    const l = list.current;
                    if (l) l.scrollTo({ top: atEnd ? 0 : l.scrollTop + l.clientHeight * 0.8, behavior: "smooth" });
                  }}
                  className="sw-more group mt-2 hidden h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] font-sans text-[11px] uppercase tracking-[0.16em] text-fg/75 transition-colors hover:border-accent/50 hover:text-accent lg:flex"
                >
                  {atEnd ? (
                    <>
                      <ChevronUp aria-hidden className="size-3.5" />
                      Back to the top
                    </>
                  ) : (
                    <>
                      {all.length - VISIBLE} more projects
                      <ChevronDown aria-hidden className="size-3.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
