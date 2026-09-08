"use client";

import { useEffect, useRef, useState } from "react";

/* Opt-in easter egg: `matrix` in the terminal plays this for ~5s, then it
   cleans itself up. Deliberately NOT a permanent background — falling glyphs
   behind real content would wreck readability. */
const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789<>[]{}/\|=+*#$%";
const RUN_MS = 5000;
const FADE_MS = 800;

export function MatrixRain() {
  const [active, setActive] = useState(false);
  const [fading, setFading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const onRun = () => {
      setFading(false);
      setActive(true);
    };
    window.addEventListener("run-matrix", onRun);
    return () => window.removeEventListener("run-matrix", onRun);
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const accent =
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() ||
      "#4ade80";

    const size = 16;
    const cols = Math.ceil(w / size);
    // stagger starts so the rain doesn't arrive as one flat line
    const drops = Array.from({ length: cols }, () => Math.random() * -40);

    ctx.fillStyle = "#05060a";
    ctx.fillRect(0, 0, w, h);

    let raf = 0;
    const draw = () => {
      // translucent wash leaves the trailing tail behind each glyph
      ctx.fillStyle = "rgba(5, 6, 10, 0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${size}px "JetBrains Mono", ui-monospace, monospace`;

      for (let i = 0; i < cols; i++) {
        const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const y = drops[i] * size;
        // brightest glyph at the head of each column
        ctx.fillStyle = Math.random() > 0.975 ? "#eaffef" : accent;
        ctx.fillText(ch, i * size, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const fadeT = setTimeout(() => setFading(true), RUN_MS);
    const endT = setTimeout(() => setActive(false), RUN_MS + FADE_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fadeT);
      clearTimeout(endT);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-[200] transition-opacity ease-out ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    />
  );
}
