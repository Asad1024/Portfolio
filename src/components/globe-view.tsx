"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

/* The globe is WebGL, so like the hero's system it is client-only and lazily
   chunked, and its render loop stops whenever it is off screen. */
const Globe = dynamic(() => import("./space/globe"), { ssr: false });

export function GlobeView({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} aria-label="Globe showing Lahore, Dubai and Islamabad" role="img">
      {visible && <Globe />}
    </div>
  );
}
