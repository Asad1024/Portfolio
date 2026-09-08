"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { contact, projects, skillGroups, stackList } from "@/lib/data";

type Line = { type: "input" | "output" | "accent"; text: string };

const WELCOME: Line[] = [
  { type: "accent", text: "asad-os v3.0.0 — orbital shell" },
  { type: "output", text: "type 'help' to see available commands." },
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
  const { setTheme, resolvedTheme } = useTheme();

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
            { type: "output", text: "theme         toggle dark/light" },
            { type: "output", text: "matrix        …you know what this does" },
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
        case "theme": {
          const next = resolvedTheme === "dark" ? "light" : "dark";
          setTheme(next);
          out.push({ type: "accent", text: `theme → ${next}` });
          break;
        }
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
    [resolvedTheme, router, setTheme],
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
          className="fixed inset-0 z-[150] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ y: 40, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.21, 0.6, 0.35, 1] }}
            className="flex h-[26rem] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-bg shadow-2xl"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.focus();
            }}
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-xs text-muted">asad@portfolio — zsh</span>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto font-mono text-xs text-muted hover:text-fg"
                aria-label="Close terminal"
              >
                esc
              </button>
            </div>

            <div
              ref={bodyRef}
              data-lenis-prevent
              className="flex-1 space-y-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed"
            >
              {lines.map((l, i) => (
                <div key={i} className={l.type === "accent" ? "term-green" : l.type === "input" ? "text-fg" : "text-muted"}>
                  {l.type === "input" && <span className="mr-2 term-green">❯</span>}
                  <span className="whitespace-pre-wrap">{l.text}</span>
                </div>
              ))}
              <div className="flex items-center">
                <span className="mr-2 term-green">❯</span>
                <input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="w-full bg-transparent text-fg outline-none placeholder:text-muted/50"
                  placeholder="type a command…"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
