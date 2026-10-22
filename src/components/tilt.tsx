"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

/* A surface with a soft highlight that follows the pointer across its face,
   the way light catches a pane of glass. It no longer leans: hovers on the
   site stay still and only change light. Mouse only, and off for reduced
   motion. */
export function Tilt({
  children,
  className,
  rounded = "rounded-3xl",
}: {
  children: React.ReactNode;
  className?: string;
  /** the card's own radius, so the highlight is clipped to its corners */
  rounded?: string;
  /** no longer used; kept so existing callers still compile */
  max?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glow = useSpring(0, { stiffness: 120, damping: 20 });
  const background = useMotionTemplate`radial-gradient(520px circle at ${gx}% ${gy}%, rgba(165, 243, 252, 0.11), transparent 45%)`;

  const onMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    gx.set(((e.clientX - r.left) / r.width) * 100);
    gy.set(((e.clientY - r.top) / r.height) * 100);
    glow.set(1);
  };

  return (
    <div className={className} onPointerMove={onMove} onPointerLeave={() => glow.set(0)}>
      <div ref={ref} className="relative h-full">
        {children}
        <motion.div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-10 ${rounded}`}
          style={{ background, opacity: glow }}
        />
      </div>
    </div>
  );
}
