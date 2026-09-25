"use client";

import { useEffect, useRef, useState } from "react";
import { Ship } from "./ship";

/* The terminal's `launch`: the ship lifts off from the bottom-left corner and
   streaks out through the top-right, dragging a light trail, over about two
   seconds. Works on every page and every screen size — unlike the voyage,
   it only crosses the content for a moment, and only because it was asked
   to. Visitors who prefer reduced motion get the terminal's countdown text
   and no flight. */
const FLIGHT_MS = 2100;

export function Flyby() {
  const [flying, setFlying] = useState(0);
  const craftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onLaunch = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setFlying((n) => n + 1);
    };
    window.addEventListener("launch-ship", onLaunch);
    return () => window.removeEventListener("launch-ship", onLaunch);
  }, []);

  useEffect(() => {
    const craft = craftRef.current;
    if (!flying || !craft) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    // aimed along the screen's own diagonal, so the ship always flies nose-first
    const angle = Math.atan2(w * 1.3, h * 1.3) * (180 / Math.PI);
    const anim = craft.animate(
      [
        { transform: `translate(${-0.12 * w}px, ${1.12 * h}px) rotate(${angle}deg) scale(0.8)` },
        { transform: `translate(${0.45 * w}px, ${0.5 * h}px) rotate(${angle}deg) scale(1.6)`, offset: 0.55 },
        { transform: `translate(${1.15 * w}px, ${-0.18 * h}px) rotate(${angle}deg) scale(1.1)` },
      ],
      { duration: FLIGHT_MS, easing: "cubic-bezier(0.45, 0, 0.25, 1)", fill: "forwards" },
    );
    const done = () => setFlying(0);
    anim.addEventListener("finish", done);
    return () => {
      anim.removeEventListener("finish", done);
      anim.cancel();
    };
  }, [flying]);

  if (!flying) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[180] overflow-hidden">
      <div ref={craftRef} className="absolute left-0 top-0 will-change-transform">
        {/* the trail hangs off the tail and fades back along the flight line */}
        <span className="absolute left-1/2 top-[70%] h-56 w-[3px] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,var(--accent),transparent)] opacity-70 blur-[1px]" />
        <Ship size={34} flame={1} />
      </div>
    </div>
  );
}
