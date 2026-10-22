"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

const CHARSET = "!<>-_\\/[]{}—=+*^?#_010101";

/** a fixed run of symbols the length of the text, spaces kept */
const maskOf = (text: string) =>
  [...text].map((c, i) => (c === " " ? " " : CHARSET[(i * 7 + 3) % CHARSET.length])).join("");

export function ScrambleText({
  text,
  className,
  trigger = "inview",
  active = true,
  duration = 900,
  rescrambleOnHover = true,
  masked = false,
  ripple = false,
}: {
  text: string;
  className?: string;
  /** "inview" runs when scrolled into view; "manual" runs when `active` flips true */
  trigger?: "inview" | "manual";
  active?: boolean;
  duration?: number;
  rescrambleOnHover?: boolean;
  /** Show symbols, not the text, until the decrypt starts. Once set it holds
   *  until then, so the text is never readable and then broken up again. */
  masked?: boolean;
  /** When the text is already on screen and readable as the effect starts,
   *  pass a short band of symbols across it instead of scrambling all of it:
   *  the effect still plays, but the text never breaks apart in front of the
   *  reader. Ignored while masked, which decodes from the symbols instead. */
  ripple?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(text);
  const [veiled, setVeiled] = useState(masked);
  const [begun, setBegun] = useState(false);
  // latched during render (React's pattern for state that follows a prop):
  // a mask that is lifted on the same render the decrypt starts must not
  // leave one frame of the plain text in between
  if (masked && !veiled) setVeiled(true);
  const rafRef = useRef(0);
  const startedRef = useRef(false);

  const run = useCallback(
    (mode: "decode" | "ripple" = "decode") => {
      cancelAnimationFrame(rafRef.current);
      const start = performance.now();
      const BAND = 3;
      const step = (now: number) => {
        setBegun(true);
        const p = Math.min(1, (now - start) / duration);
        const resolved = Math.floor(p * text.length);
        // the band's leading edge, travelling from before the first letter
        // to past the last
        const head = p * (text.length + BAND) - BAND;
        let out = "";
        for (let i = 0; i < text.length; i++) {
          const c = text[i];
          const scrambled = mode === "ripple" ? i >= head && i < head + BAND : i >= resolved;
          out += !scrambled || c === " " ? c : CHARSET[Math.floor(Math.random() * CHARSET.length)];
        }
        setDisplay(out);
        if (p < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [text, duration],
  );

  useEffect(() => {
    const shouldRun = trigger === "inview" ? inView : active;
    if (shouldRun && !startedRef.current) {
      startedRef.current = true;
      run(ripple && !veiled ? "ripple" : "decode");
    }
  }, [inView, active, trigger, run, ripple, veiled]);

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
      {veiled && !begun ? maskOf(text) : display}
    </span>
  );
}
