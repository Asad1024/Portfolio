"use client";

import { motion } from "framer-motion";
import type { ArchCol } from "@/lib/data";

/** Data-driven pipeline diagram — horizontal on desktop, stacked on mobile. */
export function ArchDiagram({ cols, caption }: { cols: ArchCol[]; caption: string }) {
  return (
    <div>
      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
        {cols.map((col, i) => (
          <div key={col.title} className="contents">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.21, 0.6, 0.35, 1] }}
              className="flex-1 rounded-xl border border-line bg-card p-4"
            >
              <p className="font-mono text-[11px] uppercase tracking-wider text-accent">
                {String(i + 1).padStart(2, "0")} {col.title}
              </p>
              <div className="mt-3 space-y-2">
                {col.items.map((item) => (
                  <div
                    key={item}
                    className="rounded-md border border-line bg-bg px-3 py-2 font-mono text-[11px] text-muted"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            {i < cols.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 + 0.15 }}
                className="flex shrink-0 items-center justify-center text-accent"
                aria-hidden
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="rotate-90 md:rotate-0"
                >
                  <path d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                </svg>
              </motion.div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-5 border-l-2 border-accent pl-4 font-mono text-xs leading-relaxed text-muted">
        {caption}
      </p>
    </div>
  );
}
