"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { BrandMark } from "./brand-mark";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Magnetic } from "./magnetic";
import { useScrollLock } from "@/lib/use-scroll-lock";

const links = [
  { href: "/#work", label: "Work" },
  { href: "/#capabilities", label: "Capabilities" },
  { href: "/#experience", label: "Experience" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

/* Which modifier to print on the shortcut hint. Read through a store so the
   server and the first client paint agree on "Ctrl" and a Mac swaps in ⌘
   without a hydration mismatch. The platform never changes, so there is
   nothing to subscribe to. */
const noSubscribe = () => () => {};
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export function Nav() {
  const mac = useSyncExternalStore(noSubscribe, isMac, () => false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [docked, setDocked] = useState(false);
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);

  /* Which section you're actually in. The nav had no idea before — every link
     looked identical the whole way down the page, so it told you where you
     could go but never where you were. The band is offset for the fixed
     header, and picks the entry nearest the top when two overlap. */
  useEffect(() => {
    const ids = links.map((l) => l.href.split("#")[1]);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    /* Kept as a running set rather than read off each callback: a callback
       only carries the entries that CHANGED, so a scroll that merely takes one
       section out of the band arrives with nothing intersecting and would have
       stranded the highlight on the section you just left. */
    const inBand = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target.id);
          else inBand.delete(e.target.id);
        }
        // two sections share the band only at a hand-over; the later one is
        // the one being scrolled into, so it wins
        setActive([...ids].reverse().find((id) => inBand.has(id)) ?? null);
      },
      { rootMargin: "-72px 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* The header has no panel at the top of the page and grows one as you
     leave it. A permanently filled bar sits over the hero as a black stripe
     across the sky; with nothing behind it, there is nothing for it to
     separate from and nothing worth blurring. */
  useEffect(() => {
    const onScroll = () => setDocked(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useScrollLock(menuOpen);

  // close the mobile menu on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter] duration-500 ${
        docked || menuOpen ? "bg-bg/55 backdrop-blur-xl backdrop-saturate-150" : "bg-transparent"
      }`}
    >
      {/* Saturating the backdrop rather than covering it: the page behind is
          a violet wash and a starfield, and a 70%-opaque black panel threw
          all of that away. At 55% with saturation up, the nebula reads
          through the glass and the bar takes its colour from the page. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
          docked || menuOpen ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in oklab, var(--accent) 6%, transparent), transparent 78%)",
        }}
      />

      {/* A hairline that fades out at both ends instead of running wall to
          wall. A full-width rule draws a hard line across the page; one that
          dissolves at the edges reads as the near edge of a surface. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px transition-opacity duration-500 ${
          docked || menuOpen ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(to right, transparent, color-mix(in oklab, var(--accent) 38%, transparent) 18%, color-mix(in oklab, var(--fg) 16%, transparent) 50%, color-mix(in oklab, var(--accent) 38%, transparent) 82%, transparent)",
        }}
      />
      {/* scroll progress */}
      <motion.div
        className="absolute inset-x-0 top-0 h-px origin-left bg-accent"
        style={{ scaleX: progress }}
      />
      <nav className="relative mx-auto flex h-16 max-w-shell items-center justify-between px-6">
        <Magnetic>
          <Link href="/" className="group flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
            <BrandMark className="size-8 shrink-0 transition-transform duration-500" />
            <span className="text-[15px] font-semibold tracking-tight text-fg">Asad Shah</span>
          </Link>
        </Magnetic>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const on = active === l.href.split("#")[1];
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={on ? "true" : undefined}
                className="group relative inline-flex items-center rounded-full px-3 py-1.5 text-[13px] transition-colors"
              >
                <span
                  className={`transition-colors duration-300 ${
                    on ? "text-fg" : "text-muted group-hover:text-fg"
                  }`}
                >
                  {l.label}
                </span>
                {/* underline: held for the section you're in, wiped in on hover
                    for the ones you aren't */}
                <span
                  aria-hidden
                  className={`absolute inset-x-3 -bottom-px h-px origin-left bg-accent transition-transform duration-300 ${
                    on ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {/* Search: the command palette, which reaches every project,
              section, link and action on the site. The key hint teaches the
              shortcut; the whole chip is the button. */}
          <Magnetic>
            <button
              aria-label="Search and commands"
              aria-keyshortcuts={mac ? "Meta+K" : "Control+K"}
              title={`Search — ${mac ? "⌘K" : "Ctrl K"}`}
              onClick={() => window.dispatchEvent(new CustomEvent("open-palette"))}
              className="group flex h-9 items-center justify-center gap-2.5 rounded-full border border-line bg-bg/40 px-2.5 font-sans text-xs text-muted backdrop-blur-sm transition-colors hover:border-accent/60 hover:text-fg sm:pl-3 sm:pr-1.5"
            >
              <Search aria-hidden className="size-3.5 transition-colors group-hover:text-accent" />
              <span className="hidden sm:inline">search</span>
              <kbd className="hidden h-6 items-center gap-0.5 rounded-full border border-line bg-card px-2 font-sans text-[11px] text-fg/85 sm:flex">
                {mac ? "⌘" : "Ctrl"}
                <span className="text-accent">K</span>
              </kbd>
            </button>
          </Magnetic>

          {/* hamburger — mobile only */}
          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex size-9 flex-col items-center justify-center gap-[5px] rounded-full border border-line md:hidden"
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
              className="block h-px w-4 bg-fg"
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
              className="block h-px w-4 bg-fg"
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu, portalled to <body>: the header has a backdrop-filter
          when docked or open, and that makes it the containing block for any
          fixed child, which clipped the overlay to the 64px bar and let the
          page show through underneath. */}
      {mounted &&
        createPortal(
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-16 z-[45] bg-bg/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex h-full flex-col justify-between px-6 py-10">
              <div className="flex flex-col gap-2">
                {links.map((l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.06 * i, duration: 0.35, ease: [0.21, 0.6, 0.35, 1] }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-baseline gap-4 border-b border-line py-5"
                    >
                      <span className="font-sans text-4xl font-semibold tracking-[-0.03em] transition-colors group-hover:text-accent">
                        {l.label}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.3 }}
                className="font-sans text-xs text-muted"
              >
                Asad Shah · Full-stack developer
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
          document.body,
        )}
    </header>
  );
}
