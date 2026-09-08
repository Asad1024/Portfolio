"use client";

import { useEffect, useRef, useState } from "react";

/* ── choreography ───────────────────────────────────────────────────────────
   Particles vortex in and spell WEB, morph through MOBILE and AI, then
   converge into ASAD and burst outward as the curtain lifts. ~3.9s total. */
const PHASES = [
  { word: "WEB", enter: 900, hold: 220, status: "compiling web stack" },
  { word: "MOBILE", enter: 400, hold: 200, status: "linking mobile runtime" },
  { word: "AI", enter: 380, hold: 200, status: "waking ai systems" },
  { word: "ASAD", enter: 440, hold: 560, status: "access granted →" },
];
const EXPLODE_MS = 600;
const STARTS: number[] = [];
{
  let t = 0;
  for (const p of PHASES) {
    STARTS.push(t);
    t += p.enter + p.hold;
  }
}
const MORPH_END = STARTS[STARTS.length - 1] + PHASES[PHASES.length - 1].enter + PHASES[PHASES.length - 1].hold;
const TOTAL_MS = MORPH_END + EXPLODE_MS;
const MAX_PARTICLES = 1500;
const MAX_DELAY = 0.3;

type Particle = {
  r0: number; a0: number; // polar scatter origin
  delay: number;
  arc: number;
  vx: number; vy: number;
  accent: boolean;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function Preloader() {
  const [phase, setPhase] = useState<"idle" | "run" | "exit" | "gone">("idle");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(PHASES[0].status);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem("booted") === "1") {
      setPhase("gone");
      window.dispatchEvent(new CustomEvent("boot-complete"));
      return;
    }
    setPhase("run");
    document.body.style.overflow = "hidden";

    // counter + status are timer-driven so the overlay can never stick.
    // Measured against wall-clock, not tick count — background tabs throttle
    // intervals, which would otherwise leave the counter stranded low.
    const t0 = performance.now();
    const tick = setInterval(() => {
      const elapsed = performance.now() - t0;
      const target = Math.min(100, Math.round((elapsed / MORPH_END) * 100));
      setProgress((p) =>
        Math.min(100, Math.max(p, target - 4 + Math.floor(Math.random() * 8))),
      );
      if (elapsed >= MORPH_END) {
        setProgress(100);
        clearInterval(tick);
      }
    }, 90);

    const statusTimers = PHASES.map((p, i) =>
      setTimeout(() => setStatus(p.status), STARTS[i]),
    );

    const exitTimer = setTimeout(() => {
      sessionStorage.setItem("booted", "1");
      window.dispatchEvent(new CustomEvent("boot-complete"));
      document.body.style.overflow = "";
      setPhase("exit");
    }, MORPH_END);
    const goneTimer = setTimeout(() => setPhase("gone"), TOTAL_MS + 250);

    let raf = 0;
    let cancelled = false;

    (async () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const styles = getComputedStyle(document.documentElement);
      const fg = hexToRgb(styles.getPropertyValue("--fg").trim() || "#ececf1");
      const accent = hexToRgb(styles.getPropertyValue("--accent").trim() || "#4ade80");

      try {
        await Promise.race([
          document.fonts.load('700 200px "Space Grotesk"'),
          new Promise((r) => setTimeout(r, 400)),
        ]);
      } catch {
        /* fallback font is fine */
      }
      if (cancelled) return;

      const cx = w / 2;
      const cy = h * 0.44;
      const font = '"Space Grotesk", ui-sans-serif, sans-serif';

      // sample each word's letterforms from an offscreen canvas
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d", { willReadFrequently: true })!;
      octx.textAlign = "center";
      octx.textBaseline = "middle";

      const step = Math.max(4, Math.round(Math.min(w * 0.26, 280) / 40));
      const sample = (word: string): [number, number][] => {
        let fs = Math.min(w * 0.26, 280);
        octx.font = `700 ${fs}px ${font}`;
        const maxW = w * 0.82;
        const measured = octx.measureText(word).width;
        if (measured > maxW) fs *= maxW / measured;

        octx.clearRect(0, 0, w, h);
        octx.font = `700 ${fs}px ${font}`;
        octx.fillStyle = "#fff";
        octx.fillText(word, cx, cy);
        const data = octx.getImageData(0, 0, w, h).data;

        const pts: [number, number][] = [];
        for (let y = 0; y < h; y += step) {
          for (let x = 0; x < w; x += step) {
            if (data[(y * w + x) * 4 + 3] > 128) pts.push([x, y]);
          }
        }
        // shuffle so particles travel across the whole word on every morph
        for (let i = pts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pts[i], pts[j]] = [pts[j], pts[i]];
        }
        return pts;
      };

      const clouds = PHASES.map((p) => sample(p.word));
      const count = Math.min(MAX_PARTICLES, Math.max(...clouds.map((c) => c.length)));

      const scatter = Math.max(w, h) * 0.8;
      const particles: Particle[] = Array.from({ length: count }, () => {
        const a0 = Math.random() * Math.PI * 2;
        const ev = 3 + Math.random() * 6;
        return {
          r0: scatter * (0.55 + Math.random() * 0.6),
          a0,
          delay: Math.random() * MAX_DELAY,
          arc: (Math.random() - 0.5) * 70,
          vx: Math.cos(a0) * ev + (Math.random() - 0.5) * 2,
          vy: Math.sin(a0) * ev + (Math.random() - 0.5) * 2,
          accent: Math.random() < 0.18,
        };
      });

      // resolve a target per particle per phase; particles with no slot in a
      // shorter word inherit their previous spot and dim to ambient dust
      const targets: Float32Array[] = [];
      const real: Uint8Array[] = [];
      for (let p = 0; p < clouds.length; p++) {
        const arr = new Float32Array(count * 2);
        const flags = new Uint8Array(count);
        for (let i = 0; i < count; i++) {
          if (i < clouds[p].length) {
            arr[i * 2] = clouds[p][i][0];
            arr[i * 2 + 1] = clouds[p][i][1];
            flags[i] = 1;
          } else if (p > 0) {
            arr[i * 2] = targets[p - 1][i * 2];
            arr[i * 2 + 1] = targets[p - 1][i * 2 + 1];
          } else {
            arr[i * 2] = cx + Math.cos(particles[i].a0) * particles[i].r0 * 0.35;
            arr[i * 2 + 1] = cy + Math.sin(particles[i].a0) * particles[i].r0 * 0.35;
          }
        }
        targets.push(arr);
        real.push(flags);
      }

      const start = performance.now();
      const draw = (now: number) => {
        if (cancelled) return;
        const t = reduced ? MORPH_END - 100 : now - start;
        ctx.clearRect(0, 0, w, h);

        // which phase are we in?
        let ph = PHASES.length - 1;
        for (let i = 0; i < PHASES.length; i++) {
          if (t < STARTS[i] + PHASES[i].enter + PHASES[i].hold) {
            ph = i;
            break;
          }
        }
        const local = t - STARTS[ph];
        const entering = local < PHASES[ph].enter;
        const rawP = entering ? local / PHASES[ph].enter : 1;
        const exploding = t >= MORPH_END;
        const et = exploding ? (t - MORPH_END) / EXPLODE_MS : 0;

        for (let i = 0; i < count; i++) {
          const pt = particles[i];
          const tx = targets[ph][i * 2];
          const ty = targets[ph][i * 2 + 1];
          let x: number, y: number, alpha: number, r: number, energy: number;

          if (exploding) {
            x = tx + pt.vx * et * 70;
            y = ty + pt.vy * et * 70;
            alpha = Math.max(0, 1 - et * 1.2) * (real[ph][i] ? 1 : 0.25);
            r = 1.7;
            energy = et * 0.8;
          } else if (entering) {
            const pp = easeInOut(clamp01((rawP - pt.delay) / (1 - MAX_DELAY)));
            energy = Math.sin(pp * Math.PI);
            if (ph === 0) {
              // vortex convergence from the scatter ring
              const a1 = Math.atan2(ty - cy, tx - cx);
              const r1 = Math.hypot(tx - cx, ty - cy);
              let da = a1 - pt.a0;
              da = Math.atan2(Math.sin(da), Math.cos(da));
              const ang = pt.a0 + da * pp + Math.sin(pp * Math.PI) * 0.9;
              const rad = pt.r0 + (r1 - pt.r0) * pp;
              x = cx + Math.cos(ang) * rad;
              y = cy + Math.sin(ang) * rad;
            } else {
              // fluid morph from the previous word, bowed along its path
              const px = targets[ph - 1][i * 2];
              const py = targets[ph - 1][i * 2 + 1];
              const dx = tx - px;
              const dy = ty - py;
              const len = Math.hypot(dx, dy) || 1;
              const bow = Math.sin(pp * Math.PI) * pt.arc;
              x = px + dx * pp + (-dy / len) * bow;
              y = py + dy * pp + (dx / len) * bow;
            }
            alpha = (real[ph][i] ? 0.3 + pp * 0.7 : 0.12) * (ph === 0 ? 0.25 + pp * 0.75 : 1);
            r = 1.1 + pp * 0.7;
          } else {
            // settled: faint shimmer through the letterforms
            x = tx;
            y = ty;
            alpha = real[ph][i] ? 0.85 + Math.sin(t / 90 + tx * 0.05) * 0.15 : 0.12;
            r = 1.8;
            energy = 0;
          }

          const useAccent = pt.accent ? 1 : energy;
          const cr = fg[0] + (accent[0] - fg[0]) * useAccent;
          const cg = fg[1] + (accent[1] - fg[1]) * useAccent;
          const cb = fg[2] + (accent[2] - fg[2]) * useAccent;
          ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, r + energy * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        if (t < TOTAL_MS + 120) raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearInterval(tick);
      statusTimers.forEach(clearTimeout);
      clearTimeout(exitTimer);
      clearTimeout(goneTimer);
      document.body.style.overflow = "";
    };
  }, []);

  if (phase === "idle" || phase === "gone") return null;

  return (
    <div
      className={`fixed inset-0 z-[250] flex flex-col justify-between bg-bg p-6 transition-opacity duration-500 ease-out sm:p-10 ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden />

      <div className="relative flex items-start justify-between font-mono text-xs text-muted">
        <p>
          <span className="text-accent">$</span> initializing asad-os
          <span className="caret-blink text-accent">_</span>
        </p>
        <p className="hidden sm:block">v2.0.0</p>
      </div>

      <div className="relative flex items-end justify-between gap-6">
        <p className="font-mono text-xs text-muted">
          <span className="text-accent">▸</span> {status}
        </p>
        <p className="font-sans text-7xl font-bold tabular-nums leading-none tracking-tighter sm:text-9xl">
          {progress}
          <span className="text-accent">%</span>
        </p>
      </div>

      <div
        className="absolute bottom-0 left-0 h-0.5 bg-accent transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
