"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  Briefcase,
  ChevronDown,
  Compass,
  Ellipsis,
  EyeOff,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  SquarePen,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Nova, type Mood } from "./nova";
import { NAME } from "./events";
import { Composer, type ComposerHandle } from "./composer";
import { AssistantMessage, UserMessage, type Act } from "./message";
import { Welcome, type Mission } from "./welcome";
import type { ChatMessage, Mode } from "./use-chat";

/* The console: a header that says honestly who is answering, the
   conversation (or the welcome screen before there is one), and the
   composer. Nothing else: everything rarer lives in the ⋯ menu. Compact by default, wider
   on demand, and the whole screen on a phone. */

/** A line to show while waiting, chosen by what was asked. */
function thinkingLine(q: string) {
  const s = q.toLowerCase();
  if (s.startsWith("role match")) return "Mapping the role to shipped work…";
  if (/(project|built|build|shipped|case study|best|work)/.test(s)) return "Opening the case studies…";
  if (/(stack|tech|use|used|redis|stripe|next|react|node|python|electron)/.test(s)) return "Checking the stack…";
  if (/(available|hire|contact|email|reach|rate)/.test(s)) return "Checking Asad's calendar…";
  if (/(experience|years|worked|company|career)/.test(s)) return "Reading the experience…";
  return "Thinking…";
}

type Props = {
  messages: ChatMessage[];
  busy: boolean;
  mode: Mode;
  mood: Mood;
  page: string;
  section?: string;
  expanded: boolean;
  voice: boolean;
  focusOnOpen: boolean;
  /** full screen on a phone: focus stays inside until it closes */
  modal: boolean;
  act: Act;
  onSend: (q: string) => void;
  onStop: () => void;
  onRegenerate: () => void;
  onReset: () => void;
  onMission: (m: Mission) => void;
  onToggleExpand: () => void;
  onToggleVoice: () => void;
  onTour: () => void;
  onHide: () => void;
  onClose: () => void;
};

export const Panel = forwardRef<ComposerHandle, Props>(function Panel(p, composerRef) {
  const reduced = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // on a phone, focus moves into the panel (not the input, which would pull
  // up the keyboard over the welcome screen)
  useEffect(() => {
    if (!p.focusOnOpen) sectionRef.current?.focus({ preventScroll: true });
  }, [p.focusOnOpen]);
  const [atBottom, setAtBottom] = useState(true);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastQuestion = [...p.messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // stay pinned to the newest line while it streams and its cards grow in,
  // unless the visitor has scrolled up to reread something; asking again
  // pins it back
  const pinned = useRef(true);
  const threadRef = useRef<HTMLDivElement>(null);
  const hasThread = p.messages.length > 0;
  useEffect(() => {
    const el = listRef.current;
    const inner = threadRef.current;
    if (!el || !inner) return;
    const pin = () => {
      if (pinned.current) el.scrollTop = el.scrollHeight;
    };
    pin();
    const ro = new ResizeObserver(pin);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [hasThread]);
  const last = p.messages[p.messages.length - 1];
  useEffect(() => {
    if (last?.role !== "user" && !(last?.status === "streaming" && !last.content)) return;
    pinned.current = true;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [last]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menu]);

  // the ⋯ menu: Esc closes just the menu, arrows move through it
  const menuKeys = (e: React.KeyboardEvent) => {
    if (!menu) return;
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      setMenu(false);
      menuRef.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = e.key === "ArrowDown" ? (at + 1) % items.length : (at - 1 + items.length) % items.length;
      items[at === -1 ? 0 : next]?.focus();
    }
  };

  // on a phone the panel is the whole screen, so Tab cycles inside it
  const trapFocus = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Tab") return;
    const all = [...e.currentTarget.querySelectorAll<HTMLElement>("button, textarea, a[href], [tabindex]:not([tabindex='-1'])")].filter(
      (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
    );
    if (!all.length) return;
    const first = all[0];
    const last = all[all.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const saveTranscript = () => {
    const text = p.messages
      .map((m) => `${m.role === "user" ? "You" : NAME}: ${m.content.replace(/\[\[[^\]]*\]\]/g, "").trim()}`)
      .join("\n\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "asad-assistant-conversation.txt" });
    a.click();
    // revoked a beat later: some browsers start the download asynchronously
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const status =
    p.busy
      ? { text: "Typing…", tone: "text-accent" }
      : p.mode === "offline" || p.mode === "limited"
        ? { text: "Answering from notes", tone: "text-amber-300/90" }
        : { text: "Online", tone: "text-muted" };

  const menuItems = [
    { label: "Start the guided tour", Icon: Compass, run: p.onTour },
    { label: "Role match", Icon: Briefcase, run: () => p.onMission("match") },
    { label: p.voice ? "Stop reading replies aloud" : "Read replies aloud", Icon: p.voice ? VolumeX : Volume2, run: p.onToggleVoice },
    ...(p.messages.length ? [{ label: "Save conversation", Icon: FileText, run: saveTranscript }] : []),
    { label: `Hide ${NAME}`, Icon: EyeOff, run: p.onHide },
  ];

  return (
    <motion.section
      key="panel"
      role="dialog"
      aria-label={NAME}
      aria-modal={p.modal || undefined}
      ref={sectionRef}
      tabIndex={-1}
      onKeyDown={p.modal ? trapFocus : undefined}
      // the drawer slides in from the right edge; the floating panel rises
      initial={reduced ? false : p.expanded ? { opacity: 0, x: 48 } : { opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={reduced ? undefined : p.expanded ? { opacity: 0, x: 40, transition: { duration: 0.18 } } : { opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className={`as-shell pointer-events-auto fixed inset-0 flex h-[100dvh] origin-bottom-right flex-col outline-none ${
        p.expanded
          ? "sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[min(30rem,100vw)] sm:rounded-none sm:border-y-0 sm:border-r-0"
          : "sm:relative sm:inset-auto sm:h-[min(41rem,calc(100dvh-8rem))] sm:w-[26.5rem]"
      }`}
    >
      {/* header */}
      <header className="relative z-30 flex items-center gap-3 border-b border-white/[0.06] px-3.5 py-3">
        {/* the one Nova on screen while the panel is open */}
        <span className="block size-11 shrink-0">
          <Nova mood={p.mood} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-tight text-fg">{NAME}</p>
          <p className={`whitespace-nowrap text-[11px] ${status.tone}`} aria-live="polite">
            {status.text}
          </p>
        </div>
        {/* right-aligned, so "new conversation" appearing on the left moves nothing */}
        <div className="flex items-center gap-0.5">
          {p.messages.length > 0 && (
            <button type="button" onClick={p.onReset} aria-label="New conversation" title="New conversation" className="as-icon-btn">
              <SquarePen className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={p.onToggleExpand}
            aria-label={p.expanded ? "Undock from the side" : "Dock to the side"}
            title={p.expanded ? "Floating window" : "Open as sidebar"}
            className="as-icon-btn hidden sm:inline-flex"
          >
            {p.expanded ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
          </button>
          <div ref={menuRef} className="relative" onKeyDown={menuKeys}>
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-label="More options"
              aria-expanded={menu}
              aria-haspopup="menu"
              className="as-icon-btn"
            >
              <Ellipsis className="size-4" />
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-10 z-20 w-56 origin-top-right rounded-xl border border-white/10 bg-[#0a0f1d] p-1 shadow-2xl"
                >
                  {menuItems.map((m) => (
                    <button
                      key={m.label}
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setMenu(false);
                        m.run();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-fg/85 transition-colors hover:bg-white/[0.06] hover:text-fg"
                    >
                      <m.Icon className="size-3.5 text-muted" />
                      {m.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button type="button" onClick={p.onClose} aria-label={`Close ${NAME}`} className="as-icon-btn">
            <X className="hidden size-4 sm:block" />
            <ChevronDown className="size-5 sm:hidden" />
          </button>
        </div>
      </header>

      {/* conversation */}
      <div
        ref={listRef}
        data-lenis-prevent
        role="log"
        aria-busy={p.busy}
        aria-label="Conversation"
        onScroll={(e) => {
          const el = e.currentTarget;
          const near = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
          pinned.current = near;
          setAtBottom(near);
        }}
        className="relative z-10 flex-1 overflow-y-auto overscroll-contain"
      >
        {p.messages.length === 0 ? (
          <Welcome page={p.page} section={p.section} onMission={p.onMission} onAsk={p.onSend} />
        ) : (
          <div ref={threadRef} className={`mx-auto space-y-5 px-4 py-5 ${p.expanded ? "max-w-[38rem]" : ""}`}>
            {p.messages.map((m, i) =>
              m.role === "user" ? (
                <UserMessage key={m.id} m={m} />
              ) : (
                <AssistantMessage
                  key={m.id}
                  m={m}
                  last={i === p.messages.length - 1}
                  thinking={thinkingLine(lastQuestion)}
                  act={p.act}
                  onRegenerate={p.onRegenerate}
                />
              ),
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {!atBottom && p.messages.length > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => {
              pinned.current = true;
              listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
            }}
            className="absolute bottom-[6.5rem] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-[#0a0f1d]/95 px-3 py-1.5 text-[11px] text-fg/85 shadow-xl"
          >
            <ArrowDown className="size-3" /> Latest
          </motion.button>
        )}
      </AnimatePresence>

      <div className="relative z-10 border-t border-white/[0.06] pb-[env(safe-area-inset-bottom)]">
        <Composer ref={composerRef} busy={p.busy} onSend={p.onSend} onStop={p.onStop} autoFocus={p.focusOnOpen} />
      </div>
    </motion.section>
  );
});
