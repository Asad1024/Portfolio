"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import { projects } from "@/lib/data";
import { routeVeil } from "@/lib/route-veil";

/* ── route change: approach ─────────────────────────────────────────────────
   You fall through a field of dust toward a star that grows as you close on
   it, and arrive in a flash of light.

   Built from the same parts as the first-visit loader — a particle field, a
   growing core, one flash — so both curtains read as the same universe, and
   both are events rather than illustrations.

   It lives in the layout, not in the page template, because a page's own
   veil can only appear once that page exists: the browser first had to build
   the next page, so every click began with the old one frozen for a beat and
   then the curtain cutting in over it. Living above the pages, it starts the
   moment a link is pressed (on mouse-down, a few dozen milliseconds before
   the click even lands), fades in over the page being left, and the next
   page is built underneath it. Arrival is announced by app/template.tsx.

   Nothing here is animated from JavaScript. The veil plays exactly while the
   browser is busiest, rendering the page it covers and, on the way home,
   restarting the hero's 3D scene. The field is painted once, a spray of
   streaks thrown out from the centre, and zoomed toward you with a CSS
   transform while the star grows ahead; transforms and opacity run on the
   compositor, which keeps its own clock, so the flight stays smooth however
   long the page takes to build behind it.

   When it lifts is decided by what has happened, not by a stopwatch. It lifts
   once all of these are true:
     - the name has fully arrived and been held for TITLE_HOLD_MS, timed from
       its own animation ending;
     - the new page is in and has finished what shows first: the pictures in
       view are decoded, the fonts are in, and anything that asked to be
       waited for (the hero's 3D scene, via routeVeil.pending) is drawn;
     - at least HOLD_MS has passed since it began, so the flight is seen.
   MAX_HOLD_MS is the backstop: past it the curtain lifts regardless, so a
   throttled tab, a slow network or a press that never became a click cannot
   leave anyone behind it. */

const HOLD_MS = 620;
const FADE_MS = 260;
const TITLE_HOLD_MS = 300;
const MAX_HOLD_MS = 2600;
/* a press that has not become a click by this long after release was not a
   navigation (dragged off the link, or cancelled), and the curtain backs off */
const PRESS_GRACE_MS = 350;
/* the flight's own length (the zoom runs this long whatever the lift does) */
const FLIGHT_MS = HOLD_MS + FADE_MS;
const STREAKS = 420;

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
    return {
      name: project?.title ?? slug,
      sub: project?.platform ?? "case study",
      // a case study calls itself a body dossier; arriving at one should look
      // like arriving at a body, not like a page transition
      body: true,
    };
  }
  return { name: "Asad Shah", sub: "home", body: false };
}

/** decode the pictures already in view, so none of them paints in after */
function picturesInView(root: HTMLElement | null) {
  if (!root) return Promise.resolve();
  const imgs = [...root.querySelectorAll("img")].filter((img) => {
    const r = img.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
  });
  return Promise.allSettled(imgs.map((img) => img.decode())).then(() => undefined);
}

/** the path an event on a same-site page link leads to, if it is a page change */
function pageLink(e: MouseEvent) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = (e.target as Element | null)?.closest?.("a[href]");
  if (!(a instanceof HTMLAnchorElement)) return null;
  if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname === location.pathname) return null;
  // files (the résumé) are not pages
  if (/\.[a-z0-9]+$/i.test(url.pathname)) return null;
  return url.pathname;
}

type Flight = {
  id: number;
  to: string;
  began: number;
  arrived: boolean;
  lifted: boolean;
  clicked: boolean;
  title: Promise<void>;
  titleIn: () => void;
  timers: ReturnType<typeof setTimeout>[];
};

export function RouteVeil() {
  const [shown, setShown] = useState<{ id: number; to: string; lifting: boolean } | null>(null);
  const flight = useRef<Flight | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let seq = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // the path the page on screen belongs to
    let onScreen = location.pathname;

    const lift = (f: Flight) => {
      if (f.lifted || flight.current !== f) return;
      f.lifted = true;
      f.timers.forEach(clearTimeout);
      setShown((s) => (s && s.id === f.id ? { ...s, lifting: true } : s));
      // the hero holds its entrance until the veil is actually out of the way,
      // otherwise the name animates behind it and lands already finished
      window.dispatchEvent(new CustomEvent("route-revealed"));
      setTimeout(() => {
        setShown((s) => (s && s.id === f.id ? null : s));
        if (flight.current === f) flight.current = null;
      }, FADE_MS);
    };

    const begin = (to: string) => {
      const live = flight.current;
      if (live && !live.lifted && live.to === to) return live;
      let titleIn = () => {};
      const title = new Promise<void>((resolve) => {
        if (reduced) resolve();
        else titleIn = () => setTimeout(resolve, TITLE_HOLD_MS);
      });
      const f: Flight = {
        id: ++seq,
        to,
        began: performance.now(),
        arrived: false,
        lifted: false,
        clicked: false,
        title,
        titleIn: () => titleIn(),
        timers: [],
      };
      if (live && !live.lifted) live.timers.forEach(clearTimeout);
      flight.current = f;
      setShown({ id: f.id, to, lifting: false });
      f.timers.push(setTimeout(() => lift(f), MAX_HOLD_MS));
      return f;
    };

    // the new page is in (dispatched by app/template.tsx once its own
    // children have run their effects, so routeVeil.pending is complete)
    const onArrived = () => {
      onScreen = location.pathname;
      const live = flight.current;
      const f = live && !live.lifted ? live : begin(location.pathname);
      if (f.arrived) return;
      f.arrived = true;
      const page = Promise.allSettled([
        ...routeVeil.pending.splice(0),
        picturesInView(document.getElementById("main")),
        document.fonts?.ready,
      ]);
      const minimum = new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, HOLD_MS - (performance.now() - f.began))),
      );
      Promise.all([f.title, page, minimum]).then(() => lift(f));
    };

    /* A mouse press starts the flight; a touch waits for the tap, because a
       finger coming down on a link is as often the start of a scroll. */
    const onPress = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const to = pageLink(e);
      if (to) begin(to);
    };
    const onRelease = () => {
      const f = flight.current;
      if (!f || f.arrived || f.lifted) return;
      f.timers.push(
        setTimeout(() => {
          if (!f.clicked && !f.arrived) lift(f);
        }, PRESS_GRACE_MS),
      );
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      const to = pageLink(e);
      if (!to) return;
      begin(to).clicked = true;
    };
    // back and forward: start before the router begins building the page
    const onPop = () => {
      if (location.pathname !== onScreen) begin(location.pathname).clicked = true;
    };

    window.addEventListener("route-arrived", onArrived);
    document.addEventListener("pointerdown", onPress, true);
    document.addEventListener("pointerup", onRelease, true);
    document.addEventListener("pointercancel", onRelease, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop, true);
    return () => {
      window.removeEventListener("route-arrived", onArrived);
      document.removeEventListener("pointerdown", onPress, true);
      document.removeEventListener("pointerup", onRelease, true);
      document.removeEventListener("pointercancel", onRelease, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop, true);
    };
  }, []);

  // the field, painted once before each flight's first frame; the zoom is CSS
  const id = shown?.id;
  useLayoutEffect(() => {
    if (id === undefined) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
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
    const reach = Math.hypot(w, h) / 2;

    ctx.lineCap = "round";
    for (let i = 0; i < STREAKS; i++) {
      // most of them out toward the edges, where perspective spreads them
      const d = reach * (0.06 + Math.pow(Math.random(), 0.7) * 0.94);
      const a = Math.random() * Math.PI * 2;
      const near = d / reach;
      const len = d * (0.06 + near * 0.16);
      const [r, g, b] = Math.random() < 0.3 ? accent : violet;
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.25 + near * 0.55})`;
      ctx.lineWidth = 0.5 + near * 1.8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
      ctx.lineTo(cx + Math.cos(a) * (d + len), cy + Math.sin(a) * (d + len));
      ctx.stroke();
    }
  }, [id]);

  if (!shown) return null;
  const { name, sub, body } = destination(shown.to);

  return (
    <div
      key={shown.id}
      aria-hidden
      className={`veil-in pointer-events-none fixed inset-0 z-[120] overflow-hidden bg-bg transition-opacity ease-out ${
        shown.lifting ? "opacity-0" : "opacity-100"
      }`}
      style={
        {
          transitionDuration: `${FADE_MS}ms`,
          "--veil-hold": `${HOLD_MS}ms`,
          "--veil-total": `${FLIGHT_MS}ms`,
        } as React.CSSProperties
      }
    >
      <canvas ref={canvasRef} className="veil-field absolute inset-0 size-full" />
      {/* the destination, swelling as it is approached */}
      <span className="veil-core" />

      {/* Approaching a body: the reticle closes on it while the name resolves
          out of the light. The home route gets the name alone — there is
          nothing to lock onto, and a targeting frame around your own front
          door reads as noise rather than arrival. */}
      {body && (
        <div aria-hidden className="lock-on absolute left-1/2 top-1/2 size-56 sm:size-72">
          {[
            "left-0 top-0 border-l-2 border-t-2",
            "right-0 top-0 border-r-2 border-t-2",
            "bottom-0 left-0 border-b-2 border-l-2",
            "bottom-0 right-0 border-b-2 border-r-2",
          ].map((pos) => (
            <span key={pos} className={`absolute size-8 border-accent/70 ${pos}`} />
          ))}
        </div>
      )}

      {/* the name resolves out of the light as you close on it */}
      <div
        className="arrive absolute inset-0 flex flex-col items-center justify-center text-center"
        onAnimationEnd={(e) => {
          if (e.animationName === "arrive" && flight.current?.id === shown.id) flight.current.titleIn();
        }}
      >
        {/* a dark halo under each line as well as the glow: the star swells to
            fill the middle of the screen behind the name, and without one the
            small lines wash out against it */}
        <p className="font-sans text-2xl font-bold tracking-tight text-fg [text-shadow:0_0_18px_var(--ring),0_2px_16px_rgba(2,3,9,0.9)] sm:text-3xl">
          {name}
        </p>
        <p className="mt-1.5 font-sans text-[11px] uppercase tracking-[0.3em] text-fg/75 [text-shadow:0_1px_10px_rgba(2,3,9,0.95),0_0_4px_rgba(2,3,9,0.9)]">
          {sub}
        </p>
        {body && (
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.3em] text-accent [text-shadow:0_1px_10px_rgba(2,3,9,0.95),0_0_4px_rgba(2,3,9,0.9)]">
            <Crosshair aria-hidden className="mr-1.5 inline size-3 align-[-1px]" />
            lock acquired
          </p>
        )}
      </div>
    </div>
  );
}
