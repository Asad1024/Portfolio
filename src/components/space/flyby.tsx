"use client";

import { useEffect, useRef, useState } from "react";
import { Ship } from "./ship";

/* The terminal's `launch`: a departure, not a fly-past. The probe sweeps in
   close to the camera at the lower left, pulls away into deep space toward a
   vanishing point, shrinking to the glow of its own drive — and then jumps:
   a flash where it was, and the stars stretch into light-speed streaks that
   burst outward from that point and fade. About two and a half seconds, on
   every page and every screen size, and only ever because it was asked for.
   Visitors who prefer reduced motion get the terminal's countdown and no
   flight. */

const DEPART_MS = 1700;
const JUMP_MS = 900;

export function Flyby() {
  const [run, setRun] = useState(0);
  const craftRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const streaksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onLaunch = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setRun((n) => n + 1);
    };
    window.addEventListener("launch-ship", onLaunch);
    return () => window.removeEventListener("launch-ship", onLaunch);
  }, []);

  useEffect(() => {
    const craft = craftRef.current;
    const flash = flashRef.current;
    const streaks = streaksRef.current;
    if (!run || !craft || !flash || !streaks) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const vx = w * 0.62;
    const vy = h * 0.36;
    const sx = w * 0.06;
    const sy = h * 1.05;
    // nose along the line of flight, from the near corner to the vanishing point
    const bearing = Math.atan2(vx - sx, -(vy - sy)) * (180 / Math.PI);

    const depart = craft.animate(
      [
        { transform: `translate(${sx}px, ${sy}px) rotate(${bearing}deg) scale(3.2)`, opacity: 0 },
        { transform: `translate(${sx + (vx - sx) * 0.25}px, ${sy + (vy - sy) * 0.25}px) rotate(${bearing}deg) scale(2)`, opacity: 1, offset: 0.12 },
        { transform: `translate(${vx}px, ${vy}px) rotate(${bearing}deg) scale(0.05)`, opacity: 1 },
      ],
      { duration: DEPART_MS, easing: "cubic-bezier(0.2, 0.55, 0.25, 1)", fill: "forwards" },
    );

    flash.style.left = `${vx}px`;
    flash.style.top = `${vy}px`;
    streaks.style.setProperty("--vx", `${vx}px`);
    streaks.style.setProperty("--vy", `${vy}px`);

    const jumpAt = DEPART_MS - 120;
    const flashAnim = flash.animate(
      [
        { transform: "translate(-50%, -50%) scale(0)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0.15 },
        { transform: "translate(-50%, -50%) scale(2.4)", opacity: 0 },
      ],
      { duration: JUMP_MS, delay: jumpAt, easing: "ease-out", fill: "both" },
    );
    const streakAnim = streaks.animate(
      [
        { opacity: 0, transform: "scale(0.6)" },
        { opacity: 0.9, transform: "scale(1)", offset: 0.2 },
        { opacity: 0, transform: "scale(1.5)" },
      ],
      { duration: JUMP_MS, delay: jumpAt, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)", fill: "both" },
    );

    const done = () => setRun(0);
    streakAnim.addEventListener("finish", done);
    return () => {
      streakAnim.removeEventListener("finish", done);
      [depart, flashAnim, streakAnim].forEach((a) => a.cancel());
    };
  }, [run]);

  if (!run) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[180] overflow-hidden">
      {/* light-speed streaks, bursting out from where the probe jumped */}
      <div
        ref={streaksRef}
        className="absolute inset-0 opacity-0"
        style={{
          transformOrigin: "var(--vx) var(--vy)",
          /* two sets of rays at different spacings, so they interfere into an
             irregular burst instead of reading as a printed pattern */
          background:
            "repeating-conic-gradient(from 0deg at var(--vx) var(--vy), transparent 0deg 3.1deg, color-mix(in oklab, var(--accent) 70%, white) 3.1deg 3.35deg, transparent 3.35deg 7.3deg, rgba(255,255,255,0.85) 7.3deg 7.42deg), repeating-conic-gradient(from 1.3deg at var(--vx) var(--vy), transparent 0deg 4.4deg, color-mix(in oklab, var(--accent) 45%, transparent) 4.4deg 4.6deg, transparent 4.6deg 11.9deg)",
          maskImage:
            "radial-gradient(circle at var(--vx) var(--vy), transparent 0 6%, #000 22%, #000 55%, transparent 85%)",
        }}
      />
      <div
        ref={flashRef}
        className="absolute size-40 rounded-full opacity-0"
        style={{
          background:
            "radial-gradient(circle, #fff 0 8%, color-mix(in oklab, var(--accent) 80%, white) 18%, color-mix(in oklab, var(--accent) 30%, transparent) 40%, transparent 70%)",
        }}
      />
      {/* The animated element scales about its own origin, which sits on the
          flight line; the inner offset centres the hull on that point, so the
          probe stays on its line at every size. */}
      <div ref={craftRef} className="absolute left-0 top-0 will-change-transform" style={{ transformOrigin: "0 0" }}>
        <div
          className="-translate-x-1/2 -translate-y-[22%]"
          style={{ filter: "drop-shadow(0 0 10px color-mix(in oklab, var(--accent) 60%, transparent))" }}
        >
          <Ship size={30} thrust={1} />
        </div>
      </div>
    </div>
  );
}
