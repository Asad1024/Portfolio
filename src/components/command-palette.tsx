"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { contact, projects } from "@/lib/data";
import { ConsolePanel } from "./console-panel";
import { Hash, FolderOpen, Zap, Search, ArrowUpDown, CornerDownLeft, MessageSquareText } from "lucide-react";
import { openAssistant } from "./assistant/events";

type Item = {
  label: string;
  group: string;
  hint?: string;
  /** extra words the query matches but the row doesn't show (stack, tags) */
  keywords?: string;
  run: () => void;
};

/** The icon and heading each kind of result carries. */
const GROUPS: Record<string, { name: string; Icon: typeof Hash }> = {
  destinations: { name: "Sections", Icon: Hash },
  bodies: { name: "Projects", Icon: FolderOpen },
  systems: { name: "Actions", Icon: Zap },
  assistant: { name: "Ask", Icon: MessageSquareText },
};

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
        keywords: [p.company, p.platform, ...p.tags, ...p.stack].filter(Boolean).join(" "),
        run: go(`/work/${p.slug}`),
      })),
      {
        label: "Ask Asad's Assistant",
        group: "systems",
        hint: "Ctrl I",
        keywords: "chat help question guide tour",
        run: () => {
          close();
          openAssistant();
        },
      },
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
    const found = items.filter((i) =>
      `${i.label} ${GROUPS[i.group]?.name ?? ""} ${i.hint ?? ""} ${i.keywords ?? ""}`.toLowerCase().includes(q),
    );
    // any query can also go to the assistant, which answers what search can't
    const ask: Item = {
      label: `Ask: “${query.trim()}”`,
      group: "assistant",
      hint: "Asad's Assistant",
      run: () => {
        close();
        openAssistant(query.trim());
      },
    };
    return [...found, ask];
  }, [items, query, close]);

  // ⌘K / Ctrl+K anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // closing goes through close(), like every other way out, so the
        // next open starts from an empty search rather than the last one
        if (open) close();
        else setOpen(true);
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
  }, [open, close]);

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
      title="search"
      sub="sections · projects · actions"
      initialFocusRef={inputRef}
      align="top"
      size="max-w-xl"
      z={160}
      footer={
        <div
          className="flex items-center gap-4 border-t px-4 py-2 font-sans text-[11px] text-muted/70"
          style={{ borderColor: "color-mix(in oklab, var(--accent) 14%, transparent)" }}
        >
          <span className="flex items-center gap-1.5"><ArrowUpDown aria-hidden className="size-3" /> navigate</span>
          <span className="flex items-center gap-1.5"><CornerDownLeft aria-hidden className="size-3" /> select</span>
          <span className="ml-auto uppercase tabular-nums tracking-widest text-accent/80">
            {results.length} {results.length === 1 ? "result" : "results"}
          </span>
        </div>
      }
    >
      {/* ── query ── */}
      <div
        className="relative flex items-center gap-3 border-b px-4"
        style={{ borderColor: "color-mix(in oklab, var(--accent) 14%, transparent)" }}
      >
        <Search aria-hidden className="size-4 shrink-0 text-accent" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // a new query means a new result list; the old index means nothing
            setCursor(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search projects and sections…"
          spellCheck={false}
          autoComplete="off"
          aria-label="Search sections, projects and actions"
          className="w-full bg-transparent py-3.5 font-sans text-sm text-fg outline-none placeholder:text-muted/60"
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
            No results for “{query}”
          </p>
        )}
        {results.map((item, i) => {
          const header = item.group !== lastGroup ? item.group : null;
          lastGroup = item.group;
          const on = i === cursor;
          const { name, Icon } = GROUPS[item.group] ?? GROUPS.systems;
          return (
            <div key={`${item.group}-${item.label}`}>
              {header && (
                <p className="flex items-center gap-2 px-3 pb-1.5 pt-3.5 font-sans text-[11px] uppercase tracking-[0.18em] text-accent/75">
                  <Icon aria-hidden className="size-3" />
                  {name}
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
                <Icon
                  aria-hidden
                  className={`size-3.5 shrink-0 transition-colors ${on ? "text-accent" : "text-muted/50"}`}
                />
                <span className="max-w-[55%] shrink-0 truncate text-sm">{item.label}</span>
                {item.hint && (
                  <span
                    className={`ml-auto min-w-0 truncate text-right font-sans text-xs transition-colors ${
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
