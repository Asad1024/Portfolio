"use client";

import { useEffect, useRef, useState } from "react";
import { Ship } from "./ship";

/* ── the voyage ─────────────────────────────────────────────────────────────
   A ship that flies the length of the home page with you, in the left-hand
   margin. Its course is a faint dotted line that weaves down past a waypoint
   at the top of every section and ends docked beside Contact. The ship holds
   level with the middle of the screen, so scrolling is what moves it; the
   stretch it has already flown lights up behind it, its thruster burns
   harder the faster you go, and it turns about when you scroll back up.

   Only drawn where the margin is wide enough to hold it without touching
   the content (1400px and up) — on anything narrower it would have to sit on
   top of the text, and then it is decoration getting in the way of the work.

   Everything per-frame is written straight to the DOM through refs; React
   only re-renders when the page is re-measured. */

const SHELL = 1248; // --container-shell, 78rem
const MIN_VIEWPORT = 1400;
/** Where on the screen the ship holds, as a fraction of the viewport height. */
const HOLD = 0.45;
const PERIOD = 1100; // px of page per weave

const WAYPOINTS = [
  { id: "work", label: "01" },
  { id: "capabilities", label: "02" },
  { id: "experience", label: "03" },
  { id: "about", label: "04" },
  { id: "contact", label: "dock" },
];

type Layout = {
  gutter: number;
  height: number;
  start: number;
  end: number;
  cx: number;
  amp: number;
  path: string;
  marks: { y: number; x: number; label: string }[];
};

export function Voyage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const shipRef = useRef<HTMLDivElement>(null);
  const flameRef = useRef<SVGGElement>(null);
  const clipRef = useRef<SVGRectElement>(null);
  const markRefs = useRef<(SVGCircleElement | null)[]>([]);
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
      const ys = WAYPOINTS.map(({ id }) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top - top : null;
      });
      if (ys.some((y) => y === null)) return;

      const cx = gutter / 2;
      const amp = Math.min(20, gutter * 0.2);
      const start = (ys[0] as number) - 60;
      const end = (ys[ys.length - 1] as number) + 140;
      const x = (y: number) => cx + amp * Math.sin(((y - start) / PERIOD) * Math.PI * 2);

      let path = "";
      for (let y = start; y <= end; y += 12) path += `${path ? "L" : "M"}${x(y).toFixed(1)} ${y.toFixed(1)}`;

      const next: Layout = {
        gutter,
        height: root.offsetHeight,
        start,
        end,
        cx,
        amp,
        path,
        marks: WAYPOINTS.map((w, i) => {
          const y = i === WAYPOINTS.length - 1 ? end : (ys[i] as number) + 40;
          return { y, x: x(y), label: w.label };
        }),
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

  // ── fly: position, heading and thrust, every frame
  useEffect(() => {
    if (!layout) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let lastY = -1;
    let heading = Math.PI; // nose down
    let thrust = 0.3;

    const frame = (t: number) => {
      const l = layoutRef.current;
      const root = rootRef.current;
      const ship = shipRef.current;
      if (!l || !root || !ship) return;

      const hold = window.innerHeight * HOLD - root.getBoundingClientRect().top;
      const y = Math.min(l.end, Math.max(l.start, hold));
      const phase = ((y - l.start) / PERIOD) * Math.PI * 2;
      const bob = reduced ? 0 : Math.sin(t / 700) * 1.6;
      const x = l.cx + l.amp * Math.sin(phase) + bob;

      const dy = lastY < 0 ? 0 : y - lastY;
      lastY = y;
      const docked = y >= l.end - 0.5;

      // point along the course, turning about when the scroll reverses
      const slope = ((l.amp * Math.PI * 2) / PERIOD) * Math.cos(phase);
      if (Math.abs(dy) > 0.4) {
        const target = dy > 0 ? Math.atan2(slope, -1) : Math.atan2(-slope, 1);
        let delta = target - heading;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
        heading += delta * (reduced ? 1 : 0.18);
      }

      const want = docked ? 0 : Math.min(1, 0.22 + Math.abs(dy) / 16);
      thrust += (want - thrust) * (reduced ? 1 : 0.12);

      ship.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${heading}rad)`;
      ship.style.visibility = "visible";
      if (flameRef.current) flameRef.current.style.transform = `scaleY(${thrust.toFixed(3)})`;
      if (clipRef.current) clipRef.current.setAttribute("height", String(Math.max(0, y)));
      markRefs.current.forEach((m, i) => {
        if (!m) return;
        const passed = y >= l.marks[i].y - 2;
        m.style.fill = passed ? "var(--accent)" : "var(--bg)";
      });

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
              <clipPath id="voyage-flown">
                <rect ref={clipRef} x="0" y="0" width={layout.gutter} height="0" />
              </clipPath>
            </defs>
            {/* the course ahead: dotted, faint */}
            <path
              d={layout.path}
              stroke="var(--accent)"
              strokeOpacity="0.22"
              strokeWidth="1"
              strokeDasharray="1.5 7"
              strokeLinecap="round"
              fill="none"
            />
            {/* the course flown: solid, lit, clipped to where the ship is */}
            <path
              d={layout.path}
              clipPath="url(#voyage-flown)"
              stroke="var(--accent)"
              strokeOpacity="0.5"
              strokeWidth="1.2"
              fill="none"
            />
            {layout.marks.map((m, i) => (
              <g key={m.label}>
                <circle
                  ref={(el) => {
                    markRefs.current[i] = el;
                  }}
                  cx={m.x}
                  cy={m.y}
                  r="3.5"
                  stroke="var(--accent)"
                  strokeOpacity="0.7"
                  fill="var(--bg)"
                />
                <text
                  x={m.x + 10}
                  y={m.y + 3.5}
                  fill="var(--muted)"
                  fontSize="10"
                  fontFamily="var(--font-mono, ui-monospace)"
                >
                  {m.label}
                </text>
              </g>
            ))}
          </svg>

          {/* hidden until the first frame has placed it on the course */}
          <div ref={shipRef} className="invisible absolute left-0 top-0 will-change-transform">
            <Ship size={20} flameRef={flameRef} />
          </div>
        </>
      )}
    </div>
  );
}
