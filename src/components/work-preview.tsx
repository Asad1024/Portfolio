/* Card visuals for the work grid: real screenshots for shipped products,
   hand-built mini-mockups for the ones with nothing public to screenshot. */

import Image from "next/image";
import { projects } from "@/lib/data";

function Chrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-[280px] overflow-hidden rounded-lg border border-line bg-bg shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="size-2 rounded-full bg-[#ff5f57]" />
        <span className="size-2 rounded-full bg-[#febc2e]" />
        <span className="size-2 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-[9px] text-muted">{title}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded border border-line bg-card px-2 py-1.5">
      {children}
    </div>
  );
}

const codevault = (
  <Chrome title="codevault — scan report">
    <div className="space-y-1.5 font-mono text-[9px]">
      {(
        [
          ["sql injection · api/users.ts:42", "critical", "#ff5f57"],
          ["aws key · config/prod.env", "high", "#febc2e"],
          ["copyleft license · 1 package", "low", "var(--muted)"],
        ] as const
      ).map(([pkg, note, color], i) => (
        <div key={i} className="flex items-center gap-2 rounded border border-line bg-card px-2 py-1.5">
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
          <span className="truncate text-fg">{pkg}</span>
          <span className="ml-auto shrink-0 text-muted">{note}</span>
        </div>
      ))}
      <p className="pt-0.5 text-muted">grade C · offline scan · 0 bytes uploaded</p>
    </div>
  </Chrome>
);

const avatarStudio = (
  <Chrome title="creative studio — render queue">
    <div className="space-y-1.5 font-mono text-[9px]">
      <div className="rounded border border-line bg-card p-2">
        <p className="text-muted">brief: skincare launch · IG reels · 25-34</p>
        <p className="mt-0.5 text-fg">script v2 of 3 — &quot;the 10-second routine…&quot;</p>
      </div>
      <div className="flex items-center justify-between rounded border border-accent/40 bg-accent/10 p-2">
        <span className="text-accent">▶ rendering avatar video</span>
        <span className="text-muted">job 2/3 · 74%</span>
      </div>
      <Row>
        <span className="text-muted">credits used</span>
        <span className="text-accent">38 / 100</span>
      </Row>
    </div>
  </Chrome>
);

const insyncx = (
  <Chrome title="insyncx — vendor payouts">
    <div className="space-y-1.5 font-mono text-[9px]">
      {(
        [
          ["order #1042 · independent", "stripe connect", "var(--accent)"],
          ["order #1043 · official store", "team credit", "#febc2e"],
          ["payout · north studio", "pending", "var(--muted)"],
        ] as const
      ).map(([label, note, color], i) => (
        <div key={i} className="flex items-center gap-2 rounded border border-line bg-card px-2 py-1.5">
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
          <span className="truncate text-fg">{label}</span>
          <span className="ml-auto shrink-0 text-muted">{note}</span>
        </div>
      ))}
      <p className="pt-0.5 text-muted">platform commission 10% · 2 payout paths</p>
    </div>
  </Chrome>
);

const ghertak = (
  <Chrome title="ghertak — fulfillment queue">
    <div className="space-y-1.5 font-mono text-[9px]">
      {(
        [
          ["#GT-2281 · 3 items · lahore", "jazzcash", "var(--accent)"],
          ["#GT-2282 · 1 item · karachi", "cod", "#febc2e"],
          ["#GT-2283 · substitution", "needs review", "#ff5f57"],
        ] as const
      ).map(([label, note, color], i) => (
        <div key={i} className="flex items-center gap-2 rounded border border-line bg-card px-2 py-1.5">
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
          <span className="truncate text-fg">{label}</span>
          <span className="ml-auto shrink-0 text-muted">{note}</span>
        </div>
      ))}
      <p className="pt-0.5 text-muted">load-out today · 42 orders · 6 vendors</p>
    </div>
  </Chrome>
);

const mockups: Record<string, React.ReactNode> = {
  ghertak,
  codevault,
  insyncx,
  "avatar-studio": avatarStudio,
};

/**
 * Card visual: a real screenshot when `image` is set on the project, otherwise
 * the hand-built mini-mockup so no card is ever empty. Fills its parent, which
 * must be `relative` and set the aspect ratio.
 */
export function ProjectVisual({ slug }: { slug: string }) {
  const project = projects.find((p) => p.slug === slug);

  if (project?.image) {
    return (
      <Image
        src={project.image}
        alt={`${project.title} interface`}
        fill
        sizes="(max-width: 1024px) 100vw, 560px"
        /* contain, not cover: these are full desktop captures and cover was
           slicing the sides off every one of them. The screen it sits in has
           a black ground, so the little letterboxing this leaves reads as a
           display showing content rather than as a gap. */
        className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
      />
    );
  }

  const mockup = mockups[slug];
  if (!mockup) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="scale-[1.15] transition-transform duration-700 ease-out group-hover:scale-[1.2]">
        {mockup}
      </div>
    </div>
  );
}
