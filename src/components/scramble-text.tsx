"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

const CHARSET = "!<>-_\\/[]{}—=+*^?#_010101";

export function ScrambleText({
  text,
  className,
  trigger = "inview",
  active = true,
  duration = 900,
  rescrambleOnHover = true,
}: {
  text: string;
  className?: string;
  /** "inview" runs when scrolled into view; "manual" runs when `active` flips true */
  trigger?: "inview" | "manual";
  active?: boolean;
  duration?: number;
  rescrambleOnHover?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(text);
  const rafRef = useRef(0);
  const startedRef = useRef(false);

  const run = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const resolved = Math.floor(p * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        out +=
          i < resolved || c === " "
            ? c
            : CHARSET[Math.floor(Math.random() * CHARSET.length)];
      }
      setDisplay(out);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [text, duration]);

  useEffect(() => {
    const shouldRun = trigger === "inview" ? inView : active;
    if (shouldRun && !startedRef.current) {
      startedRef.current = true;
      run();
    }
  }, [inView, active, trigger, run]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <span
      ref={ref}
      className={className}
      /* The ref is read inside the handler, not while rendering. React does
         not track refs, so deciding here whether the prop exists at all left
         the element one render behind whatever startedRef actually held. */
      onMouseEnter={
        rescrambleOnHover
          ? () => {
              if (startedRef.current) run();
            }
          : undefined
      }
      aria-label={text}
    >
      {display}
    </span>
  );
}
