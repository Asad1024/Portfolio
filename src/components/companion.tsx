"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Compass, Download, Mail, Minus, Send, Sparkles, X } from "lucide-react";
import { contact, projects } from "@/lib/data";

/* ── Asad AI, the guide ─────────────────────────────────────────────────────
   Asad's AI twin, living in the corner of the sky: a plasma core inside three
   gyroscope rings, tilting toward the pointer, spinning up while it thinks and
   pulsing while it speaks. It talks in the first person, as Asad's twin.

   Closed, it greets a first-time visitor once, offers a guided tour that flies
   the page and narrates it, and drops a hint on the two sections where there
   is something non-obvious to do. Open, it is a chat: questions go to
   /api/guide, which answers from the site's own data with OpenAI and streams
   the reply back. Without a working key it answers from a built-in set and
   says so in its status line. Replies can carry actions (open a case study,
   jump to a section, email, résumé), rendered as buttons.

   Everything animated stops for reduced motion, and the whole guide can be
   put away; that choice is remembered on this device. */

type Action = { label: string; icon?: React.ComponentType<{ className?: string }>; run: () => void };
type Toast = { text: string; actions?: Action[]; sticky?: boolean; ms?: number };
type Msg = { role: "user" | "assistant"; content: string };
type Mood = "idle" | "thinking" | "speaking";

const NAME = "Asad AI";

/* Only where there is something to do that isn't obvious: a running
   commentary on every section was noise sitting on top of the content. */
const SECTION_TIPS: Record<string, string> = {
  work: "Pick any project from the list to put it on stage, or click the screen for its case study.",
  contact: "The lines run from Lahore, my home, to the teams I've worked with in Islamabad and Dubai.",
};

const TOUR: { id: string; text: string }[] = [
  { id: "#work", text: "First, my work. Fourteen products: AI platforms, SaaS, and desktop tools." },
  { id: "#capabilities", text: "What I build with, grouped by what it's for, with proof for each." },
  { id: "#experience", text: "Where I've shipped: three teams, and the products from each." },
  { id: "#about", text: "And a bit about me, and how I like to work." },
  { id: "#contact", text: "That's the tour. If you're building something, this is where we start." },
];

const SUGGESTIONS = ["Are you available?", "What's your best project?", "What AI have you shipped?", "What's your stack?"];

const GREETING: Msg = {
  role: "assistant",
  content: "Hey, I'm Asad's AI twin. Ask me anything about my work, my stack, or how to reach the real me.",
};

/** Built-in answers for when the live model is unavailable. */
function offlineAnswer(q: string): string {
  const s = q.toLowerCase();
  const has = (...w: string[]) => w.some((x) => s.includes(x));
  if (has("hire", "available", "freelance", "job", "open to"))
    return "Yes, I'm open to full-time roles and freelance builds. Email is the fastest way to reach me.\n[[email|Email Asad]]";
  if (has("where", "location", "based", "timezone", "time zone"))
    return "I'm in Lahore, Pakistan (GMT+5), and I work remote-first, most recently with a team in Dubai.";
  if (has("experience", "years", "senior", "worked"))
    return "Three-plus years shipping production software, most recently five live AI platforms at Spark AI.\n[[scroll:#experience|See experience]]";
  if (has("ai", "llm", "openai", "agent", "voice"))
    return "AI is my focus: phone agents on Twilio and ElevenLabs, an AI SDR with approval gates, RAG copilots and HeyGen video.\n[[open:/work/voice-agents|AI Voice Agents]]";
  if (has("stack", "tech", "react", "next", "node", "language", "typescript"))
    return "Mostly TypeScript: Next.js and React up front, Node, NestJS and FastAPI behind, Postgres, MySQL and Redis underneath.\n[[scroll:#capabilities|See capabilities]]";
  if (has("desktop", "electron", "windows"))
    return "I build Windows apps on Electron too: SparkCue, SiteHarvest and CodeVault.\n[[open:/work/sparkcue|SparkCue]]";
  if (has("mobile", "ios", "android", "flutter", "react native"))
    return "Mobile as well: React Native, Expo and Flutter apps on the same API as the web.";
  if (has("best", "favorite", "favourite", "start", "top", "impressive"))
    return "Start with my Outbound AI Copilot: the whole sales funnel, from first search to closed deal, in one product.\n[[open:/work/outbound-copilot|Open case study]]";
  if (has("contact", "email", "reach", "phone", "call"))
    return `Email ${contact.email} or call ${contact.phone}.\n[[email|Email Asad]]`;
  if (has("resume", "cv", "résumé")) return "Here's my résumé.\n[[resume|Download résumé]]";
  if (has("hello", "hi", "hey", "salam")) return "Hi! Ask me about my projects, stack, experience, or how to reach me.";
  return "I don't have that one. The search (Ctrl K) covers every project, or email the real me.\n[[email|Email Asad]]";
}

const TAG = /\[\[(open|scroll|email|resume)(?::([^|\]]+))?(?:\|([^\]]+))?\]\]/g;

function readHidden() {
  try {
    return localStorage.getItem("kepler-hidden") === "1";
  } catch {
    return false;
  }
}

export function Companion() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();
  const [booted, setBooted] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [tour, setTour] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const seen = useRef(new Set<string>());
  const listRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLButtonElement>(null);

  // the orb leans toward the pointer and its highlight follows it
  const px = useSpring(useMotionValue(0), { stiffness: 120, damping: 16 });
  const py = useSpring(useMotionValue(0), { stiffness: 120, damping: 16 });
  const tiltX = useTransform(py, (v) => -v * 18);
  const tiltY = useTransform(px, (v) => v * 18);


  const speak = useCallback((next: Toast | null, ms = 6500) => setToast(next && { ...next, ms }), []);

  // a passing remark clears itself; a question waits for its answer
  useEffect(() => {
    if (!toast || toast.sticky) return;
    const t = setTimeout(() => setToast(null), toast.ms ?? 6500);
    return () => clearTimeout(t);
  }, [toast]);

  /* eslint-disable react-hooks/set-state-in-effect -- reading the device's saved choice after mount */
  useEffect(() => {
    setHidden(readHidden());
    const on = () => setBooted(true);
    if (sessionStorage.getItem("booted") === "1") setBooted(true);
    window.addEventListener("boot-complete", on);
    return () => window.removeEventListener("boot-complete", on);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const goTo = useCallback(
    (selector: string) => {
      if (pathname !== "/") {
        router.push(`/${selector}`);
        return;
      }
      if (reduced) document.querySelector(selector)?.scrollIntoView();
      else window.dispatchEvent(new CustomEvent("scroll-to", { detail: selector }));
    },
    [pathname, reduced, router],
  );

  const runTag = useCallback(
    (kind: string, arg?: string) => {
      if (kind === "open" && arg) router.push(arg);
      else if (kind === "scroll" && arg) goTo(arg);
      else if (kind === "email") window.location.href = `mailto:${contact.email}`;
      else if (kind === "resume") window.open("/Asad-Shah-Resume.pdf", "_blank");
    },
    [goTo, router],
  );

  const finishTour = useCallback(() => {
    setTour(null);
    speak({
      text: "Want my résumé, or to email the real me?",
      sticky: true,
      actions: [
        { label: "Email Asad", icon: Mail, run: () => (window.location.href = `mailto:${contact.email}`) },
        { label: "Résumé", icon: Download, run: () => window.open("/Asad-Shah-Resume.pdf", "_blank") },
      ],
    });
  }, [speak]);

  // the tour is a step number: each step flies to its section; its narration
  // is derived from the step below rather than stored
  useEffect(() => {
    if (tour === null) return;
    seen.current.add(TOUR[tour].id.slice(1));
    goTo(TOUR[tour].id);
  }, [tour, goTo]);

  const startTour = useCallback(() => {
    setOpen(false);
    speak(null);
    if (pathname !== "/") {
      router.push("/");
      setTimeout(() => setTour(0), 1400);
    } else setTour(0);
  }, [pathname, router, speak]);

  const openChat = useCallback(() => {
    speak(null);
    setTour(null);
    setOpen(true);
  }, [speak]);

  // the greeting, once per session, a beat after the hero has landed
  useEffect(() => {
    if (!booted || hidden) return;
    let greeted = false;
    try {
      greeted = sessionStorage.getItem("kepler-greeted") === "1";
    } catch {}
    if (greeted) return;
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem("kepler-greeted", "1");
      } catch {}
      speak({
        text: "Hey, I'm Asad's AI twin. Want a quick tour, or ask me anything?",
        sticky: true,
        actions: [
          { label: "Take the tour", icon: Compass, run: startTour },
          { label: "Ask me", icon: Sparkles, run: openChat },
        ],
      });
    }, 2600);
    return () => clearTimeout(t);
  }, [booted, hidden, speak, startTour, openChat]);

  // a hint the first time each of the two interactive sections comes into view
  useEffect(() => {
    if (!booted || hidden || pathname !== "/") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id;
          if (!e.isIntersecting || seen.current.has(id) || tour !== null || open) continue;
          seen.current.add(id);
          if (SECTION_TIPS[id]) speak({ text: SECTION_TIPS[id] }, 4800);
        }
      },
      { rootMargin: "-35% 0px -45% 0px" },
    );
    Object.keys(SECTION_TIPS).forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [booted, hidden, pathname, tour, open, speak]);

  // on a case study, a word about what you're looking at
  useEffect(() => {
    if (!booted || hidden || !pathname.startsWith("/work/")) return;
    const project = projects.find((p) => p.slug === pathname.split("/")[2]);
    if (!project || seen.current.has(pathname)) return;
    seen.current.add(pathname);
    const t = setTimeout(
      () => speak({ text: `This is ${project.title}, one of mine. The card under the screenshot is the short version.` }, 5200),
      1800,
    );
    return () => clearTimeout(t);
  }, [booted, hidden, pathname, speak]);

  // pointer tracking for the orb
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      const r = orbRef.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, d / 420);
      px.set((dx / d) * reach);
      py.set((dy / d) * reach);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, px, py]);

  // keep the newest message in view while it streams
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setDraft("");
    const history: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    const append = (chunk: string) =>
      setMessages((m) => {
        const copy = m.slice();
        copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
        return copy;
      });
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(1), page: pathname }),
      });
      if (!res.ok || !res.body) throw new Error("fallback");
      setLive(true);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        append(decoder.decode(value, { stream: true }));
      }
    } catch {
      setLive(false);
      // the built-in answer arrives word by word rather than all at once
      const reply = offlineAnswer(q);
      for (const word of reply.split(/(?<=\s)/)) {
        append(word);
        await new Promise((r) => setTimeout(r, reduced ? 0 : 22));
      }
    } finally {
      setBusy(false);
    }
  };

  const hide = () => {
    setOpen(false);
    speak(null);
    setTour(null);
    setHidden(true);
    try {
      localStorage.setItem("kepler-hidden", "1");
    } catch {}
  };
  const show = () => {
    setHidden(false);
    try {
      localStorage.removeItem("kepler-hidden");
    } catch {}
    speak({ text: "Back online. Click me any time." }, 3200);
  };

  if (!booted) return null;

  if (hidden) {
    return (
      <button
        type="button"
        onClick={show}
        aria-label={`Bring back ${NAME}, the guide`}
        className="fixed bottom-5 right-5 z-[90] size-10 rounded-full sm:bottom-6 sm:right-6"
      >
        <Orb mood="idle" small />
      </button>
    );
  }

  const tourToast: Toast | null =
    tour === null
      ? null
      : {
          text: TOUR[tour].text,
          sticky: true,
          actions: [
            {
              label: tour === TOUR.length - 1 ? "Finish" : "Next",
              icon: ArrowRight,
              run: () => (tour === TOUR.length - 1 ? finishTour() : setTour(tour + 1)),
            },
            { label: "Stop", run: () => setTour(null) },
          ],
        };
  const current = open ? null : (tourToast ?? toast);
  const mood: Mood = busy ? (messages[messages.length - 1]?.content ? "speaking" : "thinking") : current ? "speaking" : "idle";

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.section
            key="chat"
            aria-label={`${NAME}, AI guide`}
            initial={{ opacity: 0, y: 24, scale: 0.94, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, scale: 0.96, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="k-frame pointer-events-auto w-[min(25rem,calc(100vw-2rem))] origin-bottom-right"
          >
            <div className="k-panel flex h-[min(36rem,72vh)] flex-col">
              {/* header */}
              <header className="relative flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
                <span className="relative size-9 shrink-0">
                  <Orb mood={mood} small />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold tracking-tight text-fg">{NAME}</p>
                  <p className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-muted">
                    <span
                      className={`size-1.5 rounded-full ${
                        live === false ? "bg-amber-400" : "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                      }`}
                    />
                    {live === false ? "offline answers" : busy ? "thinking…" : "AI twin · online"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startTour}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-fg/80 transition-colors hover:border-accent/60 hover:text-accent"
                >
                  <Compass className="size-3.5" /> Tour
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Minimise"
                  className="rounded-full p-1.5 text-muted hover:text-fg"
                >
                  <Minus className="size-4" />
                </button>
              </header>

              {/* conversation */}
              <div ref={listRef} data-lenis-prevent className="relative flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {messages.map((m, i) => {
                  const actions: { kind: string; arg?: string; label: string }[] = [];
                  const text = m.content
                    .replace(TAG, (_, kind: string, arg?: string, label?: string) => {
                      actions.push({
                        kind,
                        arg,
                        label: label ?? (kind === "email" ? "Email Asad" : kind === "resume" ? "Résumé" : "Open"),
                      });
                      return "";
                    })
                    .trim();
                  const last = i === messages.length - 1;
                  return m.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-cyan-300 to-sky-400 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#04121a]">
                        {m.content}
                      </p>
                    </div>
                  ) : (
                    <div key={i} className="flex gap-2.5">
                      <span
                        aria-hidden
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-accent shadow-[0_0_10px_2px_rgba(34,211,238,0.55)]"
                      />
                      <div className="min-w-0 flex-1">
                        {text ? (
                          <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-fg/90">
                            {text}
                            {last && busy && <span className="k-caret" />}
                          </p>
                        ) : (
                          last &&
                          busy && (
                            <p className="flex items-center gap-2 text-[12px] text-muted">
                              <span className="k-dots">
                                <span />
                                <span />
                                <span />
                              </span>
                              Thinking
                            </p>
                          )
                        )}
                        {actions.length > 0 && !(last && busy) && (
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {actions.map((a) => (
                              <button
                                key={a.kind + a.label}
                                type="button"
                                onClick={() => runTag(a.kind, a.arg)}
                                className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-[12px] text-accent transition-colors hover:bg-accent/20"
                              >
                                {a.label}
                                <ArrowUpRight className="size-3.5" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {messages.length === 1 && (
                  <div className="flex flex-wrap gap-2 pl-7">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => ask(s)}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-fg/80 transition-colors hover:border-accent/50 hover:text-fg"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(draft);
                }}
                className="border-t border-white/[0.06] p-3"
              >
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 py-1 pl-4 pr-1 transition-colors focus-within:border-accent/60 focus-within:shadow-[0_0_0_4px_rgba(34,211,238,0.08)]">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.slice(0, 600))}
                    placeholder="Ask me anything…"
                    aria-label={`Ask ${NAME}`}
                    className="w-full bg-transparent py-2 text-[13.5px] text-fg outline-none placeholder:text-muted/70"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || busy}
                    aria-label="Send"
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-sky-500 text-[#04121a] transition-opacity disabled:opacity-30"
                  >
                    <Send className="size-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between px-1 font-sans text-[10px] text-muted/70">
                  <span>An AI twin, trained on my portfolio</span>
                  <button type="button" onClick={hide} className="transition-colors hover:text-fg">
                    Hide {NAME}
                  </button>
                </div>
              </form>
            </div>
          </motion.section>
        )}

        {current && (
          <motion.div
            key={current.text}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 12, scale: 0.95, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 8, scale: 0.97, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="k-frame pointer-events-auto w-[min(20rem,calc(100vw-2rem))] origin-bottom-right"
          >
            <div className="k-panel p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.22em] text-accent">
                  <span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                  {NAME}
                  {tour !== null && (
                    <span className="text-muted">
                      · tour {tour + 1}/{TOUR.length}
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => (speak(null), setTour(null))}
                  aria-label="Dismiss"
                  className="rounded-full p-1 text-muted transition-colors hover:text-fg"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <p className="text-[13.5px] leading-relaxed text-fg/90">{current.text}</p>
              {current.actions && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {current.actions.map((a, i) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={a.run}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
                        i === 0
                          ? "bg-gradient-to-br from-cyan-300 to-sky-400 text-[#04121a] hover:brightness-110"
                          : "border border-white/15 text-fg/85 hover:border-accent hover:text-accent"
                      }`}
                    >
                      {a.icon && <a.icon className="size-3.5" />}
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={orbRef}
        type="button"
        aria-label={open ? `Minimise ${NAME}` : `Open ${NAME}, the AI guide`}
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openChat())}
        className="pointer-events-auto relative size-14 rounded-full sm:size-16"
        initial={reduced ? false : { x: 160, y: 140, scale: 0.4, opacity: 0 }}
        animate={reduced ? undefined : { x: 0, y: [0, -6, 0], scale: 1, opacity: 1 }}
        transition={
          reduced
            ? undefined
            : {
                x: { type: "spring", stiffness: 55, damping: 12 },
                scale: { type: "spring", stiffness: 70, damping: 11 },
                opacity: { duration: 0.5 },
                y: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
              }
        }
        style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 400 }}
        whileTap={{ scale: 0.94 }}
      >
        <Orb mood={mood} px={px} py={py} />
      </motion.button>
    </div>
  );
}

/** The core: a plasma sphere inside three gyroscope rings. `mood` changes the
 *  spin and pulse; px/py, when given, move the highlight toward the pointer. */
function Orb({
  mood,
  small = false,
  px,
  py,
}: {
  mood: Mood;
  small?: boolean;
  px?: ReturnType<typeof useSpring>;
  py?: ReturnType<typeof useSpring>;
}) {
  const still = useMotionValue(0);
  const hx = useTransform(px ?? still, (v) => `${35 + v * 22}%`);
  const hy = useTransform(py ?? still, (v) => `${30 + v * 22}%`);
  return (
    <span className="k-orb" data-mood={mood} data-small={small || undefined} aria-hidden>
      <span className="k-halo" />
      <span className="k-ring k-ring-1" />
      <span className="k-ring k-ring-2" />
      <span className="k-ring k-ring-3" />
      <span className="k-core">
        <motion.span className="k-shine" style={{ left: hx, top: hy }} />
      </span>
    </span>
  );
}
