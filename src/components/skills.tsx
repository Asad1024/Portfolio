import { skillGroups } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { TechIcon } from "./tech-icon";

export function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-28">
      <SectionHeading index="03" title="Skills" hint="$ ls -la ./skills" />

      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
        {skillGroups.map((group, i) => (
          <Reveal key={group.dir} delay={i * 0.06} className="h-full">
            <div className="h-full bg-bg p-8 transition-colors duration-300 hover:bg-card">
              <p className="font-mono text-sm text-accent">{group.dir}</p>
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
