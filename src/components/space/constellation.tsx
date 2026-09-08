"use client";

import { useMemo, useState } from "react";
import { TechIcon } from "../tech-icon";

/* A skill group drawn as a constellation: nodes on a jittered two-column grid,
   joined in sequence by faint lines.

   The grid is what keeps it readable — a true random scatter collides labels
   at almost every group size. The jitter is deterministic (hashed from the
   skill name) so a constellation looks hand-placed but never moves between
   renders or between server and client. */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

type Node = { skill: string; x: number; y: number };

export function Constellation({ skills }: { skills: string[] }) {
  const [active, setActive] = useState<number | null>(null);

  const { nodes, rows } = useMemo(() => {
    const r = Math.ceil(skills.length / 2);
    const n: Node[] = skills.map((skill, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const j = hash(skill);
      return {
        skill,
        x: col === 0 ? 7 + j * 5 : 52 + j * 5,
        y: ((row + 0.5) / r) * 100 + (j - 0.5) * 6,
      };
    });
    return { nodes: n, rows: r };
  }, [skills]);

  return (
    <div className="relative mt-6" style={{ height: rows * 46 }}>
      {/* joining lines, behind the nodes */}
      <svg
        aria-hidden
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {nodes.slice(1).map((n, i) => {
          const p = nodes[i];
          const lit = active === i || active === i + 1;
          return (
            <line
              key={n.skill}
              x1={p.x}
              y1={p.y}
              x2={n.x}
              y2={n.y}
              stroke="var(--accent)"
              strokeWidth={lit ? 1.4 : 0.8}
              strokeOpacity={lit ? 0.75 : 0.22}
              // without this, preserveAspectRatio="none" stretches the stroke
              // itself and horizontal lines render thicker than vertical ones
              vectorEffect="non-scaling-stroke"
              className="transition-all duration-300"
            />
          );
        })}
      </svg>

      {nodes.map((n, i) => (
        <div
          key={n.skill}
          className="absolute flex min-w-0 -translate-y-1/2 items-center gap-2.5"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive(null)}
        >
          <span
            aria-hidden
            className="twinkle -ml-[3px] size-[5px] shrink-0 rounded-full bg-accent"
            style={{ animationDelay: `${hash(n.skill) * -3.5}s` }}
          />
          <span className="flex w-4 shrink-0 justify-center opacity-70">
            <TechIcon name={n.skill} size={15} />
          </span>
          <span
            className={`truncate font-mono text-[13px] transition-colors duration-300 ${
              active === i ? "text-accent" : "text-fg"
            }`}
          >
            {n.skill}
          </span>
        </div>
      ))}
    </div>
  );
}
