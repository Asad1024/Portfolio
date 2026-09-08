"use client";

import { useEffect, useRef } from "react";

/* Page-wide starfield: three parallax layers behind every section, so the
   whole site reads as one continuous piece of sky rather than a stack of
   panels that each happen to be dark.

   Deliberately 2D canvas, not WebGL — the hero already owns a GPU context and
   a second one competing for it on every scroll is a bad trade for what is
   ultimately background texture. */

type Star = {
  x: number;
  y: number;
  r: number;
  /** 0 = far and still, 1 = near and fast */
  depth: number;
  twinkle: number;
  phase: number;
  warm: boolean;
};

type Shooting = { x: number; y: number; vx: number; vy: number; life: number; len: number };

const LAYERS = [
  { count: 110, depth: 0.15, r: [0.4, 0.9] },
  { count: 70, depth: 0.42, r: [0.7, 1.35] },
  { count: 34, depth: 0.85, r: [1.1, 1.9] },
] as const;

function rgba(v: string, alpha: number) {
  // --star arrives as rgba(...) already carrying its own alpha; re-wrap it so
  // per-star alpha multiplies rather than replaces the theme's base value.
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (!m) return `rgba(255,255,255,${alpha})`;
  const [r, g, b, a = "1"] = m[1].split(",").map((s) => s.trim());
  return `rgba(${r},${g},${b},${alpha * parseFloat(a)})`;
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let shooting: Shooting[] = [];
    let starColor = "rgba(255,255,255,0.9)";
    let accent = "#22d3ee";
    let raf = 0;
    let scrollY = window.scrollY;

    const readColors = () => {
      const s = getComputedStyle(document.documentElement);
      starColor = s.getPropertyValue("--star").trim() || starColor;
      accent = s.getPropertyValue("--accent").trim() || accent;
    };

    const build = () => {
      // 1.5 rather than 2: these are 1-2px dots on a dark ground, where the
      // extra pixels cost real fill rate and buy nothing visible
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = [];
      for (const layer of LAYERS) {
        for (let i = 0; i < layer.count; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: layer.r[0] + Math.random() * (layer.r[1] - layer.r[0]),
            depth: layer.depth,
            twinkle: 0.6 + Math.random() * 2.4,
            phase: Math.random() * Math.PI * 2,
            warm: Math.random() < 0.16,
          });
        }
      }
    };

    /* Capped at ~30fps. This is a full-viewport 2D canvas that clears and
       repaints every star each frame, sitting on top of the hero's WebGL
       context — at 60fps on a hidpi display the two compete for the
       compositor and the orbits visibly stutter. Twinkle and drift are slow
       enough that half the frames look identical. */
    const FRAME_MS = 33;
    let last = 0;

    const draw = (t: number) => {
      if (t - last < FRAME_MS) {
        raf = requestAnimationFrame(draw);
        return;
      }
      last = t;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        // parallax: near layers slide further against the scroll than far ones
        const y = ((s.y - scrollY * s.depth * 0.35) % h + h) % h;
        const pulse = reduced ? 0.75 : 0.55 + 0.45 * Math.sin(t / 900 * s.twinkle + s.phase);

        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.warm ? accent : rgba(starColor, pulse);
        ctx.globalAlpha = s.warm ? pulse * 0.55 : 1;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // the occasional streak — rare enough to feel like luck, not decoration
      if (!reduced && Math.random() < 0.0022 && shooting.length < 2) {
        shooting.push({
          x: Math.random() * w * 0.7,
          y: Math.random() * h * 0.5,
          vx: 5 + Math.random() * 4,
          vy: 1.6 + Math.random() * 1.6,
          life: 1,
          len: 70 + Math.random() * 90,
        });
      }
      shooting = shooting.filter((m) => {
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.014;
        if (m.life <= 0) return false;
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.len, m.y - m.len * (m.vy / m.vx));
        grad.addColorStop(0, rgba(starColor, m.life));
        grad.addColorStop(1, "transparent");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.len, m.y - m.len * (m.vy / m.vx));
        ctx.stroke();
        return true;
      });

      raf = requestAnimationFrame(draw);
    };

    const onScroll = () => {
      scrollY = window.scrollY;
    };

    readColors();
    build();
    raf = requestAnimationFrame(draw);

    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", build);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener("resize", build);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />;
}
