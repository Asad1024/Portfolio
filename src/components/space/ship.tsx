/* The one craft: a swept-wing deep-space vessel with twin ion drives, drawn
   in the site's hairline language — dark hull, accent edges, nose up. Not a
   rocket: no fins, no porthole, no flame. What burns is a pair of small
   blue-white drive cores, each trailing a thin straight plume whose length
   is the thrust.

   Everything that flies — the voyage down the page and the terminal's
   launch — uses this, so there is exactly one ship in the universe. */
export function Ship({
  size = 22,
  plumeRef,
  thrust = 0.5,
}: {
  size?: number;
  /** handed the plumes' <g> so a caller can set their length per frame */
  plumeRef?: React.Ref<SVGGElement>;
  /** static thrust, 0–1, for callers that don't animate it */
  thrust?: number;
}) {
  return (
    <svg
      width={size}
      height={(size * 96) / 24}
      viewBox="0 0 24 96"
      fill="none"
      aria-hidden
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="ship-plume" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.25" stopColor="var(--accent)" stopOpacity="0.8" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ship-core">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="var(--accent)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* twin ion plumes, scaled together from the drive line */}
      <g ref={plumeRef} style={{ transformOrigin: "12px 37px", transform: `scaleY(${thrust})` }}>
        <rect x="8.95" y="37" width="1.5" height="56" rx="0.75" fill="url(#ship-plume)" />
        <rect x="13.55" y="37" width="1.5" height="56" rx="0.75" fill="url(#ship-plume)" />
        <rect x="7.6" y="37" width="8.8" height="26" rx="4.4" fill="url(#ship-plume)" opacity="0.18" />
      </g>

      {/* hull: arrowhead body swept back into wings, two drive pods at the tail */}
      <path
        d="M12 2 L13.4 10 L14.8 19 L21.5 30.5 L21.5 33 L16.5 31 L15.4 36 L13.2 36 L12 34.5 L10.8 36 L8.6 36 L7.5 31 L2.5 33 L2.5 30.5 L9.2 19 L10.6 10 Z"
        fill="var(--bg)"
        stroke="var(--accent)"
        strokeWidth="0.85"
        strokeLinejoin="round"
      />
      {/* spine and wing panel lines — the detail that makes it read as hardware */}
      <path
        d="M12 6 V30 M14.9 21.5 L19.6 29.6 M9.1 21.5 L4.4 29.6"
        stroke="var(--accent)"
        strokeOpacity="0.45"
        strokeWidth="0.55"
      />
      {/* canopy */}
      <path d="M11.3 11.5 L12 8 L12.7 11.5 Z" fill="var(--accent)" />
      {/* drive cores */}
      <circle cx="9.7" cy="37" r="2.3" fill="url(#ship-core)" />
      <circle cx="14.3" cy="37" r="2.3" fill="url(#ship-core)" />
    </svg>
  );
}
