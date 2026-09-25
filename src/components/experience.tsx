import { experience } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

/* Mission log: one continuous spine with a node per posting, read top-down as
   a transmission history rather than a CV table. */
export function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-shell scroll-mt-24 px-6 py-24 sm:py-32">
      <SectionHeading index="03" title="Mission Log" hint="$ git log --career" />

      <div className="mb-12 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-muted/90">
        <span className="term-green">◆ transmission archive</span>
        <span className="h-px flex-1 bg-line" />
        <span>{experience.length} postings</span>
      </div>

      <div className="relative">
        {/* the spine — fades out at the bottom so the log reads as ongoing */}
        <div
          aria-hidden
          className="absolute bottom-0 left-[7px] top-2 w-px bg-[linear-gradient(180deg,var(--accent),color-mix(in_oklab,var(--accent)_35%,transparent)_65%,transparent)] sm:left-[calc(14rem+7px)]"
        />

        <div className="flex flex-col">
          {experience.map((e, i) => (
            <Reveal key={e.company} delay={i * 0.06}>
              <div className="grid gap-4 py-10 pl-9 sm:grid-cols-[14rem_1fr] sm:gap-10 sm:pl-0">
                <div className="relative font-mono text-xs leading-relaxed text-muted sm:pr-9 sm:text-right">
                  {/* node */}
                  <span
                    aria-hidden
                    className="absolute -left-9 top-1 flex size-[15px] items-center justify-center sm:left-auto sm:right-0 sm:translate-x-1/2"
                  >
                    <span className="absolute size-[15px] rounded-full border border-accent/45" />
                    <span className="size-[7px] rounded-full bg-accent shadow-[0_0_12px_2px_var(--ring)]" />
                  </span>
                  <p className="text-accent">{e.period}</p>
                  <p className="mt-1">{e.location}</p>
                </div>

                <div className="rounded-xl border border-line bg-bg/40 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-accent/45">
                  <h3 className="font-sans text-2xl font-bold tracking-tight">
                    {e.company}
                    <span className="ml-3 font-mono text-sm font-normal text-muted">
                      {e.role}
                    </span>
                  </h3>
                  {e.bullets.length > 0 && (
                    <ul className="mt-4 space-y-2.5">
                      {e.bullets.map((b, j) => (
                        <li key={j} className="flex gap-3 text-sm leading-relaxed text-muted">
                          <span className="mt-0.5 font-mono text-xs text-accent">▸</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
