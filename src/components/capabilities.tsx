import { capabilities } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { TechIcon } from "./tech-icon";

export function Capabilities() {
  return (
    <section id="capabilities" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 sm:py-32">
      <SectionHeading index="02" title="Capabilities" hint="one developer, every surface" />

      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-2">
        {capabilities.map((c, i) => (
          <Reveal key={c.label} delay={i * 0.08} className="h-full">
            <div className="group relative flex h-full flex-col overflow-hidden bg-bg p-8 transition-colors duration-300 hover:bg-card sm:p-10">
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

              <p className="relative font-mono text-xs text-accent">{c.mono}</p>
              <h3 className="mt-3 font-sans text-2xl font-bold tracking-tight">{c.label}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">{c.body}</p>

              {/* The tools this surface is actually built with — named, and at
                  full strength. These were bare icons at 60% opacity, which
                  read as dull and made you hover each one to find out what it
                  was. Same treatment as the Skills groups now. */}
              <div className="relative mt-auto flex min-h-[5rem] flex-wrap content-start gap-x-6 gap-y-3.5 border-t border-line pt-6">
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
