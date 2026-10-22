"use client";

import Image from "next/image";
import Link from "next/link";
import { experience, projects, type Experience as Role } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { TechIcon } from "./tech-icon";

/* ── Experience ─────────────────────────────────────────────────────────────
   One card per role, newest first, in a single column that scrolls like the
   rest of the page; each card rises in as it arrives.

   Every card has the same parts in the same places, in its company's colour:
   who and when, a one-line summary and the stack on the left; three lines on
   what I did (their numbers lit) and what was built there on the right, each
   on one line, with the year the role began standing large in the corner. */

export function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-shell scroll-mt-24 px-6 pt-16 sm:pt-24">
      <SectionHeading index="03" label="Experience" title="Where I've" accent="shipped." />

      <div className="space-y-5">
        {experience.map((e) => (
          <Reveal key={e.company} delay={0.05}>
            <Card role={e} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Set a line's numbers in the company's colour, so each one reads at a glance. */
function Figures({ text }: { text: string }) {
  return (
    <>
      {text.split(/(~?\d+(?:\.\d+)?%?)/).map((part, k) =>
        k % 2 ? (
          <span key={k} className="font-semibold text-[color-mix(in_oklab,var(--co)_55%,white)]">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Card({ role: e }: { role: Role }) {
  const current = e.period.includes("present");
  const year = e.period.match(/\d{4}/)?.[0] ?? "";
  const built = e.projects.map((slug) => projects.find((p) => p.slug === slug)).filter((p) => p !== undefined);
  const initials = e.company.replace(/[^A-Z]/g, "").slice(0, 2) || e.company[0];
  // everything built here, linked where there is a case study
  const names = [
    ...built.map((p) => ({ title: p.title, href: `/work/${p.slug}` })),
    ...(e.internal ?? []).map((t) => ({ title: t, href: "" })),
  ];

  return (
    <article
      style={{ ["--co" as string]: e.accent }}
      className="xp-card relative overflow-hidden rounded-[1.75rem] border border-white/10 p-6 sm:p-9"
    >
      {/* the company's light, and the year behind everything */}
      <span aria-hidden className="xp-glow pointer-events-none absolute inset-0" />
      <span
        aria-hidden
        className="xp-year pointer-events-none absolute -bottom-5 right-2 select-none font-sans text-[clamp(4.5rem,9vw,8rem)] font-bold leading-none tracking-[-0.06em]"
      >
        {year}
      </span>

      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:gap-12">
        {/* who, when, and with what */}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/50 shadow-[0_0_18px_-8px_var(--co)]">
              {e.logo ? (
                <Image src={e.logo} alt="" width={36} height={36} unoptimized className="size-9 object-contain" />
              ) : (
                <span className="text-2xl font-semibold tracking-tight">{initials}</span>
              )}
            </span>
            <div className="min-w-0">
              <h3 className="font-sans text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{e.company}</h3>
              <p className="mt-0.5 text-[14px] text-fg/75">
                {e.role} <span className="text-muted">· {e.location}</span>
              </p>
            </div>
          </div>

          <span className="mt-5 flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1 font-sans text-[11.5px] text-fg/85">
            <span className="relative flex size-1.5">
              {current && <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--co)] opacity-70" />}
              <span className={`relative inline-flex size-1.5 rounded-full ${current ? "bg-[var(--co)]" : "bg-muted"}`} />
            </span>
            {e.period}
          </span>

          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-fg/80">{e.summary}</p>

          <div className="mt-auto pt-6">
            <p className="font-sans text-[10.5px] uppercase tracking-[0.2em] text-muted">Stack</p>
            {/* one row on any screen wide enough for it */}
            <ul className="mt-2.5 flex flex-wrap gap-1 sm:flex-nowrap">
              {e.stack.map((t) => (
                <li
                  key={t}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[11.5px] text-fg/80"
                >
                  <TechIcon name={t} size={12} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* what I did, and what came of it */}
        <div className="flex min-w-0 flex-col">
          <ul className="space-y-4">
            {e.bullets.map((b, j) => (
              <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-fg/75">
                <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-[var(--co)]" />
                <span>
                  <Figures text={b} />
                </span>
              </li>
            ))}
            {/* what was built here, as a fourth line: the first two by name */}
            <li className="flex gap-3 text-[15px] leading-relaxed text-fg/75">
              <span aria-hidden className="w-4 shrink-0" />
              <span className="min-w-0 truncate">
                <span className="mr-2.5 font-sans text-[10.5px] uppercase tracking-[0.18em] text-muted">Built here</span>
                {names.slice(0, 2).map((x, k) => (
                  <span key={x.title}>
                    {k > 0 && <span className="mx-1.5 text-muted/50">·</span>}
                    {x.href ? (
                      <Link href={x.href} className="text-fg/80 transition-colors duration-300 hover:text-[var(--co)]">
                        {x.title}
                      </Link>
                    ) : (
                      <span className="text-fg/80">{x.title}</span>
                    )}
                  </span>
                ))}
                {names.length > 2 && (
                  <span className="ml-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-sans text-[10.5px] text-muted">
                    +{names.length - 2}
                  </span>
                )}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </article>
  );
}
