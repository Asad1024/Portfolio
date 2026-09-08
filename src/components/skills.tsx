import { skillGroups } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { Constellation } from "./space/constellation";

export function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-36 sm:py-48">
      <SectionHeading index="03" title="Star Charts" hint="$ ls -la ./skills" />

      <div className="mb-12 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted/70">
        <span className="term-green">◆ catalogued</span>
        <span className="h-px flex-1 bg-line" />
        <span>
          {skillGroups.reduce((n, g) => n + g.skills.length, 0)} across{" "}
          {skillGroups.length} charts
        </span>
      </div>

      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
        {skillGroups.map((group, i) => (
          <Reveal key={group.dir} delay={i * 0.06} className="h-full">
            <div className="h-full bg-bg/60 p-8 backdrop-blur-sm transition-colors duration-300 hover:bg-card">
              <p className="font-mono text-sm text-accent">{group.dir}</p>
              <Constellation skills={group.skills} />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
