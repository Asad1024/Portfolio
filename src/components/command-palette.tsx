"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { contact, projects } from "@/lib/data";
import { ConsolePanel } from "./console-panel";

type Item = {
  label: string;
  group: string;
  hint?: string;
  run: () => void;
};

/** The marker each kind of result carries, in its heading and on its rows. */
const GLYPH: Record<string, string> = { destinations: "◆", bodies: "●", systems: "▸" };

const SECTIONS = [
  ["Work", "#work"],
  ["Capabilities", "#capabilities"],
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
    listRef.current
      ?.querySelector(`[data-idx="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
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
    <ConsolePanel
      open={open}
      onClose={close}
      label="Command palette"
      title="nav computer"
      sub="set destination"
      initialFocusRef={inputRef}
      align="top"
      size="max-w-xl"
      z={160}
      footer={
        <div
          className="flex items-center gap-4 border-t px-4 py-2 font-mono text-[11px] text-muted/70"
          style={{ borderColor: "color-mix(in oklab, var(--accent) 14%, transparent)" }}
        >
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span className="ml-auto uppercase tabular-nums tracking-widest text-accent/80">
            {String(results.length).padStart(2, "0")} in range
          </span>
        </div>
      }
    >
      {/* ── query ── */}
      <div
        className="relative flex items-center gap-3 border-b px-4"
        style={{ borderColor: "color-mix(in oklab, var(--accent) 14%, transparent)" }}
      >
        <span aria-hidden className="font-mono text-sm text-accent">
          ❯
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // a new query means a new result list; the old index means nothing
            setCursor(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="jump to a section, project, or action…"
          spellCheck={false}
          autoComplete="off"
          aria-label="Search sections, projects and actions"
          className="w-full bg-transparent py-3.5 font-mono text-sm text-fg outline-none placeholder:text-muted/60"
        />
      </div>

      {/* ── results ── */}
      <div
        ref={listRef}
        data-lenis-prevent
        className="relative max-h-[46vh] overflow-y-auto p-2"
      >
        {results.length === 0 && (
          <p className="px-3 py-10 text-center text-sm text-muted">
            no signal for “{query}”
          </p>
        )}
        {results.map((item, i) => {
          const header = item.group !== lastGroup ? item.group : null;
          lastGroup = item.group;
          const on = i === cursor;
          const glyph = GLYPH[item.group] ?? "◆";
          return (
            <div key={`${item.group}-${item.label}`}>
              {header && (
                <p className="flex items-center gap-2 px-3 pb-1.5 pt-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent/75">
                  <span aria-hidden className="text-[9px]">{glyph}</span>
                  {header}
                </p>
              )}
              <button
                data-idx={i}
                onMouseEnter={() => setCursor(i)}
                onClick={item.run}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 ${
                  on ? "border-accent/30 bg-accent/[0.07] text-fg" : "border-transparent text-fg/80"
                }`}
              >
                <span
                  aria-hidden
                  className={`shrink-0 font-mono text-[9px] transition-colors ${on ? "text-accent" : "text-muted/50"}`}
                >
                  {glyph}
                </span>
                <span className="truncate text-sm">{item.label}</span>
                {item.hint && (
                  <span
                    className={`ml-auto shrink-0 truncate font-mono text-xs transition-colors ${
                      on ? "text-accent/80" : "text-muted/60"
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
    </ConsolePanel>
  );
}
