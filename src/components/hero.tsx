"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { ScrambleText } from "./scramble-text";

/* The WebGL scene is client-only and lazily chunked: three and drei must never
   land in the first-paint bundle, and none of it means anything during SSR. */
const SolarSystem = dynamic(() => import("./space/solar-system"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center">
      <p className="font-mono text-xs text-muted">
        <span className="term-green">$</span> initializing orbital view
        <span className="caret-blink term-green">_</span>
      </p>
    </div>
  ),
});

/* Entrance is CSS-transition driven rather than animated in JS: a throttled
   tab starves requestAnimationFrame, which would leave the hero stranded at
   opacity 0 — the worst possible failure for the first thing anyone sees. */
const BASE = "transition-[opacity,transform] duration-700 ease-out";

/* Whether the first-visit loader has finished is not really component state —
   it is a fact about the session that the preloader writes down and then
   announces. Reading it through a store keeps one source of truth (the flag,
   not a copy of it), lets the server and the first paint agree on "not yet"
   without a hydration mismatch, and means a visitor who has already booted
   this session does not spend a render pretending otherwise. The preloader
   sets the key before it dispatches, so the snapshot taken on the event is
   always the settled one. */
function subscribeToBoot(onChange: () => void) {
  window.addEventListener("boot-complete", onChange);
  return () => window.removeEventListener("boot-complete", onChange);
}

const hasBooted = () => sessionStorage.getItem("booted") === "1";

export function Hero() {
  // The name only starts decrypting once BOTH curtains are gone: the
  // first-visit preloader and the route-transition veil.
  const bootDone = useSyncExternalStore(subscribeToBoot, hasBooted, () => false);
  const [revealed, setRevealed] = useState(false);
  const [inView, setInView] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const ready = bootDone && revealed;

  // Let the WebGL scene idle once it's off screen — see frameloop in
  // space/solar-system.tsx for why this matters.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "150px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onRevealed = () => setRevealed(true);
    window.addEventListener("route-revealed", onRevealed);

    /* Never let a missed event leave the hero invisible. It writes the flag
       and announces it rather than flipping a local copy, so the failsafe and
       the loader leave the session in exactly the same state. */
    const failsafe = setTimeout(() => {
      sessionStorage.setItem("booted", "1");
      window.dispatchEvent(new CustomEvent("boot-complete"));
      setRevealed(true);
    }, 6000);

    return () => {
      window.removeEventListener("route-revealed", onRevealed);
      clearTimeout(failsafe);
    };
  }, []);

  const rise = ready ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0";
  const fade = ready ? "opacity-100" : "opacity-0";
  const at = (ms: number) => ({ transitionDelay: `${ms}ms` });

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden"
    >
      {/* The system owns the right half on desktop and the lower band on
          mobile — never the same pixels as the type.

          Inset from the right edge rather than flush to it. Flush put a hard
          viewport edge on one side of the system and a gap to the type on the
          other, which read as lopsided margins.

          No edge mask and no post-processing pass, so the canvas is genuinely
          transparent and the page's own starfield and nebula read straight
          through it. */}
      <div
        className={`absolute inset-x-0 bottom-0 h-[44%] transition-opacity duration-1000 md:inset-y-0 md:bottom-auto md:left-auto md:right-[2.5%] md:h-full md:w-[52%] ${fade}`}
      >
        <SolarSystem paused={!inView} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-shell px-6 pb-40 pt-28 md:py-24">
        <div className="md:max-w-[46%]">
          <p
            className={`${BASE} ${fade} font-mono text-xs tracking-wide text-muted`}
            style={at(0)}
          >
            <span className="term-green">$</span> whoami
          </p>

          <h1 className="mt-10 select-none font-sans font-bold leading-[0.92] tracking-tighter">
            <span
              className={`${BASE} ${rise} block text-[clamp(3.5rem,8.5vw,7rem)] text-glow`}
              style={at(150)}
            >
              <ScrambleText text="ASAD" trigger="manual" active={ready} duration={1100} />
            </span>
            <span
              className={`${BASE} ${rise} mt-3 block text-[clamp(1.4rem,3.3vw,2.6rem)] text-muted`}
              style={at(320)}
            >
              <ScrambleText text="FULL-STACK" trigger="manual" active={ready} duration={1300} />
              <span className="text-accent">*</span>{" "}
              <ScrambleText text="DEVELOPER" trigger="manual" active={ready} duration={1300} />
            </span>
          </h1>

          <p
            className={`${BASE} ${rise} mt-12 max-w-md text-base leading-[1.75] text-muted sm:text-lg`}
            style={at(520)}
          >
            I design and ship complete products — web platforms, desktop apps,
            cloud infrastructure, and AI systems that actually make it to
            production.
          </p>

          <div
            className={`${BASE} ${fade} mt-14 flex items-center gap-5 font-mono text-xs text-muted`}
            style={at(760)}
          >
            <span className="flex items-center gap-2.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              available for work
            </span>
            <span className="h-px w-8 bg-line" />
            <span className="hidden sm:inline">lahore · remote-first</span>
          </div>
        </div>
      </div>

      <Link
        href="/#work"
        aria-label="Scroll to work"
        className={`${BASE} ${fade} absolute bottom-16 left-1/2 z-10 -translate-x-1/2 text-muted transition-colors hover:text-accent`}
        style={at(1100)}
      >
        <svg
          className="animate-bounce"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 4v16m0 0l-6-6m6 6l6-6" />
        </svg>
      </Link>
    </section>
  );
}
