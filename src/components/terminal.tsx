"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { contact, projects, skillGroups, stackList } from "@/lib/data";
import { ConsolePanel } from "./console-panel";

type Line = { type: "input" | "output" | "accent"; text: string };

const WELCOME: Line[] = [
  { type: "accent", text: "asad-os v3.0.0 — orbital shell" },
  { type: "output", text: "type a command, or press one of the keys below." },
];

/* The soft keys under the screen. A shell that greets you with nothing but
   "type help" is a dead end for anyone who doesn't already know what it
   accepts, so the useful half of it is one click away — and the chip carries
   the real command word, so clicking it also teaches you to type it. */
const SUGGESTIONS = [
  "palette",
  "projects",
  "whoami",
  "skills",
  "resume",
  "contact",
  "launch",
  "help",
];

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
            { type: "output", text: "launch        clear the pad" },
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
          out.push({ type: "accent", text: "full matrix at /#capabilities" });
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
        case "launch":
          out.push(
            { type: "output", text: "T-minus 3 … 2 … 1 …" },
            { type: "accent", text: "liftoff. we have liftoff." },
          );
          setTimeout(() => {
            setOpen(false);
            window.dispatchEvent(new CustomEvent("launch-ship"));
          }, 700);
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
      /* The star flares when the shell is used. The two showpieces on this
         page had nothing to do with each other — a terminal that happened to
         sit in front of a solar system — and one event is enough to make them
         the same machine. Fired for real commands only; an empty line is not
         an event. */
      if (cmd) window.dispatchEvent(new CustomEvent("shell-command"));
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
    <ConsolePanel
      open={open}
      onClose={() => setOpen(false)}
      label="Terminal"
      title="orbital shell"
      sub="asad-os v3.0.0"
      initialFocusRef={inputRef}
      size="max-w-2xl"
      z={150}
      footer={
        <>
          {/* ── soft keys ──
              A console has labelled buttons under its screen, and this is the
              answer to "what do I type?", so it sits outside the scroll area:
              it can never scroll away, and it is still there after you have
              run something and want to know what else there is. */}
          <div
            className="relative flex flex-wrap items-center gap-1.5 border-t px-4 py-2.5"
            style={{ borderColor: "color-mix(in oklab, var(--accent) 16%, transparent)" }}
          >
            <span className="mr-1 font-mono text-[11px] uppercase tracking-widest text-muted/80">
              try
            </span>
            {SUGGESTIONS.map((cmd) => (
              <button
                key={cmd}
                onClick={() => run(cmd)}
                className="flex items-center gap-1.5 rounded-sm border border-accent/25 bg-accent/[0.07] px-2.5 py-1 font-mono text-xs text-accent/80 transition-colors hover:border-accent/70 hover:bg-accent/15 hover:text-accent"
              >
                <span className="text-accent/45">▸</span>
                {cmd}
              </button>
            ))}
          </div>

          {/* ── status rail ── */}
          <div
            className="relative flex items-center gap-2.5 border-t px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted/80"
            style={{ borderColor: "color-mix(in oklab, var(--accent) 16%, transparent)" }}
          >
            <span className="text-accent/80">uplink stable</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden tabular-nums sm:inline">
              {String(lines.length).padStart(3, "0")} lines
            </span>
            <span className="ml-auto normal-case tracking-normal">↑↓ history · type help</span>
          </div>
        </>
      }
    >
      {/* ── readout ── */}
      <div
        ref={bodyRef}
        data-lenis-prevent
        onClick={() => inputRef.current?.focus()}
        className="relative h-[22rem] space-y-1 overflow-y-auto px-4 py-3.5 font-mono text-[13px] leading-relaxed"
      >
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.type === "accent" ? "text-accent" : l.type === "input" ? "text-fg" : "text-muted"
            }
          >
            {l.type === "input" && <span className="mr-2 text-accent">❯</span>}
            <span className="whitespace-pre-wrap">{l.text}</span>
          </div>
        ))}

        <div className="flex items-center pt-1">
          <span className="mr-2 text-accent">❯</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full bg-transparent text-fg outline-none placeholder:text-muted/70"
            placeholder="type a command…"
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal input"
          />
        </div>
      </div>
    </ConsolePanel>
  );
}
