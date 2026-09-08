import { codeToHtml, type BundledLanguage } from "shiki";
import { CopyButton } from "./copy-button";

/* Real code from the real repo, highlighted at build time with shiki so it
   ships as static HTML — no highlighter in the client bundle. Dual-theme via
   CSS variables (see .shiki rules in globals.css). */
export async function CodeBlock({
  code,
  lang,
  file,
  note,
}: {
  code: string;
  lang: BundledLanguage;
  file: string;
  note?: string;
}) {
  const html = await codeToHtml(code.trim(), {
    lang,
    themes: { light: "vitesse-light", dark: "vitesse-dark" },
    defaultColor: false,
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-bg">
      <div className="flex items-center gap-1.5 border-b border-line bg-card px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 truncate font-mono text-[11px] text-muted">{file}</span>
        <span className="ml-auto hidden rounded border border-accent/40 px-1.5 py-px font-mono text-[10px] text-accent sm:inline">
          real code · from the repo
        </span>
        <span className="rounded border border-line px-1.5 py-px font-mono text-[10px] text-muted">
          {lang}
        </span>
        <CopyButton code={code.trim()} />
      </div>

      <div
        className="code-scroll overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.7]"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {note && (
        <p className="border-t border-line px-5 py-3 font-mono text-xs leading-relaxed text-muted">
          <span className="text-accent">//</span> {note}
        </p>
      )}
    </div>
  );
}
