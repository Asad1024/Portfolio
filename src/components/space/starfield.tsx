"use client";

import { useEffect, useRef } from "react";
import { localSiderealDeg, projectZenith, toHorizontal } from "@/lib/sky";

/* Page-wide starfield: the real sky over Lahore, behind every section.

   Each star is where it actually stands above Lahore at the moment the page
   is open — the catalogue is the naked-eye sky, positions come from local
   sidereal time, and the view is the one you get lying on your back looking
   straight up (see lib/sky). Colour comes from each star's measured B-V
   index, size and brightness from its magnitude, and the constellation
   figures are drawn in underneath, just visible, so the patterns can be
   recognised as patterns rather than read as noise.

   Scrolling turns the whole dome slowly about the zenith, the way the sky
   wheels over a night — it replaces the old parallax layers, which slid
   stars about independently and would scramble a real constellation. The
   positions are re-aimed once a minute so the sky keeps real time.

   Deliberately 2D canvas, not WebGL — the hero already owns a GPU context and
   a second one competing for it on every scroll is a bad trade for what is
   ultimately background texture. The catalogue is imported lazily, after the
   first paint, and the sky fades in once it arrives. */

type Star = {
  /** projected position, zenith at (0,0), horizon at radius 2 */
  x: number;
  y: number;
  r: number;
  alpha: number;
  color: string;
  twinkle: number;
  phase: number;
};

type Shooting = { x: number; y: number; vx: number; vy: number; life: number; len: number };

/** How far out from the zenith the viewport's corners reach, in projected
 *  units. 1.55 puts the corners about 14° above the horizon — low enough to
 *  take in most of the sky, high enough that the edges aren't stretched. */
const CORNER_REACH = 1.55;
/** Radians of turn per pixel scrolled: about 60° over the whole page. */
const TURN_PER_PX = 0.00011;
const REAIM_MS = 60_000;
const FADE_IN_MS = 1400;

/* B-V colour index to a star's actual tint: blue-white for hot stars through
   to orange for cool ones. Mixed toward white, because at one or two pixels
   full saturation reads as coloured confetti rather than starlight. */
function starTint(bv: number) {
  const stops: [number, [number, number, number]][] = [
    [-0.3, [155, 180, 255]],
    [0.0, [202, 216, 255]],
    [0.4, [248, 247, 255]],
    [0.8, [255, 236, 214]],
    [1.2, [255, 214, 170]],
    [2.0, [255, 190, 130]],
  ];
  let i = 0;
  while (i < stops.length - 2 && bv > stops[i + 1][0]) i++;
  const [b0, c0] = stops[i];
  const [b1, c1] = stops[i + 1];
  const t = Math.max(0, Math.min(1, (bv - b0) / (b1 - b0)));
  const mix = (k: number) => Math.round((c0[k] + (c1[k] - c0[k]) * t) * 0.7 + 255 * 0.3);
  return `${mix(0)},${mix(1)},${mix(2)}`;
}

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
    let lines: number[][] = [];
    let shooting: Shooting[] = [];
    let starColor = "rgba(255,255,255,0.9)";
    let raf = 0;
    let scrollY = window.scrollY;
    let shownAt = 0;
    let cancelled = false;
    let catalog: typeof import("@/lib/sky-catalog") | null = null;

    const readColors = () => {
      const s = getComputedStyle(document.documentElement);
      starColor = s.getPropertyValue("--star").trim() || starColor;
    };

    const size = () => {
      // 1.5 rather than 2: these are 1-2px dots on a dark ground, where the
      // extra pixels cost real fill rate and buy nothing visible
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /* Recomputes where every star is from the clock. Only stars above the
       horizon are kept; everything else is on the far side of the planet. */
    const aim = () => {
      if (!catalog) return;
      const lst = localSiderealDeg(new Date());
      const { STARS, CONSTELLATION_LINES } = catalog;

      const next: Star[] = [];
      for (let i = 0; i < STARS.length; i += 4) {
        const { alt, az } = toHorizontal(STARS[i], STARS[i + 1], lst);
        if (alt <= 0) continue;
        const { x, y } = projectZenith(alt, az);
        const mag = STARS[i + 2];
        next.push({
          x,
          y,
          r: Math.min(2.3, Math.max(0.45, (5.8 - mag) * 0.36)),
          alpha: Math.min(1, Math.max(0.28, 0.3 + (5.5 - mag) * 0.16)),
          color: starTint(STARS[i + 3]),
          // bright stars hold steadier; faint ones flicker more
          twinkle: 0.6 + Math.random() * 2.2,
          phase: Math.random() * Math.PI * 2,
        });
      }
      stars = next;

      // constellation figures, split wherever a segment dips below the horizon
      const nextLines: number[][] = [];
      for (const line of CONSTELLATION_LINES) {
        let run: number[] = [];
        for (let i = 0; i < line.length; i += 2) {
          const { alt, az } = toHorizontal(line[i], line[i + 1], lst);
          if (alt <= 0) {
            if (run.length >= 4) nextLines.push(run);
            run = [];
            continue;
          }
          const { x, y } = projectZenith(alt, az);
          run.push(x, y);
        }
        if (run.length >= 4) nextLines.push(run);
      }
      lines = nextLines;
    };

    /* Capped at ~30fps. This is a full-viewport 2D canvas that clears and
       repaints every star each frame, sitting on top of the hero's WebGL
       context — at 60fps on a hidpi display the two compete for the
       compositor and the orbits visibly stutter. Twinkle and turn are slow
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

      if (stars.length) {
        if (!shownAt) shownAt = t;
        const fade = reduced ? 1 : Math.min(1, (t - shownAt) / FADE_IN_MS);

        const cx = w / 2;
        const cy = h / 2;
        const scale = Math.hypot(w, h) / 2 / CORNER_REACH;
        const turn = reduced ? 0 : scrollY * TURN_PER_PX;
        const cos = Math.cos(turn);
        const sin = Math.sin(turn);
        const px = (x: number, y: number) => cx + (x * cos - y * sin) * scale;
        const py = (x: number, y: number) => cy + (x * sin + y * cos) * scale;

        // the figures first, so every star sits on top of its own line
        ctx.strokeStyle = rgba(starColor, 0.075 * fade);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (const line of lines) {
          ctx.moveTo(px(line[0], line[1]), py(line[0], line[1]));
          for (let i = 2; i < line.length; i += 2) ctx.lineTo(px(line[i], line[i + 1]), py(line[i], line[i + 1]));
        }
        ctx.stroke();

        for (const s of stars) {
          const x = px(s.x, s.y);
          const y = py(s.x, s.y);
          if (x < -4 || y < -4 || x > w + 4 || y > h + 4) continue;
          const pulse = reduced ? 1 : 0.72 + 0.28 * Math.sin((t / 900) * s.twinkle + s.phase);
          ctx.fillStyle = `rgba(${s.color},${s.alpha * pulse * fade})`;
          if (s.r < 0.9) {
            // sub-pixel stars: a square is indistinguishable and far cheaper
            ctx.fillRect(x - s.r, y - s.r, s.r * 2, s.r * 2);
          } else {
            ctx.beginPath();
            ctx.arc(x, y, s.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

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
    size();
    raf = requestAnimationFrame(draw);

    import("@/lib/sky-catalog").then((mod) => {
      if (cancelled) return;
      catalog = mod;
      aim();
    });
    const reaim = setInterval(aim, REAIM_MS);

    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", size);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearInterval(reaim);
      mo.disconnect();
      window.removeEventListener("resize", size);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />;
}
