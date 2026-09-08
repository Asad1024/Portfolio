"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScrollLock } from "@/lib/use-scroll-lock";

/* The chassis both dialogs are built on.

   The terminal and the palette are the same instrument running different
   programs, and they were the same sixty lines of markup written out twice —
   hull layers, four corner brackets, the header, the rail. Every visual change
   had to be made in both places, and one of them was always a revision behind.

   It also carries what neither of them had: dialog semantics, a focus trap and
   focus restore. Without those, Tab walks straight out of an open terminal into
   the page behind it and a screen reader is never told anything opened — which
   matters more here than on most sites, because these two dialogs are the
   thing the site is actually for. */

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

export function ConsolePanel({
  open,
  onClose,
  label,
  title,
  sub,
  initialFocusRef,
  align = "center",
  size = "max-w-2xl",
  z = 150,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  /** what a screen reader announces when the dialog opens */
  label: string;
  /** the instrument's name, in the header */
  title: string;
  /** the readout beside it */
  sub: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  align?: "center" | "top";
  size?: string;
  z?: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useScrollLock(open);

  /* Remember what had focus, move into the dialog, and put focus back where it
     came from on the way out — otherwise closing the terminal drops the caret
     at the top of the document and a keyboard user starts the page again. */
  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;

    const t = setTimeout(() => {
      const target =
        initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 40);

    return () => {
      clearTimeout(t);
      returnTo.current?.focus?.();
    };
  }, [open, initialFocusRef]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      // stopped here so a dialog stacked on another only closes the top one
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;

    const nodes = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      // getClientRects rather than offsetParent: inside a fixed panel,
      // offsetParent is null for everything and would filter the lot
    ).filter((n) => n.getClientRects().length > 0);
    if (nodes.length < 2) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          // AnimatePresence tracks children by key; a single conditional
          // child is still a child, and exit is unreliable without one
          key="console-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ zIndex: z }}
          className={`fixed inset-0 flex justify-center bg-void/75 p-4 backdrop-blur-md ${
            align === "top" ? "items-start pt-[12vh]" : "items-end sm:items-center"
          }`}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onKeyDown={onKeyDown}
            initial={{ y: 40, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.21, 0.6, 0.35, 1] }}
            className={`relative flex w-full flex-col overflow-hidden rounded-lg border bg-[#04070a]/95 backdrop-blur-xl ${size}`}
            style={{
              borderColor: "color-mix(in oklab, var(--accent) 30%, transparent)",
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.65), 0 26px 70px -52px color-mix(in oklab, var(--accent) 60%, transparent)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* hull: stars, survey grid, a wash off the top edge, a slow sweep */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="hull-stars absolute inset-0 opacity-70" />
              <div className="tele-grid absolute inset-0 opacity-25" />
              <div
                className="absolute inset-x-0 top-0 h-16"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 72%)",
                }}
              />
              <div
                className="hull-scan absolute inset-x-0 h-24"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--accent) 8%, transparent), transparent)",
                }}
              />
            </div>

            {/* corner brackets — the frame reads as machined, not drawn */}
            {[
              "left-2 top-2 border-l border-t",
              "right-2 top-2 border-r border-t",
              "bottom-2 left-2 border-b border-l",
              "bottom-2 right-2 border-b border-r",
            ].map((pos) => (
              <span
                key={pos}
                aria-hidden
                className={`pointer-events-none absolute z-10 size-4 border-accent/60 ${pos}`}
              />
            ))}

            {/* ── instrument header ── */}
            <div
              className="relative flex items-center gap-3 border-b px-4 py-2.5"
              style={{ borderColor: "color-mix(in oklab, var(--accent) 20%, transparent)" }}
            >
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                {title}
              </p>
              <span className="hidden h-px flex-1 bg-line sm:block" />
              <p className="hidden font-mono text-[10px] uppercase tracking-widest text-muted/60 sm:block">
                {sub}
              </p>
              {/* signal strength, because every console has one */}
              <span aria-hidden className="hidden items-end gap-px sm:flex">
                {[4, 7, 10, 13].map((h) => (
                  <span key={h} className="w-[2px] bg-accent/70" style={{ height: h }} />
                ))}
              </span>
              <button
                onClick={onClose}
                className="ml-auto rounded border border-line px-1.5 py-px font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:border-accent/60 hover:text-accent sm:ml-0"
                aria-label={`Close ${label.toLowerCase()}`}
              >
                esc
              </button>
            </div>

            {children}
            {footer}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
