"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";
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
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Magnetic>
          <Link href="/" className="font-mono text-sm tracking-tight" onClick={() => setMenuOpen(false)}>
            <span className="text-accent">~/</span>asad
            <span className="caret-blink text-accent">_</span>
          </Link>
        </Magnetic>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((l, i) => (
            <Magnetic key={l.href} strength={0.25}>
              <Link
                href={l.href}
                className="group font-mono text-xs text-muted transition-colors hover:text-fg"
              >
                <span className="text-accent/70">0{i + 1}.</span> {l.label}
              </Link>
            </Magnetic>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
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
                      <span className="font-mono text-sm text-accent">0{i + 1}.</span>
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
