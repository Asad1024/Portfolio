import { capabilities } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { TechIcon } from "./tech-icon";

export function Capabilities() {
  return (
    <section id="capabilities" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-36 sm:py-48">
      <SectionHeading index="02" title="Capabilities" hint="one developer, every surface" />

      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
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

              {/* the tools this surface is actually built with */}
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
                {c.techs.map((t) => (
                  <span
                    key={t}
                    title={t}
                    className="opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                  >
                    <TechIcon name={t} size={19} />
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
