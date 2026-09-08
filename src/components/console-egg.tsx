"use client";

import { useEffect } from "react";
import { contact } from "@/lib/data";

/** For anyone who opens DevTools — which is exactly the audience worth talking to. */
export function ConsoleEgg() {
  useEffect(() => {
    const badge =
      "background:#4ade80;color:#0a0a0c;font-weight:700;padding:4px 12px;border-radius:3px;font-family:monospace";
    const muted = "color:#898994;font-family:monospace;line-height:1.6";
    const accent = "color:#4ade80;font-family:monospace;font-weight:700";

    console.log("%c ASAD SHAH ", badge);
    console.log(
      "%cFull-Stack Developer — building AI products, modernizing legacy code.",
      muted,
    );
    console.log(
      "%cYou opened DevTools. That already tells me something about you.",
      muted,
    );
    console.log(`%c→ ${contact.email}`, accent);
    console.log(
      "%cPS: press ` for a shell, ⌘K for the command palette, and try 'neofetch'.",
      muted,
    );
  }, []);

  return null;
}
