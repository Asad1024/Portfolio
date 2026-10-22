"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

/* A surface with a soft highlight that follows the pointer across its face,
   the way light catches a pane of glass. It no longer leans: hovers on the
   site stay still and only change light. Mouse only, and off for reduced
   motion.

   The light is painted once, as a glow on its own layer, and moved by
   transform; the surface is measured as the pointer enters rather than on
   every move. Rewriting a gradient string per move repainted the whole
   overlay each time. */
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
  const rect = useRef<DOMRect | null>(null);
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);
  const glow = useSpring(0, { stiffness: 120, damping: 20 });

  const onMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== "mouse" || !ref.current) return;
    const r = (rect.current ??= ref.current.getBoundingClientRect());
    gx.set(e.clientX - r.left);
    gy.set(e.clientY - r.top);
    glow.set(1);
  };

  return (
    <div
      className={className}
      onPointerEnter={() => (rect.current = null)}
      onPointerMove={onMove}
      onPointerLeave={() => glow.set(0)}
    >
      <div ref={ref} className="relative h-full">
        {children}
        <motion.div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-10 overflow-hidden ${rounded}`}
          style={{ opacity: glow }}
        >
          <motion.span
            className="absolute left-0 top-0 -ml-[520px] -mt-[520px] block size-[1040px] will-change-transform"
            style={{
              x: gx,
              y: gy,
              background: "radial-gradient(circle closest-side, rgba(165, 243, 252, 0.11), transparent 45%)",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
