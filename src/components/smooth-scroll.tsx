"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      anchors: { offset: -64 },
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // panels, the mobile menu and the intro freeze the page (see use-scroll-lock)
    const onLock = (e: Event) => ((e as CustomEvent<boolean>).detail ? lenis.stop() : lenis.start());
    window.addEventListener("scroll-lock", onLock);
    // anything on the page can ask for a glide to an element (the guide does)
    const onScrollTo = (e: Event) => {
      const target = document.querySelector((e as CustomEvent<string>).detail);
      if (target instanceof HTMLElement) lenis.scrollTo(target, { offset: -72, duration: 1.6 });
    };
    window.addEventListener("scroll-to", onScrollTo);

    return () => {
      window.removeEventListener("scroll-lock", onLock);
      window.removeEventListener("scroll-to", onScrollTo);
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
