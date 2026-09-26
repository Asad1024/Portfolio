"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollLock } from "@/lib/use-scroll-lock";

/* ── first visit: a star forms, then you fall into it ───────────────────────
   Two acts on one canvas.

   Collapse: dust falls inward, winds into an accretion disc seen near
   edge-on, and the core brightens and swells as the mass arrives. The
   percentage lives inside that — it sits at the centre of an orbit whose arc
   closes as the star assembles, with a lit body riding the leading edge, so
   100% is one full revolution rather than a number bolted on beside it.

   Approach: the moment it reads 100 the core ignites and the view runs at it.
   The readout drops away and a projected field tears past, which is the same
   effect the route transition uses — so arriving at the site for the first
   time and arriving at any page afterwards are the same motion, at different
   lengths. That is the whole reason to chain them.

   Shown once per browser session, not once per page load: sessionStorage
   survives a refresh, so a reload doesn't sit through it again.

   Kept short — about two and a half seconds end to end — because it stands
   between a recruiter and the work, and any click, key, wheel or tap skips
   straight to the page. */

const PHASES = [
  { at: 0.0, status: "gravity well forming" },
  { at: 0.34, status: "accretion disc stable" },
  { at: 0.62, status: "core pressure critical" },
  { at: 0.86, status: "ignition →" },
];

const COLLAPSE_MS = 1800;
const WARP_MS = 600;
const FADE_MS = 450;

const MAX_DUST = 1400;
/** the approach field — projected, so these carry a depth */
const MOTES = 560;
const DEPTH = 1500;
const FOV = 340;

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

type Flyer = { x: number; y: number; z: number; hot: boolean };

const easeIn = (t: number) => t * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function Preloader() {
  const [phase, setPhase] = useState<"idle" | "collapse" | "warp" | "exit" | "gone">("idle");
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* The curtain holds the page still while it is up. Shared with the other
     three things that freeze scrolling, so whichever closes last is the one
     that gives the page back. */
  useScrollLock(phase === "collapse" || phase === "warp");

  /* Both branches below set state on mount, and that is the only shape this
     can take. The phase cannot be seeded from sessionStorage in useState: the
     server has no session and always renders the curtain, so deriving the
     initial phase on the client would hydrate a mismatch — a returning
     visitor would get a flash of the loader they were meant to skip. One
     extra render on mount is the correct price. */
  /* eslint-disable react-hooks/set-state-in-effect -- explained above */
  useEffect(() => {
    if (sessionStorage.getItem("booted") === "1") {
      setPhase("gone");
      window.dispatchEvent(new CustomEvent("boot-complete"));
      return;
    }
    setPhase("collapse");

    /* The readout is timer-driven and measured against the wall clock, never
       against tick count — a backgrounded tab throttles intervals, which would
       otherwise strand the counter mid-collapse. */
    const t0 = performance.now();
    const tick = setInterval(() => {
      setProgress(Math.min(100, Math.round(((performance.now() - t0) / COLLAPSE_MS) * 100)));
    }, 16);

    const toWarp = setTimeout(() => {
      setProgress(100);
      clearInterval(tick);
      setPhase("warp");
    }, COLLAPSE_MS);

    /* boot-complete fires at the END of the approach, not when the counter
       hits 100. The hero holds its entrance on this event, and releasing it a
       second early would run the name's decrypt behind a curtain that is still
       up, landing it already finished. */
    let goneTimer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(tick);
      clearTimeout(toWarp);
      clearTimeout(toExit);
      detach();
      setProgress(100);
      sessionStorage.setItem("booted", "1");
      window.dispatchEvent(new CustomEvent("boot-complete"));
      setPhase("exit");
      goneTimer = setTimeout(() => setPhase("gone"), FADE_MS + 120);
    };
    const toExit = setTimeout(finish, COLLAPSE_MS + WARP_MS);

    // anything that says "I'm here for the site" ends the intro early
    const SKIP = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
    const detach = () => SKIP.forEach((type) => window.removeEventListener(type, finish));
    SKIP.forEach((type) => window.addEventListener(type, finish, { passive: true }));

    return () => {
      clearInterval(tick);
      clearTimeout(toWarp);
      clearTimeout(toExit);
      clearTimeout(goneTimer);
      detach();
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* The canvas needs its own effect: the boot effect above sets phase in the
     same pass it would read the ref, and at that point the component has still
     returned null with no canvas to draw on.

     It depends on a boolean spanning every animating phase, NOT on phase
     itself. Depending on phase tore the loop down the instant it changed —
     cleanup cancelled the frame, the effect re-ran, and the guard bailed — so
     the canvas froze on its last collapse frame and the approach never drew.
     A boolean is compared by value, so collapse -> warp -> exit is one
     unbroken run. */
  const animating = phase === "collapse" || phase === "warp" || phase === "exit";

  useEffect(() => {
    if (!animating) return;
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
    const spread = Math.max(w, h);

    const dust: Mote[] = Array.from({ length: MAX_DUST }, () => ({
      r0: reach * (0.25 + Math.random() * 0.75),
      a0: Math.random() * Math.PI * 2,
      wind: (1.4 + Math.random() * 2.6) * (Math.random() < 0.5 ? -1 : 1),
      delay: Math.random() * 0.35,
      size: 0.5 + Math.random() * 1.3,
      hot: Math.random() < 0.22,
    }));

    const flyers: Flyer[] = Array.from({ length: MOTES }, () => ({
      x: (Math.random() - 0.5) * spread * 2,
      y: (Math.random() - 0.5) * spread * 2,
      z: 1 + Math.random() * DEPTH,
      hot: Math.random() < 0.3,
    }));

    const start = performance.now();
    let last = start;

    const draw = (now: number) => {
      if (cancelled) return;
      /* Both of these need a floor, not just a ceiling. requestAnimationFrame
         hands you the frame's start time, which can precede a performance.now()
         taken after that frame already began, so the first frame's elapsed can
         be negative. Unclamped that gives a negative progress, and
         Math.pow(negative, fractional) is NaN — which createRadialGradient
         rejects outright. A negative dt would also run the field backwards. */
      const elapsed = reduced ? COLLAPSE_MS : now - start;
      const dt = Math.min(48, Math.max(0, now - last));
      last = now;

      ctx.clearRect(0, 0, w, h);

      if (elapsed < COLLAPSE_MS) {
        // ── act one: the disc falls in ──────────────────────────────────
        const p = clamp01(elapsed / COLLAPSE_MS);

        const coreR = 3 + p * p * 46;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
        glow.addColorStop(0, `rgba(255,255,255,${0.35 + p * 0.65})`);
        glow.addColorStop(0.16, `rgba(${accent.join(",")},${(0.35 + p * 0.65) * 0.85})`);
        glow.addColorStop(0.45, `rgba(${violet.join(",")},${(0.35 + p * 0.65) * 0.22})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2);
        ctx.fill();

        for (const m of dust) {
          const fall = easeIn(clamp01((p - m.delay) / (1 - m.delay)));
          const r = m.r0 * (1 - fall);
          const a = m.a0 + m.wind * fall;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r * 0.62; // disc, seen near edge-on

          const alpha = (0.18 + fall * 0.82) * (m.hot ? 1 : 0.6);
          const [cr, cg, cb] = m.hot ? accent : violet;
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, m.size + fall * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // ── act two: ignition, then the run at it ───────────────────────
        const t = clamp01((elapsed - COLLAPSE_MS) / WARP_MS);
        // one hard flash off the line, gone by a third of the way in
        const flash = Math.max(0, 1 - t * 3);

        const coreR = 40 + Math.pow(t, 2.2) * 260 + flash * 140;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3.2);
        glow.addColorStop(0, `rgba(255,255,255,${Math.min(1, 0.75 + t * 0.25 + flash)})`);
        glow.addColorStop(0.18, `rgba(${accent.join(",")},${0.5 + t * 0.4})`);
        glow.addColorStop(0.5, `rgba(${violet.join(",")},${0.16 + t * 0.12})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 3.2, 0, Math.PI * 2);
        ctx.fill();

        // hard away from the gate, easing off as the star fills the view
        const speed = (0.5 + Math.sin(t * Math.PI) * 3.1) * dt;
        ctx.lineCap = "round";
        for (const m of flyers) {
          const prevZ = m.z;
          m.z -= speed;
          if (m.z < 1) {
            m.x = (Math.random() - 0.5) * spread * 2;
            m.y = (Math.random() - 0.5) * spread * 2;
            m.z = DEPTH;
            continue;
          }

          // perspective: divide by depth. near motes sweep, far ones crawl.
          const k = FOV / m.z;
          const pk = FOV / prevZ;
          const depthFade = Math.min(1, (DEPTH - m.z) / (DEPTH * 0.55));
          const [r, g, b] = m.hot ? accent : violet;
          ctx.strokeStyle = `rgba(${r},${g},${b},${depthFade * (0.4 + t * 0.45)})`;
          ctx.lineWidth = Math.min(2.4, k * 1.6);
          ctx.beginPath();
          ctx.moveTo(cx + m.x * pk, cy + m.y * pk);
          ctx.lineTo(cx + m.x * k, cy + m.y * k);
          ctx.stroke();
        }
      }

      if (elapsed < COLLAPSE_MS + WARP_MS + 120) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [animating]);

  if (phase === "idle" || phase === "gone") return null;

  const status =
    [...PHASES].reverse().find((s) => progress / 100 >= s.at)?.status ?? PHASES[0].status;
  // the ring closes as the star assembles — 100% is one full orbit
  const R = 74;
  const circumference = 2 * Math.PI * R;
  // the readout belongs to the collapse; the approach is the canvas alone
  const readoutGone = phase !== "collapse";

  return (
    <div
      className={`fixed inset-0 z-[250] flex flex-col justify-between bg-bg p-6 transition-opacity ease-out sm:p-10 ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden />

      <div
        className={`relative flex items-start justify-between font-mono text-xs text-muted transition-opacity duration-300 ${
          readoutGone ? "opacity-0" : "opacity-100"
        }`}
      >
        <p>
          <span className="term-green">$</span> stellar ignition — asad-os
          <span className="caret-blink term-green">_</span>
        </p>
        <p className="hidden sm:block">v3.0.0 · orbital</p>
      </div>

      {/* the readout sits inside the orbit it describes */}
      <div className="relative flex flex-1 items-center justify-center">
        <div
          className={`relative flex size-[13rem] items-center justify-center transition-all duration-300 ${
            readoutGone ? "scale-95 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 180 180" aria-hidden>
            <circle cx="90" cy="90" r={R} fill="none" stroke="var(--line)" strokeWidth="1" />
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

      <p
        className={`relative font-mono text-xs text-muted transition-opacity duration-300 ${
          readoutGone ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="text-accent">▸</span> {status}
        <span className="float-right text-muted/80">press any key to skip</span>
      </p>
    </div>
  );
}
