"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ScrambleText } from "./scramble-text";
import { featuredStack } from "@/lib/data";

/* The WebGL scene is client-only and lazily chunked: three and drei
   must never land in the first-paint bundle, and none of it
   means anything during SSR. */
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

export function Hero() {
  // The name only starts decrypting once BOTH curtains are gone: the
  // first-visit preloader and the route-transition veil.
  const [bootDone, setBootDone] = useState(false);
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
    const onBoot = () => setBootDone(true);
    const onRevealed = () => setRevealed(true);

    if (sessionStorage.getItem("booted") === "1") setBootDone(true);
    else window.addEventListener("boot-complete", onBoot);
    window.addEventListener("route-revealed", onRevealed);

    // never let a missed event leave the hero invisible
    const failsafe = setTimeout(() => {
      setBootDone(true);
      setRevealed(true);
    }, 6000);

    return () => {
      window.removeEventListener("boot-complete", onBoot);
      window.removeEventListener("route-revealed", onRevealed);
      clearTimeout(failsafe);
    };
  }, []);

  const rise = ready ? "translate-y-0 opacity-100" : "translate-y-14 opacity-0";
  const fade = ready ? "opacity-100" : "opacity-0";
  const at = (ms: number) => ({ transitionDelay: `${ms}ms` });

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col justify-start overflow-hidden px-6 pt-28 md:justify-center md:pt-16"
    >
      {/* The system owns the right half on desktop and the lower band on
          mobile — never the same pixels as the type. Giving them separate
          territory is what fixes the collision; moving the scene out of the
          hero entirely just cost it the tall canvas it needs to look good.

          No edge mask: with the bloom pass gone the canvas is genuinely
          transparent, so there is no rectangle to hide and the page's own
          starfield and nebula read straight through it. */}
      <div
        className={`absolute inset-x-0 bottom-0 h-[46%] transition-opacity duration-1000 md:inset-y-0 md:bottom-auto md:left-auto md:right-0 md:h-full md:w-[56%] ${fade}`}
      >
        <SolarSystem paused={!inView} />
      </div>

      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-20 z-10 mx-auto flex max-w-6xl justify-between px-6 font-mono text-[10px] uppercase tracking-widest text-muted/70 transition-opacity duration-700 ${fade}`}
        style={at(900)}
      >
        <span className="term-green">◆ sys.orbital — nominal</span>
        <span className="hidden sm:inline">{featuredStack.length} systems online</span>
      </div>

      <div className="pointer-events-none relative z-10 mx-auto w-full max-w-6xl">
        <div className="md:max-w-[48%]">
          <p
            className={`${BASE} ${fade} mb-6 font-mono text-xs text-muted sm:text-sm`}
            style={at(0)}
          >
            <span className="term-green">$</span> whoami
          </p>

          <h1 className="select-none font-sans font-bold leading-[0.9] tracking-tighter">
            <span
              className={`${BASE} ${rise} block text-[clamp(3.5rem,9vw,7.5rem)] text-glow`}
              style={at(150)}
            >
              <ScrambleText text="ASAD" trigger="manual" active={ready} duration={1100} />
            </span>
            <span
              className={`${BASE} ${rise} mt-1 block text-[clamp(1.5rem,3.6vw,2.9rem)] text-muted`}
              style={at(320)}
            >
              <ScrambleText text="FULL-STACK" trigger="manual" active={ready} duration={1300} />
              <span className="text-accent">*</span>{" "}
              <ScrambleText text="DEVELOPER" trigger="manual" active={ready} duration={1300} />
            </span>
          </h1>

          <p
            className={`${BASE} ${rise} mt-8 text-base leading-relaxed text-muted sm:text-lg`}
            style={at(520)}
          >
            I design and ship complete products — web platforms, desktop apps,
            cloud infrastructure, and AI systems that actually make it to
            production.
          </p>

          <div
            className={`${BASE} ${fade} mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 font-mono text-xs text-muted`}
            style={at(760)}
          >
            <span className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              available for work
            </span>
            <span className="hidden sm:inline">drag to orbit</span>
          </div>
        </div>
      </div>

      <a
        href="/#work"
        aria-label="Scroll to work"
        className={`${BASE} ${fade} absolute bottom-14 left-1/2 z-10 -translate-x-1/2 text-muted hover:text-accent`}
        style={at(1100)}
      >
        <svg
          className="animate-bounce"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 4v16m0 0l-6-6m6 6l6-6" />
        </svg>
      </a>
    </section>
  );
}
