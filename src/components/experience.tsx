import { experience } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-28">
      <SectionHeading index="04" title="Experience" hint="$ git log --career" />

      <div className="flex flex-col">
        {experience.map((e, i) => (
          <Reveal key={e.company} delay={i * 0.06}>
            <div className="grid gap-4 border-t border-line py-10 last:border-b md:grid-cols-[14rem_1fr] md:gap-10">
              <div className="font-mono text-xs leading-relaxed text-muted">
                <p className="text-accent">{e.period}</p>
                <p className="mt-1">{e.location}</p>
              </div>
              <div>
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
    </section>
  );
}
