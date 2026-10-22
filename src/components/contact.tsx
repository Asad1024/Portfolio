import { contact } from "@/lib/data";
import { Reveal } from "./reveal";
import { Magnetic } from "./magnetic";
import { LocalTime } from "./local-time";
import { GithubGraph } from "./github-graph";
import { CityMap } from "./city-map";
import { ArrowUpRight, Download } from "lucide-react";

export function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden">
      {/* Planet limb closing the page: one very large ellipse whose top arc is
          all that clears the container, lit along the edge. The page has been
          in open space the whole way down, so arriving somewhere gives the
          scroll an ending. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-80 overflow-hidden">
        <div
          className="absolute left-1/2 top-28 h-[110rem] w-[220%] -translate-x-1/2 rounded-[50%] border-t"
          style={{
            borderColor: "color-mix(in oklab, var(--accent) 45%, transparent)",
            background:
              "radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--accent) 13%, transparent), transparent 42%)",
            boxShadow: "0 -18px 70px -20px var(--ring)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-shell px-6 pb-44 pt-12 sm:pb-52 sm:pt-14">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
        <div>
        <Reveal>
          <p className="flex items-center gap-3 font-sans text-[11px] uppercase tracking-[0.22em]">
            <span className="text-accent">05</span>
            <span aria-hidden className="h-px w-8 bg-accent/50" />
            <span className="text-muted">Contact</span>
          </p>
          <h2 className="mt-6 max-w-5xl font-sans text-[clamp(2.3rem,5vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
            Let&apos;s build something <br className="hidden sm:block" />
            <span className="text-accent text-glow">worth shipping.</span>
          </h2>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
            Open to full-time roles and freelance builds. Tell me what you&apos;re making and where
            it needs to go.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Magnetic>
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-3 rounded-full bg-fg px-7 py-4 text-[15px] font-medium text-bg transition-opacity hover:opacity-85"
              >
                {contact.email}
                <ArrowUpRight aria-hidden className="size-4" />
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={contact.phoneHref}
                className="inline-flex items-center rounded-full border border-line px-7 py-4 text-[15px] text-fg/80 transition-colors hover:border-accent hover:text-accent"
              >
                {contact.phone}
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="/Asad-Shah-Resume.pdf"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-full border border-line px-7 py-4 text-[15px] text-fg/80 transition-colors hover:border-accent hover:text-accent"
              >
                <Download aria-hidden className="size-4" />
                Résumé
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={contact.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-line px-7 py-4 text-[15px] text-fg/80 transition-colors hover:border-accent hover:text-accent"
              >
                GitHub
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={contact.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-line px-7 py-4 text-[15px] text-fg/80 transition-colors hover:border-accent hover:text-accent"
              >
                LinkedIn
              </a>
            </Magnetic>
          </div>
        </Reveal>
        </div>

        {/* where the work happens: home and the teams, joined on a map */}
        <Reveal delay={0.1}>
          <CityMap className="mx-auto aspect-[380/230] w-full max-w-[38rem] [mask-image:radial-gradient(80%_80%_at_50%_50%,#000_62%,transparent)]" />
        </Reveal>
        </div>

        {/* live proof: the actual contribution graph */}
        <Reveal delay={0.2}>
          <GithubGraph />
        </Reveal>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 font-sans text-xs text-muted sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Asad Shah · Lahore, Pakistan
          </p>
          <LocalTime />
        </div>
      </div>
    </section>
  );
}
