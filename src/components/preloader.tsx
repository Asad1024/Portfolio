"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { grainTile, paintGalaxy, paintNebula, paintPlanet, paintRing, paintRock } from "./space/film-textures";

/* ── first visit: a short film ──────────────────────────────────────────────
   Four scenes on one canvas, full frame, cut like a trailer.

     before     black, and a single point of light breathing in the dark
     the bang   it ignites: a white-out, the frame shakes, shockwaves split
                into colour, and thousands of particles burst outward in
                three dimensions, cooling from white-hot to colour as they go
     voyage     the camera flies through what was made — nebula, a red desert
                world, an asteroid field close enough to flinch at, a ringed
                gas giant, a comet, an ice moon, a binary star flaring the
                lens — banking gently as it goes
     arrival    a cyan star swells ahead, the name lands like an
                end card, and the light hands over to the hero, whose star
                ignites and flings its planets out (see solar-system)

   The worlds are painted procedurally (space/film-textures) — 3D noise on a
   real sphere, lit with a soft terminator — a few rows per frame while the
   opening plays, so nothing hitches. Everything holds an x, y, z, is projected
   through x/z and rolled for the bank. Title cards write themselves in letter
   by letter; the cards are driven from the frame loop.

   Once per browser session, with no controls on screen; any key, wheel or tap
   still skips it. The end is on a timer, so a throttled tab still gets the
   site. */

const FILM_MS = 11600;
const FADE_MS = 700;

const T = {
  ignite: 2700,
  bang: 2850,
  voyage: 4300,
  approach: 9900,
  arrive: 11000,
};

const CARDS = [
  { text: "In the beginning, there was nothing.", from: 350, to: 2600 },
  { text: "Then, everything.", from: 3200, to: 5100 },
  { text: "Across a hundred billion stars,", from: 5400, to: 7500 },
  { text: "to one small corner of space.", from: 7800, to: 9800 },
];

const DEPTH = 2600;
const FOV = 380;

type RGB = [number, number, number];
type Star = { x: number; y: number; z: number; c: RGB };
type Spark = { dx: number; dy: number; dz: number; s: number; c: RGB; px: number; py: number };
type Rock = { x: number; y: number; z: number; r: number; spin: number; rot: number; sprite: number };
type Cloud = { x: number; y: number; z: number; r: number; tex: number; alpha: number };
type World = { key: "desert" | "giant" | "ice"; x: number; y: number; z: number; r: number; glow: RGB };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

/** Ship speed (depth units per ms) through the voyage and approach. */
function cruise(t: number) {
  if (t < T.voyage) return 0;
  if (t < T.approach) return 0.28 + smooth((t - T.voyage) / (T.approach - T.voyage)) * 0.85;
  if (t < T.arrive - 300) return 1.13 + Math.pow((t - T.approach) / (T.arrive - 300 - T.approach), 2) * 7;
  return 8.1 * (1 - clamp01((t - (T.arrive - 300)) / 700)) + 0.2;
}

export function Preloader() {
  const [phase, setPhase] = useState<"idle" | "film" | "exit" | "gone">("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLParagraphElement>(null);
  const creditRef = useRef<HTMLDivElement>(null);

  useScrollLock(phase === "film");

  /* Both branches set state on mount, and that is the only shape this can
     take: the server has no session and always renders the cover, so the
     phase cannot be seeded from sessionStorage without a hydration mismatch. */
  /* eslint-disable react-hooks/set-state-in-effect -- explained above */
  useEffect(() => {
    if (sessionStorage.getItem("booted") === "1") {
      setPhase("gone");
      window.dispatchEvent(new CustomEvent("boot-complete"));
      return;
    }
    setPhase("film");

    let finished = false;
    let goneTimer: ReturnType<typeof setTimeout> | undefined;
    let bootTimer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(toEnd);
      detach();
      sessionStorage.setItem("booted", "1");
      setPhase("exit");
      // the hero launches its planets on boot-complete; announced part way
      // through the fade so the launch is seen rather than played behind the film
      bootTimer = setTimeout(() => window.dispatchEvent(new CustomEvent("boot-complete")), FADE_MS * 0.45);
      goneTimer = setTimeout(() => setPhase("gone"), FADE_MS + 80);
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const toEnd = setTimeout(finish, reduced ? 1200 : FILM_MS);

    // anything that says "I'm here for the site" ends the film early
    const SKIP = ["keydown", "wheel", "touchstart"] as const;
    const detach = () => SKIP.forEach((type) => window.removeEventListener(type, finish));
    SKIP.forEach((type) => window.addEventListener(type, finish, { passive: true }));

    return () => {
      clearTimeout(toEnd);
      clearTimeout(goneTimer);
      clearTimeout(bootTimer);
      detach();
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const rolling = phase === "film" || phase === "exit";

  useEffect(() => {
    if (!rolling) return;
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

    // a phone gets the same film with fewer particles and smaller textures
    const small = w < 700;
    const scale = small ? 0.55 : 1;
    const cx = w / 2;
    const cy = h / 2;
    const spread = Math.max(w, h) * 1.5;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    const WHITE: RGB = [240, 246, 255];
    const CYAN: RGB = [34, 211, 238];
    const ICE: RGB = [165, 243, 252];
    const VIOLET: RGB = [139, 92, 246];
    const AMBER: RGB = [255, 176, 92];
    const ROSE: RGB = [244, 114, 182];
    const palette = [CYAN, ICE, VIOLET, AMBER, ROSE, WHITE];

    // ── textures, painted between frames while the opening plays ──
    const tex: {
      desert?: HTMLCanvasElement;
      giant?: HTMLCanvasElement;
      ice?: HTMLCanvasElement;
      ring?: HTMLCanvasElement;
      galaxy?: HTMLCanvasElement;
      rocks: HTMLCanvasElement[];
      nebula: HTMLCanvasElement[];
    } = { rocks: [], nebula: [] };
    const grain = ctx.createPattern(grainTile(), "repeat");
    const P = small ? 220 : 320;
    const jobs: { gen: Generator<void, HTMLCanvasElement>; done: (c: HTMLCanvasElement) => void }[] = [
      { gen: paintNebula(small ? 200 : 280, VIOLET, ROSE, 3), done: (c) => tex.nebula.push(c) },
      { gen: paintPlanet("desert", P), done: (c) => (tex.desert = c) },
      { gen: paintNebula(small ? 200 : 280, CYAN, VIOLET, 7), done: (c) => tex.nebula.push(c) },
      ...[1, 2, 3, 4, 5, 6, 7].map((s) => ({ gen: paintRock(small ? 72 : 96, s), done: (c: HTMLCanvasElement) => tex.rocks.push(c) })),
      { gen: paintPlanet("giant", small ? 260 : 380), done: (c) => (tex.giant = c) },
      { gen: paintRing(small ? 300 : 440), done: (c) => (tex.ring = c) },
      { gen: paintPlanet("ice", small ? 180 : 260), done: (c) => (tex.ice = c) },
      { gen: paintNebula(small ? 200 : 280, ROSE, CYAN, 11), done: (c) => tex.nebula.push(c) },
      { gen: paintGalaxy(small ? 200 : 280), done: (c) => (tex.galaxy = c) },
    ];
    const pump = (budget: number) => {
      const until = performance.now() + budget;
      while (jobs.length && performance.now() < until) {
        const step = jobs[0].gen.next();
        if (step.done) {
          jobs[0].done(step.value);
          jobs.shift();
        }
      }
    };

    // the field the camera flies through after the bang
    const stars: Star[] = Array.from({ length: Math.round(1400 * scale) }, () => ({
      x: rnd(-spread, spread),
      y: rnd(-spread, spread),
      z: rnd(1, DEPTH),
      c: Math.random() < 0.72 ? WHITE : palette[(Math.random() * 3) | 0],
    }));

    // the bang itself: directions on a sphere, each spark its own speed and colour
    const sparks: Spark[] = Array.from({ length: Math.round(2600 * scale) }, () => {
      const u = rnd(-1, 1);
      const th = rnd(0, Math.PI * 2);
      const r = Math.sqrt(1 - u * u);
      return { dx: r * Math.cos(th), dy: u, dz: r * Math.sin(th), s: Math.pow(Math.random(), 0.55), c: palette[(Math.random() * palette.length) | 0], px: cx, py: cy };
    });

    // route scenery, placed by distance along the voyage
    const clouds: Cloud[] = [
      { x: -spread * 0.3, y: -spread * 0.12, z: 650, r: 1300, tex: 0, alpha: 0.85 },
      { x: spread * 0.34, y: spread * 0.1, z: 1350, r: 1500, tex: 1, alpha: 0.75 },
      { x: -spread * 0.08, y: spread * 0.24, z: 2300, r: 1700, tex: 2, alpha: 0.7 },
      { x: spread * 0.2, y: -spread * 0.26, z: 3100, r: 1600, tex: 0, alpha: 0.6 },
      { x: -spread * 0.32, y: spread * 0.06, z: 3900, r: 1800, tex: 1, alpha: 0.6 },
    ];
    const worlds: World[] = [
      { key: "desert", x: spread * 0.31, y: -spread * 0.19, z: 1250, r: 170, glow: AMBER },
      { key: "giant", x: -spread * 0.4, y: spread * 0.15, z: 2350, r: 340, glow: [236, 196, 150] },
      { key: "ice", x: spread * 0.36, y: spread * 0.07, z: 3250, r: 120, glow: ICE },
    ];
    // a loose field: a scatter of rocks of every size, most of them small (the
    // squared random skews them small), and five big ones that pass close
    // enough to fill a corner of the frame
    const rocks: Rock[] = [
      ...Array.from({ length: Math.round(28 * scale) }, () => ({
        x: rnd(-spread * 0.62, spread * 0.62),
        y: rnd(-spread * 0.36, spread * 0.36),
        z: rnd(1700, 3200),
        r: 10 + Math.random() ** 2 * 62,
        spin: rnd(-0.0009, 0.0009),
        rot: rnd(0, Math.PI * 2),
        sprite: (Math.random() * 7) | 0,
      })),
      ...[
        { x: -0.22, y: 0.12, z: 2050, r: 95 },
        { x: 0.3, y: 0.16, z: 2300, r: 60 },
        { x: 0.26, y: -0.1, z: 2550, r: 125 },
        { x: -0.3, y: -0.18, z: 2800, r: 70 },
        { x: 0.12, y: 0.2, z: 3000, r: 85 },
      ].map((b, i) => ({ x: spread * b.x, y: spread * b.y, z: b.z, r: b.r, spin: 0.0005 * (i % 2 ? 1 : -1), rot: i, sprite: i })),
    ];
    const binary = { x: -spread * 0.2, y: -spread * 0.28, z: 3600 };
    const destination = { x: 0, y: 0, z: 6500 };

    const start = performance.now();
    let last = start;
    let travelled = 0;

    /** camera: where it is (it drifts), depth projection, the bank, the shake */
    let roll = 0;
    let shakeX = 0;
    let shakeY = 0;
    let camX = 0;
    let camY = 0;
    const project = (x: number, y: number, z: number) => {
      const k = FOV / z;
      const sx = (x - camX) * k;
      const sy = (y - camY) * k;
      const c = Math.cos(roll);
      const s = Math.sin(roll);
      return { x: cx + sx * c - sy * s + shakeX, y: cy + sx * s + sy * c + shakeY, k };
    };

    const flare = (x: number, y: number, power: number, tint: RGB) => {
      if (power <= 0.01) return;
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 220 * power);
      glow.addColorStop(0, rgba(WHITE, 0.95 * power));
      glow.addColorStop(0.15, rgba(tint, 0.55 * power));
      glow.addColorStop(1, rgba(tint, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(x - 240 * power, y - 240 * power, 480 * power, 480 * power);
      // the anamorphic streak, the thing that makes it read as a lens
      const len = w * 0.75 * power;
      const streak = ctx.createLinearGradient(x - len, y, x + len, y);
      streak.addColorStop(0, rgba(tint, 0));
      streak.addColorStop(0.5, rgba(ICE, 0.75 * power));
      streak.addColorStop(1, rgba(tint, 0));
      ctx.fillStyle = streak;
      ctx.fillRect(x - len, y - 1.5 * power - 0.5, len * 2, 3 * power + 1);
      // ghosts along the line through the frame centre
      for (const [f, rad, a] of [
        [0.4, 26, 0.12],
        [-0.25, 48, 0.08],
        [-0.7, 18, 0.14],
      ] as const) {
        const gx = cx + (x - cx) * f;
        const gy = cy + (y - cy) * f;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad * (0.6 + power));
        g.addColorStop(0, rgba(tint, a * power));
        g.addColorStop(1, rgba(tint, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(gx, gy, rad * (0.6 + power), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const drawWorld = (wd: World, x: number, y: number, r: number, alpha: number) => {
      const t = tex[wd.key];
      if (!t || r < 0.8 || alpha <= 0) return;
      ctx.globalAlpha = alpha;
      // scattered light around the limb
      const a = ctx.createRadialGradient(x, y, r * 0.92, x, y, r * 1.28);
      a.addColorStop(0, rgba(wd.glow, 0.38));
      a.addColorStop(1, rgba(wd.glow, 0));
      ctx.fillStyle = a;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.28, 0, Math.PI * 2);
      ctx.fill();
      const ring = wd.key === "giant" ? tex.ring : undefined;
      const tilt = -0.32 + roll;
      const drawRingHalf = (back: boolean) => {
        if (!ring) return;
        const R = r * 2.3;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tilt);
        ctx.scale(1, 0.26);
        ctx.beginPath();
        if (back) ctx.rect(-R, -R, R * 2, R);
        else ctx.rect(-R, 0, R * 2, R);
        ctx.clip();
        ctx.drawImage(ring, -R, -R, R * 2, R * 2);
        ctx.restore();
      };
      drawRingHalf(true);
      ctx.drawImage(t, x - r, y - r, r * 2, r * 2);
      drawRingHalf(false);
      if (wd.key === "ice") {
        // its moon, small and grey, on its own slow path
        const m = performance.now() * 0.0005;
        const mr = r * 0.22;
        const mx = x + Math.cos(m) * r * 1.9;
        const my = y + Math.sin(m) * r * 0.5;
        const mg = ctx.createRadialGradient(mx - mr * 0.4, my - mr * 0.45, mr * 0.05, mx, my, mr);
        mg.addColorStop(0, "rgba(214,218,226,1)");
        mg.addColorStop(0.6, "rgba(96,102,116,1)");
        mg.addColorStop(1, "rgba(10,12,18,1)");
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    let cardIndex = -1;
    const setCard = (t: number) => {
      const el = cardRef.current;
      if (!el) return;
      const i = CARDS.findIndex((c) => t >= c.from && t <= c.to);
      if (i !== cardIndex) {
        cardIndex = i;
        el.replaceChildren();
        if (i >= 0) {
          // one span per letter, each rising out of a blur a beat after the last
          [...CARDS[i].text].forEach((ch, k) => {
            const span = document.createElement("span");
            span.className = "film-letter";
            span.style.setProperty("--i", String(k));
            span.textContent = ch === " " ? " " : ch;
            el.appendChild(span);
          });
        }
      }
      if (i < 0) return;
      // the whole line dissolves on its way out
      const out = clamp01((CARDS[i].to - t) / 450);
      el.style.opacity = String(out);
      el.style.filter = `blur(${(1 - out) * 8}px)`;
      el.style.letterSpacing = `${(1 - out) * 0.12}em`;
    };

    const draw = (now: number) => {
      if (cancelled) return;
      // floor on both: the first rAF can precede `start`
      const t = reduced ? T.arrive : Math.max(0, now - start);
      const dt = Math.min(48, Math.max(0, now - last));
      last = now;
      // book the next frame first: a drawing error then costs one frame, not the film
      if (t < FILM_MS + FADE_MS) raf = requestAnimationFrame(draw);
      pump(t < T.bang ? 11 : 6);
      const speed = cruise(t) * dt;
      travelled += speed;

      // ── cards, credits ──
      setCard(t);
      if (creditRef.current) {
        const c = clamp01((t - T.approach - 250) / 600) * (1 - clamp01((t - FILM_MS + 380) / 320));
        creditRef.current.style.opacity = String(c);
        creditRef.current.style.transform = `scale(${0.96 + c * 0.04})`;
        creditRef.current.style.letterSpacing = `${0.6 - c * 0.6}em`;
      }

      // ── camera ──
      roll = t > T.voyage ? Math.sin((t - T.voyage) * 0.0006) * 0.12 : 0;
      // the path drifts in a slow curve rather than running on rails, so the
      // near rocks and planets slide across the far ones (parallax), and it
      // eases back to centre as the destination comes in
      {
        const tv = Math.max(0, t - T.bang);
        const settle = 1 - clamp01((t - T.approach + 600) / 1500);
        camX = (Math.sin(tv * 0.00042) * 0.12 + Math.sin(tv * 0.0011) * 0.02) * spread * settle;
        camY = Math.sin(tv * 0.0003 + 1.2) * 0.045 * spread * settle;
      }
      const shake = t > T.bang ? 22 * Math.exp(-(t - T.bang) / 320) : t > T.ignite ? ((t - T.ignite) / (T.bang - T.ignite)) * 4 : 0;
      shakeX = (Math.random() - 0.5) * shake;
      shakeY = (Math.random() - 0.5) * shake;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#020309";
      ctx.fillRect(0, 0, w, h);

      // ── scene one: the point in the dark ──
      if (t < T.bang + 200) {
        const breathe = 0.6 + Math.sin(t * 0.006) * 0.4;
        const charge = clamp01((t - T.ignite) / (T.bang - T.ignite));
        const rr = 2 + breathe * 2.5 + charge * 60;
        const g = ctx.createRadialGradient(cx + shakeX, cy + shakeY, 0, cx + shakeX, cy + shakeY, rr * 6);
        g.addColorStop(0, rgba(WHITE, 0.9));
        g.addColorStop(0.2, rgba(ICE, 0.35 + charge * 0.5));
        g.addColorStop(1, rgba(CYAN, 0));
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      }

      // ── the voyage ──
      if (t > T.bang) {
        const born = clamp01((t - T.bang) / 1400);

        // nebula, far behind everything
        ctx.globalCompositeOperation = "screen";
        for (const c of clouds) {
          const img = tex.nebula[c.tex % Math.max(1, tex.nebula.length)];
          if (!img) continue;
          const z = c.z - travelled;
          if (z < 40) continue;
          const p = project(c.x, c.y, z);
          const rr = c.r * p.k;
          ctx.globalAlpha = c.alpha * born * clamp01((c.z + 500 - z) / 900) * Math.min(1, z / 260);
          ctx.drawImage(img, p.x - rr, p.y - rr, rr * 2, rr * 2);
        }
        // a spiral galaxy far off: it turns on its own axis, drifts slowly out
        // toward the edge of frame as the camera travels past, and grows a
        // little as it nears, the way very distant things do
        if (tex.galaxy) {
          const v = clamp01((t - T.bang) / (FILM_MS - T.bang));
          const gs = Math.min(w, h) * (0.3 + v * 0.14);
          ctx.save();
          ctx.translate(cx - w * (0.2 + v * 0.16) + shakeX, cy - h * (0.14 + v * 0.12) + shakeY);
          ctx.rotate(roll - 0.35);
          ctx.scale(1, 0.42);
          ctx.rotate((t - T.bang) * 0.00018);
          ctx.globalAlpha = 0.75 * born * (1 - clamp01((t - T.approach) / 900));
          ctx.drawImage(tex.galaxy, -gs / 2, -gs / 2, gs, gs);
          ctx.restore();
        }
        ctx.globalAlpha = 1;

        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        for (const s of stars) {
          const pz = s.z;
          s.z -= speed;
          if (s.z < 1) {
            s.x = rnd(-spread, spread);
            s.y = rnd(-spread, spread);
            s.z = DEPTH;
            continue;
          }
          const p = project(s.x, s.y, s.z);
          if (p.x < -60 || p.x > w + 60 || p.y < -60 || p.y > h + 60) continue;
          const q = project(s.x, s.y, pz);
          const fade = Math.min(1, (DEPTH - s.z) / (DEPTH * 0.45)) * born;
          const len = Math.hypot(p.x - q.x, p.y - q.y);
          if (len < 1.3) {
            const size = Math.min(2.2, p.k * 1.2);
            ctx.fillStyle = rgba(s.c, fade * 0.85);
            ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
          } else {
            ctx.strokeStyle = rgba(s.c, fade * 0.8);
            ctx.lineWidth = Math.min(2.4, p.k * 1.3);
            ctx.beginPath();
            ctx.moveTo(q.x, q.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = "source-over";

        // a comet crossing high on the frame, its tail streaming away from the light
        if (t > 6400 && t < 8800) {
          const k = (t - 6400) / 2400;
          const hx = w * (1.08 - k * 1.25);
          const hy = h * (0.1 + k * 0.28);
          const tx = hx + w * 0.32;
          const ty = hy - h * 0.12;
          ctx.globalCompositeOperation = "lighter";
          const tail = ctx.createLinearGradient(hx, hy, tx, ty);
          tail.addColorStop(0, "rgba(220,250,255,0.75)");
          tail.addColorStop(0.3, "rgba(120,220,255,0.28)");
          tail.addColorStop(1, "rgba(120,220,255,0)");
          ctx.strokeStyle = tail;
          ctx.lineCap = "round";
          for (const [width, a] of [
            [14, 0.25],
            [6, 0.5],
            [2, 1],
          ] as const) {
            ctx.globalAlpha = a * Math.sin(k * Math.PI);
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.quadraticCurveTo(hx + w * 0.16, hy - h * 0.02, tx, ty);
            ctx.stroke();
          }
          ctx.globalAlpha = Math.sin(k * Math.PI);
          const head = ctx.createRadialGradient(hx, hy, 0, hx, hy, 16);
          head.addColorStop(0, "rgba(255,255,255,1)");
          head.addColorStop(1, "rgba(160,235,255,0)");
          ctx.fillStyle = head;
          ctx.fillRect(hx - 16, hy - 16, 32, 32);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
        }

        // worlds, far to near
        for (const wd of [...worlds].sort((a, b) => b.z - a.z)) {
          const z = wd.z - travelled;
          if (z < 25) continue;
          const p = project(wd.x, wd.y, z);
          const appear = clamp01((wd.z + 300 - z) / 900) * Math.min(1, z / 60);
          drawWorld(wd, p.x, p.y, wd.r * p.k, appear * born);
        }

        // the asteroid field
        for (const rk of rocks) {
          const sprite = tex.rocks[rk.sprite % Math.max(1, tex.rocks.length)];
          if (!sprite) break;
          const z = rk.z - travelled;
          if (z < 8 || z > 1900) continue;
          rk.rot += rk.spin * dt;
          const p = project(rk.x, rk.y, z);
          const rr = rk.r * p.k;
          if (rr < 0.8 || p.x < -rr * 2 || p.x > w + rr * 2 || p.y < -rr * 2 || p.y > h + rr * 2) continue;
          ctx.globalAlpha = clamp01((1900 - z) / 600) * Math.min(1, z / 40);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(rk.rot);
          ctx.drawImage(sprite, -rr, -rr, rr * 2, rr * 2);
          ctx.restore();
        }
        ctx.globalAlpha = 1;

        // the binary pair, flaring the lens as they pass
        {
          const z = binary.z - travelled;
          if (z > 30 && z < 2400) {
            const p = project(binary.x, binary.y, z);
            const power = clamp01((2400 - z) / 1400) * Math.min(1, z / 300);
            flare(p.x, p.y, power * 0.7, AMBER);
            const sep = 70 * p.k;
            flare(p.x + sep, p.y + sep * 0.3, power * 0.45, ROSE);
          }
        }

        // the destination, swelling ahead
        {
          const z = Math.max(60, destination.z - travelled);
          const p = project(destination.x, destination.y, z);
          const power = clamp01((t - T.approach + 400) / 1200);
          if (power > 0) {
            const core = Math.min(h * 0.9, 18 + 900 * p.k);
            ctx.globalCompositeOperation = "lighter";
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, core);
            g.addColorStop(0, rgba(WHITE, 0.95 * power));
            g.addColorStop(0.25, rgba(CYAN, 0.6 * power));
            g.addColorStop(1, rgba(CYAN, 0));
            ctx.fillStyle = g;
            ctx.fillRect(p.x - core, p.y - core, core * 2, core * 2);
            ctx.globalCompositeOperation = "source-over";
            flare(p.x, p.y, power, CYAN);
          }
        }
      }

      // ── the bang: sparks, rings, the white-out ──
      if (t > T.bang && t < T.voyage + 1600) {
        const age = t - T.bang;
        const life = 1 - clamp01((age - 900) / 1700);
        const reach = Math.max(w, h) * 1.4;
        const grow = 1 - Math.exp(-age / 420);
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        for (const s of sparks) {
          const r = grow * reach * s.s;
          const z = Math.max(80, 700 + s.dz * r * 0.9);
          const k = 700 / z;
          const x = cx + s.dx * r * k + shakeX;
          const y = cy + s.dy * r * k * 0.82 + shakeY;
          const heat = clamp01(age / 700);
          const c = mix(WHITE, s.c, heat);
          ctx.strokeStyle = rgba(c, life * (0.35 + (1 - s.s) * 0.5));
          ctx.lineWidth = Math.min(2.8, 0.6 + k * 0.9);
          ctx.beginPath();
          ctx.moveTo(s.px, s.py);
          ctx.lineTo(x, y);
          ctx.stroke();
          s.px = x;
          s.py = y;
        }
        // shockwaves: soft glowing fronts, each split into colour like light
        // through a lens (cyan inside, rose outside), squashed a touch so
        // the blast reads as a disc seen at an angle
        ctx.save();
        ctx.translate(cx + shakeX, cy + shakeY);
        ctx.scale(1, 0.86);
        for (const [delay, speedPx, band] of [
          [0, 1.9, 34],
          [140, 1.35, 26],
          [320, 0.95, 20],
        ] as const) {
          const a2 = age - delay;
          if (a2 < 0) continue;
          const rr = a2 * speedPx;
          const fade = Math.max(0, 1 - a2 / 1300) ** 1.4;
          if (fade <= 0) continue;
          const wide = band * (0.6 + a2 / 900);
          for (const [off, col, strength] of [
            [-wide * 0.35, CYAN, 0.22],
            [0, WHITE, 0.27],
            [wide * 0.35, ROSE, 0.2],
          ] as const) {
            const mid = rr + off;
            const inner = Math.max(0, mid - wide);
            const g = ctx.createRadialGradient(0, 0, inner, 0, 0, mid + wide);
            g.addColorStop(0, rgba(col, 0));
            g.addColorStop(clamp01((mid - inner) / (mid + wide - inner)), rgba(col, strength * fade));
            g.addColorStop(1, rgba(col, 0));
            ctx.fillStyle = g;
            ctx.fillRect(-(mid + wide), -(mid + wide), (mid + wide) * 2, (mid + wide) * 2);
          }
        }
        ctx.restore();
        ctx.globalCompositeOperation = "source-over";
        // the white-out
        const flash = Math.max(0, 1 - age / 520);
        if (flash > 0) {
          ctx.fillStyle = `rgba(255,255,255,${flash * 0.92})`;
          ctx.fillRect(0, 0, w, h);
        }
      }

      // a vignette, for the lens
      const vg = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.35, cx, cy, Math.max(w, h) * 0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      // film grain, shifted every frame so it crawls like stock
      if (grain) {
        ctx.save();
        ctx.globalCompositeOperation = "overlay";
        ctx.globalAlpha = 0.07;
        ctx.translate(Math.random() * 192, Math.random() * 192);
        ctx.fillStyle = grain;
        ctx.fillRect(-192, -192, w + 192, h + 192);
        ctx.restore();
      }

      // ── the hand-over: light fills the frame as the film ends ──
      const out = clamp01((t - FILM_MS + 450) / 450);
      if (out > 0) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.8);
        g.addColorStop(0, `rgba(255,255,255,${out})`);
        g.addColorStop(0.5, `rgba(165,243,252,${out * 0.85})`);
        g.addColorStop(1, `rgba(34,211,238,${out * 0.4})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [rolling]);

  if (phase === "gone") return null;
  /* Before the effect has decided anything, the server-rendered page shows a
     plain cover, so a first visit never flashes the bare page and navbar before
     the film starts. A returning visitor never sees it: the boot-flag script in
     the root layout marks <html> data-booted before first paint, and CSS hides
     the cover (see globals.css). */
  if (phase === "idle") return <div aria-hidden data-boot-cover className="fixed inset-0 z-[250] bg-[#020309]" />;

  return (
    <div
      role="presentation"
      className={`fixed inset-0 z-[250] overflow-hidden bg-[#020309] transition-opacity ease-out ${
        phase === "exit" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />

      {/* title cards, written in letter by letter */}
      <p
        ref={cardRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[17vh] px-6 text-center font-sans text-[clamp(1.5rem,3.3vw,2.6rem)] font-light tracking-[-0.02em] text-white/95 drop-shadow-[0_2px_24px_rgba(0,0,0,0.95)]"
      />

      {/* the end card, in the lower third like a film's, clear of the star */}
      <div
        ref={creditRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-[24vh] text-center opacity-0"
      >
        <p className="font-sans text-[clamp(2.6rem,7vw,5.5rem)] font-semibold tracking-[-0.04em] text-white drop-shadow-[0_0_30px_rgba(34,211,238,0.6)]">
          Asad Shah
        </p>
        <p className="mt-3 font-sans text-[11px] uppercase tracking-[0.5em] text-white/80">Full-stack developer</p>
      </div>
    </div>
  );
}
