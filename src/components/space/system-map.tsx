"use client";

import { useState } from "react";
import Link from "next/link";
import { projects } from "@/lib/data";

/* The system map: every project as a body on its own orbit, on a plane tilted
   into the screen with CSS 3D.

   Each planet sits at the top edge of a wrapper div sized to its orbit's
   diameter; spinning that wrapper walks the planet around the circle, and the
   parent's rotateX turns the circle into an ellipse. So the orbit is one
   transform on one element — no rAF loop, no layout thrash, and it composites
   on the GPU alongside the hero's WebGL context instead of competing with it.

   The planet itself counter-rotates by the same angle so it stays face-on to
   the viewer rather than lying flat in the orbital plane. */

const TILT = 64;
const TAG_COLOR: Record<string, string> = {
  ai: "var(--violet)",
  desktop: "var(--accent)",
  web: "#38bdf8",
  cloud: "#2dd4bf",
};

export function SystemMap() {
  const [active, setActive] = useState<string | null>(null);
  const current = projects.find((p) => p.slug === active);

  return (
    <div className="relative">
      {/* readout — the hacker frame around the cosmic object */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between font-mono text-[10px] uppercase tracking-widest text-muted/70">
        <span className="term-green">◆ system map</span>
        <span>{projects.length} bodies · click to open</span>
      </div>

      <div
        className="relative mx-auto flex h-[26rem] items-center justify-center sm:h-[32rem]"
        style={{ perspective: "1100px" }}
      >
        <div
          className="relative size-0"
          style={{ transform: `rotateX(${TILT}deg)`, transformStyle: "preserve-3d" }}
        >
          {projects.map((p, i) => {
            const radius = 74 + i * 24;
            const size = radius * 2;
            const color = TAG_COLOR[p.tags[0]] ?? "#38bdf8";
            const isActive = active === p.slug;
            const dimmed = active !== null && !isActive;

            return (
              <div key={p.slug}>
                {/* orbit path */}
                <div
                  aria-hidden
                  className="orbit-ring absolute left-0 top-0 transition-opacity duration-300"
                  style={{
                    width: size,
                    height: size,
                    marginLeft: -radius,
                    marginTop: -radius,
                    opacity: isActive ? 0.85 : dimmed ? 0.12 : 0.34,
                    borderColor: isActive ? color : undefined,
                  }}
                />

                {/* the spinner: one rotation = one orbital period */}
                <div
                  className="orbit-spin absolute left-0 top-0"
                  style={{
                    width: size,
                    height: size,
                    marginLeft: -radius,
                    marginTop: -radius,
                    // outer bodies take longer to come round, as they should
                    animationDuration: `${26 + i * 7}s`,
                    animationDelay: `${-i * 4.4}s`,
                  }}
                >
                  <div
                    className="absolute left-1/2 top-0"
                    style={{ transform: `translateX(-50%) rotateX(-${TILT}deg)` }}
                  >
                    <Link
                      href={`/work/${p.slug}`}
                      onMouseEnter={() => setActive(p.slug)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(p.slug)}
                      onBlur={() => setActive(null)}
                      aria-label={`${p.title} — ${p.tagline}`}
                      className="block rounded-full outline-none transition-transform duration-300 hover:scale-150 focus-visible:scale-150"
                      style={{ transform: isActive ? "scale(1.5)" : undefined }}
                    >
                      <span
                        className="block rounded-full transition-all duration-300"
                        style={{
                          width: p.featured ? 13 : 9,
                          height: p.featured ? 13 : 9,
                          background: color,
                          opacity: dimmed ? 0.3 : 1,
                          boxShadow: isActive
                            ? `0 0 18px 3px ${color}`
                            : `0 0 9px 0 ${color}`,
                        }}
                      />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* the star at the centre */}
          <div
            aria-hidden
            className="absolute left-0 top-0 rounded-full"
            style={{
              width: 34,
              height: 34,
              marginLeft: -17,
              marginTop: -17,
              transform: `rotateX(-${TILT}deg)`,
              background:
                "radial-gradient(circle, #ffffff 0%, var(--accent) 42%, transparent 72%)",
              boxShadow: "0 0 44px 12px var(--ring)",
            }}
          />
        </div>
      </div>

      {/* dossier readout — reserves its own height so hovering never reflows
          the section underneath it */}
      <div className="pointer-events-none relative z-20 mx-auto -mt-6 flex h-20 max-w-md items-start justify-center text-center">
        {current ? (
          <div className="rounded-lg border border-accent/40 bg-bg/85 px-5 py-3 backdrop-blur-sm">
            <p className="font-mono text-[10px] text-accent">
              {current.index} · {current.year}
            </p>
            <p className="mt-1 font-sans text-base font-bold tracking-tight">{current.title}</p>
            <p className="mt-0.5 font-mono text-[10px] text-muted">{current.tagline}</p>
          </div>
        ) : (
          <p className="pt-4 font-mono text-[11px] text-muted/70">
            hover a body to identify · click to open its dossier
          </p>
        )}
      </div>
    </div>
  );
}
