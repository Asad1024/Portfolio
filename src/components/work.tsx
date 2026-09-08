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

/** Catalogue code for a project, e.g. sparkcue 01 -> SPK-01. Consonants first
 *  so the letters stay distinctive: SPK reads better than SPA. */
function designation(slug: string, index: string) {
  const letters = slug.replace(/[^a-z]/gi, "").toUpperCase();
  const consonants = letters.replace(/[AEIOU]/g, "");
  return `${(consonants + letters).slice(0, 3)}-${index}`;
}

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

                {/* the viewport: a screenshot read as something being observed
                    through an instrument rather than pasted into a tile */}
                <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-card">
                  <ProjectVisual slug={p.slug} />

                  {/* survey grid, and a scan bar crossing it on a slow loop */}
                  <span
                    aria-hidden
                    className="tele-grid pointer-events-none absolute inset-0 opacity-40 mix-blend-screen transition-opacity duration-500 group-hover:opacity-70"
                  />
                  <span
                    aria-hidden
                    className="scan-bar pointer-events-none absolute inset-x-0 top-0 h-14 bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--accent)_18%,transparent),transparent)]"
                  />

                  {/* frame ticks at the corners of the viewport */}
                  {[
                    "left-2 top-2 border-l border-t",
                    "right-2 top-2 border-r border-t",
                    "bottom-2 left-2 border-b border-l",
                    "bottom-2 right-2 border-b border-r",
                  ].map((pos) => (
                    <span
                      key={pos}
                      aria-hidden
                      className={`pointer-events-none absolute size-3 border-accent/50 transition-colors duration-300 group-hover:border-accent ${pos}`}
                    />
                  ))}

                  {/* keeps the readouts legible over any screenshot */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--bg)_90%,transparent),transparent)]"
                  />

                  <span className="absolute left-5 top-4 font-mono text-[11px] text-accent">
                    {p.index}
                  </span>

                  {p.link ? (
                    <span className="absolute right-5 top-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-fg/85">
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
                      </span>
                      live
                    </span>
                  ) : (
                    <span className="absolute right-5 top-4 font-mono text-[10px] uppercase tracking-widest text-muted/70">
                      archived
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-widest text-muted/60">
                    <span>{designation(p.slug, p.index)}</span>
                    <span>{p.year}</span>
                  </div>

                  <h3 className="mt-3 font-sans text-xl font-bold leading-snug tracking-tight transition-colors duration-300 group-hover:text-accent">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.tagline}</p>

                  {/* Telemetry readout: the project's headline result, framed
                      as an instrument panel rather than a caption. This is the
                      thing a card should actually argue. */}
                  {p.outcome[0] && (
                    <div className="mt-6 rounded-lg border border-accent/25 bg-accent/[0.06] px-4 py-3 transition-colors duration-300 group-hover:border-accent/50">
                      <p className="flex items-baseline gap-2.5">
                        <span className="font-sans text-2xl font-bold leading-none tracking-tight text-accent">
                          {p.outcome[0].value}
                        </span>
                        <span className="font-mono text-[10px] leading-tight text-muted">
                          {p.outcome[0].label}
                        </span>
                      </p>
                    </div>
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

                    {/* the arrow sits inside its own little orbit, with a
                        marker running the ring while the card is hovered */}
                    <span className="relative flex size-9 shrink-0 items-center justify-center">
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full border border-line transition-colors duration-300 group-hover:border-accent/60"
                      />
                      <span
                        aria-hidden
                        className="marker-orbit absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      >
                        <span className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_8px_1px_var(--ring)]" />
                      </span>
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300 group-hover:rotate-45 group-hover:text-accent"
                      >
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
