"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { projects } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { ProjectVisual } from "./work-preview";
import { TechIcon } from "./tech-icon";

const FILTERS = ["all", "web", "desktop", "ai", "cloud"] as const;

export function Work() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const shown = projects.filter((p) => filter === "all" || p.tags.includes(filter));

  return (
    <section id="work" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-36 sm:py-48">
      <SectionHeading index="01" title="Selected Work" hint="every project, one case study each" />

      <Reveal>
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-sm text-muted">
            <span className="text-accent">$</span> ls ./projects{" "}
            <span className="text-muted/60">({shown.length})</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-1.5 font-mono text-xs transition-colors ${
                  filter === f
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line text-muted hover:border-accent/50 hover:text-fg"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((p, i) => (
            <motion.div
              key={p.slug}
              layout
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, delay: Math.min(i, 5) * 0.04, ease: [0.21, 0.6, 0.35, 1] }}
            >
              <Link
                href={`/work/${p.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-bg/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/70 hover:shadow-[0_0_40px_-6px_var(--ring)]"
              >
                {/* HUD corner brackets — drawn on hover, so the card reads as
                    a target being acquired rather than a static tile */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-3 z-20 size-4 rounded-tl border-l border-t border-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-3 right-3 z-20 size-4 rounded-br border-b border-r border-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />

                <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-card">
                  <ProjectVisual slug={p.slug} />

                  {/* keeps the index and status legible over any screenshot */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--bg)_88%,transparent),transparent)]"
                  />

                  <span className="absolute left-4 top-3.5 font-mono text-[11px] text-accent">
                    {p.index}
                  </span>

                  {p.link ? (
                    <span className="absolute right-4 top-3.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-fg/85">
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
                      </span>
                      live
                    </span>
                  ) : (
                    <span className="absolute right-4 top-3.5 font-mono text-[10px] uppercase tracking-widest text-muted/70">
                      {p.year}
                    </span>
                  )}

                  {/* sweep: a scan passing over the dossier on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent,color-mix(in_oklab,var(--accent)_22%,transparent),transparent)] transition-transform duration-[900ms] ease-out group-hover:translate-x-full"
                  />
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-sans text-xl font-bold leading-snug tracking-tight transition-colors duration-300 group-hover:text-accent">
                      {p.title}
                    </h3>
                    <span className="shrink-0 font-mono text-[10px] text-muted/70">{p.year}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.tagline}</p>

                  {/* headline result — the thing a card should actually argue */}
                  {p.outcome[0] && (
                    <p className="mt-5 flex items-baseline gap-2 font-mono text-[11px] text-muted">
                      <span className="text-base font-bold not-italic text-accent">
                        {p.outcome[0].value}
                      </span>
                      {p.outcome[0].label}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-5">
                    <span className="flex items-center gap-2.5">
                      {p.stack.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          title={s}
                          className="opacity-55 transition-opacity duration-300 group-hover:opacity-100"
                        >
                          <TechIcon name={s} size={15} />
                        </span>
                      ))}
                      {p.stack.length > 4 && (
                        <span className="font-mono text-[10px] text-muted/60">
                          +{p.stack.length - 4}
                        </span>
                      )}
                    </span>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line transition-all duration-300 group-hover:rotate-45 group-hover:border-accent group-hover:text-accent">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17L17 7M17 7H8M17 7v9" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
