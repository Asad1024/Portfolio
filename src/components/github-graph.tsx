"use client";

import { useState } from "react";
import { contact } from "@/lib/data";

/* The contribution graph comes from a third-party renderer, so the whole block
   removes itself if that service is unreachable — a broken image in the contact
   section is worse than no graph at all. */
export function GithubGraph() {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  if (state === "failed") return null;

  return (
    <div className="mt-20 overflow-hidden rounded-2xl border border-line">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-card px-4 py-2.5 font-mono text-[11px] text-muted">
        <span className="truncate">
          <span className="text-accent">$</span> git log --author=Asad1024
          --since=&quot;1 year ago&quot;
        </span>
        <a
          href={contact.github}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 transition-colors hover:text-accent"
        >
          github.com/Asad1024 ↗
        </a>
      </div>

      <div className="overflow-x-auto p-4">
        <div className={state === "ready" ? "" : "animate-pulse"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://ghchart.rshah.org/4ade80/Asad1024"
            alt="Asad's GitHub contribution graph for the past year"
            className="mx-auto min-w-[640px] max-w-[900px] opacity-90"
            loading="lazy"
            onLoad={() => setState("ready")}
            onError={() => setState("failed")}
          />
        </div>
      </div>
    </div>
  );
}
