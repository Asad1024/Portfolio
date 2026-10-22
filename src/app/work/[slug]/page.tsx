import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TechIcon } from "@/components/tech-icon";
import { projects, type Project } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { StatValue } from "@/components/stat-value";
import { ArchDiagram } from "@/components/arch-diagram";
import { ProjectVisual } from "@/components/work-preview";
import { ArrowLeft, ArrowRight, ArrowUpRight, Monitor, Plus } from "lucide-react";
import { Tilt } from "@/components/tilt";
import { AskButton } from "@/components/assistant/ask-button";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  // the title stays the site's own (see the root layout); only the summary is per project
  return { description: project?.tagline };
}

/* ── Case study ─────────────────────────────────────────────────────────────
   Ordered for someone skimming, not for someone reading top to bottom: the
   product first, then a three-line summary, then the numbers. Anyone still
   here gets how it works and the decisions behind it, and the full feature
   list waits behind a disclosure instead of standing between the reader and
   everything else. */

export default async function CaseStudy({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  const idx = projects.findIndex((p) => p.slug === slug);
  const next = projects[(idx + 1) % projects.length];

  /* Sections are numbered in the order they appear, counted rather than
     written in so adding or dropping one never leaves a gap. */
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <article className="mx-auto max-w-shell px-6 pb-28 pt-28 sm:pt-32">
      {/* header */}
      <Reveal>
        <nav aria-label="Case study" className="flex items-center justify-between gap-4 font-sans text-xs text-muted">
          <Link href="/#work" className="group inline-flex items-center gap-2 transition-colors hover:text-accent">
            <ArrowLeft aria-hidden className="size-3.5 transition-transform" /> All work
          </Link>
          <Link
            href={`/work/${next.slug}`}
            className="group hidden items-center gap-2 transition-colors hover:text-accent sm:inline-flex"
          >
            Next: {next.title}
            <ArrowRight aria-hidden className="size-3.5 transition-transform" />
          </Link>
        </nav>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-accent">
              {[project.company, project.year].filter(Boolean).join("  ·  ")}
              {/* the platform runs long; on a phone it waits for the summary card */}
              <span className="hidden sm:inline">{"  ·  "}{project.platform}</span>
            </p>
            <h1 className="mt-4 font-sans text-5xl font-bold tracking-tighter sm:text-7xl lg:text-8xl">
              {project.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted sm:text-xl">{project.tagline}</p>
            {/* the assistant, already briefed on this project */}
            <AskButton className="mt-6" prompt={`Explain ${project.title} in 30 seconds`} label="Ask about this project" />
          </div>
          <Cta project={project} />
        </div>
      </Reveal>

      {/* the product, before any words about it */}
      <Reveal delay={0.1}>
        <div className="relative mt-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-6 -inset-y-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.14),transparent_70%)] blur-2xl"
          />
          <Tilt rounded="rounded-2xl" max={2.5}>
            <Media project={project} />
          </Tilt>
        </div>
      </Reveal>

      {/* summary — the whole case study in three sentences */}
      <Reveal>
        <section
          aria-label="Summary"
          className="mt-10 grid overflow-hidden rounded-2xl border border-line bg-bg/85 lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          <dl className="divide-y divide-line">
            {(
              [
                ["Challenge", project.summary.challenge],
                ["What I built", project.summary.approach],
                ["Result", project.summary.result],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="grid gap-2 p-6 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-6 sm:p-8">
                <dt className="pt-1 font-sans text-[11px] uppercase tracking-[0.18em] text-accent">{k}</dt>
                <dd
                  className={`text-base leading-relaxed sm:text-lg ${
                    k === "Result" ? "font-medium text-fg" : "text-fg/80"
                  }`}
                >
                  {v}
                </dd>
              </div>
            ))}
          </dl>

          <aside className="border-t border-line bg-card p-6 sm:p-8 lg:border-l lg:border-t-0">
            <dl className="grid grid-cols-2 gap-5 text-sm lg:grid-cols-1">
              {(
                [
                  ["Role", project.role],
                  ["Year", project.year],
                  [project.company ? "Built at" : "Platform", project.company ?? project.platform],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="font-sans text-[11px] uppercase tracking-[0.18em] text-muted">{k}</dt>
                  <dd className="mt-1 text-fg/90">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 font-sans text-[11px] uppercase tracking-[0.18em] text-muted">Built on</p>
            <ul aria-label="Main technologies" className="mt-3 flex flex-wrap gap-2">
              {project.keyStack.map((s) => (
                <li
                  key={s}
                  className="flex items-center gap-2 rounded-full border border-line bg-bg/60 px-3 py-1.5 text-xs text-fg/90"
                >
                  <TechIcon name={s} size={14} />
                  {s}
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </Reveal>

      {/* outcome */}
      <Section n={num()} title="Outcomes">
        <div
          className={`grid gap-px overflow-hidden rounded-2xl border border-line bg-line ${
            project.outcome.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
          }`}
        >
          {project.outcome.map((o) => (
            <div key={o.label} className="bg-bg/90 p-7 sm:p-9">
              <p className="font-sans text-5xl font-bold tracking-tight text-accent sm:text-6xl">
                <StatValue value={o.value} />
              </p>
              <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-muted">{o.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* architecture */}
      <Section n={num()} title="How it works">
        <ArchDiagram cols={project.arch.cols} caption={project.arch.caption} />
      </Section>

      {/* decisions, told as the story of the build */}
      <Section n={num()} title="Build story">
        <ol
          className={`grid gap-4 ${project.decisions.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}
        >
          {project.decisions.map((d, i) => (
            <li
              key={d.title}
              className="flex flex-col rounded-2xl border border-line bg-bg/80 p-6 transition-colors hover:border-accent/45 sm:p-7"
            >
              <span className="font-sans text-4xl font-bold tracking-tight text-accent/35">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-sans text-xl font-bold tracking-tight">{d.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{d.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* everything else, for the reader who wants it */}
      <Reveal>
        <details className="group mt-6 rounded-2xl border border-line bg-bg/80 open:border-accent/35">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 transition-colors hover:text-accent sm:p-8 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block font-sans text-lg font-bold tracking-tight">Full breakdown</span>
              <span className="mt-1 block text-sm text-muted">
                Overview, the problem, and all {project.built.length} features
              </span>
            </span>
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line transition-transform duration-300 group-open:rotate-45"
            >
              <Plus className="size-4" />
            </span>
          </summary>
          <div className="border-t border-line p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-accent">Overview</p>
                <p className="mt-3 leading-relaxed text-fg/80">{project.overview}</p>
              </div>
              <div>
                <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-accent">The problem</p>
                <p className="mt-3 leading-relaxed text-fg/80">{project.problem}</p>
              </div>
            </div>
            <p className="mt-10 font-sans text-[11px] uppercase tracking-[0.18em] text-accent">Features</p>
            <ul className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2">
              {project.built.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </details>
      </Reveal>

      {/* full stack */}
      <Section n={num()} title="Stack">
        <ul className="flex flex-wrap gap-2.5">
          {project.stack.map((s) => (
            <li
              key={s}
              className="flex items-center gap-2.5 rounded-full border border-line bg-[rgba(11,13,20,0.85)] px-4 py-2 font-sans text-xs text-fg/90 transition-colors hover:border-accent/45"
            >
              <TechIcon name={s} size={15} />
              {s}
            </li>
          ))}
        </ul>
      </Section>

      {/* next project */}
      <Reveal>
        <Link
          href={`/work/${next.slug}`}
          className="group mt-24 grid items-center gap-6 overflow-hidden rounded-2xl border border-line bg-bg/80 p-6 transition-colors hover:border-accent sm:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] sm:p-8"
        >
          <div>
            <p className="flex items-center gap-1.5 font-sans text-xs text-muted">Next project <ArrowRight aria-hidden className="size-3.5" /></p>
            <p className="mt-2 font-sans text-3xl font-bold tracking-tight transition-colors group-hover:text-accent sm:text-5xl">
              {next.title}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{next.tagline}</p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line bg-void">
            <ProjectVisual slug={next.slug} sizes="(max-width: 640px) 100vw, 352px" />
          </div>
        </Link>
      </Reveal>
    </article>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section className="mt-24">
        <div className="mb-8 flex items-center gap-4">
          <span className="font-sans text-xs text-accent">{n}</span>
          <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
          <span aria-hidden className="h-px flex-1 bg-line" />
        </div>
        {children}
      </section>
    </Reveal>
  );
}

function Cta({ project }: { project: Project }) {
  if (project.link) {
    return (
      <a
        href={project.link}
        target="_blank"
        rel="noreferrer"
        className="group inline-flex items-center gap-2 self-start justify-self-start rounded-full bg-fg px-6 py-3 font-sans text-xs text-bg transition-opacity hover:opacity-85 lg:self-end"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-accent" />
        </span>
        Visit live site
        <ArrowUpRight aria-hidden className="size-3.5 transition-transform" />
      </a>
    );
  }
  if (project.platform.includes("Desktop")) {
    return (
      <span className="inline-flex items-center gap-2 self-start justify-self-start rounded-full border border-line px-5 py-2.5 font-sans text-xs text-muted lg:self-end">
        <Monitor aria-hidden className="size-3.5" />
        Desktop app, shipped as an installer
      </span>
    );
  }
  return null;
}

/** The product in a window frame: the real screenshot where there is one,
 *  the hand-built mockup otherwise, so no case study opens on words alone. */
function Media({ project }: { project: Project }) {
  const address = project.link
    ? project.link.replace("https://", "").replace(/\/$/, "")
    : project.title.toLowerCase().replace(/\s+/g, "-");

  const frame = (
    <>
      <div className="flex items-center gap-1.5 border-b border-line bg-[#0b0d14] px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="mx-auto truncate rounded-md border border-line bg-bg/70 px-4 py-1 font-mono text-[11px] text-muted sm:min-w-72 sm:text-center">
          {address}
        </span>
        {project.link ? (
          <span className="hidden font-sans text-xs text-muted transition-colors group-hover:text-accent sm:block">
            open <ArrowUpRight aria-hidden className="inline size-3.5" />
          </span>
        ) : (
          <span className="hidden w-12 sm:block" />
        )}
      </div>
      {project.image ? (
        <div className="overflow-hidden">
          <Image
            src={project.image}
            alt={`${project.title}: product screenshot`}
            placeholder="blur"
            loading="eager"
            fetchPriority="high"
            // the frame caps at the shell width; without this it serves the
            // full ~1900px asset to every viewport wide enough to ask
            sizes="(max-width: 1280px) 100vw, 1232px"
            className="w-full transition-transform duration-700 ease-out"
          />
        </div>
      ) : (
        <div className="tele-grid relative aspect-[4/3] overflow-hidden bg-void sm:aspect-[16/8]">
          <ProjectVisual slug={project.slug} variant="hero" />
        </div>
      )}
    </>
  );

  const shell =
    "group relative block overflow-hidden rounded-2xl border border-line bg-void shadow-[0_40px_120px_-40px_rgba(34,211,238,0.35)] transition-colors hover:border-accent/50";
  return project.link ? (
    <a href={project.link} target="_blank" rel="noreferrer" className={shell}>
      {frame}
    </a>
  ) : (
    <div className={shell}>{frame}</div>
  );
}
