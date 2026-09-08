"use client";

import { useEffect, useState } from "react";

/* An editor-style status line pinned to the bottom of the viewport: where you
   are in the page, and how far down it you have travelled. */
const SECTIONS = ["work", "capabilities", "skills", "experience", "about", "contact"];

export function StatusBar() {
  const [section, setSection] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.round((window.scrollY / max) * 100) : 0);

      // whichever section straddles the middle of the viewport is "current"
      const mid = window.innerHeight / 2;
      let current = "";
      for (const id of SECTIONS) {
        const r = document.getElementById(id)?.getBoundingClientRect();
        if (r && r.top <= mid && r.bottom >= mid) {
          current = id;
          break;
        }
      }
      setSection(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-9 max-w-6xl items-center gap-4 px-4 font-mono text-[11px] text-muted sm:px-6">
        {/* current location */}
        <span className="flex shrink-0 items-center gap-2">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
          </span>
          <span className="text-accent">~/asad</span>
          <span className="hidden text-muted/70 sm:inline">
            {section ? `/${section}` : ""}
          </span>
        </span>

        {/* The shortcut chips moved up to the header, where they sit beside
            the nav instead of competing with it from the opposite corner of
            the screen. What is left is location and progress — which is what
            a status line is actually for. */}
        <span className="ml-auto hidden w-10 text-right tabular-nums text-accent sm:inline">
          {progress}%
        </span>
      </div>
    </div>
  );
}
