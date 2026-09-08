import { skillGroups } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { TechIcon } from "./tech-icon";

/* ── Instrumentation ────────────────────────────────────────────────────────
   One continuous band per group, drifting sideways, alternating direction.

   Every previous version of this section was a static arrangement — grouped
   cards, then a constellation, then a numbered catalogue — and a wall of
   thirty-three labelled boxes is a wall however it is arranged. This is the
   opposite: nothing is boxed and nothing is aligned to a grid. The bands read
   as something running rather than something filed, which is also the only
   treatment on the page that fills the full width.

   Each band holds two copies of its group and travels exactly half its own
   width, so the loop closes on itself invisibly. Hovering a band stops it, so
   anything that catches your eye can actually be read. */

/** Slowest band takes this long; each subsequent one is a little quicker, so
 *  no two ever line up and the section never pulses as a whole. */
const BASE_SECONDS = 68;

export function Skills() {
  const total = skillGroups.reduce((n, g) => n + g.skills.length, 0);

  return (
    <section id="skills" className="scroll-mt-24 py-36 sm:py-48">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading index="03" title="Instrumentation" hint="$ ls -la ./skills" />

        <div className="mb-14 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted/70">
          <span className="term-green">◆ catalogued</span>
          <span className="h-px flex-1 bg-line" />
          <span>
            {total} instruments · {skillGroups.length} bands
          </span>
        </div>
      </div>

      {/* full bleed: the bands run past the content column on both sides */}
      <div className="space-y-3">
        {skillGroups.map((group, gi) => {
          // two copies, so the track can travel half its width and land back
          // exactly where it started
          const run = [...group.skills, ...group.skills];
          return (
            <Reveal key={group.dir} delay={gi * 0.05}>
              <div className="drift-track group/band relative border-y border-line/60 bg-bg/20 py-3">
                <div className="drift-mask overflow-hidden">
                  <div
                    className="drift flex w-max items-center gap-3"
                    style={
                      {
                        "--drift-duration": `${BASE_SECONDS - gi * 6}s`,
                        "--drift-direction": gi % 2 ? "reverse" : "normal",
                      } as React.CSSProperties
                    }
                  >
                    {run.map((skill, i) => (
                      <span
                        key={`${skill}-${i}`}
                        className="flex shrink-0 items-center gap-2.5 rounded-full border border-line px-4 py-2 font-mono text-[13px] text-fg transition-colors duration-300 hover:border-accent/60 hover:text-accent"
                      >
                        <TechIcon name={skill} size={16} />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* the band's own label, parked over the left edge */}
                <span className="pointer-events-none absolute left-6 top-1/2 z-10 -translate-y-1/2 rounded-full border border-accent/30 bg-bg px-3 py-1 font-mono text-[10px] text-accent opacity-0 transition-opacity duration-300 group-hover/band:opacity-100">
                  {group.dir}
                </span>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
