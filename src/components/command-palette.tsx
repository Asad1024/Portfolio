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
        group: "Go to",
        hint: href,
        run: go(href),
      })),
      ...projects.map((p) => ({
        label: p.title,
        group: "Projects",
        hint: p.tagline,
        run: go(`/work/${p.slug}`),
      })),
      {
        label: "Open terminal",
        group: "Actions",
        hint: "`",
        run: () => {
          close();
          window.dispatchEvent(new CustomEvent("open-terminal"));
        },
      },
      {
        label: "Download resume",
        group: "Actions",
        hint: "PDF",
        run: () => {
          close();
          window.open("/Asad-Shah-Resume.pdf", "_blank");
        },
      },
      {
        label: "Email Asad",
        group: "Actions",
        hint: contact.email,
        run: () => {
          close();
          window.location.href = `mailto:${contact.email}`;
        },
      },
      {
        label: "GitHub",
        group: "Actions",
        hint: "Asad1024",
        run: () => {
          close();
          window.open(contact.github, "_blank");
        },
      },
      {
        label: "LinkedIn",
        group: "Actions",
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
      className="fixed inset-0 z-[160] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <span className="font-mono text-sm text-accent">❯</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a section, project, or action…"
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent py-4 font-mono text-sm text-fg outline-none placeholder:text-muted/60"
          />
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted sm:block">
            esc
          </kbd>
        </div>

        <div ref={listRef} data-lenis-prevent className="max-h-[46vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center font-mono text-xs text-muted">
              no matches for “{query}”
            </p>
          )}
          {results.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={`${item.group}-${item.label}`}>
                {header && (
                  <p className="px-3 pb-1.5 pt-3 font-mono text-[10px] uppercase tracking-wider text-muted/70">
                    {header}
                  </p>
                )}
                <button
                  data-idx={i}
                  onMouseEnter={() => setCursor(i)}
                  onClick={item.run}
                  className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    i === cursor ? "bg-card text-fg" : "text-muted"
                  }`}
                >
                  <span className="truncate font-sans text-sm">{item.label}</span>
                  {item.hint && (
                    <span className="shrink-0 truncate font-mono text-[11px] text-muted/70">
                      {item.hint}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 font-mono text-[10px] text-muted">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span className="ml-auto">{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
