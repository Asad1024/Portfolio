"use client";

import { useState } from "react";

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — nothing sensible to do */
    }
  }

  return (
    <button
      onClick={copy}
      aria-label="Copy code"
      className="rounded px-2 py-1 font-mono text-[11px] text-muted transition-colors hover:bg-card hover:text-fg"
    >
      {copied ? <span className="text-accent">copied ✓</span> : "copy"}
    </button>
  );
}
