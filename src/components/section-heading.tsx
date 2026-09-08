import { Reveal } from "./reveal";
import { ScrambleText } from "./scramble-text";

export function SectionHeading({
  index,
  title,
  hint,
}: {
  index: string;
  title: string;
  hint?: string;
}) {
  return (
    <Reveal>
      <div className="mb-14 flex items-end justify-between gap-4">
        <h2 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="mr-3 font-mono text-base font-normal text-accent sm:text-lg">
            /{index}
          </span>
          <ScrambleText text={title} />
        </h2>
        {hint && <p className="hidden font-mono text-xs text-muted sm:block">{hint}</p>}
      </div>
    </Reveal>
  );
}
