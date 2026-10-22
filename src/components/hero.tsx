"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { ScrambleText } from "./scramble-text";
import { Magnetic } from "./magnetic";
import Image from "next/image";
import { profile, projects } from "@/lib/data";
import { ArrowRight } from "lucide-react";

/* The WebGL scene is client-only and lazily chunked: three and drei must never
   land in the first-paint bundle, and none of it means anything during SSR. */
const SolarSystem = dynamic(() => import("./space/solar-system"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center">
      <p className="font-sans text-xs text-muted">
        initializing orbital view
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
      // longer than the whole intro film: firing inside it launched the planets
      // behind the film, where nobody could see them
    }, 15000);

    return () => {
      window.removeEventListener("route-revealed", onRevealed);
      clearTimeout(failsafe);
    };
  }, []);

  const rise = ready ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0";
  const fade = ready ? "opacity-100" : "opacity-0";
  /* The name moves in but never fades up from nothing. It is the largest
     thing on the first screen, and browsers only count a page as painted once
     that is visible — held at opacity 0 behind the intro it read as a
     five-second paint on a phone. The intro curtain and the decrypt already
     hide it and bring it on; the slide is all the entrance it needs. */
  const lift = ready ? "translate-y-0" : "translate-y-10";
  const at = (ms: number) => ({ transitionDelay: `${ms}ms` });

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[92svh] items-center overflow-hidden md:min-h-[84vh]"
    >
      {/* The system owns the right half on desktop and the lower band on
          mobile — never the same pixels as the type.

          Inset from the right edge rather than flush to it. Flush put a hard
          viewport edge on one side of the system and a gap to the type on the
          other, which read as lopsided margins.

          Capped at 907px. As a bare percentage the system kept growing with
          the window, so the layout inside it was only ever right at one width
          — every crowding decision has to be made against a fixed box, and
          this is that box.

          No edge mask and no post-processing pass, so the canvas is genuinely
          transparent and the page's own starfield and nebula read straight
          through it. */}
      <div
        className={`absolute inset-x-0 bottom-0 h-[44%] transition-opacity duration-1000 md:inset-y-0 md:bottom-auto md:left-auto md:right-[2.5%] md:h-full md:w-[52%] md:max-w-[907px] ${fade}`}
      >
        <SolarSystem paused={!inView} launched={ready} />
        {/* Arrival: the star ignites and two shockwaves sweep out across the
            screen as the system is flung into its orbits (see solar-system). */}
        {ready && (
          <span aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden">
            <span className="ignite" />
            <span className="shockwave" />
            <span className="shockwave shockwave-late" />
          </span>
        )}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-shell px-6 pb-40 pt-28 md:pb-16 md:pt-32">
        <div className="md:max-w-[50%]">
          <p
            className={`${BASE} ${fade} inline-flex items-center gap-2.5 rounded-full border border-line bg-bg/40 py-1 pl-1 pr-4 font-sans text-[12px] tracking-wide text-muted backdrop-blur-sm`}
            style={at(0)}
          >
            {profile.photo && (
              <Image
                src={profile.photo}
                alt=""
                width={32}
                height={32}
                loading="eager"
                className="size-8 rounded-full border border-accent/40 object-cover object-top"
              />
            )}
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            <span className="whitespace-nowrap">Available for work</span>
            <span aria-hidden className="hidden h-3 w-px bg-line sm:block" />
            <span className="hidden whitespace-nowrap sm:inline">Lahore, remote-first</span>
          </p>

          <h1 className="mt-10 select-none font-sans font-semibold leading-[0.95] tracking-[-0.05em]">
            <span
              className={`${BASE} ${lift} block text-[clamp(3.5rem,8.1vw,6.9rem)] text-glow`}
              style={at(150)}
            >
              <ScrambleText text="Asad Shah" trigger="manual" active={ready} duration={1100} />
            </span>
            <span
              className={`${BASE} ${rise} mt-10 block text-[clamp(1.55rem,3.2vw,2.55rem)] font-medium leading-[1.15] tracking-[-0.03em] text-fg/85`}
              style={at(320)}
            >
              Full-stack developer shipping{" "}
              <span className="whitespace-nowrap text-accent">
                AI products
              </span>{" "}
              end to end.
            </span>
          </h1>

          <div
            className={`${BASE} ${rise} mt-14 flex flex-wrap items-center gap-3`}
            style={at(640)}
          >
            <Magnetic>
              <Link
                href="/#work"
                className="group inline-flex items-center gap-2.5 whitespace-nowrap rounded-full bg-fg px-5 py-3.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 sm:px-7 sm:py-4 sm:text-[15px]"
              >
                View selected work
                <ArrowRight aria-hidden className="size-4 transition-transform duration-300" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/#contact"
                className="inline-flex items-center whitespace-nowrap rounded-full border border-line bg-bg/40 px-5 py-3.5 text-sm font-medium text-fg/90 backdrop-blur-sm transition-colors hover:border-accent hover:text-accent sm:px-7 sm:py-4 sm:text-[15px]"
              >
                Get in touch
              </Link>
            </Magnetic>
          </div>

          <dl
            className={`${BASE} ${fade} mt-16 hidden flex-wrap gap-x-10 gap-y-4 sm:flex`}
            style={at(800)}
          >
            {[
              [String(projects.length), "products shipped"],
              ["5", "live AI platforms"],
              ["3+", "years in production"],
            ].map(([v, k]) => (
              <div key={k}>
                <dt className="sr-only">{k}</dt>
                <dd className="font-sans text-[1.75rem] font-semibold tracking-tight text-fg">{v}</dd>
                <dd className="mt-0.5 font-sans text-[12.5px] text-muted">{k}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

    </section>
  );
}
