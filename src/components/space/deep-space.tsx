"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

/* The deep-space scene is a second WebGL context, so it keeps out of the
   hero's way entirely: it is not downloaded until the hero has been scrolled
   past, it fades in only while the hero is off screen, and its render loop
   stops the moment the hero comes back — the two 3D scenes never run at the
   same time. Pages without a hero simply show it.

   Phones don't get it: there are no side margins for it to live in, so it
   would only ever sit behind text, and it costs battery for that. Visitors
   who ask for reduced motion don't get it either. Both keep the real sky. */
const DeepSpaceScene = dynamic(() => import("./deep-space-scene"), { ssr: false });

export function DeepSpace() {
  const [needed, setNeeded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const skip =
      window.matchMedia("(max-width: 767px)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (skip) return;
    const hero = document.querySelector("[data-hero]");
    if (!hero) {
      // no hero on this page: show it, once the page has painted
      const id = requestAnimationFrame(() => {
        setNeeded(true);
        setVisible(true);
      });
      return () => cancelAnimationFrame(id);
    }
    // "off screen" means less than a fifth of the hero still showing
    const io = new IntersectionObserver(
      ([entry]) => {
        const away = entry.intersectionRatio < 0.2;
        setVisible(away);
        if (away) setNeeded(true);
      },
      { threshold: [0, 0.2, 0.5, 1] },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  if (!needed) return null;
  return (
    <div
      aria-hidden
      className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${visible ? "opacity-100" : "opacity-0"}`}
      /* Full strength in the margins, ghosted behind the content column —
         the objects are the setting, and the words always win. */
      style={{
        maskImage:
          "linear-gradient(90deg, #000 0%, rgba(0,0,0,0.9) 12%, rgba(0,0,0,0.34) 28%, rgba(0,0,0,0.34) 72%, rgba(0,0,0,0.9) 88%, #000 100%)",
      }}
    >
      <DeepSpaceScene running={visible} />
    </div>
  );
}
