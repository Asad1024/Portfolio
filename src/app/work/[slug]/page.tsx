import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TechIcon } from "@/components/tech-icon";
import { projects } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { StatValue } from "@/components/stat-value";
import { ArchDiagram } from "@/components/arch-diagram";
import { CodeBlock } from "@/components/code-block";

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
  return {
    title: project ? `${project.title} — Asad` : "Work — Asad",
    description: project?.tagline,
  };
}

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

  return (
    <article className="mx-auto max-w-4xl px-6 pb-28 pt-36">
      {/* header */}
      <Reveal>
        <Link
          href="/#work"
          className="group inline-flex items-center gap-2 font-mono text-xs text-muted transition-colors hover:text-accent"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span> cd ..
        </Link>
        <p className="mt-10 font-mono text-sm text-accent">
          {project.index} / {project.platform}
        </p>
        <h1 className="mt-4 font-sans text-6xl font-bold tracking-tighter sm:text-8xl">
          {project.title}
        </h1>
        <p className="mt-4 max-w-2xl text-xl text-muted">{project.tagline}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {project.link ? (
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3 font-mono text-xs text-bg transition-opacity hover:opacity-85"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              visit live site
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                <path d="M7 17L17 7M17 7H8M17 7v9" />
              </svg>
            </a>
          ) : project.platform.includes("Desktop") ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-mono text-xs text-muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
              </svg>
              desktop app — distributed as an installer
            </span>
          ) : null}
        </div>
      </Reveal>

      {/* meta strip */}
      <Reveal delay={0.1}>
        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line font-mono text-xs sm:grid-cols-4">
          {[
            ["year", project.year],
            ["role", project.role],
            [project.company ? "built at" : "platform", project.company ?? project.platform],
            ["stack", project.stack.slice(0, 3).join(", ") + " +"],
          ].map(([k, v]) => (
            <div key={k} className="bg-bg p-4">
              <p className="text-accent">{k}</p>
              <p className="mt-1 leading-relaxed text-muted">{v}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* product screenshot — links out when the project is publicly reachable */}
      {project.image && (
        <Reveal delay={0.12}>
          {(() => {
            const Frame = (
              <>
                <div className="flex items-center gap-1.5 border-b border-line bg-card px-4 py-2.5">
                  <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="size-2.5 rounded-full bg-[#febc2e]" />
                  <span className="size-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-3 truncate font-mono text-[11px] text-muted">
                    {project.link
                      ? project.link.replace("https://", "").replace(/\/$/, "")
                      : project.title.toLowerCase().replace(/\s+/g, "-")}
                  </span>
                  {project.link && (
                    <span className="ml-auto hidden font-mono text-[11px] text-muted transition-colors group-hover:text-accent sm:block">
                      open ↗
                    </span>
                  )}
                </div>
                <div className="overflow-hidden">
                  <Image
                    src={project.image!}
                    alt={`${project.title} — product screenshot`}
                    priority
                    className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                  />
                </div>
              </>
            );
            const shell =
              "group mt-14 block overflow-hidden rounded-2xl border border-line transition-colors hover:border-accent/50";
            return project.link ? (
              <a href={project.link} target="_blank" rel="noreferrer" className={shell}>
                {Frame}
              </a>
            ) : (
              <div className={shell}>{Frame}</div>
            );
          })()}
        </Reveal>
      )}

      {/* overview */}
      <Reveal delay={0.15}>
        <p className="mt-16 text-2xl font-medium leading-relaxed tracking-tight sm:text-3xl">
          {project.overview}
        </p>
      </Reveal>

      {/* problem */}
      <Section mono="01_problem">
        <p className="text-lg leading-relaxed text-muted">{project.problem}</p>
      </Section>

      {/* built */}
      <Section mono="02_what-i-built">
        <ul className="space-y-4">
          {project.built.map((b, i) => (
            <li key={i} className="flex gap-4 text-lg leading-relaxed text-muted">
              <span className="mt-0.5 font-mono text-sm text-accent">▸</span>
              {b}
            </li>
          ))}
        </ul>
      </Section>

      {/* real code */}
      {project.snippet && (
        <Section mono="03_code">
          <CodeBlock
            code={project.snippet.code}
            lang={project.snippet.lang}
            file={project.snippet.file}
            note={project.snippet.note}
          />
        </Section>
      )}

      {/* architecture */}
      <Section mono="04_architecture">
        <ArchDiagram cols={project.arch.cols} caption={project.arch.caption} />
      </Section>

      {/* decisions */}
      <Section mono="05_decisions">
        <div className="grid gap-6 sm:grid-cols-2">
          {project.decisions.map((d) => (
            <div key={d.title} className="rounded-xl border border-line bg-card p-7">
              <h3 className="font-sans text-lg font-bold tracking-tight">{d.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{d.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* outcome */}
      <Section mono="06_outcome">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          {project.outcome.map((o) => (
            <div key={o.label} className="bg-bg p-8 text-center">
              <p className="font-sans text-5xl font-bold tracking-tight text-accent">
                <StatValue value={o.value} />
              </p>
              <p className="mt-3 font-mono text-xs text-muted">{o.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* full stack list */}
      <Reveal>
        <div className="mt-20 flex flex-wrap gap-2">
          {project.stack.map((s) => (
            <span key={s} className="flex items-center gap-2 rounded-full border border-line px-4 py-1.5 font-mono text-xs text-muted">
              <TechIcon name={s} size={13} />
              {s}
            </span>
          ))}
        </div>
      </Reveal>

      {/* next project */}
      <Reveal>
        <Link
          href={`/work/${next.slug}`}
          className="group mt-24 flex items-center justify-between rounded-2xl border border-line p-8 transition-colors hover:border-accent sm:p-10"
        >
          <div>
            <p className="font-mono text-xs text-muted">next_project →</p>
            <p className="mt-2 font-sans text-3xl font-bold tracking-tight transition-colors group-hover:text-accent sm:text-4xl">
              {next.title}
            </p>
          </div>
          <span className="flex size-12 items-center justify-center rounded-full border border-line transition-all duration-300 group-hover:rotate-45 group-hover:border-accent group-hover:text-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M17 7H8M17 7v9" />
            </svg>
          </span>
        </Link>
      </Reveal>
    </article>
  );
}

function Section({ mono, children }: { mono: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section className="mt-20 border-t border-line pt-10">
        <p className="mb-6 font-mono text-sm text-accent">/{mono}</p>
        {children}
      </section>
    </Reveal>
  );
}
