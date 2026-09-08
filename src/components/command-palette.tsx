"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { contact, projects } from "@/lib/data";

type Item = {
  label: string;
  group: string;
  hint?: string;
  run: () => void;
};

const SECTIONS = [
  ["Work", "#work"],
  ["Capabilities", "#capabilities"],
  ["Skills", "#skills"],
  ["Experience", "#experience"],
  ["About", "#about"],
  ["Contact", "#contact"],
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCursor(0);
  }, []);

  const items: Item[] = useMemo(() => {
    const go = (href: string) => () => {
      close();
      if (href.startsWith("#")) {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push(href);
      }
    };
    return [
      ...SECTIONS.map(([label, href]) => ({
        label,
        group: "destinations",
        hint: href,
        run: go(href),
      })),
      ...projects.map((p) => ({
        label: p.title,
        group: "bodies",
        hint: p.tagline,
        run: go(`/work/${p.slug}`),
      })),
      {
        label: "Open terminal",
        group: "systems",
        hint: "`",
        run: () => {
          close();
          window.dispatchEvent(new CustomEvent("open-terminal"));
        },
      },
      {
        label: "Download resume",
        group: "systems",
        hint: "PDF",
        run: () => {
          close();
          window.open("/Asad-Shah-Resume.pdf", "_blank");
        },
      },
      {
        label: "Email Asad",
        group: "systems",
        hint: contact.email,
        run: () => {
          close();
          window.location.href = `mailto:${contact.email}`;
        },
      },
      {
        label: "GitHub",
        group: "systems",
        hint: "Asad1024",
        run: () => {
          close();
          window.open(contact.github, "_blank");
        },
      },
      {
        label: "LinkedIn",
        group: "systems",
        hint: "asadshah2",
        run: () => {
          close();
          window.open(contact.linkedin, "_blank");
        },
      },
    ];
  }, [close, router]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      `${i.label} ${i.group} ${i.hint ?? ""}`.toLowerCase().includes(q),
    );
  }, [items, query]);

  // ⌘K / Ctrl+K anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    // the header button opens it the same way the terminal is opened, so the
    // shortcut and the click share one path
    const onOpen = () => setOpen(true);
    window.addEventListener("open-palette", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("open-palette", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-idx="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (results.length ? (c + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (results.length ? (c - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[cursor]?.run();
    }
  }

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-[160] flex items-start justify-center bg-void/75 p-4 pt-[12vh] backdrop-blur-md"
      onClick={close}
    >
      {/* The palette is the ship's nav computer, the terminal is its shell —
          same hardware, different instrument, so they share the plating, the
          brackets and the sweep and differ only in what they are lit with:
          cyan for navigating the site, green for talking to it. */}
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-lg border bg-[#04070a]/95 backdrop-blur-xl"
        style={{
          borderColor: "color-mix(in oklab, var(--accent) 30%, transparent)",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.65), 0 26px 70px -52px color-mix(in oklab, var(--accent) 60%, transparent)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* hull */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hull-stars absolute inset-0 opacity-70" />
          <div className="tele-grid absolute inset-0 opacity-25" />
          <div
            className="absolute inset-x-0 top-0 h-16"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 72%)",
            }}
          />
          <div
            className="hull-scan absolute inset-x-0 h-24"
            style={{
              background:
                "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--accent) 8%, transparent), transparent)",
            }}
          />
        </div>

        {[
          "left-2 top-2 border-l border-t",
          "right-2 top-2 border-r border-t",
          "bottom-2 left-2 border-b border-l",
          "bottom-2 right-2 border-b border-r",
        ].map((pos) => (
          <span
            key={pos}
            aria-hidden
            className={`pointer-events-none absolute z-10 size-4 border-accent/60 ${pos}`}
          />
        ))}

        {/* ── instrument header ── */}
        <div
          className="relative flex items-center gap-3 border-b px-4 py-2.5"
          style={{ borderColor: "color-mix(in oklab, var(--accent) 20%, transparent)" }}
        >
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            nav computer
          </p>
          <span className="hidden h-px flex-1 bg-line sm:block" />
          <p className="hidden font-mono text-[10px] uppercase tracking-widest text-muted/60 sm:block">
            set destination
          </p>
          <kbd className="ml-auto rounded border border-line px-1.5 py-px font-mono text-[10px] uppercase tracking-widest text-muted sm:ml-0">
            esc
          </kbd>
        </div>

        {/* ── query ── */}
        <div
          className="relative flex items-center gap-3 border-b px-4"
          style={{ borderColor: "color-mix(in oklab, var(--accent) 14%, transparent)" }}
        >
          <span className="font-mono text-sm text-accent">❯</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="jump to a section, project, or action…"
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent py-3.5 font-mono text-sm text-fg outline-none placeholder:text-muted/45"
          />
        </div>

        {/* ── results ── */}
        <div ref={listRef} data-lenis-prevent className="relative max-h-[46vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-8 text-center font-mono text-xs text-muted">
              no signal for “{query}”
            </p>
          )}
          {results.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const glyph = item.group === "bodies" ? "●" : item.group === "systems" ? "▸" : "◆";
            return (
              <div key={`${item.group}-${item.label}`}>
                {header && (
                  <div className="flex items-center gap-2.5 px-3 pb-1.5 pt-3.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/70">
                      {header}
                    </p>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                )}
                <button
                  data-idx={i}
                  onMouseEnter={() => setCursor(i)}
                  onClick={item.run}
                  className={`flex w-full items-center gap-3 rounded-sm border px-3 py-2.5 text-left transition-colors ${
                    i === cursor
                      ? "border-accent/40 bg-accent/[0.08] text-fg"
                      : "border-transparent text-muted"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`shrink-0 font-mono text-[9px] ${
                      i === cursor ? "text-accent" : "text-muted/35"
                    }`}
                  >
                    {glyph}
                  </span>
                  <span className="truncate font-sans text-sm">{item.label}</span>
                  {item.hint && (
                    <span
                      className={`ml-auto shrink-0 truncate font-mono text-[11px] ${
                        i === cursor ? "text-accent/85" : "text-muted/60"
                      }`}
                    >
                      {item.hint}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── status rail ── */}
        <div
          className="relative flex items-center gap-3 border-t px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted/55"
          style={{ borderColor: "color-mix(in oklab, var(--accent) 16%, transparent)" }}
        >
          <span className="normal-case tracking-normal">↑↓ navigate</span>
          <span className="normal-case tracking-normal">↵ select</span>
          <span className="ml-auto tabular-nums text-accent/80">
            {String(results.length).padStart(2, "0")} in range
          </span>
        </div>
      </div>
    </div>
  );
}
