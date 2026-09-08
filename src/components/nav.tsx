"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Magnetic } from "./magnetic";

const links = [
  { href: "/#work", label: "Work" },
  { href: "/#capabilities", label: "Capabilities" },
  { href: "/#skills", label: "Skills" },
  { href: "/#experience", label: "Experience" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export function Nav() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

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
       stranded the highlight on the section you just left. Document order then
       picks the topmost of whatever is currently in the band. */
    const inBand = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target.id);
          else inBand.delete(e.target.id);
        }
        setActive(ids.find((id) => inBand.has(id)) ?? null);
      },
      { rootMargin: "-72px 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // close the mobile menu on Escape
  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/70 backdrop-blur-md">
      {/* scroll progress */}
      <motion.div
        className="absolute inset-x-0 top-0 h-px origin-left bg-accent"
        style={{ scaleX: progress }}
      />
      <nav className="mx-auto flex h-16 max-w-shell items-center justify-between px-6">
        <Magnetic>
          <Link href="/" className="font-mono text-sm tracking-tight" onClick={() => setMenuOpen(false)}>
            <span className="text-accent">~/</span>asad
            <span className="caret-blink text-accent">_</span>
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
                className="group relative rounded-full px-3 py-1.5 font-mono text-xs transition-colors"
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
          {/* Set exactly like the wordmark opposite it — cyan sigil, plain
              word, blinking cyan underscore. The two ends of the header are
              the same kind of object then: one is where you are, the other is
              what you can talk to. */}
          <Magnetic>
            <button
              aria-label="Open terminal"
              title="Terminal — `"
              onClick={() => window.dispatchEvent(new CustomEvent("open-terminal"))}
              className="group flex h-9 items-center font-mono text-sm tracking-tight"
            >
              <span className="text-accent">&gt;_</span>
              <span className="ml-1.5 transition-colors group-hover:text-accent">terminal</span>
              <span className="caret-blink text-accent">_</span>
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

      {/* mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-16 z-40 bg-bg md:hidden"
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
                      <span className="font-sans text-4xl font-bold tracking-tight transition-colors group-hover:text-accent">
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
                className="font-mono text-xs text-muted"
              >
                <span className="text-accent">$</span> asad — full-stack developer · web
                · desktop · cloud · ai
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
