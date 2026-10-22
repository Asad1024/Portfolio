"use client";

import { useEffect } from "react";

/* The sky is the hero's backdrop, but further down it sits behind paragraphs,
   and a bright star between two letters is noise. Once the first screen has
   scrolled away the whole sky drops to a quieter level (see `.nebula` in
   globals.css), and comes back up at the top. A flag on <html> rather than
   state, so nothing re-renders on scroll. */
export function SkyDimmer() {
  useEffect(() => {
    const root = document.documentElement;
    const onScroll = () => {
      root.toggleAttribute("data-sky-dim", window.scrollY > window.innerHeight * 0.6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      root.removeAttribute("data-sky-dim");
    };
  }, []);

  return null;
}
