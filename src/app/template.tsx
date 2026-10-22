"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { routeVeil } from "@/lib/route-veil";

/* ── route change: arrival ──────────────────────────────────────────────────
   The curtain between pages is components/route-veil, which lives in the
   layout so it can start the moment a link is pressed, before this page even
   exists. This template is the page's side of it: it tells the veil the page
   is in, and holds the content a touch low until the veil lifts, so the page
   settles up into place as it is revealed. */

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  /* Keyed on the whole path, not left to the template's own remount. A root
     template is keyed by its FIRST segment, so /work/a -> /work/b would keep
     the same instance and never announce the second arrival — the exact
     navigation this site does most. */
  return <Arrival key={pathname}>{children}</Arrival>;
}

function Arrival({ children }: { children: React.ReactNode }) {
  // The first page of a visit has no veil over it (the intro loader, or
  // nothing at all, covers that), on the server and on hydration alike.
  const [initial] = useState(() => !routeVeil.navigated);
  const [settled, setSettled] = useState(initial);

  useEffect(() => {
    if (initial) {
      routeVeil.navigated = true;
      window.dispatchEvent(new CustomEvent("route-revealed"));
      return;
    }
    const onRevealed = () => setSettled(true);
    window.addEventListener("route-revealed", onRevealed);
    /* The page's own children ran their effects before this one, so anything
       they asked the veil to wait for is already in routeVeil.pending. */
    window.dispatchEvent(new CustomEvent("route-arrived"));
    return () => window.removeEventListener("route-revealed", onRevealed);
  }, [initial]);

  /* The veil masks the page while it settles, so this only ever offsets the
     content — never fades it out. Content stays visible even if the veil
     never runs. */
  return (
    <div
      className={`transition-transform duration-300 ease-out ${settled ? "translate-y-0" : "translate-y-4"}`}
    >
      {children}
    </div>
  );
}
