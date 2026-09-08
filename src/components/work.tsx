"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { projects } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { ProjectVisual } from "./work-preview";

const FILTERS = ["all", "web", "desktop", "ai", "cloud"] as const;

export function Work() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const shown = projects.filter((p) => filter === "all" || p.tags.includes(filter));

  return (
    <section id="work" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-28">
      <SectionHeading index="01" title="Selected Work" hint="every project, one case study each" />

      <Reveal>
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-sm text-muted">
            <span className="text-accent">$</span> ls ./projects{" "}
            <span className="text-muted/60">({shown.length})</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-1.5 font-mono text-xs transition-colors ${
                  filter === f
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line text-muted hover:border-accent/50 hover:text-fg"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((p, i) => (
            <motion.div
              key={p.slug}
              layout
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, delay: Math.min(i, 5) * 0.04, ease: [0.21, 0.6, 0.35, 1] }}
            >
              <Link
                href={`/work/${p.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line transition-all duration-300 hover:border-accent hover:shadow-[0_0_32px_-4px_var(--ring)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-card">
                  <ProjectVisual slug={p.slug} />
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-baseline justify-between gap-3 font-mono text-[11px]">
                    <span className="text-accent">{p.index}</span>
                    <span className="text-muted">{p.year}</span>
                  </div>

                  <h3 className="mt-3 font-sans text-xl font-bold leading-snug tracking-tight transition-colors duration-300 group-hover:text-accent">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.tagline}</p>

                  <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                    <p className="font-mono text-[10px] leading-relaxed text-muted/80">
                      {p.company ? `${p.company} · ` : ""}
                      {p.platform}
                    </p>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line transition-all duration-300 group-hover:rotate-45 group-hover:border-accent group-hover:text-accent">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17L17 7M17 7H8M17 7v9" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
