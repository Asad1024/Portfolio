"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ArchCol } from "@/lib/data";

/* ── Architecture, as a live pipeline ──────────────────────────────────────
   The stages sit on one data bus. When the diagram scrolls into view the bus
   draws itself left to right and each stage docks onto it in turn; after
   that a signal keeps travelling the bus, and every node — and its card —
   flares as the signal passes through it.

   Everything that loops is a transform or opacity on a small element, so it
   runs on the compositor and costs the main thread nothing: the page already
   has a whole sky to draw. The loops only start once the diagram is on
   screen, all in the same frame, which is what keeps the flares in step with
   the signal. With reduced motion there is no signal and no flaring. */

/** One trip of the signal plus its rest, in seconds. */
const PERIOD = 5.2;
/** Share of the period spent travelling; the rest is the pause at the end. */
const TRAVEL = 0.78;

export function ArchDiagram({ cols, caption }: { cols: ArchCol[]; caption: string }) {
  const [live, setLive] = useState(false);
  const n = cols.length;
  /* The bus runs from the centre of the first stage to the centre of the last
     one, which on a grid of n equal columns is half a column in from each
     side. */
  const inset = `${50 / n}%`;
  /** When the signal reaches stage i, so its node can flare on arrival. */
  const arrival = (i: number) => `${(TRAVEL * PERIOD * i) / Math.max(1, n - 1)}s`;

  return (
    <motion.div
      className={`arch ${live ? "arch-live" : ""}`}
      style={{ "--arch-period": `${PERIOD}s` } as React.CSSProperties}
      onViewportEnter={() => setLive(true)}
      viewport={{ once: true, margin: "-60px" }}
    >
      {/* ── wide screens: stages across, bus along the top ─────────────── */}
      <div className="relative hidden md:block">
        <div className="absolute top-5 h-3 -translate-y-1/2" style={{ left: inset, right: inset }}>
          {/* the bus, drawn once */}
          <motion.span
            aria-hidden
            className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 origin-left bg-gradient-to-r from-accent/70 via-accent/40 to-accent/70"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
          />
          {/* the signal: a strip the width of the bus with the dot at its
              leading edge, slid from fully left to fully in — so the dot
              crosses the bus on a transform alone, towing a comet tail */}
          <span aria-hidden className="absolute inset-0 overflow-hidden motion-reduce:hidden">
            <span className="arch-signal-x absolute inset-0">
              <span className="absolute inset-y-[5px] right-0 w-2/5 bg-gradient-to-r from-transparent to-accent/70" />
              <span className="absolute right-0 top-1/2 size-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_3px_var(--accent)]" />
            </span>
          </span>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {cols.map((col, i) => (
            <Stage key={col.title} col={col} i={i} delay={arrival(i)} />
          ))}
        </div>
      </div>

      {/* ── narrow screens: stages down, bus along the left ────────────── */}
      <div className="relative md:hidden">
        <div className="absolute bottom-10 left-5 top-5 w-3 -translate-x-1/2">
          <motion.span
            aria-hidden
            className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 origin-top bg-gradient-to-b from-accent/70 via-accent/40 to-accent/70"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
          />
          <span aria-hidden className="absolute inset-0 overflow-hidden motion-reduce:hidden">
            <span className="arch-signal-y absolute inset-0">
              <span className="absolute inset-x-[5px] bottom-0 h-2/5 bg-gradient-to-b from-transparent to-accent/70" />
              <span className="absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_3px_var(--accent)]" />
            </span>
          </span>
        </div>

        <div className="space-y-4">
          {cols.map((col, i) => (
            <Stage key={col.title} col={col} i={i} delay={arrival(i)} vertical />
          ))}
        </div>
      </div>

      <motion.p
        className="mt-8 border-l-2 border-accent pl-4 font-mono text-xs leading-relaxed text-muted"
        initial={{ opacity: 0, x: -12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.25 + n * 0.12 }}
      >
        {caption}
      </motion.p>
    </motion.div>
  );
}

function Stage({
  col,
  i,
  delay,
  vertical = false,
}: {
  col: ArchCol;
  i: number;
  delay: string;
  vertical?: boolean;
}) {
  const step = String(i + 1).padStart(2, "0");
  return (
    <motion.div
      className={vertical ? "flex gap-4" : "flex flex-col items-center"}
      initial={{ opacity: 0, y: vertical ? 0 : 22, x: vertical ? 18 : 0 }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: 0.2 + i * 0.12, ease: [0.21, 0.6, 0.35, 1] }}
    >
      {/* node on the bus */}
      <span className="relative z-10 flex size-10 shrink-0 items-center justify-center">
        <span
          aria-hidden
          className="arch-node-flare absolute inset-0 rounded-full bg-accent/25"
          style={{ animationDelay: delay }}
        />
        <span className="relative flex size-10 items-center justify-center rounded-full border border-accent/50 bg-bg font-mono text-[11px] text-accent shadow-[0_0_14px_-4px_var(--accent)]">
          {step}
        </span>
      </span>

      {/* the stage itself */}
      <div
        className={`group relative w-full flex-1 overflow-hidden rounded-xl border border-line bg-card p-4 backdrop-blur-sm transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-accent/60 ${
          vertical ? "" : "mt-4"
        }`}
      >
        {/* flares as the signal passes; opacity only, so it never repaints */}
        <span
          aria-hidden
          className="arch-card-glow pointer-events-none absolute inset-0 rounded-xl"
          style={{ animationDelay: delay }}
        />
        {/* light that sweeps the card on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent/10 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
        />
        <p className="relative font-mono text-xs uppercase tracking-[0.18em] text-accent">{col.title}</p>
        <ul className="relative mt-3 space-y-2">
          {col.items.map((item, k) => (
            <motion.li
              key={item}
              className="flex items-start gap-2 rounded-md border border-line bg-bg/70 px-3 py-2 font-mono text-xs leading-snug text-muted transition-colors duration-300 group-hover:border-accent/25 group-hover:text-fg"
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: 0.35 + i * 0.12 + k * 0.08 }}
            >
              <span aria-hidden className="mt-[5px] size-1 shrink-0 rounded-full bg-accent/70" />
              {item}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
