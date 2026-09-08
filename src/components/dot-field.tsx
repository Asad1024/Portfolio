"use client";

import { useEffect, useRef } from "react";

type Dot = { ox: number; oy: number; x: number; y: number; vx: number; vy: number };

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function DotField({
  spacing = 30,
  masked = true,
}: {
  /** Grid pitch in px. Larger = sparser and cheaper. */
  spacing?: number;
  /** Radial fade, for the hero. Off for the page-wide background. */
  masked?: boolean;
} = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SPACING = spacing;
    const RADIUS = 150;
    const FORCE = 3.2;

    let w = 0;
    let h = 0;
    let dots: Dot[] = [];
    let muted: [number, number, number] = [137, 137, 148];
    let accent: [number, number, number] = [74, 222, 128];
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;

    const readColors = () => {
      const s = getComputedStyle(document.documentElement);
      try {
        muted = hexToRgb(s.getPropertyValue("--muted").trim());
        accent = hexToRgb(s.getPropertyValue("--accent").trim());
      } catch {
        /* keep previous */
      }
    };

    const build = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = SPACING / 2; y < h; y += SPACING) {
        for (let x = SPACING / 2; x < w; x += SPACING) {
          dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
        }
      }
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        if (!reduced) {
          // repulsion from cursor
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < RADIUS && dist > 0.01) {
            const f = ((RADIUS - dist) / RADIUS) * FORCE;
            d.vx += (dx / dist) * f;
            d.vy += (dy / dist) * f;
          }
          // spring back home + gentle ambient wave
          const wave = Math.sin(t / 1600 + d.ox * 0.02 + d.oy * 0.015) * 1.4;
          d.vx += (d.ox - d.x) * 0.06;
          d.vy += (d.oy + wave - d.y) * 0.06;
          d.vx *= 0.86;
          d.vy *= 0.86;
          d.x += d.vx;
          d.y += d.vy;
        }
        // color: muted at rest, accent when displaced
        const disp = Math.min(1, Math.hypot(d.x - d.ox, d.y - d.oy) / 22);
        const [r, g, b] = disp > 0.05
          ? [
              muted[0] + (accent[0] - muted[0]) * disp,
              muted[1] + (accent[1] - muted[1]) * disp,
              muted[2] + (accent[2] - muted[2]) * disp,
            ]
          : muted;
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${0.35 + disp * 0.5})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.1 + disp * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    readColors();
    build();
    raf = requestAnimationFrame(draw);

    const observer = new MutationObserver(readColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", build);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", build);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, [spacing]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`absolute inset-0 size-full ${masked ? "hero-mask" : ""}`}
    />
  );
}
