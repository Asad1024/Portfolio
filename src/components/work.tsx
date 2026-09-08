"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { projects } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { ProjectVisual } from "./work-preview";
import { TechIcon } from "./tech-icon";

/* ── Selected Work, as a console ────────────────────────────────────────────
   A manifest of every project on the left, one large viewport on the right
   that swaps as you move down the list.

   This replaces a three-up grid of screenshot cards, which had two problems
   no amount of styling fixed. The screenshots are 1917px desktop captures and
   a grid renders them around 350px wide — a five-fold downscale that turns
   every UI into unreadable mush, so the image argued nothing. And twelve
   equal-weight cards is a wall: nothing leads, nothing is scannable, and you
   read none of it.

   One viewport at roughly three times the width fixes the first. A dense
   left-hand list fixes the second — all twelve legible at once, and the one
   you are pointing at is the one shown large. */

const FILTERS = ["all", "web", "desktop", "ai", "cloud"] as const;

/** Catalogue code for a project, e.g. sparkcue 01 -> SPR-01. Consonants first
 *  so the letters stay distinctive: SPR reads better than SPA. */
function designation(slug: string, index: string) {
  const letters = slug.replace(/[^a-z]/gi, "").toUpperCase();
  const consonants = letters.replace(/[AEIOU]/g, "");
  return `${(consonants + letters).slice(0, 3)}-${index}`;
}

export function Work() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [activeSlug, setActiveSlug] = useState(projects[0].slug);

  const shown = useMemo(
    () => projects.filter((p) => filter === "all" || p.tags.includes(filter)),
    [filter],
  );

  // The active project has to come from the filtered set: filtering away the
  // selected one would otherwise leave the viewport showing something no
  // longer in the list.
  const active = shown.find((p) => p.slug === activeSlug) ?? shown[0];

  return (
    <section id="work" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-36 sm:py-48">
      <SectionHeading index="01" title="Selected Work" hint="every project, one case study each" />

      <Reveal>
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-sm text-muted">
            <span className="term-green">$</span> ls ./projects{" "}
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

      <Reveal delay={0.1}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
          {/* ── manifest ─────────────────────────────────────────────────── */}
          <ul className="divide-y divide-line border-y border-line">
            {shown.map((p) => {
              const on = active?.slug === p.slug;
              return (
                <li key={p.slug}>
                  <Link
                    href={`/work/${p.slug}`}
                    onMouseEnter={() => setActiveSlug(p.slug)}
                    onFocus={() => setActiveSlug(p.slug)}
                    className="group flex items-center gap-4 py-4 outline-none transition-colors sm:gap-5"
                  >
                    {/* selection marker — the row the viewport is showing */}
                    <span
                      aria-hidden
                      className={`h-8 w-px shrink-0 transition-colors duration-300 ${
                        on ? "bg-accent" : "bg-transparent"
                      }`}
                    />

                    <span
                      className={`shrink-0 font-mono text-[11px] tabular-nums transition-colors duration-300 ${
                        on ? "text-accent" : "text-muted/50"
                      }`}
                    >
                      {designation(p.slug, p.index)}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate font-sans text-base font-bold tracking-tight transition-colors duration-300 sm:text-lg ${
                          on ? "text-accent" : "text-fg"
                        }`}
                      >
                        {p.title}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[11px] text-muted/70">
                        {p.company ? `${p.company} · ` : ""}
                        {p.platform}
                      </span>
                    </span>

                    {p.link && (
                      <span
                        aria-hidden
                        title="live"
                        className="relative flex size-1.5 shrink-0"
                      >
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
                      </span>
                    )}

                    <span
                      aria-hidden
                      className={`shrink-0 font-mono text-[11px] transition-all duration-300 ${
                        on ? "translate-x-0 text-accent opacity-100" : "-translate-x-1 opacity-0"
                      }`}
                    >
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ── viewport ─────────────────────────────────────────────────── */}
          {active && (
            /* On a narrow screen there is no hover, so the viewport can
               never be driven by the list — it leads instead, as a featured
               project, with the manifest reading underneath it. */
            <div className="order-first lg:order-none lg:sticky lg:top-28 lg:self-start">
              <Link
                href={`/work/${active.slug}`}
                className="group block overflow-hidden rounded-2xl border border-line bg-bg/40 backdrop-blur-sm transition-colors duration-300 hover:border-accent/60"
              >
                {/* ── the display ──────────────────────────────────────
                    A bezel with a screen inside it rather than a picture
                    running edge to edge. Two reasons: the shot is contained
                    now, so it needs a black ground to sit on and be framed by,
                    and a bordered panel reads as a monitor in a console — the
                    thing the whole section is pretending to be. */}
                <div className="p-3 sm:p-4">
                  <div className="rounded-xl border border-line bg-[linear-gradient(180deg,color-mix(in_oklab,var(--fg)_7%,var(--bg)),var(--bg))] p-2.5 shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--fg)_10%,transparent)]">
                    <div className="relative isolate aspect-[16/9] overflow-hidden rounded-lg bg-black ring-1 ring-[color-mix(in_oklab,var(--fg)_12%,transparent)]">
                      {/* keyed on the slug so React remounts it per project and
                          the fade replays, rather than swapping pixels in place */}
                      <div
                        key={active.slug}
                        className="absolute inset-0 animate-[fade-in_0.45s_ease-out]"
                      >
                        <ProjectVisual slug={active.slug} />
                      </div>

                      <span
                        aria-hidden
                        className="tele-grid pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
                      />
                      <span
                        aria-hidden
                        className="scan-bar pointer-events-none absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--accent)_14%,transparent),transparent)]"
                      />

                      {/* glare: one soft diagonal wipe, so the glass reads as
                          glass instead of as a flat hole in the bezel */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,color-mix(in_oklab,var(--fg)_9%,transparent),transparent_42%)]"
                      />

                      {[
                        "left-2.5 top-2.5 border-l border-t",
                        "right-2.5 top-2.5 border-r border-t",
                        "bottom-2.5 left-2.5 border-b border-l",
                        "bottom-2.5 right-2.5 border-b border-r",
                      ].map((pos) => (
                        <span
                          key={pos}
                          aria-hidden
                          className={`pointer-events-none absolute size-3 border-accent/50 ${pos}`}
                        />
                      ))}
                    </div>

                    {/* chin: the readouts live on the bezel now, off the
                        picture, so they never sit on top of the work */}
                    <div className="flex items-center justify-between gap-3 px-1 pb-0.5 pt-2.5 font-mono text-[10px]">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className={`size-1.5 rounded-full ${
                            active.link
                              ? "bg-accent shadow-[0_0_6px_1px_var(--ring)]"
                              : "bg-muted/40"
                          }`}
                        />
                        <span className="text-accent">
                          {designation(active.slug, active.index)}
                        </span>
                      </span>
                      <span className="uppercase tracking-widest text-muted/70">
                        {active.link ? "live" : "archived"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-7 pb-7 pt-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-sans text-2xl font-bold tracking-tight transition-colors duration-300 group-hover:text-accent">
                      {active.title}
                    </h3>
                    <span className="shrink-0 font-mono text-[11px] text-muted/70">
                      {active.year}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{active.tagline}</p>

                  {active.outcome[0] && (
                    <p className="mt-6 flex items-baseline gap-2.5">
                      <span className="font-sans text-3xl font-bold leading-none tracking-tight text-accent">
                        {active.outcome[0].value}
                      </span>
                      <span className="font-mono text-[11px] text-muted">
                        {active.outcome[0].label}
                      </span>
                    </p>
                  )}

                  <div className="mt-7 flex items-center justify-between gap-4 border-t border-line pt-5">
                    <span className="flex items-center gap-3">
                      {active.stack.slice(0, 5).map((s) => (
                        <span key={s} title={s} className="opacity-70">
                          <TechIcon name={s} size={16} />
                        </span>
                      ))}
                      {active.stack.length > 5 && (
                        <span className="font-mono text-[10px] text-muted/60">
                          +{active.stack.length - 5}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 font-mono text-[11px] text-muted transition-colors group-hover:text-accent">
                      open dossier
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
