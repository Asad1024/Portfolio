import Image from "next/image";
import Link from "next/link";
import { profile, projects } from "@/lib/data";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { ArrowUpRight, Briefcase, Building2, Layers, Lock, MapPin, Package, ShieldCheck, type LucideIcon } from "lucide-react";
import { CountUp } from "./count-up";
import { Tilt } from "./tilt";

/* How I work, as claims each backed by a project you can open, rather than
   slogans anyone could put on a page; shown as three small cards. */
const principles: { title: string; body: string; proof: string; icon: LucideIcon }[] = [
  {
    icon: Layers,
    title: "Slow work goes on a queue",
    body: "Sends, renders, enrichment, and AI replies run as jobs, so a slow provider never stalls the person clicking.",
    proof: "outbound-copilot",
  },
  {
    icon: ShieldCheck,
    title: "AI drafts, rules decide",
    body: "Every AI feature ships with a gate: approval rules, a grounding badge, or a fail-closed check.",
    proof: "voice-agents",
  },
  {
    icon: Lock,
    title: "Sensitive data stays local",
    body: "When the input is source code or a live call, nothing leaves the machine. No upload, no server.",
    proof: "codevault",
  },
];

export function About() {
  // numbers count up as they arrive
  const facts: { label: string; icon: LucideIcon; value: React.ReactNode }[] = [
    { label: "Based in", icon: MapPin, value: "Lahore, Pakistan" },
    { label: "Experience", icon: Briefcase, value: <><CountUp to={3} />+ years</> },
    { label: "Shipped", icon: Package, value: <><CountUp to={projects.length} /> products</> },
    { label: "Currently", icon: Building2, value: "Spark AI, remote" },
  ];

  return (
    <section id="about" className="mx-auto max-w-shell scroll-mt-24 px-6 pt-16 sm:pt-24">
      <SectionHeading index="04" label="About" title="Beyond" accent="the code." />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        {/* portrait + facts; on a wide screen the column takes the height of
            the text beside it, the facts sit at the bottom and the photo fills
            what is left, so both columns end on the same line */}
        <Reveal className="h-full">
          <div className="flex h-full flex-col">
            <Tilt max={7} className="lg:min-h-0 lg:flex-1">
              <div className="ab-frame relative h-full rounded-3xl">
                <Portrait />
              </div>
            </Tilt>
            <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
              {facts.map(({ label, icon: Icon, value }) => (
                <div key={label} className="group/fact flex items-start gap-3 bg-bg/90 p-4 sm:p-5">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/[0.08] transition-colors group-hover/fact:border-accent/50">
                    <Icon aria-hidden className="size-4 text-accent" />
                  </span>
                  <div className="min-w-0">
                    <dt className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted">{label}</dt>
                    <dd className="mt-1 text-[15px] text-fg">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <div>
          <Reveal delay={0.08}>
            <p className="font-sans text-2xl font-medium leading-snug tracking-[-0.02em] text-fg sm:text-[2rem]">
              I take products from a blank repo to{" "}
              <span className="text-accent">real users</span>: the
              schema, the API, the billing, the AI pipeline, and the interface people actually
              touch.
            </p>
            <div className="mt-6 space-y-4 text-[16.5px] leading-relaxed text-muted">
              <p>
                Lately that means AI SaaS: voice agents, an outbound sales copilot, booking and CRM
                platforms. Five are live at <span className="text-fg">Spark AI</span>, where I work
                remotely with a team in Dubai.
              </p>
              <p>
                I like the whole stack, because the interesting bugs live{" "}
                <span className="text-fg">between the layers</span>.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="mt-12 font-sans text-[11px] uppercase tracking-[0.22em] text-muted">
              How I work
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {principles.map((p, i) => {
                const project = projects.find((x) => x.slug === p.proof);
                const Icon = p.icon;
                return (
                  <li key={p.title} className="ab-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] p-5">
                    <span aria-hidden className="ab-card-glow pointer-events-none absolute inset-0" />
                    <div className="relative flex items-center justify-between">
                      <span className="flex size-10 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 transition-transform duration-500">
                        <Icon aria-hidden className="size-[18px] text-accent" />
                      </span>
                      <span className="font-sans text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="relative mt-4 text-[16px] font-semibold leading-snug tracking-tight text-fg">{p.title}</h3>
                    <p className="relative mt-1.5 text-[13.5px] leading-relaxed text-muted">{p.body}</p>
                    {project && (
                      <Link
                        href={`/work/${project.slug}`}
                        className="relative mt-auto inline-flex items-center gap-1 pt-4 font-sans text-[11px] text-fg/70 transition-colors hover:text-accent"
                      >
                        see {project.title}
                        <ArrowUpRight aria-hidden className="size-3.5 transition-transform" />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** The photo when there is one; until then a monogram that looks intended,
 *  not like a missing image. Either way it sits in the same orbit frame. */
function Portrait() {
  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <div className="group relative aspect-[4/5] overflow-hidden rounded-3xl border border-line bg-void lg:aspect-auto lg:h-full lg:min-h-[20rem]">
      {profile.photo ? (
        <>
          {/* The photo is bright and shot on a light wall; toned down a step and
              washed faintly toward the accent it sits in the night palette, and
              it warms back to full colour under the pointer. */}
          <Image
            src={profile.photo}
            alt={profile.name}
            fill
            sizes="(max-width: 1024px) 100vw, 480px"
            className="object-cover object-[50%_20%] brightness-[0.82] contrast-[1.06] saturate-[0.9] transition-[filter,transform] duration-700 ease-out group-hover:brightness-95 group-hover:saturate-100"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_45%,color-mix(in_oklab,var(--violet)_18%,transparent))] mix-blend-soft-light transition-opacity duration-700 group-hover:opacity-50"
          />
          {/* a vignette, so the bright wall behind fades into the night around it */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_75%_at_50%_35%,transparent_45%,rgba(4,6,12,0.7))] transition-opacity duration-700 group-hover:opacity-70"
          />
        </>
      ) : (
        <div aria-label={profile.name} role="img" className="tele-grid absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_70%)]" />
          {[78, 58, 38].map((size, i) => (
            <span
              key={size}
              aria-hidden
              className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/20"
              style={{ width: `${size}%`, aspectRatio: "1", opacity: 1 - i * 0.15 }}
            />
          ))}
          <span
            aria-hidden
            className="marker-orbit absolute left-1/2 top-[45%] block size-[78%] -translate-x-1/2 -translate-y-1/2"
            style={{ aspectRatio: "1", height: "auto" }}
          >
            <span className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_16px_4px_var(--ring)]" />
          </span>
          <span className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 font-sans text-[clamp(5rem,12vw,8.5rem)] font-semibold leading-none tracking-[-0.05em] text-fg">
            {initials}
          </span>
        </div>
      )}

      {/* caption bar */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-bg/95 via-bg/70 to-transparent p-5 pt-14">
        <div>
          <p className="text-lg font-semibold tracking-tight text-fg">{profile.name}</p>
          <p className="text-sm text-muted">Full-stack developer</p>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-sans text-[11px] text-accent">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
          </span>
          available
        </span>
      </div>
    </div>
  );
}
