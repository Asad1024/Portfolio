"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Nova } from "./nova";

/* ── the guide layer ────────────────────────────────────────────────────────
   What makes the assistant part of the page rather than a box in its corner.
   When it shows the visitor something (the tour, or a "take me there" in a
   reply), Nova leaves the corner and flies to it: the sky dims around the
   section being shown, the whole of it that's on screen is framed in lock-on
   brackets, and Nova sits in the frame's corner with a line about it.

   The frame follows its section as the page scrolls, so it stays on it
   through the glide and through the visitor's own scrolling. Nothing here
   takes pointer events except the card: the page stays usable. */

export type GuideAction = { label: string; run: () => void; primary?: boolean; quiet?: boolean };

export type GuideStop = {
  /** a selector on the current page */
  target: string;
  kicker: string;
  title: string;
  text: string;
  actions: GuideAction[];
  step?: { index: number; total: number };
};

type Box = { x: number; y: number; w: number; h: number };

const NAV = 72; // the fixed header
const CARD_W = 330;
const CARD_H = 190; // until the card has been measured
const GAP = 16;

/** The part of the section that's on screen, below the header. */
function measure(sel: string, vw: number, vh: number): Box | null {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const top = Math.max(r.top, NAV + 6);
  const bottom = Math.min(r.bottom, vh - 10);
  const left = Math.max(r.left, 0) + 8;
  const right = Math.min(r.right, vw) - 8;
  // scrolled almost past it: keep a sliver framed where it went
  if (bottom - top < 48) return { x: left, y: Math.min(top, vh - 58), w: right - left, h: 48 };
  return { x: left, y: top, w: right - left, h: bottom - top };
}

export function GuideLayer({ stop, onClose }: { stop: GuideStop | null; onClose: () => void }) {
  const reduced = useReducedMotion();
  const [box, setBox] = useState<Box | null>(null);
  const [view, setView] = useState({ w: 0, h: 0 });
  const last = useRef<Box | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(CARD_H);

  // follow the target as the page moves; measured on scroll and resize, and
  // polled gently in case it isn't on the page yet (a route still loading)
  const target = stop?.target;
  useEffect(() => {
    if (!target) return;
    let raf = 0;
    // the previous stop's frame isn't shown for a target that isn't here yet
    let stale = true;
    const read = () => {
      raf = 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const b = measure(target, vw, vh);
      const p = last.current;
      if (!b && stale && p) {
        last.current = null;
        setBox(null);
      }
      if (b) stale = false;
      if (b && (!p || Math.abs(p.x - b.x) + Math.abs(p.y - b.y) + Math.abs(p.w - b.w) + Math.abs(p.h - b.h) > 0.5)) {
        last.current = b;
        setBox(b);
      }
      setView((v) => (v.w === vw && v.h === vh ? v : { w: vw, h: vh }));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    schedule();
    const poll = setInterval(schedule, 300);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(poll);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [target]);

  const show = !!stop && !!box && view.w > 0;
  const mobile = view.w < 640;

  // the card's real height, so it's never placed partly off-screen
  useEffect(() => {
    const el = card.current;
    if (!show || !el) return;
    const ro = new ResizeObserver(() => setCardH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [show]);

  // keyboard users land on the card when the guide appears, so Enter moves on
  useEffect(() => {
    if (show) card.current?.querySelector<HTMLElement>("button.as-btn-solid")?.focus({ preventScroll: true });
  }, [show]);

  // the card docks in the frame's lower-right corner, or just below the
  // frame when the section ends early enough to leave room
  let cx = 0;
  let cy = 0;
  if (box) {
    if (mobile) {
      cx = 12;
      cy = view.h - cardH - 16;
    } else {
      cx = Math.min(Math.max(box.x + box.w - CARD_W - GAP, GAP), view.w - CARD_W - GAP);
      const below = box.y + box.h + GAP;
      cy = below + cardH < view.h - GAP ? below : Math.max(box.y + box.h - cardH - GAP, NAV + GAP);
    }
  }

  // brisk: a step lands in well under a second
  const spring = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 30 };
  const flight = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 170, damping: 22 };

  return (
    <AnimatePresence>
      {show && box && stop && (
        <motion.div
          key="guide"
          className="pointer-events-none fixed inset-0 z-[95]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          transition={{ duration: 0.2 }}
        >
          {/* the lock-on frame; its shadow is what dims the sky around it —
              one composited layer, rather than a full-screen mask repainted
              while the frame moves */}
          <motion.div
            className="absolute rounded-[16px] shadow-[0_0_0_200vmax_rgba(2,4,10,0.6)]"
            initial={reduced ? false : { left: box.x - 16, top: box.y - 16, width: box.w + 32, height: box.h + 32, opacity: 0 }}
            animate={{ left: box.x, top: box.y, width: box.w, height: box.h, opacity: 1 }}
            transition={spring}
          >
            <span className="as-beam" />
            {(["tl", "tr", "bl", "br"] as const).map((c) => (
              <span key={c} className="as-bracket" data-c={c} />
            ))}
          </motion.div>

          {/* Nova and its card, flying from stop to stop */}
          <motion.div
            className="pointer-events-auto absolute"
            style={{ width: mobile ? view.w - 24 : CARD_W }}
            initial={reduced ? false : { left: view.w - 96, top: view.h - 96, scale: 0.6, opacity: 0 }}
            animate={{ left: cx, top: cy, scale: 1, opacity: 1 }}
            exit={reduced ? undefined : { left: view.w - 96, top: view.h - 96, scale: 0.5, opacity: 0 }}
            transition={flight}
            role="dialog"
            aria-label={`Asad's Assistant: ${stop.title}`}
          >
            <span className="absolute -top-6 left-3 z-10 block size-12">
              <Nova mood="speaking" />
            </span>
            <div ref={card} className="as-shell relative !rounded-2xl !border px-4 pb-4 pt-3.5">
              <div className="relative flex items-center justify-between gap-3 pl-12">
                <p className="text-[11px] text-muted">
                  {stop.kicker}
                  {stop.step && (
                    <span className="tabular-nums">
                      {"  ·  "}
                      {stop.step.index + 1} of {stop.step.total}
                    </span>
                  )}
                </p>
                <button type="button" onClick={onClose} aria-label="Close the guide" className="as-icon-btn -mr-1.5 !size-7">
                  <X className="size-3.5" />
                </button>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={stop.title}
                  className="relative"
                  initial={reduced ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -3 }}
                  transition={{ duration: 0.16 }}
                >
                  <p className="mt-2.5 text-[15px] font-semibold tracking-tight text-fg">{stop.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-fg/75">{stop.text}</p>
                </motion.div>
              </AnimatePresence>
              {stop.step && (
                <div className="relative mt-3 h-0.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
                  <motion.span
                    className="block h-full rounded-full bg-accent"
                    initial={false}
                    animate={{ width: `${((stop.step.index + 1) / stop.step.total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
              <div className="relative mt-3.5 flex items-center gap-2">
                {stop.actions
                  .filter((a) => !a.quiet)
                  .map((a) => (
                    <button key={a.label} type="button" onClick={a.run} className={a.primary ? "as-btn as-btn-solid" : "as-btn"}>
                      {a.label}
                    </button>
                  ))}
                {stop.actions
                  .filter((a) => a.quiet)
                  .map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={a.run}
                      className="ml-auto text-[12px] text-muted transition-colors hover:text-accent"
                    >
                      {a.label}
                    </button>
                  ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
