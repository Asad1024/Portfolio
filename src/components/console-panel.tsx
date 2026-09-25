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
  /** the instrument's name, in the header — leave out for a bare panel */
  title?: string;
  /** the readout beside it */
  sub?: string;
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
    /* Only hand focus back to someone who was navigating by keyboard. Closing
       with Esc is itself a keypress, so restoring focus to a button that was
       clicked makes the browser ring it as if it had been tabbed to — a focus
       ring nobody asked for, left on the search pill after every close. */
    const keyboardUser = !!returnTo.current?.matches?.(":focus-visible");

    const t = setTimeout(() => {
      const target =
        initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 40);

    return () => {
      clearTimeout(t);
      if (keyboardUser) returnTo.current?.focus?.();
      else (document.activeElement as HTMLElement | null)?.blur?.();
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
            className={`relative flex w-full flex-col overflow-hidden rounded-xl border bg-[#05080c]/95 backdrop-blur-xl ${size}`}
            style={{
              borderColor: "color-mix(in oklab, var(--accent) 22%, transparent)",
              boxShadow:
                "0 24px 64px -24px rgba(0,0,0,0.8), 0 0 40px -18px color-mix(in oklab, var(--accent) 35%, transparent)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* A single faint wash off the top edge. The stars, grid, sweep
                and corner brackets that used to sit here made the panel feel
                busy; the content is the interface, not the frame. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-20"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--accent) 7%, transparent), transparent 72%)",
              }}
            />

            {/* ── instrument header: its name, a readout, signal, and the close key.
                The console character lives here and in the colour — not in
                brackets, grids or sweeps over the content. ── */}
            {title && (
              <div
                className="relative flex items-center gap-3 border-b px-4 py-2.5"
                style={{ borderColor: "color-mix(in oklab, var(--accent) 16%, transparent)" }}
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full bg-accent"
                  style={{ boxShadow: "0 0 8px var(--accent)" }}
                />
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">{title}</p>
                {sub && (
                  <p className="ml-auto hidden font-mono text-[11px] uppercase tracking-widest text-muted/70 sm:block">
                    {sub}
                  </p>
                )}
                {/* signal strength, because every console has one */}
                <span aria-hidden className={`hidden items-end gap-px sm:flex ${sub ? "" : "ml-auto"}`}>
                  {[4, 7, 10, 13].map((h) => (
                    <span key={h} className="w-[2px] rounded-full bg-accent/70" style={{ height: h }} />
                  ))}
                </span>
                <button
                  onClick={onClose}
                  className="ml-auto rounded-md border border-line px-1.5 py-px font-mono text-[11px] uppercase tracking-widest text-muted transition-colors hover:border-accent/60 hover:text-accent sm:ml-0"
                  aria-label={`Close ${label.toLowerCase()}`}
                >
                  esc
                </button>
              </div>
            )}

            {children}
            {footer}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
