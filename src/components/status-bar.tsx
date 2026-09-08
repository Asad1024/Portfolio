"use client";

import { useEffect, useState } from "react";

/* An editor-style status line pinned to the bottom of the viewport. It exists
   for two reasons: it makes the keyboard features discoverable (nobody finds a
   terminal they're never told about), and it reads like a developer tool. */
const SECTIONS = ["work", "capabilities", "skills", "experience", "about", "contact"];

export function StatusBar() {
  const [section, setSection] = useState("");
  const [progress, setProgress] = useState(0);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));

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

  const hint =
    "flex items-center gap-1.5 rounded px-2 py-1 transition-colors hover:bg-card hover:text-fg";
  const key =
    "rounded border border-line px-1.5 py-px text-[10px] leading-relaxed text-fg/80";

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

        {/* discoverability: the whole point of this bar */}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() =>
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }),
              )
            }
            className={hint}
            aria-label="Open command palette"
          >
            <kbd className={key}>{isMac ? "⌘" : "ctrl"}</kbd>
            <kbd className={key}>K</kbd>
            <span className="hidden text-fg sm:inline">palette</span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-terminal"))}
            className={`${hint} attention-pulse term-green`}
            aria-label="Open terminal"
          >
            <span className="term-green">&gt;_</span>
            <span className="hidden sm:inline">terminal</span>
            <span className="caret-blink term-green">_</span>
          </button>

          <span className="ml-2 hidden w-10 text-right tabular-nums text-accent sm:inline">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
