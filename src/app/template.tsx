"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { projects } from "@/lib/data";

/* ── route change: approach ─────────────────────────────────────────────────
   You fall through a field of dust toward a star that grows as you close on
   it, and arrive in a flash of light.

   The previous attempt was a neat SVG diagram of a transfer orbit, and that
   was the problem: it described a journey instead of being one. This is built
   from the same parts as the first-visit loader — a real particle field, a
   growing core, one flash — so both curtains read as the same universe, and
   both are events rather than illustrations.

   The depth is genuine rather than faked with lengths: every mote holds an
   x, y and z, and is projected through x/z. That is what makes the ones close
   to you tear past the edges of the screen while the far ones barely move,
   and it is why the field opens up as you accelerate.

   Everything the page depends on is CSS-transition driven, not animated in
   JS. A throttled tab starves requestAnimationFrame, and neither the veil nor
   the content behind it may be stranded at opacity 0 because of that. The
   field is decoration: if that loop never runs, the curtain still lifts on
   its timer. */

const HOLD_MS = 1350;
const FADE_MS = 500;
const TOTAL_MS = HOLD_MS + FADE_MS;

const MOTES = 620;
const DEPTH = 1500;
const FOV = 340;

type Mote = { x: number; y: number; z: number; hot: boolean };

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function destination(pathname: string) {
  if (pathname.startsWith("/work/")) {
    const slug = pathname.split("/")[2];
    const project = projects.find((p) => p.slug === slug);
    return { name: project?.title ?? slug, sub: project?.platform ?? "case study" };
  }
  return { name: "asad", sub: "home" };
}

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  /* Keyed on the whole path, not left to the template's own remount. A root
     template is keyed by its FIRST segment, so /work/a -> /work/b keeps the
     same instance and the veil would never replay between two case studies —
     the exact navigation this site does most. The key gives the subtree fresh
     state on every path change, which is what the effect used to do by
     resetting two booleans on the way in. */
  return (
    <RouteVeil key={pathname} pathname={pathname}>
      {children}
    </RouteVeil>
  );
}

function RouteVeil({
  pathname,
  children,
}: {
  pathname: string;
  children: React.ReactNode;
}) {
  const [lifting, setLifting] = useState(false);
  const [gone, setGone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { name, sub } = destination(pathname);

  useEffect(() => {
    const lift = setTimeout(() => {
      setLifting(true);
      // the hero holds its entrance until the veil is actually out of the way,
      // otherwise the name animates behind it and lands already finished
      window.dispatchEvent(new CustomEvent("route-revealed"));
    }, HOLD_MS);
    const clear = setTimeout(() => setGone(true), TOTAL_MS);

    let raf = 0;
    let cancelled = false;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
      const spread = Math.max(w, h);

      const field: Mote[] = Array.from({ length: MOTES }, () => ({
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
           taken after that frame already began — so `now - start` is briefly
           negative on the first frame. Unclamped that gives a negative t, and
           Math.pow(negative, 2.4) is NaN, which createRadialGradient rejects
           outright. A negative dt would also drive the field backwards. */
        const elapsed = now - start;
        const dt = Math.min(48, Math.max(0, now - last));
        last = now;
        const t = Math.max(0, Math.min(1, elapsed / HOLD_MS));

        // hard away from the gate, easing off as the destination fills the view
        const speed = (0.35 + Math.sin(t * Math.PI) * 2.4) * dt;

        ctx.clearRect(0, 0, w, h);

        // the destination, growing as it is approached
        const coreR = 4 + Math.pow(t, 2.4) * 190;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3.2);
        glow.addColorStop(0, `rgba(255,255,255,${0.5 + t * 0.5})`);
        glow.addColorStop(0.18, `rgba(${accent.join(",")},${0.45 + t * 0.4})`);
        glow.addColorStop(0.5, `rgba(${violet.join(",")},${0.14 + t * 0.12})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineCap = "round";
        for (const m of field) {
          const prevZ = m.z;
          m.z -= speed;
          // recycle behind the camera, back out to the far plane
          if (m.z < 1) {
            m.x = (Math.random() - 0.5) * spread * 2;
            m.y = (Math.random() - 0.5) * spread * 2;
            m.z = DEPTH;
            continue;
          }

          // perspective: divide by depth. near motes sweep, far ones crawl.
          const k = FOV / m.z;
          const pk = FOV / prevZ;
          const x = cx + m.x * k;
          const y = cy + m.y * k;
          const px = cx + m.x * pk;
          const py = cy + m.y * pk;

          // fade in from the far plane, so nothing pops into existence
          const depthFade = Math.min(1, (DEPTH - m.z) / (DEPTH * 0.55));
          const [r, g, b] = m.hot ? accent : violet;
          ctx.strokeStyle = `rgba(${r},${g},${b},${depthFade * (0.35 + t * 0.5)})`;
          ctx.lineWidth = Math.min(2.4, k * 1.6);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        if (elapsed < TOTAL_MS) raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(lift);
      clearTimeout(clear);
    };
  }, [pathname]);

  return (
    <>
      {/* The veil masks the page while it settles, so this only ever offsets
          the content — never fades it out. Content stays visible even if the
          transition never runs. */}
      <div
        className={`transition-transform duration-500 ease-out ${
          lifting ? "translate-y-0" : "translate-y-4"
        }`}
      >
        {children}
      </div>

      {!gone && (
        <div
          aria-hidden
          className={`pointer-events-none fixed inset-0 z-[120] bg-bg transition-opacity ease-out ${
            lifting ? "opacity-0" : "opacity-100"
          }`}
          style={{ transitionDuration: `${FADE_MS}ms` }}
        >
          <canvas ref={canvasRef} className="absolute inset-0 size-full" />

          {/* the name resolves out of the light as you close on it */}
          <div className="arrive absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            <p className="font-sans text-2xl font-bold tracking-tight text-fg drop-shadow-[0_0_18px_var(--ring)] sm:text-3xl">
              {name}
            </p>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-fg/60">
              {sub}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
