"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { featuredStack } from "@/lib/data";

/* The stack as an orbital system, on its own full-bleed band between the hero
   and the work.

   It lived behind the headline first, which asked one screen to be both a
   title card and a data visualisation — the orbits ran straight through the
   type and neither read cleanly. Given its own section it can be centred and
   sized properly, and the hero goes back to being a hero. */

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

export function StackSystem() {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // Let the WebGL scene idle whenever it's off screen — see frameloop in
  // space/solar-system.tsx for why this matters.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "200px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id="stack" className="relative scroll-mt-24 overflow-hidden pb-6">
      <div className="mx-auto mb-2 flex max-w-6xl items-center gap-3 px-6 font-mono text-[10px] uppercase tracking-widest text-muted/70">
        <span className="term-green">◆ stack.orbital</span>
        <span className="h-px flex-1 bg-line" />
        <span>{featuredStack.length} systems online</span>
      </div>

      {/* Masked at top and bottom: the canvas carries its own glow, so ending
          it at the section edge draws a hard seam across the page. */}
      <div
        className="relative h-[74vh] min-h-[30rem] w-full"
        style={{
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 3%, black 93%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, black 3%, black 93%, transparent 100%)",
        }}
      >
        <SolarSystem paused={!inView} />
      </div>

      <p className="mx-auto max-w-6xl px-6 text-center font-mono text-[11px] text-muted/70">
        drag to orbit · hover a body
      </p>
    </section>
  );
}
