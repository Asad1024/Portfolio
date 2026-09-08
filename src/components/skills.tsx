import { skillGroups } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { TechIcon } from "./tech-icon";

/* Six boxes, one per group, hairline-separated. The single-pixel gaps come
   from the grid's own background showing through, so the dividers stay exactly
   one pixel at any zoom rather than doubling where two borders meet. */
export function Skills() {
  const total = skillGroups.reduce((n, g) => n + g.skills.length, 0);

  return (
    <section id="skills" className="mx-auto max-w-shell scroll-mt-24 px-6 py-24 sm:py-32">
      <SectionHeading index="03" title="Skills" hint="$ ls -la ./skills" />

      <div className="mb-12 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted/70">
        <span className="term-green">◆ catalogued</span>
        <span className="h-px flex-1 bg-line" />
        <span>
          {total} across {skillGroups.length} groups
        </span>
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
        {skillGroups.map((group, i) => (
          <Reveal key={group.dir} delay={i * 0.06} className="h-full">
            <div className="h-full bg-bg p-8 transition-colors duration-300 hover:bg-card">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-mono text-sm text-accent">{group.dir}</p>
                <span className="font-mono text-[10px] tabular-nums text-muted/50">
                  {String(group.skills.length).padStart(2, "0")}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    className="flex min-w-0 items-center gap-3 font-mono text-sm text-fg"
                  >
                    <span className="flex w-5 shrink-0 justify-center">
                      <TechIcon name={skill} size={17} />
                    </span>
                    <span className="truncate">{skill}</span>
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
