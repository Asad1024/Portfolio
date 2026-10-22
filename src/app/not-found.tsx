import Link from "next/link";
import { ArrowLeft, LayoutGrid } from "lucide-react";

/* A wrong address, kept inside the same sky: the 404 drifts on its own orbit
   instead of dropping the visitor onto a stock white error page. */
export default function NotFound() {
  return (
    <section className="relative mx-auto flex min-h-[100svh] max-w-shell flex-col items-center justify-center px-6 py-32 text-center">
      <div aria-hidden className="relative flex size-64 items-center justify-center sm:size-80">
        <span className="absolute inset-0 rounded-full border border-accent/20" />
        <span className="absolute inset-8 rounded-full border border-accent/10" />
        <span className="marker-orbit absolute inset-0">
          <span className="absolute left-1/2 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_18px_5px_var(--ring)]" />
        </span>
        <span className="font-sans text-[7rem] font-semibold leading-none tracking-[-0.06em] text-fg sm:text-[9rem]">404</span>
      </div>

      <h1 className="mt-10 font-sans text-[clamp(2.2rem,5vw,3.5rem)] font-semibold tracking-[-0.04em]">
        Lost in <span className="text-accent">space.</span>
      </h1>
      <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted">
        This page drifted out of orbit, or never existed. The work is still where you left it.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          <ArrowLeft aria-hidden className="size-4 transition-transform" />
          Back to home
        </Link>
        <Link
          href="/#work"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-bg/75 px-6 py-3.5 text-sm font-medium text-fg/90 transition-colors hover:border-accent hover:text-accent"
        >
          <LayoutGrid aria-hidden className="size-4" />
          Browse the work
        </Link>
      </div>
      <p className="mt-8 font-sans text-xs text-muted">
        or press <kbd className="rounded border border-line px-1.5 py-0.5 text-fg/85">Ctrl K</kbd> to search
      </p>
    </section>
  );
}
