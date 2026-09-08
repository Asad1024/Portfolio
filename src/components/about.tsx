import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const principles = [
  ["ship > perfect", "Working software in users' hands beats elegant software on a branch."],
  ["boring infrastructure", "Excitement belongs in the product, not in the deploy pipeline."],
  ["latency is a feature", "Milliseconds are designed, budgeted, and measured — not hoped for."],
  ["own the whole stack", "From the pixel to the queue worker. No hand-offs, no gaps."],
];

export function About() {
  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 sm:py-32">
      <SectionHeading index="05" title="About" hint="$ cat about.md" />

      <div className="grid gap-20 lg:grid-cols-[3fr_2fr]">
        <Reveal>
          <div className="space-y-6 text-lg leading-relaxed text-muted">
            <p>
              I&apos;m a full-stack developer from Lahore with{" "}
              <span className="text-fg">3+ years building production AI SaaS</span> —
              voice agents, video funnel builders, booking platforms, outreach CRMs —
              each one taken from blank repo to live product with real users.
            </p>
            <p>
              My range is the point: the same person who designs the multi-tenant
              schema also writes the NestJS API, the Stripe billing flow, the LLM
              pipeline, the Flutter or Electron client, and the 200ms of animation
              that makes it feel right.
            </p>
            <p>
              Currently at <span className="text-fg">Spark AI</span> (remote, Dubai),
              where I&apos;ve shipped five live AI platforms — and open to interesting
              problems.
            </p>
          </div>
        </Reveal>

        <div className="space-y-px overflow-hidden rounded-2xl border border-line bg-line">
          {principles.map(([title, body], i) => (
            <Reveal key={title} delay={i * 0.07}>
              <div className="bg-bg p-6 transition-colors hover:bg-card">
                <p className="font-mono text-sm text-accent">{`// ${title}`}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
