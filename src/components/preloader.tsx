"use client";

import { useEffect, useRef, useState } from "react";

/* ── first visit: a star forming ────────────────────────────────────────────
   Dust falls inward, spirals into an accretion disc, ignites, and the shock
   front carries the curtain away — which is exactly the object the hero opens
   on, so the load reads as that star being born rather than as a progress bar
   with a space wallpaper behind it.

   Progress is the physics, not a decoration alongside it: the same 0..1 drives
   how far the dust has fallen, how bright and how large the core is, and how
   far the ring has closed. There is nothing to keep in sync because there is
   only one number.

   Shown once per browser session, not once per page load — sessionStorage
   survives a refresh, so a reload doesn't sit through it again. */

const PHASES = [
  { at: 0.0, status: "gravity well forming" },
  { at: 0.34, status: "accretion disc stable" },
  { at: 0.62, status: "core pressure critical" },
  { at: 0.86, status: "ignition →" },
];

const COLLAPSE_MS = 3000;
const IGNITE_MS = 620;
const TOTAL_MS = COLLAPSE_MS + IGNITE_MS;
const MAX_DUST = 1400;

type Mote = {
  /** where it starts, in polar coordinates about the core */
  r0: number;
  a0: number;
  /** how far around it winds on the way in — the spiral */
  wind: number;
  /** staggered so the disc doesn't arrive as one shell */
  delay: number;
  size: number;
  hot: boolean;
};

const easeIn = (t: number) => t * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function Preloader() {
  const [phase, setPhase] = useState<"idle" | "run" | "exit" | "gone">("idle");
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem("booted") === "1") {
      setPhase("gone");
      window.dispatchEvent(new CustomEvent("boot-complete"));
      return;
    }
    setPhase("run");
    document.body.style.overflow = "hidden";

    /* The readout is timer-driven and measured against the wall clock, never
       against tick count — a backgrounded tab throttles intervals, which would
       otherwise strand the counter mid-collapse. */
    const t0 = performance.now();
    const tick = setInterval(() => {
      setProgress(Math.min(100, Math.round(((performance.now() - t0) / COLLAPSE_MS) * 100)));
    }, 60);

    const exitTimer = setTimeout(() => {
      sessionStorage.setItem("booted", "1");
      window.dispatchEvent(new CustomEvent("boot-complete"));
      document.body.style.overflow = "";
      setProgress(100);
      clearInterval(tick);
      setPhase("exit");
    }, COLLAPSE_MS);
    const goneTimer = setTimeout(() => setPhase("gone"), TOTAL_MS + 260);

    return () => {
      clearInterval(tick);
      clearTimeout(exitTimer);
      clearTimeout(goneTimer);
      document.body.style.overflow = "";
    };
  }, []);


  /* The canvas gets its own effect, gated on phase. The boot effect above
     flips phase to "run", but it reads refs in the same pass — at which point
     the component has still returned null and there is no canvas to draw on.
     Splitting it means this runs only once the element is actually mounted. */
  useEffect(() => {
    if (phase !== "run") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    let cancelled = false;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const styles = getComputedStyle(document.documentElement);
    const accent = hexToRgb(styles.getPropertyValue("--accent").trim() || "#22d3ee");
    const violet = hexToRgb(styles.getPropertyValue("--violet").trim() || "#8b5cf6");

    const cx = w / 2;
    const cy = h / 2;
    const reach = Math.hypot(w, h) * 0.55;

    const dust: Mote[] = Array.from({ length: MAX_DUST }, () => ({
      r0: reach * (0.25 + Math.random() * 0.75),
      a0: Math.random() * Math.PI * 2,
      wind: (1.4 + Math.random() * 2.6) * (Math.random() < 0.5 ? -1 : 1),
      delay: Math.random() * 0.35,
      size: 0.5 + Math.random() * 1.3,
      hot: Math.random() < 0.22,
    }));

    const start = performance.now();
    const draw = (now: number) => {
      if (cancelled) return;
      const elapsed = reduced ? COLLAPSE_MS : now - start;
      const p = clamp01(elapsed / COLLAPSE_MS);
      const blast = clamp01((elapsed - COLLAPSE_MS) / IGNITE_MS);

      ctx.clearRect(0, 0, w, h);

      // core: grows and brightens as the dust arrives, then flares
      const coreR = 3 + p * p * 46 + blast * 260;
      const coreA = blast > 0 ? 1 - blast : 0.35 + p * 0.65;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
      glow.addColorStop(0, `rgba(255,255,255,${coreA})`);
      glow.addColorStop(0.16, `rgba(${accent.join(",")},${coreA * 0.85})`);
      glow.addColorStop(0.45, `rgba(${violet.join(",")},${coreA * 0.22})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2);
      ctx.fill();

      for (const m of dust) {
        // each mote falls on its own clock, and winds as it falls
        const fall = easeIn(clamp01((p - m.delay) / (1 - m.delay)));
        const r = m.r0 * (1 - fall) + blast * reach * 1.8;
        const a = m.a0 + m.wind * fall + blast * 0.6;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.62; // disc, seen near edge-on

        // brightest just before it lands, then gone in the flash
        const alpha = (blast > 0 ? 1 - blast : 0.18 + fall * 0.82) * (m.hot ? 1 : 0.6);
        const [cr, cg, cb] = m.hot ? accent : violet;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, m.size + fall * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      if (elapsed < TOTAL_MS + 120) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
  

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [phase]);

  if (phase === "idle" || phase === "gone") return null;

  const status = [...PHASES].reverse().find((s) => progress / 100 >= s.at)?.status ?? PHASES[0].status;
  // the ring closes as the star assembles — 100% is one full orbit
  const R = 74;
  const circumference = 2 * Math.PI * R;

  return (
    <div
      className={`fixed inset-0 z-[250] flex flex-col justify-between bg-bg p-6 transition-opacity duration-500 ease-out sm:p-10 ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden />

      <div className="relative flex items-start justify-between font-mono text-xs text-muted">
        <p>
          <span className="term-green">$</span> stellar ignition — asad-os
          <span className="caret-blink term-green">_</span>
        </p>
        <p className="hidden sm:block">v3.0.0 · orbital</p>
      </div>

      {/* the readout sits inside the orbit it describes */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="relative flex size-[13rem] items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 180 180" aria-hidden>
            <circle
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke="var(--line)"
              strokeWidth="1"
            />
            <circle
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              style={{ transition: "stroke-dashoffset 120ms linear" }}
            />
          </svg>

          {/* the body riding the leading edge of the arc */}
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_14px_3px_var(--ring)]"
            style={{
              transform: `rotate(${(progress / 100) * 360 - 90}deg) translateX(${R}px)`,
              transformOrigin: "0 0",
              transition: "transform 120ms linear",
            }}
          />

          <p className="font-sans text-5xl font-bold tabular-nums tracking-tighter">
            {progress}
            <span className="text-accent">%</span>
          </p>
        </div>
      </div>

      <p className="relative font-mono text-xs text-muted">
        <span className="text-accent">▸</span> {status}
      </p>
    </div>
  );
}
