import { capabilities } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { TechIcon } from "./tech-icon";

export function Capabilities() {
  const total = new Set(capabilities.flatMap((c) => c.techs)).size;

  return (
    <section id="capabilities" className="mx-auto max-w-shell scroll-mt-24 px-6 py-24 sm:py-32">
      <SectionHeading index="02" title="Capabilities" hint="one developer, every surface" />

      <div className="mb-12 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-muted/90">
        <span className="term-green">◆ full stack</span>
        <span className="h-px flex-1 bg-line" />
        <span>
          {total} tools across {capabilities.length} surfaces
        </span>
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-2">
        {capabilities.map((c, i) => (
          /* Each card spans three rows of the outer grid through subgrid —
             title, description, tools — so the two cards sharing a row share
             those row heights. Whichever card's title or description runs
             longer, both tool lists start on the same line, at every width. */
          <Reveal key={c.label} delay={i * 0.08} className="row-span-3 grid grid-rows-subgrid gap-0">
            <div className="group relative row-span-3 grid grid-rows-subgrid gap-0 overflow-hidden bg-bg p-8 transition-colors duration-300 hover:bg-card sm:p-10">
              {/* orbit watermark — concentric rings tucked into the corner,
                  brightening with the card */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full border border-accent/10 transition-colors duration-500 group-hover:border-accent/25"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full border border-accent/10 transition-colors duration-500 group-hover:border-accent/20"
              />

              <div>
                <p className="relative font-mono text-xs text-accent">{c.mono}</p>
                <h3 className="mt-3 font-sans text-2xl font-bold tracking-tight">{c.label}</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">{c.body}</p>

              {/* Every tool this surface is actually built with — named, and
                  at full strength, so nothing needs hovering to identify.
                  A grid of equal columns rather than a wrapping row: with free
                  wrapping every name started wherever the previous one ended,
                  so the icons never lined up. Every card is the same width, so
                  the columns also line up from card to card. */}
              <div className="relative mt-8 grid content-start grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-x-6 gap-y-4 border-t border-line pt-6">
                {c.techs.map((t) => (
                  <span
                    key={t}
                    className="flex min-w-0 items-center gap-3 font-mono text-sm text-fg"
                  >
                    <span className="flex w-5 shrink-0 justify-center">
                      <TechIcon name={t} size={17} />
                    </span>
                    <span className="truncate">{t}</span>
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
