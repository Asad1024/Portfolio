"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { projects } from "@/lib/data";

/* Route transition: a terminal-style task list that checks itself off, then
   dissolves as the page rises in underneath (~1.2s).

   Everything here is CSS-transition driven rather than animated in JS: a
   throttled tab starves requestAnimationFrame, which would otherwise strand
   the veil — and the page behind it — at opacity 0. */
const STEP_MS = 400;
const HOLD_MS = 280;
const FADE_MS = 350;

function routeInfo(pathname: string) {
  if (pathname.startsWith("/work/")) {
    const slug = pathname.split("/")[2];
    const project = projects.find((p) => p.slug === slug);
    return {
      label: `~/work/${slug}`,
      steps: [
        "resolving route",
        `loading ${project?.title ?? "case study"}`,
        "fetching screenshots",
        "building architecture map",
        "ready",
      ],
    };
  }
  return {
    label: "~/home",
    steps: [
      "resolving route",
      "mounting sections",
      "indexing projects",
      "warming interface",
      "ready",
    ],
  };
}

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { label, steps } = routeInfo(pathname);
  const [done, setDone] = useState(0);
  const [lifting, setLifting] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    setDone(0);
    setLifting(false);
    setGone(false);

    const total = steps.length;
    const start = performance.now();
    // wall-clock driven so a throttled interval still lands on the right step
    const id = setInterval(() => {
      const n = Math.min(total, Math.floor((performance.now() - start) / STEP_MS) + 1);
      setDone(n);
      if (n >= total) clearInterval(id);
    }, 60);

    const lift = setTimeout(() => {
      setDone(total);
      setLifting(true);
      // the hero holds its entrance until the veil is actually out of the way,
      // otherwise the name animates behind it and lands already finished
      window.dispatchEvent(new CustomEvent("route-revealed"));
    }, total * STEP_MS + HOLD_MS);
    const clear = setTimeout(
      () => setGone(true),
      total * STEP_MS + HOLD_MS + FADE_MS,
    );

    return () => {
      clearInterval(id);
      clearTimeout(lift);
      clearTimeout(clear);
    };
    // re-run the sequence on every navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const pct = Math.round((done / steps.length) * 100);

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
          <div className="w-[15rem] font-mono text-xs">
            <p className="text-muted">
              <span className="text-accent">$</span> accessing{" "}
              <span className="text-fg">{label}</span>
            </p>

            <div className="mt-4 space-y-2">
              {steps.map((step, i) => {
                const complete = done > i;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-2.5 transition-opacity duration-300 ${
                      complete ? "opacity-100" : "opacity-30"
                    }`}
                  >
                    <span className="flex size-3 items-center justify-center">
                      {complete ? (
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <span className="block size-1.5 animate-pulse rounded-full bg-muted" />
                      )}
                    </span>
                    <span className={complete ? "text-muted" : "text-muted/60"}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-line">
                <div
                  className="h-full bg-accent transition-[width] duration-300 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="tabular-nums text-muted">{pct}%</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
