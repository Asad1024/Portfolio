"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { Compass, Download, Mail, MessageSquareText, Sparkles, X } from "lucide-react";
import { contact } from "@/lib/data";
import { plainText, type ButtonKind } from "@/lib/assistant/protocol";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { Nova, type Mood } from "./nova";
import { Panel, NAME } from "./panel";
import { GuideLayer, type GuideStop } from "./guide-layer";
import type { Mission } from "./welcome";
import { useChat } from "./use-chat";
import { OPEN_EVENT, type OpenDetail } from "./events";
import type { ComposerHandle } from "./composer";
import type { Act } from "./message";

/* ── Asad's Assistant ────────────────────────────────────────────────────────
   The guide that lives in the corner of the sky as Nova, a small drone with a
   visor whose eyes follow the pointer. It is three things at once:

   - a console (panel.tsx): a conversation about Asad's work, answered live by
     /api/guide or, without a model, by the offline engine — with project
     cards, a contact card, a role-match score and follow-up questions;
   - a guide on the page (guide-layer.tsx): for the tour and for any "take me
     there", Nova flies out of the corner to the section, dims the sky around
     it and explains what to look at;
   - a companion: it greets a first-time visitor once, and otherwise waits
     to be asked.

   Anything on the site can open it with a question (events.ts). Ctrl/⌘ + I
   toggles it, Esc closes it. Everything animated stops for reduced motion,
   and the whole guide can be put away; that choice is remembered. */

type Toast = { text: string; actions?: { label: string; Icon?: typeof Mail; run: () => void }[]; sticky?: boolean; ms?: number };

const SECTION_TITLES: Record<string, string> = {
  work: "Selected work",
  capabilities: "Capabilities",
  experience: "Experience",
  about: "About",
  contact: "Contact",
};

/* What Nova says when it flies the visitor to a section. */
const SHOW: Record<string, { title: string; text: string }> = {
  work: { title: "The work", text: "Fourteen shipped products. Pick one from the list to put it on stage, or click its screen for the full case study." },
  capabilities: { title: "What he builds with", text: "Grouped by what each tool is for, and every group points to the projects that prove it." },
  experience: { title: "Where he's shipped", text: "Three teams, from Lahore to Dubai, with the products built at each." },
  about: { title: "The person behind it", text: "How Asad likes to work, and what he cares about beyond the code." },
  contact: { title: "Start a conversation", text: "Email gets the fastest reply. The map shows where Asad works from and who he's shipped with." },
};

const TOUR: { id: string; title: string; text: string; ask: string }[] = [
  { id: "work", title: "Fourteen shipped products", text: "AI platforms, SaaS and desktop tools. Pick any project from the list to put it on stage.", ask: "Which project should I open first?" },
  { id: "capabilities", title: "What he builds with", text: "Grouped by what it's for — and each group links to the work that proves it.", ask: "What's his strongest area?" },
  { id: "experience", title: "Where he's shipped", text: "Three teams, Dubai to Lahore, and the products from each.", ask: "Tell me about his experience" },
  { id: "about", title: "The person behind it", text: "How Asad likes to work, and what he cares about beyond the code.", ask: "Where is Asad based?" },
  { id: "contact", title: "That's the tour", text: "If you're building something, this is where it starts. Email gets the fastest reply.", ask: "Is Asad available?" },
];

function readFlag(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function writeFlag(key: string, on: boolean) {
  try {
    if (on) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {}
}

export function Assistant() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();
  const [booted, setBooted] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [voice, setVoice] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [tour, setTour] = useState<number | null>(null);
  const [showing, setShowing] = useState<string | null>(null);
  const [section, setSection] = useState<string | undefined>();
  const [hover, setHover] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const composer = useRef<ComposerHandle>(null);
  const pendingPrompt = useRef<string | null>(null);
  const sectionRef = useRef(section);
  useEffect(() => {
    sectionRef.current = section;
  }, [section]);

  // the chat reads the section when it sends, not on every scroll
  const homeSection = pathname === "/" ? section : undefined;
  // back to the launcher on close, once it's been shown again
  const returnFocus = () => setTimeout(() => launcherRef.current?.focus(), 0);
  const getSection = useCallback(() => (pathname === "/" ? sectionRef.current : undefined), [pathname]);
  const chat = useChat({ page: pathname, section: getSection });

  // Nova's eyes follow the pointer
  const px = useSpring(useMotionValue(0), { stiffness: 120, damping: 16 });
  const py = useSpring(useMotionValue(0), { stiffness: 120, damping: 16 });

  useScrollLock(open && mobile);

  const speak = useCallback((next: Toast | null, ms = 6500) => setToast(next && { ...next, ms }), []);

  /* eslint-disable react-hooks/set-state-in-effect -- reading the device's saved choices after mount */
  useEffect(() => {
    setHidden(readFlag("kepler-hidden"));
    setVoice(readFlag("assistant-voice"));
    setExpanded(readFlag("assistant-drawer"));
    const mq = window.matchMedia("(max-width: 639px)");
    const onMq = () => setMobile(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    const on = () => setBooted(true);
    if (sessionStorage.getItem("booted") === "1") setBooted(true);
    window.addEventListener("boot-complete", on);
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("boot-complete", on);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // a passing remark clears itself; a question waits for its answer
  useEffect(() => {
    if (!toast || toast.sticky) return;
    const t = setTimeout(() => setToast(null), toast.ms ?? 6500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── where the visitor is: the section crossing the middle of the screen,
     watched by the browser rather than measured on every scroll ── */
  useEffect(() => {
    if (pathname !== "/") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setSection(e.target.id);
          else setSection((s) => (s === e.target.id ? undefined : s));
        }
      },
      { rootMargin: "-45% 0px -54% 0px" },
    );
    Object.keys(SECTION_TITLES).forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);

  /* ── moving around the site ── */
  const glide = useCallback(
    (selector: string) => {
      if (reduced) document.querySelector(selector)?.scrollIntoView();
      else window.dispatchEvent(new CustomEvent("scroll-to", { detail: selector }));
    },
    [reduced],
  );

  // the guide layer's stops glide to their section once the home page is up
  // (starting one from another page takes the visitor home first, below)
  const target = tour !== null ? TOUR[tour].id : showing;
  useEffect(() => {
    if (!target || pathname !== "/") return;
    const t = setTimeout(() => glide(`#${target}`), document.getElementById(target) ? 0 : 900);
    return () => clearTimeout(t);
  }, [target, pathname, glide]);

  // a visitor who follows a link mid-tour has chosen to go there: the tour
  // ends rather than dragging them back home (state adjusted during render,
  // on the route change itself)
  const [routeSeen, setRouteSeen] = useState(pathname);
  if (routeSeen !== pathname) {
    setRouteSeen(pathname);
    if (pathname !== "/" && (tour !== null || showing)) {
      setTour(null);
      setShowing(null);
    }
  }

  // a question handed over with the open is asked once the panel is up —
  // and also when it already was, so "Ask about this project" never goes
  // unanswered; the counter is what tells the effect there's a new one
  const [asked, setAsked] = useState(0);
  const openChat = useCallback((prompt?: string) => {
    setToast(null);
    setTour(null);
    setShowing(null);
    setOpen(true);
    if (prompt) {
      pendingPrompt.current = prompt;
      setAsked((n) => n + 1);
    }
  }, []);

  const { send } = chat;
  useEffect(() => {
    if (!open || !pendingPrompt.current) return;
    const q = pendingPrompt.current;
    pendingPrompt.current = null;
    send(q);
  }, [open, send, asked]);

  const startTour = useCallback(() => {
    setOpen(false);
    setToast(null);
    setShowing(null);
    setTour(0);
    if (pathname !== "/") router.push("/");
  }, [pathname, router]);

  const showSection = useCallback(
    (selector: string) => {
      const id = selector.replace(/^#/, "");
      if (!SHOW[id]) return;
      setOpen(false);
      setToast(null);
      setTour(null);
      setShowing(id);
      if (pathname !== "/") router.push("/");
    },
    [pathname, router],
  );

  const finishTour = useCallback(() => {
    setTour(null);
    speak({
      text: "Want Asad's résumé, or to start a conversation with him?",
      sticky: true,
      actions: [
        { label: "Email Asad", Icon: Mail, run: () => (window.location.href = `mailto:${contact.email}`) },
        { label: "Résumé", Icon: Download, run: () => window.open("/Asad-Shah-Resume.pdf", "_blank") },
        { label: "Ask me", Icon: MessageSquareText, run: () => openChat() },
      ],
    });
  }, [speak, openChat]);

  const emailAsad = useCallback(() => {
    const lastQ = [...chat.messages].reverse().find((m) => m.role === "user")?.content;
    const body = `Hi Asad,\n\n${lastQ && lastQ.length < 300 ? `I was asking your assistant: "${lastQ}"\n\n` : ""}`;
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent("Hello from your portfolio")}&body=${encodeURIComponent(body)}`;
  }, [chat.messages]);

  // the latest handlers, behind one stable object, so a streaming reply
  // doesn't re-render every earlier message on each word
  const handlers = useRef<Act | null>(null);
  const current: Act = {
    button: (kind: ButtonKind, arg?: string) => {
      if (kind === "open" && arg) {
        if (mobile) setOpen(false);
        router.push(arg);
      } else if (kind === "scroll" && arg) showSection(arg);
      else if (kind === "email") emailAsad();
      else if (kind === "resume") window.open("/Asad-Shah-Resume.pdf", "_blank");
      else if (kind === "tour") startTour();
    },
    open: (href) => {
      if (mobile) setOpen(false);
      router.push(href);
    },
    email: emailAsad,
    ask: (q) => chat.send(q),
  };
  useEffect(() => {
    handlers.current = current;
  });
  const act = useMemo<Act>(
    () => ({
      button: (kind, arg) => handlers.current?.button(kind, arg),
      open: (href) => handlers.current?.open(href),
      email: () => handlers.current?.email(),
      ask: (q) => handlers.current?.ask(q),
    }),
    [],
  );

  const onMission = (m: Mission) => {
    if (m === "tour") startTour();
    else if (m === "match") composer.current?.roleMatch();
    else if (m === "best") chat.send("What's his best project?");
    else chat.send("Is Asad available, and how do I reach him?");
  };

  /* ── first visit: a greeting; then hints where something isn't obvious ── */
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
        text: "Hi, I'm Asad's assistant. Want a one-minute tour of his work, or ask me anything?",
        sticky: true,
        actions: [
          { label: "Take the tour", Icon: Compass, run: startTour },
          { label: "Ask me", Icon: Sparkles, run: () => openChat() },
        ],
      });
    }, 2600);
    return () => clearTimeout(t);
  }, [booted, hidden, speak, startTour, openChat]);

  /* Nothing else pops up on its own. Hints while scrolling and a remark on
     every case study were noise on top of the content; the case studies
     carry an "Ask about this project" button instead. */

  /* ── shortcuts and outside requests ── */
  useEffect(() => {
    const onOpen = (e: Event) => {
      if (hidden) {
        setHidden(false);
        writeFlag("kepler-hidden", false);
      }
      openChat((e as CustomEvent<OpenDetail>).detail?.prompt);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (open) setOpen(false);
        else onOpen(new CustomEvent(OPEN_EVENT));
        return;
      }
      // something inside (the ⋯ menu) already dealt with this Esc
      if (e.key === "Escape" && e.defaultPrevented) return;
      if (e.key === "Escape") {
        if (tour !== null || showing) {
          setTour(null);
          setShowing(null);
        } else if (open) {
          setOpen(false);
          returnFocus();
        }
        return;
      }
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if (tour !== null && !typing) {
        if (e.key === "ArrowRight") {
          if (tour === TOUR.length - 1) finishTour();
          else setTour(tour + 1);
        }
        if (e.key === "ArrowLeft" && tour > 0) setTour(tour - 1);
      }
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [hidden, open, tour, showing, openChat, finishTour]);

  // pointer tracking for Nova's eyes
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      const r = launcherRef.current?.getBoundingClientRect();
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

  /* ── reading replies aloud ── */
  const spoken = useRef<string | null>(null);
  const lastMsg = chat.messages[chat.messages.length - 1];
  useEffect(() => {
    if (!voice || !lastMsg || lastMsg.role !== "assistant" || lastMsg.status !== "done" || spoken.current === lastMsg.id) return;
    spoken.current = lastMsg.id;
    if (!("speechSynthesis" in window)) return;
    const text = plainText(lastMsg.content).replace(/[*_`#]/g, "");
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.04;
    const en = window.speechSynthesis.getVoices().find((v) => /en[-_](GB|US)/i.test(v.lang) && /natural|google|samantha|daniel/i.test(v.name));
    if (en) u.voice = en;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, [voice, lastMsg]);
  useEffect(() => {
    if (!open || !voice) window.speechSynthesis?.cancel();
  }, [open, voice]);

  const toggleVoice = () => {
    setVoice((v) => {
      writeFlag("assistant-voice", !v);
      if (!v && lastMsg?.role === "assistant") spoken.current = lastMsg.id; // don't read out the old reply
      return !v;
    });
  };

  const hide = () => {
    setOpen(false);
    setToast(null);
    setTour(null);
    setShowing(null);
    setHidden(true);
    writeFlag("kepler-hidden", true);
    setTimeout(() => document.getElementById("assistant-return")?.focus(), 0);
  };
  const show = () => {
    setHidden(false);
    writeFlag("kepler-hidden", false);
    speak({ text: "Back online. Click me any time, or press Ctrl + I." }, 3600);
  };

  if (!booted) return null;

  if (hidden) {
    return (
      <button
        type="button"
        id="assistant-return"
        onClick={show}
        aria-label={`Bring back ${NAME}`}
        title={`Bring back ${NAME}`}
        className="fixed bottom-5 right-5 z-[90] size-10 rounded-full opacity-70 transition-opacity hover:opacity-100 sm:bottom-6 sm:right-6"
      >
        <Nova mood="idle" small />
      </button>
    );
  }

  /* ── the guide layer's current stop ── */
  let stop: GuideStop | null = null;
  if (tour !== null) {
    const s = TOUR[tour];
    const lastStep = tour === TOUR.length - 1;
    stop = {
      target: `#${s.id}`,
      kicker: SECTION_TITLES[s.id],
      title: s.title,
      text: s.text,
      step: { index: tour, total: TOUR.length },
      actions: [
        { label: lastStep ? "Finish" : "Next", primary: true, run: () => (lastStep ? finishTour() : setTour(tour + 1)) },
        ...(tour > 0 ? [{ label: "Back", run: () => setTour(tour - 1) }] : []),
        { label: "Ask about this", quiet: true, run: () => openChat(s.ask) },
      ],
    };
  } else if (showing) {
    stop = {
      target: `#${showing}`,
      kicker: SECTION_TITLES[showing],
      title: SHOW[showing].title,
      text: SHOW[showing].text,
      actions: [
        { label: "Back to chat", primary: true, run: () => openChat() },
        { label: "Got it", run: () => setShowing(null) },
      ],
    };
  }
  const guiding = !!stop;

  const mood: Mood = chat.busy
    ? chat.messages[chat.messages.length - 1]?.content
      ? "speaking"
      : "thinking"
    : toast || hover
      ? "speaking"
      : "idle";

  return (
    <>
      <GuideLayer
        stop={stop}
        onClose={() => {
          setTour(null);
          setShowing(null);
        }}
      />

      <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {open && (
            <Panel
              ref={composer}
              messages={chat.messages}
              busy={chat.busy}
              mode={chat.mode}
              mood={mood}
              page={pathname}
              section={homeSection}
              expanded={expanded}
              voice={voice}
              focusOnOpen={!mobile}
              modal={mobile}
              act={act}
              onSend={chat.send}
              onStop={chat.stop}
              onRegenerate={chat.regenerate}
              onReset={chat.reset}
              onMission={onMission}
              onToggleExpand={() =>
                setExpanded((v) => {
                  writeFlag("assistant-drawer", !v);
                  return !v;
                })
              }
              onToggleVoice={toggleVoice}
              onTour={startTour}
              onHide={hide}
              onClose={() => {
                setOpen(false);
                returnFocus();
              }}
            />
          )}

          {!open && !guiding && toast && (
            <motion.div
              key={toast.text}
              role="status"
              aria-live="polite"
              initial={reduced ? false : { opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="as-shell pointer-events-auto relative w-[min(21rem,calc(100vw-2rem))] origin-bottom-right !rounded-2xl !border p-4"
            >
              <div className="relative mb-1.5 flex items-center justify-between">
                <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.22em] text-accent">
                  <span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                  {NAME}
                </p>
                <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" className="as-icon-btn -mr-1.5 !size-7">
                  <X className="size-3.5" />
                </button>
              </div>
              <p className="relative text-[13.5px] leading-relaxed text-fg/90">{toast.text}</p>
              {toast.actions && (
                <div className="relative mt-3 flex flex-wrap gap-2">
                  {toast.actions.map((a, i) => (
                    <button key={a.label} type="button" onClick={a.run} className={i === 0 ? "as-btn as-btn-solid" : "as-btn"}>
                      {a.Icon && <a.Icon className="size-3.5" />}
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* the launcher: Nova, who leaves the corner while it's guiding */}
        {/* the floating launcher steps aside while the panel is open: Nova
            is already in its header, and one Nova on screen is enough */}
        <div className={`relative flex items-center gap-3 ${open ? "hidden" : ""}`}>
          <AnimatePresence>
            {hover && !open && !toast && !guiding && (
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                className="pointer-events-none hidden items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-[#0a0f1d]/90 px-3 py-1.5 text-[12px] text-fg/90 shadow-xl sm:flex"
              >
                Ask {NAME}
                <kbd className="rounded border border-white/15 px-1 font-sans text-[10px] text-muted">Ctrl I</kbd>
              </motion.span>
            )}
          </AnimatePresence>
          <motion.button
            ref={launcherRef}
            type="button"
            aria-label={open ? `Close ${NAME}` : `Open ${NAME}`}
            aria-expanded={open}
            onClick={() => (open ? setOpen(false) : openChat())}
            className="pointer-events-auto relative size-14 rounded-full sm:size-16"
            initial={reduced ? false : { x: 160, y: 140, scale: 0.4, opacity: 0 }}
            animate={reduced ? { opacity: guiding ? 0 : 1 } : { x: 0, y: 0, scale: guiding ? 0.3 : 1, opacity: guiding ? 0 : 1 }}
            transition={
              reduced
                ? undefined
                : {
                    x: { type: "spring", stiffness: 55, damping: 12 },
                    y: { type: "spring", stiffness: 55, damping: 12 },
                    scale: { type: "spring", stiffness: 70, damping: 11 },
                    opacity: { duration: 0.4 },
                  }
            }
            onHoverStart={() => setHover(true)}
            onHoverEnd={() => setHover(false)}
            whileTap={{ scale: 0.94 }}
            style={{ pointerEvents: guiding ? "none" : undefined }}
          >
            {/* a slow bob, as if hovering on its thruster */}
            <motion.span
              className="block size-full"
              animate={reduced ? undefined : { y: [0, -5, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            >
              <Nova mood={mood} px={px} py={py} />
            </motion.span>
            {/* a replying beacon while the panel is closed mid-answer */}
            {!open && chat.busy && <span className="absolute right-1 top-1 size-3 animate-ping rounded-full bg-accent motion-reduce:animate-none" />}
          </motion.button>
        </div>
      </div>
    </>
  );
}
