"use client";

import { useEffect, useRef, useState } from "react";
import { LAND_DOTS } from "@/lib/land-dots";

/* ── Where the work happens, as a map ───────────────────────────────────────
   The Gulf and Pakistan as a field of dots, with the three places the
   experience section names lit on it at their real positions: home in
   Lahore, and the teams in Islamabad and Dubai. Every place is joined to
   every other by a curved line that draws itself in when the map comes into
   view, a signal running along each, and rings pulse out from every city.

   Flat SVG and CSS rather than a WebGL globe: zoomed to the region the cities
   sit properly apart, and it costs next to nothing to animate. */

/** the window onto the world: longitude 48°E to 86°E, latitude 40°N to 17°N */
const LON0 = 48;
const LON1 = 86;
const LAT0 = 40;
const LAT1 = 17;
const SCALE = 10;
const W = (LON1 - LON0) * SCALE;
const H = (LAT0 - LAT1) * SCALE;
const at = (lat: number, lon: number) => ({ x: (lon - LON0) * SCALE, y: (LAT0 - lat) * SCALE });

type City = { name: string; note: string; lat: number; lon: number; home?: boolean; label: "right" | "left" | "below" };
const CITIES: City[] = [
  { name: "Lahore", note: "home base", lat: 31.52, lon: 74.36, home: true, label: "right" },
  { name: "Islamabad", note: "GherTak", lat: 33.68, lon: 73.05, label: "left" },
  { name: "Dubai", note: "Spark AI", lat: 25.2, lon: 55.27, label: "below" },
];
/** every pair, so the three form one connected triangle */
const LINKS: [number, number][] = [
  [0, 2],
  [0, 1],
  [1, 2],
];

/** the region's land, from the same samples the globe used */
const LAND: { x: number; y: number; twinkle: boolean }[] = [];
for (let i = 0; i < LAND_DOTS.length; i += 2) {
  const lat = LAND_DOTS[i] / 10;
  const lon = LAND_DOTS[i + 1] / 10;
  if (lon < LON0 - 1 || lon > LON1 + 1 || lat > LAT0 + 1 || lat < LAT1 - 1) continue;
  LAND.push({ ...at(lat, lon), twinkle: (i / 2) % 7 === 0 });
}

/** a gentle arc from a to b, bowed upward by a share of its length */
function arc(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const bow = Math.max(10, len * 0.32);
  // the perpendicular that points up the screen
  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  return `M ${a.x} ${a.y} Q ${mx + nx * bow} ${my + ny * bow} ${b.x} ${b.y}`;
}

export function CityMap({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  // the lines draw themselves in the first time the map is seen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pts = CITIES.map((c) => at(c.lat, c.lon));

  return (
    <div
      ref={ref}
      data-on={on || undefined}
      role="img"
      aria-label="Map showing Lahore, Islamabad and Dubai, connected"
      className={`cm relative ${className}`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" aria-hidden>
        {/* the land */}
        {LAND.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={1.5}
            className={d.twinkle ? "cm-land cm-twinkle" : "cm-land"}
            style={d.twinkle ? { animationDelay: `${(i * 0.37) % 4}s` } : undefined}
          />
        ))}

        {/* the links: a faint line, drawn in, and a signal running along it */}
        {LINKS.map(([a, b], i) => {
          const d = arc(pts[a], pts[b]);
          return (
            <g key={`${a}-${b}`}>
              <path d={d} pathLength={100} className="cm-link" style={{ animationDelay: `${0.2 + i * 0.35}s` }} />
              <path d={d} pathLength={100} className="cm-signal" style={{ animationDelay: `${1.6 + i * 0.9}s` }} />
            </g>
          );
        })}

        {/* the cities */}
        {CITIES.map((c, i) => {
          const p = pts[i];
          return (
            <g key={c.name} transform={`translate(${p.x} ${p.y})`}>
              {[0, 1].map((k) => (
                <circle key={k} r={5} className="cm-ring" style={{ animationDelay: `${i * 0.5 + k * 1.2}s` }} />
              ))}
              <circle r={c.home ? 9 : 7} className="cm-halo" />
              <circle r={c.home ? 3.4 : 2.6} className={c.home ? "cm-dot cm-home" : "cm-dot"} />
            </g>
          );
        })}
      </svg>

      {/* the labels, as text over the map so they stay crisp at any size */}
      {CITIES.map((c, i) => {
        const p = pts[i];
        const place =
          c.label === "right"
            ? // on a phone there is no room to the right of Lahore, so it sits below
              "translate-x-3 -translate-y-1/2 max-sm:-translate-x-1/2 max-sm:translate-y-3"
            : c.label === "left"
              ? "-translate-x-[calc(100%+0.75rem)] -translate-y-full"
              : "-translate-x-1/2 translate-y-3";
        return (
          <span
            key={c.name}
            aria-hidden
            className={`cm-label pointer-events-none absolute whitespace-nowrap rounded-full border border-line bg-bg/80 px-2.5 py-1 text-[11px] text-fg/90 backdrop-blur-sm ${place}`}
            style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%`, animationDelay: `${0.4 + i * 0.2}s` }}
          >
            <span className={c.home ? "text-fg" : "text-accent"}>{c.name}</span>
            <span className="text-muted"> · {c.note}</span>
          </span>
        );
      })}
    </div>
  );
}
