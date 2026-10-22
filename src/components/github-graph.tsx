import { contact } from "@/lib/data";
import { getYearContributions, type ContributionDay } from "@/lib/github";
import { ArrowUpRight } from "lucide-react";

/* A single calendar year, 1 January to 31 December, drawn here rather than
   pulled in as a third-party image — which fixed the chart to a rolling
   twelve months and gave no control over where the year started.

   The grid is built from the Sunday on or before 1 January to the Saturday on
   or after 31 December, so every column is a full week and the weekday rows
   line up. Days either side of the year are laid out but not painted, which
   keeps the shape rectangular without inventing data. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const LEVEL_CLASS = [
  "bg-[color-mix(in_oklab,var(--fg)_9%,transparent)]",
  "bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]",
  "bg-[color-mix(in_oklab,var(--accent)_50%,transparent)]",
  "bg-[color-mix(in_oklab,var(--accent)_74%,transparent)]",
  "bg-[var(--accent)]",
] as const;

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GithubGraph() {
  const year = new Date().getUTCFullYear();
  const data = await getYearContributions(contact.github.split("/").pop() ?? "", year);

  // a broken chart is worse than none — the section simply closes up
  if (!data) return null;

  const byDate = new Map(data.days.map((d) => [d.date, d]));

  const start = new Date(Date.UTC(year, 0, 1));
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const end = new Date(Date.UTC(year, 11, 31));
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));

  const weeks: (ContributionDay | null)[][] = [];
  const monthAt: (string | null)[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const week: (ContributionDay | null)[] = [];
    let label: string | null = null;
    for (let i = 0; i < 7; i++) {
      const inYear = cursor.getUTCFullYear() === year;
      // label the column where a month first appears, skipping January's
      // partial lead-in so the first label isn't crushed against the edge
      if (inYear && cursor.getUTCDate() <= 7 && i === 0) {
        label = MONTHS[cursor.getUTCMonth()];
      }
      week.push(inYear ? (byDate.get(iso(cursor)) ?? { date: iso(cursor), count: 0, level: 0 }) : null);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
    monthAt.push(label);
  }

  /* The figures worth a glance before the grid itself: the busiest day and
     the longest unbroken run, both read straight off the same data. */
  const best = data.days.reduce((m, d) => (d.count > m.count ? d : m), data.days[0] ?? { count: 0, date: "" });
  let streak = 0;
  let run = 0;
  for (const d of [...data.days].sort((a, b) => a.date.localeCompare(b.date))) {
    run = d.count > 0 ? run + 1 : 0;
    streak = Math.max(streak, run);
  }
  const login = contact.github.split("/").pop();

  return (
    <div className="mt-20 overflow-hidden rounded-3xl border border-line bg-card backdrop-blur-sm">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line p-6 sm:p-8">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-muted">GitHub activity · {year}</p>
          <p className="mt-2 font-sans text-4xl font-semibold tracking-tight text-fg">
            {data.total.toLocaleString()}{" "}
            <span className="text-accent">contributions</span>
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-10 gap-y-3">
          {[
            [`${streak} days`, "longest streak"],
            [`${best.count}`, "busiest day"],
          ].map(([v, k]) => (
            <div key={k}>
              <dt className="sr-only">{k}</dt>
              <dd className="text-xl font-semibold tracking-tight text-fg">{v}</dd>
              <dd className="font-sans text-[11px] text-muted">{k}</dd>
            </div>
          ))}
          <a
            href={contact.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 self-center rounded-full border border-line px-4 py-2 font-sans text-xs text-muted transition-colors hover:border-accent hover:text-accent"
          >
            @{login} <ArrowUpRight aria-hidden className="size-3.5" />
          </a>
        </dl>
      </div>

      {/* Columns share the width, so the year fills the card at any size; on
          a phone it keeps a floor and scrolls sideways instead of shrinking
          the squares to specks. */}
      <div className="overflow-x-auto p-6 sm:p-8">
        <div className="min-w-[46rem]">
          <div className="flex gap-2">
            <div
              aria-hidden
              className="grid shrink-0 grid-rows-[1rem_repeat(7,minmax(0,1fr))] gap-[3px] font-sans text-[10px] text-muted/80"
            >
              {["", "", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <span key={i} className="flex items-center">
                  {d}
                </span>
              ))}
            </div>

            <div
              className="grid flex-1 gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
            >
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-rows-[1rem_repeat(7,minmax(0,1fr))] gap-[3px]">
                  <span aria-hidden className="h-4 overflow-visible whitespace-nowrap font-sans text-[10px] text-muted/80">
                    {monthAt[wi]}
                  </span>
                  {week.map((day, di) =>
                    day ? (
                      <span
                        key={di}
                        title={`${day.count} on ${day.date}`}
                        className={`aspect-square w-full rounded-[3px] ${LEVEL_CLASS[day.level]}`}
                      />
                    ) : (
                      // outside the year: holds the grid square, paints nothing
                      <span key={di} className="aspect-square w-full" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-1.5 font-sans text-[10px] text-muted/80">
            <span>Less</span>
            {LEVEL_CLASS.map((c, i) => (
              <span key={i} className={`size-[11px] rounded-[2px] ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
