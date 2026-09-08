"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { contact, projects, skillGroups, stackList } from "@/lib/data";

type Line = { type: "input" | "output" | "accent"; text: string };

const WELCOME: Line[] = [
  { type: "accent", text: "asad-os v3.0.0 — orbital shell" },
  { type: "output", text: "type a command, or pick one below." },
];

/* Shown as buttons under the prompt on open. A shell that greets you with
   nothing but "type help" is a dead end for anyone who doesn't already know
   what it accepts — these make the useful half of it reachable in one click,
   while still teaching the command by putting the real word on the chip. */
const SUGGESTIONS = ["palette", "projects", "resume", "contact", "help"];

export function Terminal() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>(WELCOME);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const KONAMI = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
    ];
    let konamiIdx = 0;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "`" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
      // konami code easter egg
      if (tag !== "INPUT" && tag !== "TEXTAREA") {
        konamiIdx = e.key === KONAMI[konamiIdx] ? konamiIdx + 1 : e.key === KONAMI[0] ? 1 : 0;
        if (konamiIdx === KONAMI.length) {
          konamiIdx = 0;
          setOpen(true);
          setLines((l) => [
            ...l,
            { type: "accent", text: "↑↑↓↓←→←→BA — konami code accepted." },
            { type: "output", text: "30 extra lives granted. you clearly grew up right." },
            { type: "accent", text: "achievement unlocked: hire this person." },
          ]);
        }
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-terminal", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-terminal", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  const run = useCallback(
    (raw: string) => {
      const cmd = raw.trim();
      const out: Line[] = [{ type: "input", text: cmd }];
      const [name, ...args] = cmd.split(/\s+/);

      switch (name) {
        case "":
          break;
        case "help":
          out.push(
            { type: "output", text: "help          this list" },
            { type: "output", text: "neofetch      system info" },
            { type: "output", text: "whoami        who is asad" },
            { type: "output", text: "projects      list case studies" },
            { type: "output", text: "open <name>   open a case study" },
            { type: "output", text: "stack         technologies I use" },
            { type: "output", text: "skills        skill matrix by domain" },
            { type: "output", text: "resume        download my CV" },
            { type: "output", text: "contact       how to reach me" },
            { type: "output", text: "matrix        …you know what this does" },
            { type: "output", text: "palette       open the command palette" },
            { type: "output", text: "clear         clear the screen" },
            { type: "output", text: "exit          close terminal" },
          );
          break;
        case "whoami":
          out.push(
            { type: "accent", text: "asad shah — full-stack developer · lahore, pk" },
            { type: "output", text: "web · mobile (flutter/rn) · desktop (electron) · cloud · ai" },
            { type: "output", text: "3+ years shipping production AI SaaS, blank repo → live users." },
          );
          break;
        case "projects":
        case "ls":
          projects.forEach((p) =>
            out.push({ type: "output", text: `${p.slug.padEnd(14)} ${p.tagline}` }),
          );
          out.push({ type: "accent", text: `hint: open ${projects[0].slug}` });
          break;
        case "open": {
          const p = projects.find((x) => x.slug === args[0]);
          if (p) {
            out.push({ type: "accent", text: `opening /work/${p.slug} ...` });
            setTimeout(() => {
              setOpen(false);
              router.push(`/work/${p.slug}`);
            }, 400);
          } else {
            out.push({ type: "output", text: `not found: '${args[0] ?? ""}' — try 'projects'` });
          }
          break;
        }
        case "stack":
          out.push({ type: "output", text: stackList.join(" · ") });
          break;
        case "skills":
          skillGroups.forEach((g) =>
            out.push({
              type: "output",
              text: `${g.dir.padEnd(18)}${g.skills.join(", ")}`,
            }),
          );
          out.push({ type: "accent", text: "full matrix at /#skills" });
          break;
        case "contact":
          out.push(
            { type: "accent", text: `email     ${contact.email}` },
            { type: "output", text: `phone     ${contact.phone}` },
            { type: "output", text: `github    ${contact.github}` },
            { type: "output", text: `linkedin  ${contact.linkedin}` },
          );
          break;
        case "neofetch": {
          const art = [
            "    ▄▄▄▄▄▄▄",
            "  ▄█████████▄",
            "  ███ ▀▀▀ ███",
            "  ███▄▄▄▄▄███",
            "   ▀███████▀",
            "     ▀▀▀▀▀",
            "",
            "",
          ];
          const info = [
            "asad@portfolio",
            "──────────────────────────────",
            "Role        Full-Stack Developer",
            "Company     Spark AI · Dubai",
            "Location    Lahore, PK",
            "Experience  3+ years",
            "Stack       TS · React · NestJS · AI",
            "Shipped     " + projects.length + " products",
          ];
          art.forEach((line, i) =>
            out.push({
              type: i < 6 ? "accent" : "output",
              text: line.padEnd(16) + (info[i] ?? ""),
            }),
          );
          break;
        }
        case "resume":
        case "cv":
          out.push({ type: "accent", text: "fetching Asad-Shah-Resume.pdf ..." });
          setTimeout(() => window.open("/Asad-Shah-Resume.pdf", "_blank"), 400);
          break;
        case "matrix":
          out.push({ type: "accent", text: "wake up, Neo..." });
          setTimeout(() => {
            setOpen(false);
            window.dispatchEvent(new CustomEvent("run-matrix"));
          }, 500);
          break;
        case "palette":
          out.push({ type: "accent", text: "opening command palette ..." });
          setOpen(false);
          window.dispatchEvent(new CustomEvent("open-palette"));
          break;

        case "clear":
          setLines([]);
          setValue("");
          return;
        case "exit":
          setOpen(false);
          break;
        case "sudo":
          out.push({ type: "accent", text: "permission granted. you clearly have taste — let's talk." });
          break;
        default:
          out.push({ type: "output", text: `command not found: ${name} — try 'help'` });
      }

      setLines((l) => [...l, ...out]);
      if (cmd) setHistory((h) => [cmd, ...h]);
      setHistIdx(-1);
      setValue("");
    },
    [router],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") run(value);
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      if (history[idx]) {
        setHistIdx(idx);
        setValue(history[idx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = histIdx - 1;
      setHistIdx(idx);
      setValue(idx >= 0 ? history[idx] : "");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[150] flex items-end justify-center bg-void/75 p-4 backdrop-blur-md sm:items-center"
          onClick={() => setOpen(false)}
        >
          {/* The console is hardware on a ship, not a window on a laptop: no
              traffic lights, no title bar pretending to be zsh. Hull plating,
              corner brackets, a live reactor light and a sweep that keeps
              crossing it — every part of the chrome says "instrument". */}
          <motion.div
            initial={{ y: 40, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.21, 0.6, 0.35, 1] }}
            className="relative flex h-[28rem] w-full max-w-2xl flex-col overflow-hidden rounded-lg border bg-[#04070a]/95 backdrop-blur-xl"
            style={{
              borderColor: "color-mix(in oklab, var(--green) 32%, transparent)",
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.65), 0 26px 70px -52px color-mix(in oklab, var(--green) 55%, transparent)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.focus();
            }}
          >
            {/* hull: plating, a wash off the top edge, and a slow sweep */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="hull-grid absolute inset-0 opacity-30" />
              <div
                className="absolute inset-x-0 top-0 h-16"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--green) 10%, transparent), transparent 72%)",
                }}
              />
              <div
                className="hull-scan absolute inset-x-0 h-24"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--green) 8%, transparent), transparent)",
                }}
              />
            </div>

            {/* corner brackets — the frame reads as machined, not drawn */}
            {[
              "left-2 top-2 border-l border-t",
              "right-2 top-2 border-r border-t",
              "bottom-2 left-2 border-b border-l",
              "bottom-2 right-2 border-b border-r",
            ].map((pos) => (
              <span
                key={pos}
                aria-hidden
                className={`pointer-events-none absolute size-4 border-green/60 ${pos}`}
              />
            ))}

            {/* ── instrument header ── */}
            <div
              className="relative flex items-center gap-3 border-b px-4 py-2.5"
              style={{ borderColor: "color-mix(in oklab, var(--green) 22%, transparent)" }}
            >
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-green" />
              </span>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-green">
                orbital shell
              </p>
              <span className="hidden h-px flex-1 bg-line sm:block" />
              <p className="hidden font-mono text-[10px] uppercase tracking-widest text-muted/60 sm:block">
                asad-os v3.0.0
              </p>
              {/* signal strength, because every console has one */}
              <span aria-hidden className="hidden items-end gap-px sm:flex">
                {[4, 7, 10, 13].map((h) => (
                  <span key={h} className="w-[2px] bg-green/70" style={{ height: h }} />
                ))}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto rounded border border-line px-1.5 py-px font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:border-green/60 hover:text-green sm:ml-0"
                aria-label="Close terminal"
              >
                esc
              </button>
            </div>

            {/* ── readout ── */}
            <div
              ref={bodyRef}
              data-lenis-prevent
              className="relative flex-1 space-y-1 overflow-y-auto px-4 py-3.5 font-mono text-[13px] leading-relaxed"
            >
              {lines.map((l, i) => (
                <div
                  key={i}
                  className={
                    l.type === "accent"
                      ? "term-green"
                      : l.type === "input"
                        ? "text-fg"
                        : "text-muted"
                  }
                >
                  {l.type === "input" && <span className="mr-2 term-green">❯</span>}
                  <span className="whitespace-pre-wrap">{l.text}</span>
                </div>
              ))}

              {/* only while the shell is untouched — once you have run
                  something you know how it works and they are just noise */}
              {lines === WELCOME && (
                <div className="flex flex-wrap items-center gap-2 pb-1 pt-2.5">
                  {SUGGESTIONS.map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => run(cmd)}
                      className="flex items-center gap-1.5 rounded-sm border border-green/25 bg-green/[0.06] px-2.5 py-1 font-mono text-[11px] text-green/85 transition-colors hover:border-green/70 hover:bg-green/15 hover:text-green"
                    >
                      <span className="text-green/50">▸</span>
                      {cmd}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center pt-1">
                <span className="mr-2 term-green">❯</span>
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="w-full bg-transparent text-fg outline-none placeholder:text-muted/40"
                  placeholder="type a command…"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* ── status rail ── */}
            <div
              className="relative flex items-center gap-2.5 border-t px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted/55"
              style={{ borderColor: "color-mix(in oklab, var(--green) 18%, transparent)" }}
            >
              <span className="text-green/80">uplink stable</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden tabular-nums sm:inline">
                {String(lines.length).padStart(3, "0")} lines
              </span>
              <span className="ml-auto normal-case tracking-normal">↑↓ history · type help</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
