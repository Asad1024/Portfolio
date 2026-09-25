/* The one ship, drawn in the same hairline language as the fallback tech
   glyphs: outline only, accent stroke, nose up. Everything that flies — the
   voyage down the page and the terminal's launch — uses this, so there is
   exactly one ship in the universe.

   The flame is its own element, scaled from the nozzle by whoever is flying
   the ship, so thrust can follow speed without redrawing the hull. */
export function Ship({
  size = 26,
  flameRef,
  flame = 0.4,
}: {
  size?: number;
  /** handed the flame's <g> so a caller can scale it per frame */
  flameRef?: React.Ref<SVGGElement>;
  /** static thrust, 0–1, for callers that don't animate it */
  flame?: number;
}) {
  return (
    <svg width={size} height={(size * 40) / 24} viewBox="0 0 24 40" fill="none" aria-hidden>
      {/* exhaust, drawn first so the hull sits over its root */}
      <g
        ref={flameRef}
        style={{ transformOrigin: "12px 26px", transform: `scaleY(${flame})` }}
      >
        <path d="M9.5 26 Q12 40 14.5 26 Z" fill="var(--accent)" opacity="0.35" />
        <path d="M10.8 26 Q12 34 13.2 26 Z" fill="#ffffff" opacity="0.85" />
      </g>
      <g stroke="var(--accent)" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        {/* hull */}
        <path d="M12 2c3 3.8 4.2 8.6 4.2 15v6.5H7.8V17C7.8 10.6 9 5.8 12 2z" fill="var(--bg)" />
        {/* fins */}
        <path d="M7.8 17.5L4 22.5v3.2l3.8-2.2M16.2 17.5l3.8 5v3.2l-3.8-2.2" />
        {/* porthole */}
        <circle cx="12" cy="11.5" r="1.9" />
        {/* nozzle */}
        <path d="M9.8 23.5v2.5h4.4v-2.5" />
      </g>
    </svg>
  );
}
