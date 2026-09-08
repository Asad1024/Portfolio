"use client";

import { useEffect, useState } from "react";
import { DotField } from "./dot-field";
import { ScrambleText } from "./scramble-text";

/* Entrance is CSS-transition driven rather than animated in JS: a throttled
   tab starves requestAnimationFrame, which would leave the hero stranded at
   opacity 0 — the worst possible failure for the first thing anyone sees. */
const BASE = "transition-[opacity,transform] duration-700 ease-out";

export function Hero() {
  // The name only starts decrypting once BOTH curtains are gone: the
  // first-visit preloader and the route-transition veil.
  const [bootDone, setBootDone] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const ready = bootDone && revealed;

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
    <section className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 pt-16">
      <DotField />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: "var(--glow)" }}
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <p
          className={`${BASE} ${fade} mb-6 font-mono text-xs text-muted sm:text-sm`}
          style={at(0)}
        >
          <span className="text-accent">$</span> whoami
        </p>

        <h1 className="select-none font-sans font-bold leading-[0.9] tracking-tighter">
          <span
            className={`${BASE} ${rise} block text-[clamp(4rem,14vw,11rem)]`}
            style={at(150)}
          >
            <ScrambleText text="ASAD" trigger="manual" active={ready} duration={1100} />
          </span>
          <span
            className={`${BASE} ${rise} block text-[clamp(2rem,7vw,5.5rem)] text-muted`}
            style={at(320)}
          >
            <ScrambleText text="FULL-STACK" trigger="manual" active={ready} duration={1300} />
            <span className="text-accent">*</span>{" "}
            <ScrambleText text="DEVELOPER" trigger="manual" active={ready} duration={1300} />
          </span>
        </h1>

        <p
          className={`${BASE} ${rise} mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg`}
          style={at(520)}
        >
          I design and ship complete products — web platforms, desktop apps,
          cloud infrastructure, and AI systems that actually make it to
          production.
        </p>

        <div
          className={`${BASE} ${fade} mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-xs text-muted`}
          style={at(760)}
        >
          <span className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            available for work
          </span>
          <span>web · mobile · desktop · cloud · ai</span>
        </div>
      </div>

      <a
        href="/#work"
        aria-label="Scroll to work"
        className={`${BASE} ${fade} absolute bottom-16 left-1/2 -translate-x-1/2 text-muted hover:text-accent`}
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
