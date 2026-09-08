import { contact } from "@/lib/data";
import { Reveal } from "./reveal";
import { Magnetic } from "./magnetic";
import { LocalTime } from "./local-time";
import { GithubGraph } from "./github-graph";

export function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden border-t border-line">
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

      <div className="relative mx-auto max-w-6xl px-6 pb-56 pt-36 sm:pb-72 sm:pt-48">
        <Reveal>
          <p className="font-mono text-xs text-muted">
            <span className="term-green">$</span> ./start-a-project.sh
          </p>
          <h2 className="mt-6 max-w-3xl font-sans text-5xl font-bold leading-[1.05] tracking-tighter sm:text-7xl">
            Let&apos;s build something{" "}
            <span className="text-accent text-glow">worth shipping.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Magnetic>
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-3 rounded-full bg-fg px-7 py-4 font-mono text-sm text-bg transition-opacity hover:opacity-85"
              >
                {contact.email}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H8M17 7v9" />
                </svg>
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={contact.phoneHref}
                className="rounded-full border border-line px-7 py-4 font-mono text-sm text-muted transition-colors hover:border-accent hover:text-accent"
              >
                {contact.phone}
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="/Asad-Shah-Resume.pdf"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-full border border-line px-7 py-4 font-mono text-sm text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" />
                </svg>
                resume
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={contact.github}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line px-7 py-4 font-mono text-sm text-muted transition-colors hover:border-accent hover:text-accent"
              >
                github
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={contact.linkedin}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line px-7 py-4 font-mono text-sm text-muted transition-colors hover:border-accent hover:text-accent"
              >
                linkedin
              </a>
            </Magnetic>
          </div>
        </Reveal>

        {/* live proof: the actual contribution graph */}
        <Reveal delay={0.2}>
          <GithubGraph />
        </Reveal>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 font-mono text-xs text-muted sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Asad Shah — {contact.location}
          </p>
          <LocalTime />
          <p className="text-muted/80">
            built with Next.js 16 · Tailwind 4 · Three.js · GLSL shaders · CSS 3D
          </p>
          <p>
            <span className="text-accent">exit 0</span>
          </p>
        </div>
      </div>
    </section>
  );
}
