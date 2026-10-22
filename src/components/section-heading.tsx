import { Reveal } from "./reveal";
import { SplitReveal } from "./split-reveal";

/* Every section opens the same way: a small numbered label, a large headline
   with its last word or two set in the accent colour, and an optional line of
   context on the right. One pattern, so the page reads as one piece. */
export function SectionHeading({
  index,
  label,
  title,
  accent,
  hint,
}: {
  index: string;
  label: string;
  title: string;
  /** set in the accent colour, after the title */
  accent?: string;
  hint?: string;
}) {
  return (
    <Reveal>
      <div className="mb-8 grid gap-6 sm:mb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-end">
        <div>
          <p className="flex items-center gap-3 font-sans text-[11px] uppercase tracking-[0.22em]">
            <span className="text-accent">{index}</span>
            <span aria-hidden className="h-px w-8 bg-accent/50" />
            <span className="sr-only">{label}</span>
          </p>
          <h2 className="mt-3 font-sans text-[clamp(2rem,4.4vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.035em]">
            <SplitReveal text={title} />
            {accent && (
              <>
                {" "}
                <SplitReveal
                  text={accent}
                  delay={title.split(" ").length * 0.07}
                  className="text-accent"
                />
              </>
            )}
          </h2>
        </div>
        {hint && <p className="text-[15px] leading-relaxed text-muted lg:text-right">{hint}</p>}
      </div>
    </Reveal>
  );
}
