"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { projects } from "@/lib/data";

/* ── route change: an orbital transfer ──────────────────────────────────────
   A trajectory draws itself between two bodies while a craft runs it, and the
   destination lights up as it arrives.

   It echoes the first-visit loader deliberately — a lit body travelling a
   curve toward something — so the two curtains read as one system rather than
   two unrelated effects. It is also literally what a navigation is: you were
   there, now you are here.

   Everything the page depends on is CSS-transition driven, not animated in
   JS. A throttled tab starves requestAnimationFrame, and neither the veil nor
   the content behind it may be stranded at opacity 0 because of that. The
   trajectory is pure CSS for the same reason: there is no loop to starve. */

const HOLD_MS = 1250;
const FADE_MS = 550;
const TOTAL_MS = HOLD_MS + FADE_MS;

/** Shared by the drawn path and the craft's offset-path, so the curve and the
 *  thing running it can never disagree. */
const TRAJECTORY = "M 54 96 Q 200 12 346 96";

function destination(pathname: string) {
  if (pathname.startsWith("/work/")) {
    const slug = pathname.split("/")[2];
    const project = projects.find((p) => p.slug === slug);
    return { name: project?.title ?? slug, sub: project?.platform ?? "case study" };
  }
  return { name: "asad", sub: "home" };
}

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [lifting, setLifting] = useState(false);
  const [gone, setGone] = useState(false);
  const { name, sub } = destination(pathname);

  useEffect(() => {
    setLifting(false);
    setGone(false);

    const lift = setTimeout(() => {
      setLifting(true);
      // the hero holds its entrance until the veil is actually out of the way,
      // otherwise the name animates behind it and lands already finished
      window.dispatchEvent(new CustomEvent("route-revealed"));
    }, HOLD_MS);
    const clear = setTimeout(() => setGone(true), TOTAL_MS);

    return () => {
      clearTimeout(lift);
      clearTimeout(clear);
    };
  }, [pathname]);

  return (
    <>
      {/* The veil masks the page while it settles, so this only ever offsets
          the content — never fades it out. Content stays visible even if the
          transition never runs. */}
      <div
        className={`transition-transform duration-500 ease-out ${
          lifting ? "translate-y-0" : "translate-y-4"
        }`}
      >
        {children}
      </div>

      {!gone && (
        <div
          aria-hidden
          className={`pointer-events-none fixed inset-0 z-[120] flex items-center justify-center bg-bg transition-opacity ease-out ${
            lifting ? "opacity-0" : "opacity-100"
          }`}
          style={{ transitionDuration: `${FADE_MS}ms` }}
        >
          {/* keyed on the route so the whole sequence restarts on every
              navigation rather than holding its finished state */}
          <div key={pathname} className="w-[25rem] max-w-[86vw] px-6">
            <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.35em] text-muted/60">
              transfer orbit
            </p>

            <svg viewBox="0 0 400 120" className="w-full overflow-visible">
              {/* the full course, faint */}
              <path
                d={TRAJECTORY}
                fill="none"
                stroke="var(--line)"
                strokeWidth="1"
                strokeDasharray="2 6"
              />
              {/* the part already flown */}
              <path
                className="trace-path"
                d={TRAJECTORY}
                pathLength={1}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* origin */}
              <circle cx="54" cy="96" r="3" fill="var(--muted)" />

              {/* destination — its ring closes as the craft lands */}
              <circle
                cx="346"
                cy="96"
                r="7"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1"
                className="arrive"
                style={{ transformOrigin: "346px 96px" }}
              />
              <circle cx="346" cy="96" r="2.5" fill="var(--accent)" />

              {/* the craft, running the same curve the path describes */}
              <circle className="run-path" r="3.5" fill="var(--fg)" />
            </svg>

            <div className="mt-1 text-center">
              <p className="font-sans text-lg font-bold tracking-tight">{name}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted">{sub}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
