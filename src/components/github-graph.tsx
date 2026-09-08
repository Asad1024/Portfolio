import { contact } from "@/lib/data";
import { getYearContributions, type ContributionDay } from "@/lib/github";

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
  "bg-[color-mix(in_oklab,var(--green)_28%,transparent)]",
  "bg-[color-mix(in_oklab,var(--green)_50%,transparent)]",
  "bg-[color-mix(in_oklab,var(--green)_74%,transparent)]",
  "bg-[var(--green)]",
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

  return (
    <div className="mt-20 overflow-hidden rounded-2xl border border-line">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-card px-4 py-2.5 font-mono text-[11px] text-muted">
        <span className="truncate">
          <span className="term-green">$</span> git log --author=
          {contact.github.split("/").pop()} --since=&quot;{year}-01-01&quot;
        </span>
        <a
          href={contact.github}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 transition-colors hover:text-accent"
        >
          {contact.github.replace("https://", "")} ↗
        </a>
      </div>

      <div className="overflow-x-auto p-5">
        <div className="mx-auto w-max">
          <div className="flex items-baseline justify-between gap-6 pb-3 font-mono text-[11px]">
            <span className="text-fg">
              {data.total.toLocaleString()}{" "}
              <span className="text-muted">contributions in {year}</span>
            </span>
            <span className="text-muted/60">Jan 1 — Dec 31</span>
          </div>

          <div className="flex gap-1.5">
            {/* weekday gutter — every other row, as GitHub labels it */}
            <div
              aria-hidden
              className="grid shrink-0 grid-rows-7 gap-[3px] pr-1 font-mono text-[9px] leading-[11px] text-muted/60"
            >
              {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <span key={i} className="h-[11px]">
                  {d}
                </span>
              ))}
            </div>

            <div>
              <div aria-hidden className="mb-1 flex gap-[3px] font-mono text-[9px] text-muted/60">
                {monthAt.map((m, i) => (
                  <span key={i} className="w-[11px] shrink-0 whitespace-nowrap">
                    {m}
                  </span>
                ))}
              </div>

              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-rows-7 gap-[3px]">
                    {week.map((day, di) =>
                      day ? (
                        <span
                          key={di}
                          title={`${day.count} on ${day.date}`}
                          className={`size-[11px] rounded-[2px] ${LEVEL_CLASS[day.level]}`}
                        />
                      ) : (
                        // outside the year: holds the grid square, paints nothing
                        <span key={di} className="size-[11px]" />
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[9px] text-muted/60">
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
