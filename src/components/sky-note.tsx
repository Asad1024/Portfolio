"use client";

import { useEffect, useState } from "react";
import { highestFamous } from "@/lib/sky";

/* The one line that lets a visitor in on the background: the stars behind
   the page are the real sky over Lahore, and here is what is up right now.
   Worked out on the client, from the visitor's clock, so it is true for the
   moment they are reading it — and re-checked once a minute. */
export function SkyNote() {
  const [overhead, setOverhead] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setOverhead(highestFamous(new Date()));
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="font-mono text-xs leading-relaxed text-muted">
      <span className="term-green">$</span> sky --over lahore
      <span className="mt-1.5 block text-muted/90">
        the stars behind this page are the real sky over Lahore, right now
        {overhead && (
          <>
            {" "}
            — <span className="text-fg">{overhead}</span> is overhead
          </>
        )}
        .
        {/* hover only exists with a mouse, so the hint does too */}
        <span className="hidden [@media(hover:hover)]:inline"> point at a bright star to learn its name.</span>
      </span>
    </p>
  );
}
