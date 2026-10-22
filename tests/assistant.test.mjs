/* Unit tests for the guide's pure modules: the reply protocol, the markdown
   parser and the offline knowledge engine. Node runs the TypeScript sources
   directly (type stripping), so there is nothing to build first:

     npm test
*/
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReply } from "../src/lib/assistant/protocol.ts";
import { parseMarkdown, parseInline, safeHref } from "../src/lib/assistant/markdown.ts";
import { offlineAnswer, extractTechs, isJobDescription, roleMatch } from "../src/lib/assistant/knowledge.ts";

const project = (slug, title, keyStack, tags = ["ai"], extra = {}) => ({
  slug,
  title,
  tagline: `${title} tagline`,
  year: "2026",
  platform: "Web",
  featured: true,
  tags,
  keyStack,
  stack: keyStack,
  summary: { challenge: `${title} challenge.`, approach: `${title} approach.`, result: `${title} result.` },
  ...extra,
});

const KB = {
  projects: [
    project("outbound-copilot", "Outbound AI Copilot", ["Next.js", "NestJS", "OpenAI", "Redis"], ["ai", "saas"], { company: "Spark AI" }),
    project("voice-agents", "AI Voice Agents", ["Twilio", "ElevenLabs", "OpenAI"], ["ai", "voice"]),
    project("sparkcue", "SparkCue", ["Electron", "Node.js", "OpenAI"], ["desktop", "ai"]),
    project("sales-crm", "Sales CRM", ["Next.js", "PostgreSQL", "Stripe"], ["saas"]),
    project("mongo-thing", "Mongo Thing", ["MongoDB"], ["saas"]),
  ],
  experience: [{ company: "Spark AI", role: "Full Stack Developer", period: "2026", location: "Remote", summary: "AI SaaS.", projects: [] }],
  pillars: [{ title: "AI systems", accent: "in production", body: "LLMs doing real work.", techs: ["OpenAI"], proof: ["voice-agents", "sparkcue"] }],
  contact: { email: "a@b.c", phone: "1" },
};

/* ── protocol ── */

test("parseReply separates prose from interface", () => {
  const r = parseReply(
    "Here it is.\n[[project:sparkcue]][[open:/work/sparkcue|Read it]]\n[[contact]][[next:What stack?]][[next:Are you available?]]",
  );
  assert.equal(r.text, "Here it is.");
  assert.deepEqual(r.projects, ["sparkcue"]);
  assert.deepEqual(r.buttons, [{ kind: "open", arg: "/work/sparkcue", label: "Read it" }]);
  assert.equal(r.contact, true);
  assert.deepEqual(r.followUps, ["What stack?", "Are you available?"]);
});

test("parseReply drops links that leave the site", () => {
  const r = parseReply("[[open:https://evil.example|x]][[scroll:javascript:alert(1)|y]][[project:../etc]][[scroll:#work|Work]]");
  assert.deepEqual(r.buttons, [{ kind: "scroll", arg: "#work", label: "Work" }]);
  assert.deepEqual(r.projects, []);
});

test("parseReply holds back a half-streamed directive", () => {
  assert.equal(parseReply("Look at this [[proj", true).text, "Look at this");
  assert.equal(parseReply("Look [", true).text, "Look");
  // not streaming: an unclosed bracket is just text
  assert.equal(parseReply("a [[b").text, "a [[b");
});

test("parseReply caps, dedupes and defaults labels", () => {
  const r = parseReply("[[project:a]][[project:a]][[project:b]][[project:c]][[project:d]][[email]][[email]][[resume]][[tour]][[scroll:#about]]");
  assert.deepEqual(r.projects, ["a", "b", "c"]);
  assert.equal(r.buttons.length, 3);
  assert.equal(r.buttons[0].label, "Email Asad");
});

test("parseReply reads a fit gauge and clamps it", () => {
  assert.deepEqual(parseReply("[[fit:88|Strong fit]]").fit, { score: 88, label: "Strong fit" });
  assert.deepEqual(parseReply("[[fit:140|x]]").fit, { score: 100, label: "x" });
  assert.equal(parseReply("[[fit:abc|x]]").fit, undefined);
});

/* ── markdown ── */

test("parseMarkdown builds paragraphs and lists", () => {
  const b = parseMarkdown("Intro line\n\n- one\n- **two**\n\n1. first\n2. second\nAfter");
  assert.equal(b[0].t, "p");
  assert.equal(b[1].t, "ul");
  assert.equal(b[1].items.length, 2);
  assert.deepEqual(b[1].items[1], [{ t: "strong", c: [{ t: "text", v: "two" }] }]);
  assert.equal(b[2].t, "ol");
  assert.equal(b[3].t, "p");
});

test("parseInline handles code, emphasis and links", () => {
  const out = parseInline("Use `a*b*c` and *this* with [docs](https://github.com/Asad1024) or [bad](javascript:alert(1))");
  assert.deepEqual(out[1], { t: "code", v: "a*b*c" });
  assert.equal(out[3].t, "em");
  assert.equal(out[5].t, "link");
  assert.equal(out[5].href, "https://github.com/Asad1024");
  assert.ok(!out.some((n) => n.t === "link" && n.href.startsWith("javascript")));
});

test("safeHref allows only site, mail and web links", () => {
  assert.equal(safeHref("/work/x"), "/work/x");
  assert.equal(safeHref("mailto:a@b.c"), "mailto:a@b.c");
  assert.equal(safeHref("//evil.com"), null);
  assert.equal(safeHref("javascript:alert(1)"), null);
});

/* ── offline engine ── */

const reply = (q, ctx) => parseReply(offlineAnswer(q, KB, ctx));

test("availability gets the contact card", () => {
  const r = reply("Are you available for freelance?");
  assert.equal(r.contact, true);
  assert.ok(r.followUps.length >= 2);
});

test("a named project gets its card and case study", () => {
  const r = reply("tell me about sparkcue");
  assert.deepEqual(r.projects, ["sparkcue"]);
  assert.equal(r.buttons[0].arg, "/work/sparkcue");
});

test("a follow-up refers back to the project in focus", () => {
  const r = reply("What was the hardest part?", { focus: "voice-agents" });
  assert.match(r.text, /AI Voice Agents challenge/);
});

test("a case study page is the focus when nothing else is", () => {
  const r = reply("what stack did this use?", { page: "/work/sales-crm" });
  assert.match(r.text, /Sales CRM\*\* runs on Next\.js, PostgreSQL, Stripe/);
});

test("a technology question lists the projects that use it", () => {
  const r = reply("Have you used Redis?");
  assert.deepEqual(r.projects, ["outbound-copilot"]);
});

test("a technology that isn't on the site is admitted, not claimed", () => {
  const r = reply("Do you know golang?");
  assert.match(r.text, /isn't in any of the projects/);
});

test("voice calls are a topic, not a request for a phone number", () => {
  const r = reply("Have you built AI that makes phone calls?");
  assert.equal(r.contact, false);
});

test("unknown questions don't guess", () => {
  const r = reply("what is the capital of peru");
  assert.match(r.text, /rather not guess/);
});

/* ── role match ── */

const JD = `About the role: we are looking for a full-stack engineer. Requirements: 3+ years with Next.js and TypeScript,
NestJS or Node.js APIs, PostgreSQL, Redis queues, Stripe billing, OpenAI integrations. Nice to have: Kubernetes, Go (golang).`;

test("job descriptions are recognised", () => {
  assert.equal(isJobDescription(JD), true);
  assert.equal(isJobDescription("Role match: next.js"), true);
  assert.equal(isJobDescription("what's your stack?"), false);
});

test("extractTechs finds technologies without false friends", () => {
  const t = extractTechs(JD);
  for (const name of ["Next.js", "TypeScript", "NestJS", "PostgreSQL", "Redis", "Stripe", "OpenAI", "Kubernetes", "Go"]) assert.ok(t.includes(name), name);
  assert.ok(!extractTechs("we go to the next meeting").includes("Go"));
});

test("roleMatch scores, shows evidence and admits gaps", () => {
  const r = parseReply(roleMatch(JD, KB));
  assert.ok(r.fit && r.fit.score > 40 && r.fit.score < 98);
  assert.match(r.text, /Not shown on this site:.*Kubernetes/);
  assert.ok(r.projects.includes("outbound-copilot"));
  assert.equal(r.contact, true);
  // "Go" must not be proven by MongoDB
  assert.match(r.text, /Not shown on this site:.*Go/);
});

test("roleMatch asks for more when there's nothing to match", () => {
  assert.equal(parseReply(roleMatch("Role match: be nice", KB)).fit, undefined);
});

/* ── questions visitors actually ask (from the code review) ── */

test("who Asad is, and thanks, get real answers", () => {
  for (const q of ["Who is Asad?", "Tell me about Asad", "What does he do?"]) assert.doesNotMatch(reply(q).text, /rather not guess/, q);
  assert.match(reply("Thanks!").text, /welcome/i);
});

test("résumé with accents is recognised", () => {
  assert.equal(reply("Can I see his résumé?").buttons[0].kind, "resume");
});

test("'what was the result?' refers back to the project in focus", () => {
  assert.match(reply("What was the result?", { focus: "sparkcue" }).text, /SparkCue result/);
});

test("a company name gets that job, not a topic", () => {
  assert.match(reply("What did he build at Spark AI?").text, /Spark AI/);
  assert.doesNotMatch(reply("What did he build at Spark AI?").text, /LLMs doing real work/);
});

test("'where did he work' is about experience, not location", () => {
  assert.match(reply("Where did he work before?").text, /Full Stack Developer, Spark AI/);
});

test("strongest area and main language are about skills, not the best project", () => {
  assert.match(reply("What's his strongest area?").text, /TypeScript/);
  assert.match(reply("What's his main language?").text, /TypeScript/);
});

test("a bare 'it' doesn't hijack an unrelated question", () => {
  assert.doesNotMatch(reply("How long did it take to learn React?", { focus: "sparkcue" }).text, /SparkCue approach/);
});

test("links can't leave the site except to Asad's profiles", () => {
  assert.equal(safeHref("/\evil.example"), null);
  assert.equal(safeHref("https://evil.example"), null);
  assert.equal(safeHref("https://github.com/Asad1024"), "https://github.com/Asad1024");
  assert.equal(safeHref("/work/sparkcue"), "/work/sparkcue");
  assert.equal(safeHref("/#contact"), "/#contact");
  assert.equal(safeHref("/admin"), null);
});

test("a streaming reply with a stray '[[' still shows its text once it ends", () => {
  assert.equal(parseReply("Price is [[ not a tag. Then more text").text, "Price is [[ not a tag. Then more text");
});
