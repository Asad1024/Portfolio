"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, FileText, Mail, Video } from "lucide-react";
import { contact } from "@/lib/data";
import { TechIcon } from "./tech-icon";

/* ── Let's talk ─────────────────────────────────────────────────────────────
   The header's one call to action: a pill with a status light and Asad's own
   clock, opening a small panel with every way to reach him. The light is real:
   green and breathing inside his working hours in Lahore, amber outside them,
   so someone in another timezone can tell at a glance whether a message now
   is likely to be answered now. */

const TZ = "Asia/Karachi";
/** working hours in Lahore, 24h clock, Monday to Saturday */
const OPEN_HOUR = 10;
const CLOSE_HOUR = 20;

const WHATSAPP_HELLO = "Hi Asad, I came across your portfolio and would like to talk about a project.";
const WHATSAPP_CALL = "Hi Asad, I'd like to set up a Zoom call. What times work for you?";
const wa = (text: string) => `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`;

/* Lahore's clock as a store: one string per minute, so the pill re-renders
   once a minute rather than every second, and the server (which has no
   business guessing the visitor's moment) renders without it. */
const clockFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h23",
});
function readClock() {
  const parts = Object.fromEntries(clockFmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return `${parts.weekday} ${parts.hour}:${parts.minute}`;
}
function subscribeClock(onChange: () => void) {
  const id = setInterval(onChange, 20_000);
  return () => clearInterval(id);
}

function status(clock: string) {
  const [day, hm] = clock.split(" ");
  const [h, m] = hm.split(":").map(Number);
  const open = day !== "Sun" && h >= OPEN_HOUR && h < CLOSE_HOUR;
  const h12 = h % 12 || 12;
  return {
    open,
    time: `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`,
    note: open ? "Available now · usually replies within the hour" : `Away · back at ${OPEN_HOUR} AM`,
  };
}

export function TalkMenu() {
  const clock = useSyncExternalStore(subscribeClock, readClock, () => null);
  const now = clock ? status(clock) : null;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // close on Escape or on a press anywhere outside
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const options = [
    {
      label: "WhatsApp",
      hint: "Chat now",
      href: wa(WHATSAPP_HELLO),
      icon: <TechIcon name="WhatsApp" size={16} />,
    },
    {
      label: "Book a call",
      hint: "Zoom · Meet",
      href: contact.bookingUrl ?? wa(WHATSAPP_CALL),
      icon: <Video aria-hidden className="size-4 text-accent" />,
    },
    {
      label: "Email",
      hint: contact.email,
      href: `mailto:${contact.email}`,
      icon: <Mail aria-hidden className="size-4 text-accent" />,
    },
    {
      label: "Résumé",
      hint: "PDF",
      href: "/Asad-Shah-Resume.pdf",
      icon: <FileText aria-hidden className="size-4 text-accent" />,
    },
  ];

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="group flex h-9 items-center gap-2.5 rounded-full border border-line bg-bg/40 pl-3 pr-3.5 font-sans text-xs text-fg/90 transition-colors hover:border-accent/60 hover:text-fg"
      >
        <StatusLight open={now?.open ?? true} />
        <span className="whitespace-nowrap">Let&apos;s talk</span>
        {now && (
          <>
            <span aria-hidden className="hidden h-3 w-px bg-line sm:block" />
            <span className="hidden tabular-nums text-muted sm:inline">{now.time}</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
            /* under the pill on desktop; on a phone, the header's full width
               less a 16px gutter each side (the pill sits left of the menu
               button there, so anchoring to it ran the panel off the edge) */
            className="absolute right-0 top-12 w-[19rem] origin-top-right rounded-2xl border border-line bg-[#070a14]/[0.97] p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] max-sm:fixed max-sm:inset-x-4 max-sm:top-[4.25rem] max-sm:w-auto"
          >
            <div className="flex items-center gap-2.5 px-3 pb-2.5 pt-2">
              <StatusLight open={now?.open ?? true} />
              <p className="text-[11.5px] leading-snug text-muted">
                {now ? (
                  <>
                    <span className="text-fg">{now.time}</span> in Lahore · {now.note}
                  </>
                ) : (
                  "Lahore, Pakistan · remote-first"
                )}
              </p>
            </div>
            <ul className="flex flex-col">
              {options.map((o) => (
                <li key={o.label}>
                  <a
                    href={o.href}
                    target={o.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noreferrer"
                    onClick={() => setOpen(false)}
                    className="group/opt flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white/[0.03]">
                      {o.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-medium text-fg">{o.label}</span>
                      <span className="block truncate text-[11.5px] text-muted">{o.hint}</span>
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="size-3.5 text-muted transition-colors group-hover/opt:text-accent"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** green and breathing when available, a still amber when away */
function StatusLight({ open }: { open: boolean }) {
  return (
    <span aria-hidden className="relative flex size-2 shrink-0">
      {open && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
      <span className={`relative inline-flex size-2 rounded-full ${open ? "bg-emerald-400" : "bg-amber-400"}`} />
    </span>
  );
}
