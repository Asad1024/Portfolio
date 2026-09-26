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

/** A star with a proper name, projected like the rest, for the hover label.
 *  `rate` and `phase` set its blink, which marks it out as one you can hover. */
type Named = { x: number; y: number; r: number; name: string; detail: string; rate: number; phase: number };

type Shooting = { x: number; y: number; vx: number; vy: number; life: number; len: number };

/** How far out from the zenith the viewport's corners reach, in projected
 *  units. 1.55 puts the corners about 14° above the horizon — low enough to
 *  take in most of the sky, high enough that the edges aren't stretched. */
const CORNER_REACH = 1.55;
/** Radians of turn per pixel scrolled: about 60° over the whole page. */
const TURN_PER_PX = 0.00011;
const REAIM_MS = 60_000;
const FADE_IN_MS = 1400;
/** How close, in pixels, the pointer has to come to a named star. */
const PICK_RADIUS = 16;

/* The label only answers on empty sky. Anything a visitor is reading or
   using — text, links, controls, cards with their own ground, the hero's 3D
   system — is not sky, so the pointer there never raises a name. */
const INTERACTIVE = "a,button,input,textarea,select,label,p,h1,h2,h3,h4,h5,h6,li,pre,code,img,svg,canvas,video,header,nav,[role=dialog]";
function overEmptySky(el: Element | null) {
  for (let e = el; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
    if (e.matches(INTERACTIVE)) return false;
    const bg = getComputedStyle(e).backgroundColor;
    if (bg && bg !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(bg)) return false;
    for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent?.trim()) return false;
  }
  return true;
}

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
    let accentRgb = "34,211,238";
    let raf = 0;
    let scrollY = window.scrollY;
    let shownAt = 0;
    let cancelled = false;
    let catalog: typeof import("@/lib/sky-catalog") | null = null;
    let named: Named[] = [];
    let monoFont = "ui-monospace, monospace";
    /* The sky is drawn once into an off-screen layer — every star and figure,
       at the scale the viewport needs — and each frame only rotates and
       stamps that one image. Redrawing ~1,400 stars one by one every frame
       was the single most expensive thing on the page on a phone. The
       brightest few dozen are left out of the layer and drawn live on top,
       so the stars people actually notice still twinkle. */
    let layer: HTMLCanvasElement | null = null;
    let layerSize = 0;
    let twinklers: Star[] = [];

    // pointer, and whether it is over empty sky (re-checked only when it moves)
    const pointer = { x: 0, y: 0, moved: false, active: false };
    // the label being shown: which star, and how far faded in
    let label: { star: Named; x: number; y: number } | null = null;
    let labelAlpha = 0;

    const readColors = () => {
      const s = getComputedStyle(document.documentElement);
      starColor = s.getPropertyValue("--star").trim() || starColor;
      const hex = (s.getPropertyValue("--accent").trim() || "#22d3ee").replace("#", "");
      const n = parseInt(hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex, 16);
      if (!Number.isNaN(n)) accentRgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
      const mono = document.querySelector(".font-mono");
      if (mono) monoFont = getComputedStyle(mono).fontFamily;
      buildLayer();
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
      buildLayer();
    };

    function buildLayer() {
      if (!stars.length || !w || !h) return;
      const scale = Math.hypot(w, h) / 2 / CORNER_REACH;
      // square, and large enough that it still covers the screen when turned
      layerSize = Math.ceil(Math.hypot(w, h)) + 8;
      const ld = Math.min(window.devicePixelRatio || 1, 1.25);
      layer ??= document.createElement("canvas");
      layer.width = layerSize * ld;
      layer.height = layerSize * ld;
      const lc = layer.getContext("2d");
      if (!lc) return;
      lc.setTransform(ld, 0, 0, ld, layerSize * ld / 2, layerSize * ld / 2);
      lc.clearRect(-layerSize, -layerSize, layerSize * 2, layerSize * 2);

      // the figures first, so every star sits on top of its own line
      lc.strokeStyle = rgba(starColor, 0.075);
      lc.lineWidth = 0.8;
      lc.beginPath();
      for (const line of lines) {
        lc.moveTo(line[0] * scale, line[1] * scale);
        for (let i = 2; i < line.length; i += 2) lc.lineTo(line[i] * scale, line[i + 1] * scale);
      }
      lc.stroke();

      twinklers = [];
      for (const s of stars) {
        if (s.r >= 1.3) {
          twinklers.push(s);
          continue;
        }
        // the average of the twinkle, baked in
        lc.fillStyle = `rgba(${s.color},${s.alpha * 0.86})`;
        if (s.r < 0.9) {
          lc.fillRect(s.x * scale - s.r, s.y * scale - s.r, s.r * 2, s.r * 2);
        } else {
          lc.beginPath();
          lc.arc(s.x * scale, s.y * scale, s.r, 0, Math.PI * 2);
          lc.fill();
        }
      }
    }

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

      const nextNamed: Named[] = [];
      const { NAMED_STARS, STAR_NAMES } = catalog;
      for (let i = 0, k = 0; i < NAMED_STARS.length; i += 4, k++) {
        const { alt, az } = toHorizontal(NAMED_STARS[i], NAMED_STARS[i + 1], lst);
        if (alt <= 0) continue;
        const { x, y } = projectZenith(alt, az);
        const mag = NAMED_STARS[i + 2];
        const ly = NAMED_STARS[i + 3];
        const [name, con] = STAR_NAMES[k];
        nextNamed.push({
          x,
          y,
          r: Math.min(2.3, Math.max(0.45, (5.8 - mag) * 0.36)),
          name,
          detail: ly ? `${con} · ${ly.toLocaleString("en-US")} light-years` : con,
          /* Seeded from the star's index, not Math.random: aim() re-runs every
             minute, and a fresh random phase would make every star jump
             mid-blink. The golden angle spreads the phases so no two
             neighbours in the list flash together. */
          rate: 0.9 + ((k * 0.618) % 1) * 0.9,
          phase: (k * 2.39996) % (Math.PI * 2),
        });
      }
      named = nextNamed;
      buildLayer();
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

        // the whole baked sky, turned for the scroll, in one draw
        if (layer) {
          ctx.save();
          ctx.globalAlpha = fade;
          ctx.translate(cx, cy);
          ctx.rotate(turn);
          ctx.drawImage(layer, -layerSize / 2, -layerSize / 2, layerSize, layerSize);
          ctx.restore();
        }

        // then only the bright ones, live, so they can twinkle
        for (const s of twinklers) {
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

        /* The named stars blink — a bright flash with a soft accent glow and a
           four-point glint, each on its own beat — so the ones that answer a
           hover can be told apart from the ones that don't. Held steady under
           reduced motion. */
        if (!reduced) {
          ctx.lineCap = "round";
          for (const n of named) {
            const x = px(n.x, n.y);
            const y = py(n.x, n.y);
            if (x < -16 || y < -16 || x > w + 16 || y > h + 16) continue;
            // a sine raised to a power: quiet most of the cycle, then a clear flash
            const blink = (0.5 + 0.5 * Math.sin((t / 1000) * n.rate + n.phase)) ** 4;
            if (blink < 0.03) continue;
            const a = blink * fade;

            const glowR = n.r + 4 + blink * 9;
            const glow = ctx.createRadialGradient(x, y, 0, x, y, glowR);
            glow.addColorStop(0, `rgba(${accentRgb},${0.55 * a})`);
            glow.addColorStop(1, `rgba(${accentRgb},0)`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, glowR, 0, Math.PI * 2);
            ctx.fill();

            // the glint: a thin cross, longest at the peak of the flash
            const spike = n.r + 3 + blink * 10;
            ctx.strokeStyle = rgba(starColor, 0.85 * a);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - spike, y);
            ctx.lineTo(x + spike, y);
            ctx.moveTo(x, y - spike);
            ctx.lineTo(x, y + spike);
            ctx.stroke();

            ctx.fillStyle = rgba(starColor, a);
            ctx.beginPath();
            ctx.arc(x, y, n.r + 0.6 + blink * 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // ── the name of the star under the pointer, on empty sky only
        if (pointer.moved) {
          pointer.moved = false;
          pointer.active = overEmptySky(document.elementFromPoint(pointer.x, pointer.y));
        }
        let hit: { star: Named; x: number; y: number } | null = null;
        if (pointer.active) {
          let best = PICK_RADIUS * PICK_RADIUS;
          for (const n of named) {
            const x = px(n.x, n.y);
            const y = py(n.x, n.y);
            const d = (x - pointer.x) ** 2 + (y - pointer.y) ** 2;
            if (d < best) {
              best = d;
              hit = { star: n, x, y };
            }
          }
        }
        if (hit) label = hit;
        else if (label) {
          // keep following the star it names while it fades out
          label = { ...label, x: px(label.star.x, label.star.y), y: py(label.star.x, label.star.y) };
        }
        labelAlpha += ((hit ? 1 : 0) - labelAlpha) * (reduced ? 1 : 0.2);
        if (label && labelAlpha > 0.02) drawLabel(label, labelAlpha * fade);
        else if (labelAlpha <= 0.02) label = null;
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

    /* Where the label goes: to the right of the star, else the left, below
       or above — whichever box lies entirely on empty sky, checked at its corners
       and middle. Worked out once per star, not per frame. If nowhere is
       clear the star just gets its ring: a name is never printed over text. */
    const LABEL_H = 34;
    let placed: { star: Named; side: "right" | "left" | "below" | "above" | null } | null = null;
    const measure = (text: string, size: number, weight: number) => {
      ctx.font = `${weight} ${size}px ${monoFont}`;
      return ctx.measureText(text).width;
    };
    const placeLabel = (l: { star: Named; x: number; y: number }) => {
      const width = Math.max(measure(l.star.name, 13, 500), measure(l.star.detail, 11, 400)) + 16;
      const gap = l.star.r + 12;
      const boxes = {
        right: { x: l.x + gap, y: l.y - LABEL_H / 2 },
        left: { x: l.x - gap - width, y: l.y - LABEL_H / 2 },
        // centred under the star, slid sideways as needed to stay on screen
        below: { x: Math.min(w - 4 - width, Math.max(4, l.x - width / 2)), y: l.y + gap },
        above: { x: Math.min(w - 4 - width, Math.max(4, l.x - width / 2)), y: l.y - gap - LABEL_H },
      };
      for (const side of ["right", "left", "below", "above"] as const) {
        const b = boxes[side];
        if (b.x < 4 || b.y < 4 || b.x + width > w - 4 || b.y + LABEL_H > h - 4) continue;
        const probes = [
          [b.x, b.y], [b.x + width, b.y], [b.x, b.y + LABEL_H], [b.x + width, b.y + LABEL_H],
          [b.x + width / 2, b.y + LABEL_H / 2],
        ];
        if (probes.every(([x, y]) => overEmptySky(document.elementFromPoint(x, y)))) return side;
      }
      return null;
    };

    const drawLabel = (l: { star: Named; x: number; y: number }, a: number) => {
      if (!placed || placed.star !== l.star) placed = { star: l.star, side: placeLabel(l) };
      const ring = l.star.r + 5;
      ctx.strokeStyle = `rgba(${accentRgb},${0.75 * a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(l.x, l.y, ring, 0, Math.PI * 2);
      ctx.stroke();
      if (!placed.side) return;

      const width = Math.max(measure(l.star.name, 13, 500), measure(l.star.detail, 11, 400)) + 16;
      const gap = l.star.r + 12;
      const bx =
        placed.side === "right"
          ? l.x + gap
          : placed.side === "left"
            ? l.x - gap - width
            : Math.min(w - 4 - width, Math.max(4, l.x - width / 2));
      const by =
        placed.side === "below" ? l.y + gap : placed.side === "above" ? l.y - gap - LABEL_H : l.y - LABEL_H / 2;

      // a faint backing, so the text stays crisp over a busy patch of sky
      ctx.fillStyle = `rgba(4,5,10,${0.72 * a})`;
      ctx.beginPath();
      ctx.roundRect(bx, by, width, LABEL_H, 6);
      ctx.fill();
      ctx.strokeStyle = `rgba(${accentRgb},${0.22 * a})`;
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = `500 13px ${monoFont}`;
      ctx.fillStyle = `rgba(232,236,245,${0.95 * a})`;
      ctx.fillText(l.star.name, bx + 8, by + 15);
      ctx.font = `400 11px ${monoFont}`;
      ctx.fillStyle = `rgba(139,147,167,${0.95 * a})`;
      ctx.fillText(l.star.detail, bx + 8, by + 28);
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.moved = true;
    };
    const onLeave = () => {
      pointer.active = false;
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
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearInterval(reaim);
      mo.disconnect();
      window.removeEventListener("resize", size);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />;
}
