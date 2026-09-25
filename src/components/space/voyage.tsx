"use client";

import { useEffect, useRef, useState } from "react";
import { Ship } from "./ship";

/* ── the voyage ─────────────────────────────────────────────────────────────
   A deep-space probe that flies the length of the home page with you, in the
   left-hand margin, like a craft on a mission display.

   The planned course is a hairline you can barely see, ticked where each
   section begins. The probe holds level with the middle of the screen, so
   scrolling is what flies it: its ion drive burns harder the faster you go
   and leaves a glowing wake that fades out behind it; it comes about when you
   scroll back; and crossing into a new section is a jump — a burst of speed
   streaks and a new sector on the readout. Targeting brackets hold it in
   frame, and where the margin is wide enough, live telemetry sits beneath:
   velocity from your scroll speed, and distance out from 0 to 170 AU — about
   as far as Voyager 1 has come. At Contact it acquires signal and holds.

   Only drawn where the margin can hold it without touching content (1400px
   and up); the telemetry needs a little more room still. Everything
   per-frame is written straight to the DOM through refs — React only
   re-renders when the page is re-measured. */

const SHELL = 1248; // --container-shell, 78rem
const MIN_VIEWPORT = 1400;
/** Margin width the telemetry readout needs to sit clear of the content. */
const HUD_GUTTER = 150;
/** Where on the screen the probe holds, as a fraction of viewport height. */
const HOLD = 0.45;
const PERIOD = 1400; // px of page per weave
const WAKE = 420; // px of flown course that still glows
const MAX_AU = 170;

const SECTORS = [
  { id: "work", name: "selected work" },
  { id: "capabilities", name: "capabilities" },
  { id: "experience", name: "mission log" },
  { id: "about", name: "about" },
  { id: "contact", name: "contact" },
];

type Layout = {
  gutter: number;
  height: number;
  start: number;
  end: number;
  cx: number;
  amp: number;
  course: string;
  ticks: { y: number; x: number; label: string }[];
  hud: boolean;
};

export function Voyage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const craftRef = useRef<HTMLDivElement>(null);
  const plumeRef = useRef<SVGGElement>(null);
  const wakeRef = useRef<SVGPathElement>(null);
  const wakeGradRef = useRef<SVGLinearGradientElement>(null);
  const streakRef = useRef<HTMLDivElement>(null);
  const velRef = useRef<HTMLSpanElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const sectorRef = useRef<HTMLSpanElement>(null);
  const sectorNameRef = useRef<HTMLSpanElement>(null);
  const layoutRef = useRef<Layout | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);

  // ── measure: the course is laid down once per page size, not per frame
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const width = root.offsetWidth;
      const gutter = (width - SHELL) / 2;
      if (window.innerWidth < MIN_VIEWPORT || gutter < 60) {
        layoutRef.current = null;
        setLayout(null);
        return;
      }
      const top = root.getBoundingClientRect().top;
      const ys = SECTORS.map(({ id }) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top - top : null;
      });
      if (ys.some((y) => y === null)) return;

      const cx = gutter / 2;
      const amp = Math.min(16, gutter * 0.14);
      const start = (ys[0] as number) - 80;
      const end = (ys[ys.length - 1] as number) + 160;
      const x = (y: number) => cx + amp * Math.sin(((y - start) / PERIOD) * Math.PI * 2);

      let course = "";
      for (let y = start; y <= end; y += 12) course += `${course ? "L" : "M"}${x(y).toFixed(1)} ${y.toFixed(1)}`;

      const next: Layout = {
        gutter,
        height: root.offsetHeight,
        start,
        end,
        cx,
        amp,
        course,
        ticks: SECTORS.map((s, i) => {
          const y = (ys[i] as number) + 40;
          return { y, x: x(y), label: String(i + 1).padStart(2, "0") };
        }),
        hud: gutter >= HUD_GUTTER,
      };
      layoutRef.current = next;
      setLayout(next);
    };

    measure();
    // sections grow as images and reveals settle, so re-lay the course with them
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // ── fly: position, heading, thrust, wake and telemetry, every frame
  useEffect(() => {
    if (!layout) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let lastY = -1;
    let lastT = 0;
    let heading = Math.PI; // nose down the page
    let thrust = 0.35;
    let speed = 0; // smoothed px/ms
    let sector = -1;

    const courseX = (l: Layout, y: number) =>
      l.cx + l.amp * Math.sin(((y - l.start) / PERIOD) * Math.PI * 2);

    const jump = () => {
      const s = streakRef.current;
      if (!s || reduced) return;
      s.getAnimations().forEach((a) => a.cancel());
      s.animate(
        [
          { opacity: 0, transform: "translate(-50%, 0) scaleY(0.2)" },
          { opacity: 1, transform: "translate(-50%, 0) scaleY(1)", offset: 0.25 },
          { opacity: 0, transform: "translate(-50%, 0) scaleY(1.6)" },
        ],
        { duration: 650, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
      );
    };

    const frame = (t: number) => {
      const l = layoutRef.current;
      const root = rootRef.current;
      const craft = craftRef.current;
      if (!l || !root || !craft) return;

      const hold = window.innerHeight * HOLD - root.getBoundingClientRect().top;
      const y = Math.min(l.end, Math.max(l.start, hold));
      const x = courseX(l, y);
      const dt = lastT ? Math.max(1, t - lastT) : 16;
      const dy = lastY < 0 ? 0 : y - lastY;
      lastY = y;
      lastT = t;
      speed += (Math.abs(dy) / dt - speed) * 0.1;
      const docked = y >= l.end - 0.5;

      // bearing along the course; comes about when the scroll reverses
      const slope = ((l.amp * Math.PI * 2) / PERIOD) * Math.cos(((y - l.start) / PERIOD) * Math.PI * 2);
      if (Math.abs(dy) > 0.4) {
        const target = dy > 0 ? Math.atan2(slope, -1) : Math.atan2(-slope, 1);
        const delta = Math.atan2(Math.sin(target - heading), Math.cos(target - heading));
        heading += delta * (reduced ? 1 : 0.14);
      }

      // the drive: an idle trickle, full burn on a fast scroll, cold at dock
      const flicker = reduced ? 0 : Math.sin(t / 90) * 0.03;
      const want = docked ? 0.08 : Math.min(1, 0.28 + speed * 0.55);
      thrust += (want - thrust) * (reduced ? 1 : 0.1);

      craft.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${heading}rad)`;
      craft.style.visibility = "visible";
      plumeRef.current?.style.setProperty("transform", `scaleY(${(thrust + flicker).toFixed(3)})`);

      // the wake: only the last stretch flown, fading out behind the probe
      const from = Math.max(l.start, y - WAKE);
      let d = "";
      for (let wy = from; wy <= y; wy += 10) d += `${d ? "L" : "M"}${courseX(l, wy).toFixed(1)} ${wy.toFixed(1)}`;
      wakeRef.current?.setAttribute("d", d || "M0 0");
      wakeGradRef.current?.setAttribute("y1", String(from));
      wakeGradRef.current?.setAttribute("y2", String(y));

      // telemetry
      const progress = (y - l.start) / (l.end - l.start);
      let s = 0;
      for (let i = 0; i < l.ticks.length; i++) if (y >= l.ticks[i].y - 60) s = i;
      if (s !== sector) {
        if (sector !== -1 && s > sector) jump();
        sector = s;
        const arrived = docked || s === SECTORS.length - 1;
        if (sectorRef.current) {
          sectorRef.current.textContent = arrived ? "signal acquired" : `sector ${String(s + 1).padStart(2, "0")}`;
        }
        if (sectorNameRef.current) {
          sectorNameRef.current.textContent = arrived ? "transmit when ready" : SECTORS[s].name;
        }
      }
      if (velRef.current) velRef.current.textContent = `${(speed * 22).toFixed(1).padStart(4, "0")} km/s`;
      if (distRef.current) distRef.current.textContent = `${(progress * MAX_AU).toFixed(2)} au`;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [layout]);

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {layout && (
        <>
          <svg
            className="absolute left-0 top-0"
            width={layout.gutter}
            height={layout.height}
            viewBox={`0 0 ${layout.gutter} ${layout.height}`}
          >
            <defs>
              <linearGradient
                ref={wakeGradRef}
                id="voyage-wake"
                gradientUnits="userSpaceOnUse"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0" stopColor="var(--accent)" stopOpacity="0" />
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0.75" />
              </linearGradient>
            </defs>
            {/* the planned course: a hairline, just there */}
            <path d={layout.course} stroke="var(--accent)" strokeOpacity="0.09" strokeWidth="1" fill="none" />
            {/* section ticks, like the graduations on a nav chart */}
            {layout.ticks.map((tk) => (
              <g key={tk.label} stroke="var(--accent)" strokeOpacity="0.35">
                <path d={`M${tk.x - 6} ${tk.y} H${tk.x + 6}`} strokeWidth="1" />
                <text
                  x={tk.x + 11}
                  y={tk.y + 3}
                  stroke="none"
                  fill="var(--muted)"
                  fillOpacity="0.8"
                  fontSize="9"
                  letterSpacing="0.12em"
                  fontFamily="var(--font-mono)"
                >
                  {tk.label}
                </text>
              </g>
            ))}
            {/* the wake */}
            <path
              ref={wakeRef}
              stroke="url(#voyage-wake)"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
              style={{ filter: "drop-shadow(0 0 3px var(--accent))" }}
            />
          </svg>

          {/* hidden until the first frame has placed it on the course */}
          <div ref={craftRef} className="invisible absolute left-0 top-0 will-change-transform">
            {/* jump streaks, fired as the probe crosses into a new sector */}
            <div
              ref={streakRef}
              className="absolute left-1/2 top-[40%] h-40 w-6 opacity-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0 20%, var(--accent) 20% 24%, transparent 24% 48%, #fff 48% 52%, transparent 52% 76%, var(--accent) 76% 80%, transparent 80%)",
                maskImage: "linear-gradient(180deg, #000, transparent)",
                transformOrigin: "50% 0",
              }}
            />
            {/* targeting brackets */}
            <span className="absolute -inset-x-3 -top-2 bottom-[55%]">
              {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((c) => (
                <span key={c} className={`absolute size-2 border-accent/50 ${c}`} />
              ))}
            </span>
            <div style={{ filter: "drop-shadow(0 0 6px color-mix(in oklab, var(--accent) 45%, transparent))" }}>
              <Ship size={22} plumeRef={plumeRef} />
            </div>
          </div>

          {/* telemetry: rides with the probe, never rotates with it */}
          {layout.hud && (
            <Telemetry
              velRef={velRef}
              distRef={distRef}
              sectorRef={sectorRef}
              sectorNameRef={sectorNameRef}
              craftRef={craftRef}
            />
          )}
        </>
      )}
    </div>
  );
}

/* The readout follows the probe's position but keeps its own orientation, so
   it is always legible. It copies the probe's translation each frame rather
   than being its child — a child would rotate with the hull. */
function Telemetry({
  velRef,
  distRef,
  sectorRef,
  sectorNameRef,
  craftRef,
}: {
  velRef: React.RefObject<HTMLSpanElement | null>;
  distRef: React.RefObject<HTMLSpanElement | null>;
  sectorRef: React.RefObject<HTMLSpanElement | null>;
  sectorNameRef: React.RefObject<HTMLSpanElement | null>;
  craftRef: React.RefObject<HTMLDivElement | null>;
}) {
  const hudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const follow = () => {
      const craft = craftRef.current;
      const hud = hudRef.current;
      if (craft && hud) {
        const m = craft.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
        if (m) {
          hud.style.transform = `translate(${m[1]}px, ${m[2]}px) translate(-50%, 66px)`;
          hud.style.visibility = "visible";
        }
      }
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
  }, [craftRef]);

  return (
    <div
      ref={hudRef}
      className="invisible absolute left-0 top-0 w-[8.5rem] font-mono text-[10px] uppercase leading-[1.7] tracking-[0.14em] text-muted will-change-transform"
    >
      <div className="flex justify-between border-t border-accent/25 pt-1.5">
        <span className="text-muted/70">vel</span>
        <span ref={velRef} className="tabular-nums text-fg/85" />
      </div>
      <div className="flex justify-between">
        <span className="text-muted/70">dist</span>
        <span ref={distRef} className="tabular-nums text-fg/85" />
      </div>
      <span ref={sectorRef} className="mt-1 block text-accent" />
      <span ref={sectorNameRef} className="block truncate normal-case tracking-[0.06em] text-muted/80" />
    </div>
  );
}
