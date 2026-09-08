import { stackList } from "@/lib/data";
import { TechIcon } from "./tech-icon";

export function Marquee() {
  const items = [...stackList, ...stackList];
  return (
    <div className="marquee-mask overflow-hidden border-y border-line py-5">
      <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap font-mono text-sm text-muted">
        {items.map((s, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="flex items-center gap-2.5">
              <TechIcon name={s} size={17} />
              {s}
            </span>
            <span className="text-accent">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
