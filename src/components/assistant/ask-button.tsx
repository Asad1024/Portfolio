"use client";

import { MessageSquareText } from "lucide-react";
import { openAssistant } from "./events";

/** Hands a question to the assistant from anywhere on the site. */
export function AskButton({ prompt, label, className = "" }: { prompt: string; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openAssistant(prompt)}
      className={`group inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.08] px-4 py-2 text-sm text-accent transition-colors hover:border-accent/60 hover:bg-accent/15 ${className}`}
    >
      <MessageSquareText aria-hidden className="size-4 transition-transform group-hover:-rotate-6" />
      {label}
    </button>
  );
}
