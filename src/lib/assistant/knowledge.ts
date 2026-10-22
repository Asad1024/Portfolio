/* ── the offline brain ──────────────────────────────────────────────────────
   When the live model is unavailable (no key, rate limited, provider down)
   the guide still answers, from the same facts the pages show. It is a small
   retrieval engine rather than a list of canned lines: it recognises the
   common intents (availability, contact, résumé, location, experience), and
   otherwise looks for a project by name, a technology by name, or a topic,
   and answers with the matching projects as cards.

   It speaks the reply protocol (protocol.ts), so the panel renders an
   offline answer exactly like a live one. Pure: the facts come in as an
   argument, so it runs under `node --test` without the site's images. */

export type KbProject = {
  slug: string;
  title: string;
  tagline: string;
  year: string;
  company?: string;
  platform: string;
  featured: boolean;
  tags: string[];
  keyStack: string[];
  stack: string[];
  summary: { challenge: string; approach: string; result: string };
};
export type KbJob = { company: string; role: string; period: string; location: string; summary: string; projects: string[] };
export type KbPillar = { title: string; accent: string; body: string; techs: string[]; proof: string[] };
export type Kb = {
  projects: KbProject[];
  experience: KbJob[];
  pillars: KbPillar[];
  contact: { email: string; phone: string };
};
/** `page` is where the visitor is; `focus` is the project the conversation
 *  last showed, so "what was the hardest part?" has something to refer to. */
export type AskContext = { page?: string; focus?: string };

const norm = (s: string) =>
  ` ${s
    .toLowerCase()
    // "résumé" and "resume" are the same word to a visitor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9.+#]+/g, " ")
    .trim()} `;

/** Whole-word (or whole-phrase) match on a normalised string. */
const has = (n: string, ...words: string[]) => words.some((w) => n.includes(` ${w} `));
/** Prefix match, for word families: "hire" catches "hiring", "hired". */
const stem = (n: string, ...stems: string[]) => stems.some((w) => n.includes(` ${w}`));

/* Spellings people type for the technologies that matter, mapped to the name
   used in the site's stack lists. */
const TECH_ALIASES: Record<string, string[]> = {
  "Next.js": ["next.js", "nextjs", "next js", "next"],
  React: ["react", "react.js", "reactjs"],
  "React Native": ["react native", "rn", "expo"],
  TypeScript: ["typescript", "ts"],
  "Node.js": ["node", "node.js", "nodejs"],
  NestJS: ["nest", "nestjs", "nest.js"],
  FastAPI: ["fastapi", "python"],
  PostgreSQL: ["postgres", "postgresql", "psql"],
  MySQL: ["mysql"],
  Redis: ["redis", "bullmq", "queue", "queues"],
  Stripe: ["stripe", "payments", "billing", "subscriptions"],
  OpenAI: ["openai", "gpt", "chatgpt", "llm", "llms"],
  Gemini: ["gemini"],
  ElevenLabs: ["elevenlabs", "eleven labs"],
  Twilio: ["twilio", "telephony", "phone calls"],
  HeyGen: ["heygen", "avatar", "avatars"],
  LiveKit: ["livekit"],
  Electron: ["electron", "desktop app", "windows app"],
  Flutter: ["flutter", "dart"],
  Docker: ["docker", "containers"],
  RAG: ["rag", "embeddings", "retrieval", "vector"],
  MCP: ["mcp"],
  Playwright: ["playwright", "scraping", "scraper", "crawler"],
  Prisma: ["prisma"],
  Supabase: ["supabase"],
  WhatsApp: ["whatsapp"],
  Tailwind: ["tailwind", "tailwindcss", "tailwind css"],
  "Socket.io": ["socket.io", "socketio", "websocket", "websockets", "realtime", "real time"],
  MongoDB: ["mongodb", "mongo"],
  Python: ["python"],
  Zustand: ["zustand"],
  Redux: ["redux"],
  Jest: ["jest", "unit tests", "unit testing"],
  Vitest: ["vitest"],
  Sentry: ["sentry", "observability", "monitoring"],
  Vercel: ["vercel"],
  AWS: ["aws", "amazon web services", "s3", "ec2", "lambda"],
  Kubernetes: ["kubernetes", "k8s"],
  "GitHub Actions": ["github actions", "ci cd", "ci/cd", "cicd", "continuous integration"],
  "Three.js": ["three.js", "threejs", "webgl", "3d"],
  "Framer Motion": ["framer motion", "framer-motion", "animation", "animations"],
  GraphQL: ["graphql", "apollo"],
  Vue: ["vue", "vue.js", "vuejs", "nuxt"],
  Angular: ["angular"],
  Go: ["golang"],
  Java: ["java", "spring boot", "spring"],
  "C#": ["c#", ".net", "dotnet", "asp.net"],
  PHP: ["php", "laravel"],
  Azure: ["azure"],
  GCP: ["gcp", "google cloud"],
  Firebase: ["firebase"],
};

const TOPICS: { words: string[]; pillar: string; lead: string }[] = [
  { words: ["ai", "llm", "agent", "agents", "voice", "machine learning", "ml", "copilot"], pillar: "AI systems", lead: "AI is what Asad builds most:" },
  { words: ["saas", "multi tenant", "multitenant", "b2b", "dashboard", "platform"], pillar: "Multi-tenant", lead: "Asad builds whole SaaS products, schema to screen:" },
  { words: ["payment", "payments", "infra", "infrastructure", "devops", "deploy", "deployment", "email server", "mail server"], pillar: "Payments &", lead: "Payments and infrastructure are part of shipping:" },
  { words: ["desktop", "mobile", "ios", "android", "windows", "app store"], pillar: "Desktop &", lead: "Asad ships beyond the browser too:" },
];

const GENERIC_NEXT = ["What's his best project?", "Is Asad available?", "What's his tech stack?"];

function next(...qs: string[]) {
  return qs
    .filter(Boolean)
    .slice(0, 3)
    .map((q) => `[[next:${q}]]`)
    .join("");
}

function cards(slugs: string[]) {
  return slugs
    .slice(0, 3)
    .map((s) => `[[project:${s}]]`)
    .join("");
}

function findProjectByName(n: string, kb: Kb): KbProject | undefined {
  // longest title first, so "AI Voice Agents" wins over a shorter overlap
  const byLength = [...kb.projects].sort((a, b) => b.title.length - a.title.length);
  return byLength.find((p) => {
    const title = norm(p.title).trim();
    const slug = p.slug.replace(/-/g, " ");
    return n.includes(` ${title} `) || n.includes(` ${slug} `) || n.includes(` ${p.slug} `);
  });
}

function findTech(n: string): string | undefined {
  // multi-word aliases first, so "react native" isn't read as "react"
  const entries = Object.entries(TECH_ALIASES).flatMap(([name, aliases]) => aliases.map((a) => [name, a] as const));
  entries.sort((a, b) => b[1].length - a[1].length);
  return entries.find(([, alias]) => has(n, alias))?.[0];
}

/** Every technology a text mentions, by its stack name, in order of first mention. */
export function extractTechs(text: string): string[] {
  const n = norm(text);
  const found: { name: string; at: number }[] = [];
  for (const [name, aliases] of Object.entries(TECH_ALIASES)) {
    // "next" alone is too common a word to read as Next.js in a long text
    const usable = aliases.filter((a) => !(a === "next" || a === "go" || a === "spring" || a === "realtime" || a === "real time" || a === "queue" || a === "3d"));
    const at = Math.min(...usable.map((a) => n.indexOf(` ${a} `)).filter((i) => i !== -1));
    if (Number.isFinite(at)) found.push({ name, at });
  }
  // React Native implies React only if React is named on its own too
  return found.sort((a, b) => a.at - b.at).map((f) => f.name);
}

export const ROLE_MATCH = "Role match:";

/** A pasted job description, or a message sent from the Role Match card. */
export function isJobDescription(q: string) {
  if (q.trim().toLowerCase().startsWith(ROLE_MATCH.toLowerCase())) return true;
  return (
    q.length > 200 &&
    /(requirements|responsibilit|qualifications|we are looking|we're looking|you will|you'll|must have|nice to have|years of experience|about the role|job description)/i.test(q)
  );
}

/** Map a job description's technologies to shipped work, honestly: what's
 *  proven, by which projects, and what this site can't show. */
export function roleMatch(jd: string, kb: Kb): string {
  const techs = extractTechs(jd.trim().replace(/^role match:/i, ""));
  if (techs.length < 2)
    return `Paste the full job description — requirements and stack included — and I'll map each one to work Asad has shipped, with a fit score.${next("What's Asad's tech stack?", "Is Asad available?")}`;

  const rows = techs.map((t) => ({ tech: t, using: projectsUsing(t, kb) }));
  const proven = rows.filter((r) => r.using.length);
  const gaps = rows.filter((r) => !r.using.length).map((r) => r.tech);
  const ratio = proven.length / rows.length;
  const score = Math.min(97, Math.round(35 + 62 * ratio));
  const verdict = score >= 85 ? "Strong fit" : score >= 70 ? "Good fit" : score >= 50 ? "Partial fit" : "Stretch";

  // the projects that cover the most of this role
  const tally = new Map<string, number>();
  for (const r of proven) for (const p of r.using) tally.set(p.slug, (tally.get(p.slug) ?? 0) + 1);
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([slug]) => slug);

  const lines = proven
    .slice(0, 6)
    .map((r) => `- **${r.tech}** — ${r.using.slice(0, 2).map((p) => p.title).join(", ")}`);
  const gapLine = gaps.length
    ? `\n\n**Not shown on this site:** ${gaps.slice(0, 5).join(", ")}. Worth asking Asad directly — I'd rather say so than stretch.`
    : "";

  return `[[fit:${score}|${verdict}]]\nAsad has shipped **${proven.length} of the ${rows.length}** technologies this role asks for, in production:\n\n${lines.join("\n")}${gapLine}\n${cards(top)}[[contact]]${next("Is Asad available for this?", "Which project proves it best?", "How many years of experience?")}`;
}

function projectsUsing(tech: string, kb: Kb) {
  // whole words, so "Go" doesn't find MongoDB and "Java" doesn't find JavaScript
  const name = norm(tech).trim();
  const bare = name.replace(/\.js$/, "");
  return kb.projects.filter((p) =>
    [...p.keyStack, ...p.stack, ...p.tags].some((s) => {
      const hay = norm(s);
      return has(hay, name) || has(hay, bare);
    }),
  );
}

function describe(p: KbProject) {
  const where = p.company ? ` at ${p.company}` : "";
  return `**${p.title}** (${p.year}${where}) — ${p.tagline}.\n\n${p.summary.approach}\n\n**Result:** ${p.summary.result}`;
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function experienceAnswer(kb: Kb) {
  return `Asad has 3+ years shipping production software:\n\n${kb.experience
    .map((e) => `- **${e.role}, ${e.company}** (${e.period}) — ${e.summary}`)
    .join("\n")}\n[[scroll:#experience|See experience]]${next("What did he build at Spark AI?", "Is Asad available?")}`;
}

function stackAnswer() {
  return `Mostly **TypeScript**: Next.js and React up front, Node, NestJS and FastAPI behind, PostgreSQL, MySQL and Redis underneath. For AI work: OpenAI, Gemini, ElevenLabs, Twilio and LiveKit. Electron for desktop, React Native and Flutter for mobile.\n[[scroll:#capabilities|See capabilities]]${next("Has he used Stripe?", "What AI products has he shipped?")}`;
}

/** Score a project against free text, for questions that name no title. */
function scoreProject(n: string, p: KbProject) {
  const words = n.split(" ").filter((w) => w.length > 3);
  if (!words.length) return 0;
  const hay = norm([p.title, p.tagline, p.platform, ...p.tags, ...p.keyStack, p.summary.challenge, p.summary.approach].join(" "));
  return words.reduce((s, w) => s + (hay.includes(` ${w}`) ? 1 : 0), 0) / words.length;
}

/* The assistant speaks about Asad, in the third person; visitors may still
   say "you" and mean him, so both read the same. */
export function offlineAnswer(question: string, kb: Kb, ctx: AskContext = {}): string {
  const n = norm(question);
  const word = n.trim().split(" ").length;
  const onProject = ctx.page?.startsWith("/work/") ? kb.projects.find((p) => p.slug === ctx.page!.split("/")[2]) : undefined;
  const best = kb.projects.find((p) => p.slug === "outbound-copilot") ?? kb.projects[0];

  if (isJobDescription(question)) return roleMatch(question, kb);

  if (word <= 3 && has(n, "hi", "hello", "hey", "salam", "assalam", "yo", "hiya", "good morning", "good evening"))
    return `Hi! I'm Asad's assistant. I can walk you through his projects, his stack, or how to work with him.${next("What's his best project?", "Is Asad available?", "What can you help me with?")}`;

  if (word <= 6 && has(n, "thanks", "thank you", "thx", "cheers", "appreciate it", "much appreciated"))
    return `You're welcome! If you'd like to take it further, Asad answers email himself.${next("Is Asad available?", "What's his best project?")}`;

  if (has(n, "who is asad", "who is he", "tell me about asad", "tell me about him", "about asad", "what does he do", "what does asad do", "introduce asad", "introduce him", "who is this guy"))
    return `**Asad Shah** is a full-stack developer in Lahore, Pakistan, working remote-first. He has 3+ years shipping production software and ${kb.projects.length} products on this site — mostly AI SaaS, plus desktop and mobile apps — built end to end, from the database to the interface.\n\nRight now he's ${kb.experience[0] ? `a ${kb.experience[0].role} at **${kb.experience[0].company}**` : "building AI products"}.\n[[scroll:#about|About Asad]]${next("What's his best project?", "Is Asad available?", "What's his tech stack?")}`;

  if (has(n, "are you real", "are you human", "are you a bot", "are you ai", "who are you", "what are you", "are you asad", "real asad", "is this asad"))
    return `I'm Asad's assistant — a virtual guide he built for this site, not Asad himself. I know everything on these pages; for anything else, he answers email personally.\n[[email|Email Asad]]${next("What can you help me with?", "What's his best project?")}`;

  if (stem(n, "rate", "salary", "price", "pricing", "cost", "charge", "budget", "quote"))
    return `Asad doesn't quote rates here: it depends on scope, timeline and whether it's a full-time role or a build. Send him a line about the project and he'll come back with a straight number.\n[[email|Ask for a quote]]${next("Is Asad available?", "What does a typical build look like?")}`;

  if (has(n, "hire", "hire you", "hire him", "hiring", "available", "availability", "freelance", "freelancing", "contract", "open to work", "work with you", "work with him", "work together", "full time", "remote role", "job offer") || stem(n, "collaborat"))
    return `Yes — Asad is open to **full-time roles** and **freelance builds**, remote-first from Lahore (GMT+5). He's shipped with teams in Dubai and Islamabad without timezone friction.\n\nEmail is the fastest way to start.\n[[contact]][[email|Start a conversation]]${next("What's his best project?", "What's his tech stack?", "How many years of experience?")}`;

  if (has(n, "contact", "email", "email you", "email him", "reach you", "reach him", "phone number", "call you", "call him", "linkedin", "github", "get in touch", "message you"))
    return `Here's how to reach Asad — email gets the fastest reply.\n[[contact]]${next("Is Asad available?", "Can I see his résumé?")}`;

  if (stem(n, "resume", "résumé", "cv", "curriculum"))
    return `Here's Asad's résumé: one page, the products and the numbers.\n[[resume|Download résumé]][[scroll:#experience|See experience]]${next("Is Asad available?", "What's his best project?")}`;

  if (has(n, "where did he work", "where has he worked", "where did you work", "worked at", "work before", "worked before", "previous job", "previous jobs", "past jobs", "past roles"))
    return experienceAnswer(kb);

  if (stem(n, "where", "location", "based", "timezone", "time zone", "country", "city", "relocat"))
    return `Asad is in **Lahore, Pakistan** (GMT+5) and works remote-first — most recently with a team in Dubai. He overlaps comfortably with Europe and the Gulf, and partly with US mornings.${next("Is Asad available?", "What's his experience?")}`;

  if (has(n, "tour", "guide me", "show me around", "walk me through", "where do i start", "what is this site", "what can i do here"))
    return `I can fly you through the page section by section — it takes about a minute.\n[[tour|Start the tour]]${next("What's his best project?", "What can you help me with?")}`;

  if (has(n, "help", "what can you do", "what can you help", "what can you help me with"))
    return `I know every project, stack choice and number on this site. Ask me to compare projects, explain how something was built, find work in a technology, score Asad against a job description, or set up a conversation with him.${next("What's his best project?", "Has he used Redis?", "Is Asad available?")}`;

  // a named project wins over everything topical; failing that, a question
  // that points back ("it", "this", "the hardest part") means the project in focus
  const focus = kb.projects.find((p) => p.slug === ctx.focus) ?? onProject;
  // "it" alone is too common to mean the project; with an aspect of one it does
  const pointsBack =
    has(n, "this", "this project", "the project", "that project", "here", "similar", "related") ||
    stem(n, "hardest", "challeng", "result", "outcome") ||
    (has(n, "it", "its") && stem(n, "stack", "tech", "built", "build", "hard", "challeng", "work"));
  const named = findProjectByName(n, kb);

  // a company by name: that job, and what was built there
  const job = named ? undefined : kb.experience.find((e) => has(n, norm(e.company).trim()));
  if (job)
    return `At **${job.company}** (${job.period}, ${job.location}), Asad is ${/present/.test(job.period) ? "" : "was "}a ${job.role}. ${job.summary}\n${cards(job.projects)}[[scroll:#experience|See experience]]${next(
      job.projects[0] ? `Tell me about ${kb.projects.find((p) => p.slug === job.projects[0])?.title ?? "his work there"}` : "What's his best project?",
      "Is Asad available?",
    )}`;

  const target = named ?? (focus && pointsBack ? focus : undefined);
  if (target) {
    const t = target;
    const more = `[[open:/work/${t.slug}|Read the case study]]`;
    if (has(n, "similar", "related", "like this", "like it", "others like")) {
      const similar = kb.projects
        .filter((p) => p.slug !== t.slug)
        .map((p) => ({ p, s: p.tags.filter((x) => t.tags.includes(x)).length + p.keyStack.filter((x) => t.keyStack.includes(x)).length }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 3)
        .map((x) => x.p.slug);
      return `If you liked ${t.title}, these share the most with it:\n${cards(similar)}${next("What's his best project?", "Is Asad available?")}`;
    }
    if (stem(n, "hard", "challeng", "problem", "difficult", "why"))
      return `The hard part of **${t.title}**: ${t.summary.challenge}\n\nHow Asad solved it: ${t.summary.approach}\n${more}${next("What was the result?", `What stack did ${t.title} use?`, "Show me similar projects")}`;
    if (stem(n, "stack", "tech", "built with", "use", "language", "framework"))
      return `**${t.title}** runs on ${t.keyStack.join(", ")}.\n\nThe full list: ${t.stack.slice(0, 8).join(" · ")}.\n${more}${next("What was the hardest part?", "Show me similar projects")}`;
    if (stem(n, "result", "outcome", "impact", "metric", "number", "success"))
      return `**Result:** ${t.summary.result}\n${more}${next("What was the hardest part?", "Show me similar projects")}`;
    return `${describe(t)}\n[[project:${t.slug}]]${more}${next(`What stack did ${t.title} use?`, "What was the hardest part?", "Show me similar projects")}`;
  }

  if (has(n, "strongest area", "strongest skill", "main skill", "main skills", "best at", "good at", "main language", "first language", "primary language", "favourite language", "favorite language", "specialty", "speciality", "specialize", "specialise"))
    return stackAnswer();

  if (has(n, "best", "favorite", "favourite", "top", "impressive", "proudest", "flagship", "start with", "strongest", "first"))
    return `Start with **${best.title}**: ${lower(best.tagline)}. It shows Asad's whole range — AI, SaaS and infrastructure — in one product.\n\nFor voice and telephony, see **AI Voice Agents**; for real-time desktop work, **SparkCue**.\n[[project:${best.slug}]][[open:/work/${best.slug}|Open the case study]]${next("What was the hardest part?", "What AI products has he shipped?", "Is Asad available?")}`;

  const tech = findTech(n);
  if (tech) {
    const using = projectsUsing(tech, kb);
    if (using.length)
      return `Yes — **${tech}** is in ${using.length === 1 ? "one of Asad's projects" : `${using.length} of Asad's projects`}.${using.length > 3 ? " The strongest examples:" : ""}\n${cards(using.slice(0, 3).map((p) => p.slug))}${next(
        "What's his full stack?",
        `Tell me about ${using[0].title}`,
        "Is Asad available?",
      )}`;
    return `**${tech}** isn't in any of the projects on this site, so I won't claim it. Ask Asad whether it's come up elsewhere.\n[[email|Ask Asad]]${next("What's his tech stack?", "What's his best project?")}`;
  }

  const topic = TOPICS.find((t) => has(n, ...t.words));
  if (topic) {
    const pillar = kb.pillars.find((p) => p.title === topic.pillar);
    if (pillar)
      return `${topic.lead} ${pillar.body}\n${cards(pillar.proof)}[[scroll:#capabilities|See capabilities]]${next("What's his best project?", "Which stack does he prefer?", "Is Asad available?")}`;
  }

  if (stem(n, "experience", "years", "senior", "worked", "career", "background", "companies", "employer", "job history"))
    return experienceAnswer(kb);

  if (stem(n, "stack", "tech", "tools", "languages", "framework", "skills"))
    return stackAnswer();

  if (stem(n, "project", "work", "portfolio", "built", "build", "shipped", "products"))
    return `${kb.projects.length} products on this site, across AI platforms, SaaS and desktop tools. Three to start with:\n${cards(
      kb.projects.filter((p) => p.featured).slice(0, 3).map((p) => p.slug),
    )}[[scroll:#work|See all work]]${next("What's his best project?", "What AI products has he shipped?")}`;

  // nothing matched an intent: rank projects by overlap with the question
  const ranked = kb.projects
    .map((p) => ({ p, s: scoreProject(n, p) }))
    .filter((x) => x.s >= 0.34)
    .sort((a, b) => b.s - a.s);
  if (ranked.length)
    return `The closest thing Asad has built is **${ranked[0].p.title}** — ${lower(ranked[0].p.tagline)}.\n${cards(ranked.slice(0, 2).map((x) => x.p.slug))}${next(...GENERIC_NEXT)}`;

  return `I don't have an answer to that one, and I'd rather not guess. Asad can help by email — or try one of these.\n[[email|Email Asad]]${next(...GENERIC_NEXT)}`;
}
