"use client";

import { useEffect, useId, useState } from "react";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";

export type Mood = "idle" | "thinking" | "speaking";

/** Nova: a round drone with a visor, two eyes, fins, an antenna beacon and a
 *  thruster. The eyes follow px/py (the pointer, -1…1) and blink on a loose
 *  timer; while speaking they become happy arcs, and while thinking they
 *  glance up and the beacon quickens. The small copy drops the extras. */
export function Nova({
  mood,
  small = false,
  px,
  py,
}: {
  mood: Mood;
  small?: boolean;
  px?: MotionValue<number>;
  py?: MotionValue<number>;
}) {
  const id = useId();
  const still = useMotionValue(0);
  const eyeX = useTransform(px ?? still, (v) => v * 3.2);
  const eyeY = useTransform(py ?? still, (v) => v * 2.6);
  const [blink, setBlink] = useState(false);
  const happy = mood === "speaking";
  const look = mood === "thinking" ? -2 : 0;

  // blink on a loose, irregular timer
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(() => {
        setBlink(true);
        t = setTimeout(() => {
          setBlink(false);
          next();
        }, 140);
      }, 2400 + Math.random() * 3600);
    };
    next();
    return () => clearTimeout(t);
  }, []);

  const body = `${id}-body`;
  const visor = `${id}-visor`;
  const flame = `${id}-flame`;
  return (
    <svg viewBox="0 0 80 80" className="nova block size-full overflow-visible" data-mood={mood} aria-hidden>
      <defs>
        <radialGradient id={body} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#2d3a52" />
          <stop offset="0.55" stopColor="#111a2b" />
          <stop offset="1" stopColor="#05080f" />
        </radialGradient>
        <linearGradient id={visor} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b2230" />
          <stop offset="1" stopColor="#04101a" />
        </linearGradient>
        <radialGradient id={flame} cx="50%" cy="0%" r="100%">
          <stop offset="0" stopColor="#e0fbff" />
          <stop offset="0.4" stopColor="#22d3ee" stopOpacity="0.8" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
      </defs>

      {!small && (
        <>
          {/* thruster */}
          <ellipse className="nova-flame" cx="40" cy="70" rx="7" ry="9" fill={`url(#${flame})`} />
          {/* glow */}
          <circle cx="40" cy="40" r="30" fill="#22d3ee" opacity="0.08" />
          {/* fins */}
          <path d="M11 44 L4 52 L14 50 Z" fill="#14324a" stroke="#22d3ee" strokeOpacity="0.5" strokeWidth="1" />
          <path d="M69 44 L76 52 L66 50 Z" fill="#14324a" stroke="#22d3ee" strokeOpacity="0.5" strokeWidth="1" />
          {/* antenna */}
          <line x1="40" y1="12" x2="40" y2="5" stroke="#22d3ee" strokeOpacity="0.6" strokeWidth="1.5" />
          <circle className="nova-beacon" cx="40" cy="4" r="2.6" fill="#22d3ee" />
        </>
      )}

      {/* body */}
      <circle cx="40" cy="40" r="27" fill={`url(#${body})`} stroke="#22d3ee" strokeOpacity="0.55" strokeWidth="1.2" />
      <path d="M22 28 A22 22 0 0 1 40 17" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />

      {/* visor */}
      <rect x="20" y="32" width="40" height="17" rx="8.5" fill={`url(#${visor})`} stroke="#22d3ee" strokeOpacity="0.4" />

      {/* eyes */}
      <motion.g style={{ x: eyeX, y: eyeY }}>
        <g transform={`translate(0 ${look})`}>
          {happy ? (
            <>
              <path d="M28 42 Q32 37 36 42" fill="none" stroke="#a5f3fc" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M44 42 Q48 37 52 42" fill="none" stroke="#a5f3fc" strokeWidth="2.4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="32" cy="40.5" rx="3.4" ry={blink ? 0.4 : 3.6} fill="#a5f3fc" />
              <ellipse cx="48" cy="40.5" rx="3.4" ry={blink ? 0.4 : 3.6} fill="#a5f3fc" />
              <circle cx="33.2" cy="39.2" r="1" fill="#fff" opacity={blink ? 0 : 0.9} />
              <circle cx="49.2" cy="39.2" r="1" fill="#fff" opacity={blink ? 0 : 0.9} />
            </>
          )}
        </g>
      </motion.g>
      {/* eye glow */}
      <rect x="22" y="34" width="36" height="13" rx="6.5" fill="#22d3ee" opacity="0.07" />
    </svg>
  );
}
