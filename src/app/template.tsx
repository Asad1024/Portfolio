"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { projects } from "@/lib/data";

/* ── route change: a jump ───────────────────────────────────────────────────
   Stars stretch into streaks, hold, and snap back as the destination arrives.
   This replaces a terminal task list, which was fine writing but described a
   filesystem on a site about orbits — and made every navigation wait out five
   ticked-off steps for something that has already loaded.

   It is also half the length: 1.1s against 2.3s. A transition is a cut, not a
   loading screen; the page underneath is ready long before either finishes.

   Everything the page depends on is CSS-transition driven, not animated in
   JS. A throttled tab starves requestAnimationFrame, and the veil — and the
   content behind it — must never be left stranded at opacity 0 because of it.
   The streaks are the only rAF work, and they are decoration: if that loop
   never runs, the veil still lifts on its timer. */

const HOLD_MS = 620;
const FADE_MS = 420;
const TOTAL_MS = HOLD_MS + FADE_MS;
const STREAKS = 220;

function destination(pathname: string) {
  if (pathname.startsWith("/work/")) {
    const slug = pathname.split("/")[2];
    return projects.find((p) => p.slug === slug)?.title ?? slug;
  }
  return "home";
}

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [lifting, setLifting] = useState(false);
  const [gone, setGone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    let raf = 0;
    let cancelled = false;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cx = w / 2;
      const cy = h / 2;
      const reach = Math.hypot(w, h) * 0.5;

      const stars = Array.from({ length: STREAKS }, () => ({
        a: Math.random() * Math.PI * 2,
        // biased outward, so the field reads as depth rather than a ring
        d: Math.pow(Math.random(), 0.55),
        len: 0.05 + Math.random() * 0.3,
      }));

      const start = performance.now();
      const draw = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / TOTAL_MS);
        // accelerate away, then decelerate into the destination
        const speed = Math.sin(t * Math.PI);
        ctx.clearRect(0, 0, w, h);
        ctx.lineCap = "round";

        for (const s of stars) {
          const near = s.d * reach + speed * reach * 0.55;
          const far = near + s.len * reach * speed;
          const ca = Math.cos(s.a);
          const sa = Math.sin(s.a);
          ctx.strokeStyle = `rgba(255,255,255,${0.06 + speed * 0.5})`;
          ctx.lineWidth = 0.6 + speed * 0.9;
          ctx.beginPath();
          ctx.moveTo(cx + ca * near, cy + sa * near);
          ctx.lineTo(cx + ca * far, cy + sa * far);
          ctx.stroke();
        }

        if (t < 1) raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
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
          className={`pointer-events-none fixed inset-0 z-[120] bg-bg transition-opacity ease-out ${
            lifting ? "opacity-0" : "opacity-100"
          }`}
          style={{ transitionDuration: `${FADE_MS}ms` }}
        >
          <canvas ref={canvasRef} className="absolute inset-0 size-full" />

          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted">
              <span className="text-accent">↯</span> {destination(pathname)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
