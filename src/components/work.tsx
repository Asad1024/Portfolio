"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

/** How long the pointer has to rest on a row before the viewport follows it.
 *  Long enough that sweeping across the list toward the viewport doesn't
 *  cycle through everything on the way; short enough to still feel instant. */
const HOVER_INTENT_MS = 120;
/** Quiet period after the last scroll or wheel event before hover counts
 *  again. Long enough to cover Lenis easing out after the final wheel tick. */
const SCROLL_SETTLE_MS = 300;
/** How far the pointer must move after a scroll before hover counts again. */
const MIN_TRAVEL_PX = 10;
/** Matches the fade-in keyframe, so the outgoing shot is dropped only once
 *  the incoming one fully covers it. */
const CROSSFADE_MS = 450;

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

  /* The shot being faded out, kept underneath the incoming one so a switch is
     a crossfade rather than a flash of the black ground between two images. */
  const [outgoing, setOutgoing] = useState<string | null>(null);
  const outgoingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const select = (slug: string) => {
    if (!active || slug === active.slug) return;
    setOutgoing(active.slug);
    setActiveSlug(slug);
    clearTimeout(outgoingTimer.current);
    outgoingTimer.current = setTimeout(() => setOutgoing(null), CROSSFADE_MS);
  };

  /* Scrolling moves the list under a pointer that hasn't moved, and the
     browser reports every row that slides beneath it as hovered — which made
     an ordinary scroll flick the viewport through half the projects.

     Two gates, because either alone leaks. The page has to be still (Lenis
     keeps it gliding well after the last wheel tick, hence the wheel listener
     and the generous settle). And the pointer has to have genuinely travelled
     since the scroll: a hand on a mouse drifts a pixel or two while it works
     the wheel, and Chrome fires a synthetic move at the old coordinates once
     scrolling ends to refresh hover state — neither is someone choosing a
     project. */
  const scrolling = useRef(false);
  const travel = useRef(Infinity);
  const pending = useRef<{ slug: string; timer: ReturnType<typeof setTimeout> } | null>(null);

  useEffect(() => {
    let settle: ReturnType<typeof setTimeout> | undefined;
    let last: { x: number; y: number } | null = null;

    const onScroll = () => {
      scrolling.current = true;
      travel.current = 0;
      if (pending.current) {
        clearTimeout(pending.current.timer);
        pending.current = null;
      }
      clearTimeout(settle);
      settle = setTimeout(() => {
        scrolling.current = false;
      }, SCROLL_SETTLE_MS);
    };
    const onMove = (e: PointerEvent) => {
      if (last) travel.current += Math.hypot(e.clientX - last.x, e.clientY - last.y);
      last = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onScroll, { passive: true });
    // capture, so the distance is counted before the row's own handler reads it
    window.addEventListener("pointermove", onMove, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("pointermove", onMove, { capture: true });
      clearTimeout(settle);
      clearTimeout(outgoingTimer.current);
      if (pending.current) clearTimeout(pending.current.timer);
    };
  }, []);

  /* Driven by pointer movement rather than enter, so a row that scrolled
     under a resting cursor waits for the cursor to actually move. Touch has
     no hover — a tap there opens the case study. */
  const intend = (e: React.PointerEvent, slug: string) => {
    if (e.pointerType === "touch" || scrolling.current) return;
    if (travel.current < MIN_TRAVEL_PX) return;
    if (slug === active?.slug || pending.current?.slug === slug) return;
    if (pending.current) clearTimeout(pending.current.timer);
    pending.current = {
      slug,
      timer: setTimeout(() => {
        pending.current = null;
        select(slug);
      }, HOVER_INTENT_MS),
    };
  };

  const abandon = (slug: string) => {
    if (pending.current?.slug !== slug) return;
    clearTimeout(pending.current.timer);
    pending.current = null;
  };

  return (
    <section id="work" className="mx-auto max-w-shell scroll-mt-24 px-6 py-24 sm:py-32">
      <SectionHeading index="01" title="Selected Work" hint="every project, one case study each" />

      <Reveal>
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-sm text-muted">
            <span className="term-green">$</span> ls ./projects{" "}
            <span className="text-muted/80">({shown.length})</span>
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
                    onPointerMove={(e) => intend(e, p.slug)}
                    onPointerLeave={() => abandon(p.slug)}
                    onFocus={() => select(p.slug)}
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
                      className={`shrink-0 font-mono text-xs tabular-nums transition-colors duration-300 ${
                        on ? "text-accent" : "text-muted/80"
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
                      <span className="mt-0.5 block truncate font-mono text-xs text-muted/90">
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
                      className={`shrink-0 font-mono text-xs transition-all duration-300 ${
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
                {/* Full bleed to the panel edge. The ground is black rather
                    than the card colour because the shot is contained, not
                    cropped — against black the small letterboxing reads as a
                    screen showing content; against the card it read as a gap. */}
                <div className="relative isolate aspect-[16/10] overflow-hidden border-b border-line bg-black">
                  {/* Keyed on the slug, so the incoming shot mounts fresh and
                      its fade plays, while the outgoing one keeps its element
                      — and its finished animation — and simply sits beneath
                      until it is covered. That is the crossfade: no frame
                      where neither is showing. */}
                  {/* Inset past the corner ticks, so the brackets sit just
                      outside the picture and frame it rather than lying on top
                      of it. The black ground fills the margin. */}
                  {[outgoing, active.slug]
                    .filter((slug, i): slug is string => !!slug && (i === 1 || slug !== active.slug))
                    .map((slug) => (
                      <div
                        key={slug}
                        className="absolute inset-5 animate-[fade-in_0.45s_ease-out]"
                      >
                        <ProjectVisual slug={slug} />
                      </div>
                    ))}

                  <span
                    aria-hidden
                    className="tele-grid pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
                  />
                  <span
                    aria-hidden
                    className="scan-bar pointer-events-none absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--accent)_14%,transparent),transparent)]"
                  />

                  {[
                    "left-3 top-3 border-l border-t",
                    "right-3 top-3 border-r border-t",
                    "bottom-3 left-3 border-b border-l",
                    "bottom-3 right-3 border-b border-r",
                  ].map((pos) => (
                    <span
                      key={pos}
                      aria-hidden
                      className={`pointer-events-none absolute size-3.5 border-accent/60 ${pos}`}
                    />
                  ))}

                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--bg)_85%,transparent),transparent)]"
                  />
                  <span className="absolute left-5 top-4 font-mono text-xs text-accent">
                    {designation(active.slug, active.index)}
                  </span>
                  <span className="absolute right-5 top-4 font-mono text-xs uppercase tracking-widest text-muted/80">
                    {active.link ? "live" : "private build"}
                  </span>
                </div>

                <div className="p-7">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-sans text-2xl font-bold tracking-tight transition-colors duration-300 group-hover:text-accent">
                      {active.title}
                    </h3>
                    <span className="shrink-0 font-mono text-xs text-muted/90">
                      {active.year}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{active.tagline}</p>

                  {active.outcome[0] && (
                    <p className="mt-6 flex items-baseline gap-2.5">
                      <span className="font-sans text-3xl font-bold leading-none tracking-tight text-accent">
                        {active.outcome[0].value}
                      </span>
                      <span className="font-mono text-xs text-muted">
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
                        <span className="font-mono text-xs text-muted/80">
                          +{active.stack.length - 5}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 font-mono text-xs text-muted transition-colors group-hover:text-accent">
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
