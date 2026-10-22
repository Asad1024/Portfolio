/* ── a small, safe markdown ─────────────────────────────────────────────────
   Replies are short, so they only need the markdown people actually write in
   chat: paragraphs, bullet and numbered lists, **bold**, *italic*, `code` and
   [links](…). This turns that into a tree the panel renders with React, never
   as HTML, so nothing in a reply can inject markup. Headings are read as a
   bold line; anything else unrecognised is left as the text it was. Pure, so
   it runs under `node --test`. */

export type Inline =
  | { t: "text"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; c: Inline[] };

export type Block =
  | { t: "p"; c: Inline[] }
  | { t: "ul"; items: Inline[][] }
  | { t: "ol"; items: Inline[][]; start: number };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBER = /^\s*(\d{1,3})[.)]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;

/* Where a link in a reply may go: a page or section of this site, email,
   or one of the few outside places Asad is (his GitHub and LinkedIn).
   Anything else is shown as plain text, so a model that strays can't send a
   visitor off the site. Backslashes and control characters are refused
   outright: browsers read "/\evil.com" as "//evil.com". */
const SITE_PATH = /^\/(work\/[a-z0-9-]+)?(#[a-z][\w-]*)?$/;
const SECTION = /^#[a-z][\w-]*$/;
const OUTSIDE = ["github.com", "www.github.com", "linkedin.com", "www.linkedin.com"];

export function safeHref(href: string) {
  const h = href.trim();
  if (/[\\\x00-\x1f\x7f]/.test(h)) return null;
  if (SITE_PATH.test(h) || SECTION.test(h)) return h;
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(h)) return h;
  try {
    const url = new URL(h);
    if (url.protocol === "https:" && OUTSIDE.includes(url.hostname)) return url.href;
  } catch {}
  return null;
}

export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { t: "ul" | "ol"; items: string[]; start: number } | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ t: "p", c: parseInline(para.join("\n")) });
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map(parseInline);
    blocks.push(list.t === "ul" ? { t: "ul", items } : { t: "ol", items, start: list.start });
    list = null;
  };

  for (const line of src.split("\n")) {
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    const b = BULLET.exec(line);
    const n = b ? null : NUMBER.exec(line);
    if (b || n) {
      flushPara();
      const kind = b ? "ul" : "ol";
      if (list && list.t !== kind) flushList();
      if (!list) list = { t: kind, items: [], start: n ? Number(n[1]) : 1 };
      list.items.push(b ? b[1] : n![2]);
      continue;
    }
    // a line that isn't a bullet, straight under a list item, continues it
    if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += " " + line.trim();
      continue;
    }
    flushList();
    const h = HEADING.exec(line);
    para.push(h ? `**${h[1].replace(/\*\*/g, "")}**` : line);
  }
  flushPara();
  flushList();
  return blocks;
}

/* Inline marks are matched left to right, earliest first; whatever sits
   between them is text. Code is matched before emphasis so `a*b*c` stays
   literal inside backticks. */
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*)|(\[[^\]\n]+\]\([^)\s]+\))|(\*[^*\s][^*\n]*?\*)|(_[^_\s][^_\n]*?_)/;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let rest = src;
  while (rest) {
    const m = INLINE.exec(rest);
    if (!m) {
      push(out, rest);
      break;
    }
    if (m.index) push(out, rest.slice(0, m.index));
    const tok = m[0];
    if (m[1]) out.push({ t: "code", v: tok.slice(1, -1) });
    else if (m[2]) out.push({ t: "strong", c: parseInline(tok.slice(2, -2)) });
    else if (m[3]) {
      const split = tok.indexOf("](");
      const label = tok.slice(1, split);
      const href = safeHref(tok.slice(split + 2, -1));
      if (href) out.push({ t: "link", href, c: parseInline(label) });
      else push(out, label);
    } else out.push({ t: "em", c: parseInline(tok.slice(1, -1)) });
    rest = rest.slice(m.index + tok.length);
  }
  return out;
}

function push(out: Inline[], v: string) {
  const last = out[out.length - 1];
  if (last?.t === "text") last.v += v;
  else out.push({ t: "text", v });
}
