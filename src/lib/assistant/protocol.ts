/* ── the reply protocol ─────────────────────────────────────────────────────
   A reply is plain text with a little markdown, plus directives in double
   brackets that the panel turns into interface instead of words:

     [[project:<slug>]]           a project card (image, tagline, stack)
     [[contact]]                  the contact card
     [[open:/work/<slug>|Label]]  a button that opens a case study
     [[scroll:#<id>|Label]]       a button that glides to a section
     [[email|Label]]              a button that drafts an email to Asad
     [[resume|Label]]             a button that opens the résumé
     [[tour|Label]]               a button that starts the guided tour
     [[next:<question>]]          a suggested follow-up question
     [[fit:<0-100>|Verdict]]      a fit gauge, for a role-match analysis

   The same grammar is taught to the model (see prompt.ts) and spoken by the
   offline engine (see knowledge.ts), so one parser serves both. Pure: no DOM,
   no React, no site data, so it runs under `node --test` as is. */

export type ButtonKind = "open" | "scroll" | "email" | "resume" | "tour";

export type Directive =
  | { kind: ButtonKind; arg?: string; label: string }
  | { kind: "project"; slug: string }
  | { kind: "contact" }
  | { kind: "fit"; score: number; label: string };

export type ParsedReply = {
  /** the prose, directives removed */
  text: string;
  buttons: Extract<Directive, { kind: ButtonKind }>[];
  projects: string[];
  contact: boolean;
  followUps: string[];
  fit?: { score: number; label: string };
};

const TAG = /\[\[(open|scroll|email|resume|tour|project|contact|next|fit)(?::([^|\]]*))?(?:\|([^\]]*))?\]\]/g;

const DEFAULT_LABEL: Record<ButtonKind, string> = {
  open: "Open case study",
  scroll: "Take me there",
  email: "Email Asad",
  resume: "Download résumé",
  tour: "Take the tour",
};

const LIMITS = { buttons: 3, projects: 3, followUps: 3 };

/** Where an argument is a link, only the shapes the site itself uses pass:
 *  a case study path or a section id. Anything else (a full URL, a script)
 *  is dropped, so a model that strays can't point a button off the site. */
const SAFE_OPEN = /^\/work\/[a-z0-9-]+$/;
const SAFE_SCROLL = /^#[a-z][a-z0-9-]*$/;
const SAFE_SLUG = /^[a-z0-9-]+$/;

/**
 * Split a reply into prose and interface. While `streaming`, a directive
 * that has started but not closed is held back rather than flashed as raw
 * brackets for a frame.
 */
export function parseReply(raw: string, streaming = false): ParsedReply {
  let source = raw;
  if (streaming) {
    const open = source.lastIndexOf("[[");
    if (open !== -1 && source.indexOf("]]", open) === -1) source = source.slice(0, open);
    // a lone trailing "[" may be the first half of one
    if (source.endsWith("[")) source = source.slice(0, -1);
  }

  const out: ParsedReply = { text: "", buttons: [], projects: [], contact: false, followUps: [] };
  const text = source.replace(TAG, (_m, kind: string, rawArg?: string, rawLabel?: string) => {
    const arg = rawArg?.trim() || undefined;
    const label = rawLabel?.trim() || undefined;
    switch (kind) {
      case "project":
        if (arg && SAFE_SLUG.test(arg) && !out.projects.includes(arg) && out.projects.length < LIMITS.projects)
          out.projects.push(arg);
        break;
      case "contact":
        out.contact = true;
        break;
      case "fit": {
        const score = Number(arg);
        if (!out.fit && Number.isFinite(score))
          out.fit = { score: Math.max(0, Math.min(100, Math.round(score))), label: (label ?? "Fit").slice(0, 40) };
        break;
      }
      case "next": {
        const q = (arg ?? label)?.replace(/\s+/g, " ").slice(0, 80);
        if (q && !out.followUps.includes(q) && out.followUps.length < LIMITS.followUps) out.followUps.push(q);
        break;
      }
      default: {
        const k = kind as ButtonKind;
        if (k === "open" && !(arg && SAFE_OPEN.test(arg))) break;
        if (k === "scroll" && !(arg && SAFE_SCROLL.test(arg))) break;
        if (out.buttons.length >= LIMITS.buttons) break;
        if (out.buttons.some((b) => b.kind === k && b.arg === arg)) break;
        out.buttons.push({ kind: k, arg, label: (label ?? DEFAULT_LABEL[k]).slice(0, 40) });
      }
    }
    return "";
  });

  out.text = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return out;
}

/** The prose alone, for copying a reply or reading it back as history. */
export function plainText(raw: string) {
  return parseReply(raw).text;
}
