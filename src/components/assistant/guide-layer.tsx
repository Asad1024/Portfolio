"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
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

/** Where the card docks: in the frame's lower-right corner, or just below the
 *  frame when the section ends early enough to leave room; along the bottom
 *  of the screen on a phone. */
function place(b: Box, vw: number, vh: number, cardH: number) {
  if (vw < 640) return { x: 12, y: vh - cardH - 16 };
  const x = Math.min(Math.max(b.x + b.w - CARD_W - GAP, GAP), vw - CARD_W - GAP);
  const below = b.y + b.h + GAP;
  const y = below + cardH < vh - GAP ? below : Math.max(b.y + b.h - cardH - GAP, NAV + GAP);
  return { x, y };
}

// brisk: a step lands in well under a second
const SPRING = { stiffness: 260, damping: 30 };
const FLIGHT = { stiffness: 170, damping: 22 };

export function GuideLayer({ stop, onClose }: { stop: GuideStop | null; onClose: () => void }) {
  const reduced = useReducedMotion();
  // React state only for what changes rarely: whether there is a frame at
  // all, and the viewport size
  const [framed, setFramed] = useState(false);
  const [view, setView] = useState({ w: 0, h: 0 });
  const last = useRef<Box | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const cardH = useRef(CARD_H);

  /* The frame and the card follow their section every frame of a scroll, so
     they are driven by motion values written straight to the DOM — never a
     React render per frame. The frame moves by transform; the sky is dimmed
     around it by four plain panels rather than one 200vmax box-shadow
     repainted over the whole screen each time the frame changed size. */
  const fx = useSpring(0, SPRING);
  const fy = useSpring(0, SPRING);
  const fw = useSpring(0, SPRING);
  const fh = useSpring(0, SPRING);
  const cx = useSpring(0, FLIGHT);
  const cy = useSpring(0, FLIGHT);
  const aboveY = useTransform(fy, (y) => `calc(${y}px - 100%)`);
  const belowY = useTransform([fy, fh], ([y, h]: number[]) => y + h);
  const leftX = useTransform(fx, (x) => `calc(${x}px - 100%)`);
  const rightX = useTransform([fx, fw], ([x, w]: number[]) => x + w);

  // follow the target as the page moves; measured on scroll and resize, and
  // polled gently in case it isn't on the page yet (a route still loading)
  const target = stop?.target;
  useEffect(() => {
    if (!target) return;
    let raf = 0;
    // the previous stop's frame isn't shown for a target that isn't here yet
    let stale = true;
    const to = (v: typeof fx, n: number) => (reduced ? v.jump(n) : v.set(n));
    const read = () => {
      raf = 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setView((v) => (v.w === vw && v.h === vh ? v : { w: vw, h: vh }));
      const b = measure(target, vw, vh);
      const p = last.current;
      if (!b) {
        if (stale && p) {
          last.current = null;
          setFramed(false);
        }
        return;
      }
      stale = false;
      if (p && Math.abs(p.x - b.x) + Math.abs(p.y - b.y) + Math.abs(p.w - b.w) + Math.abs(p.h - b.h) <= 0.5) return;
      last.current = b;
      if (!p) {
        // arriving: the frame closes in on the section, the card flies out
        // of the corner where Nova lives
        fx.jump(b.x - 16);
        fy.jump(b.y - 16);
        fw.jump(b.w + 32);
        fh.jump(b.h + 32);
        cx.jump(vw - 96);
        cy.jump(vh - 96);
      }
      to(fx, b.x);
      to(fy, b.y);
      to(fw, b.w);
      to(fh, b.h);
      const c = place(b, vw, vh, cardH.current);
      to(cx, c.x);
      to(cy, c.y);
      setFramed(true);
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
  }, [target, reduced, fx, fy, fw, fh, cx, cy]);

  const show = !!stop && framed && view.w > 0;
  const mobile = view.w < 640;

  // the card's real height, so it's never placed partly off-screen
  useEffect(() => {
    const el = card.current;
    if (!show || !el) return;
    const ro = new ResizeObserver(() => {
      cardH.current = el.offsetHeight;
      const b = last.current;
      if (!b) return;
      const c = place(b, window.innerWidth, window.innerHeight, cardH.current);
      cx.set(c.x);
      cy.set(c.y);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [show, cx, cy]);

  // keyboard users land on the card when the guide appears, so Enter moves on
  useEffect(() => {
    if (show) card.current?.querySelector<HTMLElement>("button.as-btn-solid")?.focus({ preventScroll: true });
  }, [show]);

  return (
    <AnimatePresence>
      {show && stop && (
        <motion.div
          key="guide"
          className="pointer-events-none fixed inset-0 z-[95] overflow-hidden [contain:strict]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          transition={{ duration: 0.2 }}
        >
          {/* the sky dimmed around the frame: above, below, and either side */}
          <motion.div className="as-dim left-0 top-0 h-full w-full" style={{ y: aboveY }} />
          <motion.div className="as-dim left-0 top-0 h-full w-full" style={{ y: belowY }} />
          <motion.div className="as-dim left-0 top-0 w-full" style={{ x: leftX, y: fy, height: fh }} />
          <motion.div className="as-dim left-0 top-0 w-full" style={{ x: rightX, y: fy, height: fh }} />

          {/* the lock-on frame */}
          <motion.div
            className="absolute left-0 top-0 rounded-[16px]"
            style={{ x: fx, y: fy, width: fw, height: fh }}
          >
            <span className="as-beam" />
            {(["tl", "tr", "bl", "br"] as const).map((c) => (
              <span key={c} className="as-bracket" data-c={c} />
            ))}
          </motion.div>

          {/* Nova and its card, flying from stop to stop */}
          <motion.div
            className="pointer-events-auto absolute left-0 top-0"
            style={{ x: cx, y: cy, width: mobile ? view.w - 24 : CARD_W }}
            initial={reduced ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduced ? undefined : { x: view.w - 96, y: view.h - 96, scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", ...FLIGHT }}
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
