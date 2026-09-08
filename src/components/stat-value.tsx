"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { ScrambleText } from "./scramble-text";

/** Animated case-study stat: counts numeric values up on scroll; scrambles words in. */
export function StatValue({ value }: { value: string }) {
  const match = value.match(/^([^0-9]*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(match ? `${match[1]}0${match[3]}` : value);

  useEffect(() => {
    if (!inView || !match) return;
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr.replace(/,/g, ""));
    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
    const useCommas = numStr.includes(",");
    const start = performance.now();
    const duration = 1300;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const n = target * eased;
      const formatted = useCommas
        ? Math.round(n).toLocaleString("en-US")
        : n.toFixed(decimals);
      setDisplay(`${prefix}${formatted}${suffix}`);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);

  if (!match) {
    return <ScrambleText text={value} duration={700} rescrambleOnHover={false} />;
  }
  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}
