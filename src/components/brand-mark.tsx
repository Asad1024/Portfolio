import { useId } from "react";

/** The site's mark: the same code glyph and star as the browser-tab icon
 *  (src/app/icon.svg), drawn inline so it scales crisply at any size. */
export function BrandMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a5f3fc" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#070a14" />
      <rect
        x="0.75"
        y="0.75"
        width="62.5"
        height="62.5"
        rx="13.25"
        fill="none"
        stroke="#22d3ee"
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />
      <g fill="none" stroke={`url(#${id})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 21 L11 32 L22 43" />
        <path d="M42 21 L53 32 L42 43" />
        <path d="M36 16 L28 48" />
      </g>
      <path
        d="M53 5 C53.3 8.2 54.2 9.1 57.4 9.4 C54.2 9.7 53.3 10.6 53 13.8 C52.7 10.6 51.8 9.7 48.6 9.4 C51.8 9.1 52.7 8.2 53 5 Z"
        fill="#e8ecf5"
      />
    </svg>
  );
}
