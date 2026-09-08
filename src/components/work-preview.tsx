/* Preview cards for work-row hover: real screenshots for live products, mini-mockups otherwise. */

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

function Bars({ rows }: { rows: [string, number, string][] }) {
  return (
    <div className="space-y-2 font-mono text-[9px]">
      {rows.map(([label, pct, n]) => (
        <div key={label}>
          <div className="flex justify-between text-muted">
            <span>{label}</span>
            <span className="text-fg">{n}</span>
          </div>
          <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-card">
            <div className="h-full rounded-full bg-accent/80" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const sparkcue = (
  <Chrome title="sparkcue — live call">
    <div className="space-y-2 font-mono text-[9px]">
      <div className="flex items-center gap-2 text-muted">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
        </span>
        transcribing… 00:14:32
      </div>
      <div className="rounded border border-line bg-card p-2">
        <p className="text-muted">prospect:</p>
        <p className="mt-0.5 text-fg">&quot;honestly, it sounds expensive…&quot;</p>
      </div>
      <div className="rounded border border-accent/40 bg-accent/10 p-2">
        <p className="text-accent">▸ cue: price objection</p>
        <p className="mt-0.5 text-muted">reframe to cost-of-inaction, then ask…</p>
      </div>
    </div>
  </Chrome>
);

const circlevoice = (
  <Chrome title="voice agent — call in progress">
    <div className="space-y-1.5 font-mono text-[9px]">
      <div className="flex items-center justify-between text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-accent" /> agent live
        </span>
        <span className="text-accent">642ms</span>
      </div>
      <div className="rounded border border-line bg-card p-2">
        <p className="text-muted">caller: &quot;do you have anything saturday?&quot;</p>
      </div>
      <div className="rounded border border-accent/40 bg-accent/10 p-2">
        <p className="text-fg">agent: &quot;we do — 11am or 2:30. which works?&quot;</p>
      </div>
      <Row>
        <span className="text-muted">→ booking slot</span>
        <span className="text-accent">sat 11:00 ✓</span>
      </Row>
    </div>
  </Chrome>
);

const leadsreach = (
  <Chrome title="outreach — campaign">
    <Bars
      rows={[
        ["sourced", 100, "1,240"],
        ["scored & qualified", 62, "770"],
        ["personalized", 48, "596"],
        ["replied", 9, "112"],
      ]}
    />
  </Chrome>
);

const siteharvest = (
  <Chrome title="siteharvest — diff feed">
    <div className="space-y-1.5 font-mono text-[9px]">
      {(
        [
          ["competitor-a.com/pricing", "+ $49 plan added", true],
          ["competitor-b.io/changelog", "~ 3 features shipped", false],
          ["competitor-c.dev/careers", "+ 2 AI roles opened", true],
        ] as const
      ).map(([site, diff, up], i) => (
        <Row key={i}>
          <span className="truncate text-muted">{site}</span>
          <span className={up ? "ml-2 shrink-0 text-accent" : "ml-2 shrink-0 text-muted"}>{diff}</span>
        </Row>
      ))}
      <p className="pt-0.5 text-muted">last scan: 22 min ago · 40 sites ok</p>
    </div>
  </Chrome>
);

const leadgen = (
  <Chrome title="leadgen — list build">
    <div className="space-y-1.5 font-mono text-[9px]">
      {(
        [
          ["northwind labs", "saas · 42 ppl", 94],
          ["acme logistics", "b2b · 118 ppl", 87],
          ["brightops.io", "devtools · 9 ppl", 81],
        ] as const
      ).map(([name, meta, score]) => (
        <Row key={name}>
          <span className="text-fg">{name}</span>
          <span className="ml-2 text-muted">{meta}</span>
          <span className="ml-2 shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-accent">{score}</span>
        </Row>
      ))}
      <p className="pt-0.5 text-muted">6 sources · deduped · 312 verified emails</p>
    </div>
  </Chrome>
);

const mailforge = (
  <Chrome title="email infra — domain health">
    <div className="space-y-1.5 font-mono text-[9px]">
      {(
        [
          ["send.acme-out.com", "warming · day 9/14", "#febc2e"],
          ["mail.acme-go.com", "healthy · 98 score", "var(--accent)"],
          ["out.acme-hq.com", "healthy · 96 score", "var(--accent)"],
        ] as const
      ).map(([domain, status, color]) => (
        <Row key={domain}>
          <span className="flex items-center gap-1.5 text-fg">
            <span className="size-1.5 rounded-full" style={{ background: color }} />
            {domain}
          </span>
          <span className="ml-2 shrink-0 text-muted">{status}</span>
        </Row>
      ))}
      <p className="pt-0.5 text-muted">spf ✓ dkim ✓ dmarc ✓ · 0 blacklists</p>
    </div>
  </Chrome>
);

const codevault = (
  <Chrome title="codevault — scan report">
    <div className="space-y-1.5 font-mono text-[9px]">
      {(
        [
          ["jsonwebtoken@8.5.1", "reachable · auth path", "#ff5f57"],
          ["lodash@4.17.20", "reachable · api layer", "#febc2e"],
          ["minimist@1.2.5", "installed, never called", "var(--muted)"],
        ] as const
      ).map(([pkg, note, color], i) => (
        <div key={i} className="flex items-center gap-2 rounded border border-line bg-card px-2 py-1.5">
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
          <span className="truncate text-fg">{pkg}</span>
          <span className="ml-auto shrink-0 text-muted">{note}</span>
        </div>
      ))}
      <p className="pt-0.5 text-muted">10,412 deps resolved · 2 exploitable</p>
    </div>
  </Chrome>
);

const slotwise = (
  <Chrome title="booking — thursday">
    <div className="space-y-1.5 font-mono text-[9px]">
      {(
        [
          ["09:00", "sarah k — consult", "confirmed ✓", true],
          ["11:30", "open slot", "waitlist: 2", false],
          ["14:00", "imran d — follow-up", "deposit paid", true],
        ] as const
      ).map(([time, who, status, booked]) => (
        <Row key={time}>
          <span className="text-accent">{time}</span>
          <span className={booked ? "ml-2 text-fg" : "ml-2 text-muted"}>{who}</span>
          <span className="ml-2 shrink-0 text-muted">{status}</span>
        </Row>
      ))}
      <p className="pt-0.5 text-muted">reminders sent · no-shows this week: 0</p>
    </div>
  </Chrome>
);

const funnelflow = (
  <Chrome title="funnel builder — avatar funnel">
    <div className="space-y-1.5 font-mono text-[9px]">
      <div className="flex items-center justify-between rounded border border-accent/40 bg-accent/10 p-2">
        <span className="text-accent">▶ rendering avatar video…</span>
        <span className="text-muted">0:42 / 1:10</span>
      </div>
      <Bars
        rows={[
          ["video watched", 100, "8,420"],
          ["quiz completed", 52, "4,378"],
          ["form submitted", 21, "1,768"],
        ]}
      />
      <p className="pt-0.5 text-muted">variant B +18% · A/B running</p>
    </div>
  </Chrome>
);

const sparkaiCrm = (
  <Chrome title="crm — deal">
    <div className="space-y-1.5 font-mono text-[9px]">
      <Row>
        <span className="text-fg">acme corp — pilot</span>
        <span className="ml-2 shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-accent">$18k</span>
      </Row>
      <div className="rounded border border-line bg-card p-2 text-muted">
        <p>summary: pricing agreed, security review pending since tue…</p>
      </div>
      <div className="rounded border border-accent/40 bg-accent/10 p-2">
        <p className="text-accent">▸ next: nudge security review</p>
        <p className="mt-0.5 text-muted">sourced from 3 emails · 1 meeting</p>
      </div>
    </div>
  </Chrome>
);

const matchify = (
  <Chrome title="matchmaking — for you">
    <div className="space-y-1.5 font-mono text-[9px]">
      <div className="rounded border border-line bg-card p-2">
        <div className="flex items-center justify-between">
          <span className="text-fg">Maya, 28 · 2 km away</span>
          <span className="rounded bg-accent/15 px-1.5 py-0.5 text-accent">92% match</span>
        </div>
        <p className="mt-1 text-muted">values: intentional · museums · long walks</p>
      </div>
      <div className="rounded border border-accent/40 bg-accent/10 p-2">
        <p className="text-accent">✦ luna coach</p>
        <p className="mt-0.5 text-muted">&quot;ask about her favorite exhibit — you both listed art.&quot;</p>
      </div>
      <p className="pt-0.5 text-muted">next curated match in 31h</p>
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

const mockups: Record<string, React.ReactNode> = {
  sparkcue,
  circlevoice,
  leadsreach,
  siteharvest,
  leadgen,
  mailforge,
  codevault,
  slotwise,
  funnelflow,
  "sparkai-crm": sparkaiCrm,
  matchify,
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
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
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
