"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/** A number that counts up from zero the first time it comes into view. */
export function CountUp({ to, duration = 1.4 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();

  // wait at zero until seen
  useEffect(() => {
    if (ref.current && !reduced) ref.current.textContent = "0";
  }, [reduced]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduced) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (v) => (el.textContent = String(Math.round(v))),
    });
    return () => controls.stop();
  }, [inView, reduced, to, duration]);

  // the real number is in the markup, so it reads right before and without the count
  return (
    <span ref={ref} className="tabular-nums">
      {to}
    </span>
  );
}
