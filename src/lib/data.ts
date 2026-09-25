import type { StaticImageData } from "next/image";

import sparkcueImg from "@/assets/sparkcue.png";
import voiceAgentsImg from "@/assets/voice-agents.png";
import outboundCopilotImg from "@/assets/outbound-copilot.png";
import siteharvestImg from "@/assets/siteharvest.png";
import leadgenImg from "@/assets/leadgen.png";
import bookingPlatformImg from "@/assets/booking-platform.png";
import videoFunnelsImg from "@/assets/video-funnels.png";
import salesCrmImg from "@/assets/sales-crm.png";
import matchingAppImg from "@/assets/matching-app.png";
import mailforgeImg from "@/assets/mailforge.png";

export type ArchCol = { title: string; items: string[] };

export type Project = {
  slug: string;
  index: string;
  featured: boolean;
  tags: string[];
  /** Employer to credit. Client work is always attributed. */
  company?: string;
  link?: string;
  /** Statically imported from src/assets so Next optimizes and hashes it. */
  image?: StaticImageData;
  title: string;
  tagline: string;
  year: string;
  role: string;
  platform: string;
  /** The handful of technologies the project is really built on, shown with
   *  its name. `stack` keeps the full list. */
  keyStack: string[];
  stack: string[];
  overview: string;
  problem: string;
  built: string[];
  arch: { cols: ArchCol[]; caption: string };
  /** A real, self-contained function lifted from the project's repo. */
  snippet?: { file: string; lang: "ts" | "tsx" | "js" | "python"; note: string; code: string };
  decisions: { title: string; body: string }[];
  outcome: { value: string; label: string }[];
};

/** The projects shown before "explore more", in this order. Each is also
 *  marked `featured` on its entry. */
export const showcase = [
  "outbound-copilot",
  "sparkcue",
  "voice-agents",
  "booking-platform",
  "sales-crm",
  "siteharvest",
  "codevault",
  "mailforge",
];

export const projects: Project[] = [
  {
    slug: "sparkcue",
    index: "01",
    featured: true,
    tags: ["desktop", "ai"],
    image: sparkcueImg,
    title: "SparkCue",
    tagline: "Real-time AI conversation copilot for Windows",
    year: "2026",
    role: "Design · Architecture · Full build",
    platform: "Desktop — Electron (Windows x64)",
    keyStack: ["Electron", "Node.js", "OpenAI", "ElevenLabs"],
    stack: [
      "Electron 36",
      "Node.js",
      "OpenAI (streaming · vision · embeddings)",
      "ElevenLabs Scribe v2 Realtime",
      "OpenAI Realtime",
      "RAG · cosine retrieval",
      "pdf-parse · mammoth",
      "Text-to-speech",
      "NSIS installer",
    ],
    overview:
      "A Windows desktop copilot that sits beside any live conversation — Zoom, Meet, Teams, or a phone dialer — and tells you what to say next. It hears both sides of the call, and the moment the other person stops talking it streams in a short line you can say out loud, grounded in your own documents. No bot joins the call, audio is captured locally, and the AI runs on the user's own API keys.",
    problem:
      "The hardest moment in a sales call or interview is the few seconds after a tough question. Coaching usually comes days later in a call review, too late to help. The product had to give usable guidance within a second or two, work on any call app, never appear as a meeting participant, and base its answers on the user's pricing, product docs, or CV instead of generic AI filler.",
    built: [
      "Two-stream capture: the microphone and system-audio loopback run as separate transcription sessions, so speakers are separated without diarization",
      "Realtime speech-to-text on ElevenLabs Scribe v2 (16 kHz PCM), failing over automatically to OpenAI Realtime if credits run out",
      "Suggestion cards streamed token by token: one line to say, a one-line reason, and 2–4 depth points, with a badge showing whether the answer came from your documents, partly from them, or neither",
      "Playbook RAG over PDF, Word, and text files: small playbooks go in whole; above about 15k characters they're chunked, embedded, and retrieved by cosine similarity, with the index cached on disk",
      "Modes for sales, interviews, support, and meetings, plus a custom mode, each with its own prompt, speaker labels, live checklist, and coaching rubric",
      "Screen awareness: snip a region or pick a window, then a vision model classifies it (code, slides, spreadsheet, terminal…) — the app's own window is excluded from capture",
      "Invisible mode that hides the window from screen share, screenshots, and the taskbar, plus a pin-on-top option, a see-through fade, and global hotkeys",
      "Practice mode: an AI plays the other side out loud with configurable difficulty, mood, and language, can question you from your own documents, and scores the session",
      "Hindi and Urdu speech shown in Roman letters mid-call with the original script underneath; replies can match the other person or stay in English, Hinglish, or Roman Urdu",
      "End & Coach scoring, call history with transcripts and trends, export, echo rejection, a first-run key check, and a guided tour",
    ],
    arch: {
      cols: [
        { title: "capture", items: ["mic stream", "system-audio loopback"] },
        { title: "transcribe", items: ["Scribe v2 realtime", "OpenAI failover"] },
        { title: "ground", items: ["playbook RAG", "screen snapshot"] },
        { title: "suggest", items: ["streamed card", "grounding badge"] },
        { title: "coach", items: ["mode rubric", "history + trends"] },
      ],
      caption: "two audio streams in, one readable line out in ~1–2s. Everything runs on the user's PC with the user's own keys; there's no backend",
    },
    snippet: {
      file: "src/coach.js",
      lang: "js",
      note:
        "The coaching half of the product. The rubric swaps with the mode — you don't grade a job interview on talk ratio — and the transcript is flattened to speaker-tagged lines before it ever reaches the model.",
      code: `async function generateCoachReport({ apiKey, model, transcript, reference, modeId }) {
  const client = new OpenAI({ apiKey });
  const lines = transcript.map((t) => \`\${t.speaker}: \${t.text}\`).join('\\n');
  const rubric = RUBRICS[modeId] || RUBRICS.sales;

  const res = await client.chat.completions.create({
    model,
    max_tokens: 1600,
    temperature: 0.5,
    messages: [
      { role: 'system', content: \`\${rubric}\\n\\n\${SECTIONS}\\n\\n=== REFERENCE MATERIAL ===\\n\${reference || '(none)'}\` },
      { role: 'user', content: \`Transcript:\\n\\n\${lines}\` },
    ],
  });
  return res.choices[0]?.message?.content || 'No report generated.';
}`,
    },
    decisions: [
      {
        title: "Loopback capture over meeting bots",
        body: "Bots that join calls are visible to the other person and break every time a platform changes. Capturing system audio on Windows works with any app that plays sound through the speakers, and keeping the mic as its own stream separates the speakers without diarization.",
      },
      {
        title: "Send the whole playbook when it's small, retrieve when it isn't",
        body: "Below about 15k characters, the full playbook goes into the prompt, because retrieval would only lose context. Above that, chunks are embedded and ranked by cosine similarity, and the index is rebuilt only when a document changes. Each answer shows how grounded it is, so the user knows when to double-check a number.",
      },
      {
        title: "Bring your own keys, no backend",
        body: "Keys stay in the Windows user profile and are never bundled into the installer. Running with no server means no call audio passes through anyone else's infrastructure, and a typical user pays a few dollars a month.",
      },
    ],
    outcome: [
      { value: "~1–2s", label: "end of speech to suggestion" },
      { value: "5", label: "conversation modes, incl. custom" },
      { value: "0", label: "meeting bots or servers" },
    ],
  },
  {
    slug: "voice-agents",
    index: "02",
    featured: true,
    tags: ["web", "ai", "cloud"],
    company: "Spark AI",
    image: voiceAgentsImg,
    title: "AI Voice Agents",
    tagline: "Multilingual AI voice agents that make and answer phone calls",
    year: "2026",
    role: "Architecture · Full build",
    platform: "Web — Cloud + Telephony",
    keyStack: ["React", "Node.js", "MySQL", "Twilio", "ElevenLabs", "OpenAI"],
    stack: [
      "React 18",
      "Node.js · Express",
      "MySQL · Sequelize",
      "Twilio",
      "ElevenLabs",
      "TypeScript",
      "Vite",
      "Tailwind CSS",
      "Radix UI",
      "TanStack Query",
      "React Hook Form · Zod",
      "i18next",
      "WebSockets",
      "OpenAI · Gemini",
      "Stripe",
      "SendGrid · Nodemailer",
    ],
    overview:
      "A multilingual AI voice-calling platform for sales and customer teams. A company sets up an AI agent, gives it a voice and a knowledge base, then runs outbound call campaigns or puts it on the line as an inbound receptionist. The agent qualifies leads, books appointments, follows up, and handles inbound calls without a person on every line. Every call is saved with its transcript, duration, status, and analytics.",
    problem:
      "Sales and support teams can't staff every call. Outbound follow-ups get skipped, inbound calls go unanswered after hours, and each missed call is lost revenue. A voice agent only helps if it sounds natural on a real phone line, answers from the business's own information instead of making things up, and costs a predictable amount — across the languages the business actually works in.",
    built: [
      "Live call pipeline: Twilio phone calls with outbound and inbound media streams over WebSockets, and audio streamed both ways between the caller and the ElevenLabs conversational agent",
      "Outbound campaigns you can create, edit, test-call, and run against lead lists",
      "Inbound AI receptionist with business hours and transfer to a human",
      "Voice library: choose or upload a voice and preview it before going live",
      "Knowledge base from uploaded documents, including PDFs, so the agent answers from the business's own content",
      "Agent marketplace with ready-made agents for eight industries — real estate, healthcare, e-commerce, finance, automotive, education, hospitality, legal — for qualification, booking, cart recovery, reminders, and support",
      "Leads and CRM with Spark CRM connect, import, and push, plus Calendar and Calendly booking directly from calls",
      "Analytics: dashboards, call logs, voice analytics, conversation intelligence, and AI quality checks, compliance checks, and coaching",
      "Organizations with invites, seats, and shared credits; Stripe subscriptions, upgrades, and credit billing",
      "Interface available in five languages — English, Azerbaijani, Turkish, Hindi, and Arabic — via i18next",
      "JWT auth with Google sign-in and email verification, hardened with Helmet, rate limiting, and request validation",
    ],
    arch: {
      cols: [
        { title: "configure", items: ["agent + voice", "knowledge base"] },
        { title: "dial", items: ["Twilio outbound", "inbound receptionist"] },
        { title: "converse", items: ["WebSocket media", "ElevenLabs agent"] },
        { title: "act", items: ["book · transfer", "CRM push"] },
        { title: "review", items: ["transcripts", "QA + analytics"] },
      ],
      caption: "Twilio carries the call and a WebSocket media stream carries the audio live to the voice agent. Afterward, everything is stored in MySQL and billed against credits",
    },
    decisions: [
      {
        title: "Stream the audio, don't batch it",
        body: "Calls run on Twilio media streams over WebSockets in both directions, so the caller and the agent talk in real time instead of waiting on a record, transcribe, and reply cycle. It's the difference between a conversation and a voicemail menu.",
      },
      {
        title: "Ground the agent in the business's own content",
        body: "Each agent answers from its knowledge base, and when it can't, the inbound receptionist transfers the call to a person. A voice agent that makes up a price or opening hours loses more trust than it saves in labor.",
      },
      {
        title: "Credits shared across the organization",
        body: "Call usage is deducted from a credit balance that teammates share, on top of Stripe plans. Companies know what a campaign will cost before they run it, and adding a team member doesn't require new billing.",
      },
    ],
    outcome: [
      { value: "24/7", label: "inbound coverage, no staff" },
      { value: "5", label: "interface languages" },
      { value: "8", label: "industries of ready-made agents" },
    ],
  },
  {
    slug: "outbound-copilot",
    index: "03",
    featured: true,
    tags: ["web", "ai", "cloud"],
    company: "Spark AI",
    image: outboundCopilotImg,
    title: "Outbound AI Copilot",
    tagline: "AI sales copilot — find people, reach out, book the meeting, close the deal",
    year: "2025 — 2026",
    role: "Product · Architecture · Full build",
    platform: "Web — Cloud (Vercel + Render)",
    keyStack: ["Next.js", "TypeScript", "Node.js", "MySQL", "BullMQ", "OpenAI"],
    stack: [
      "Next.js 14",
      "TypeScript",
      "Node.js · Express",
      "MySQL · Sequelize",
      "BullMQ · Redis",
      "React 18",
      "Tailwind CSS",
      "TanStack Query",
      "Zustand",
      "Socket.IO",
      "Zod",
      "OpenAI",
      "Twilio Voice",
      "ElevenLabs",
      "Unipile",
      "Stripe",
      "Vitest · Playwright",
    ],
    overview:
      "A B2B sales workspace that covers the whole outbound path in one product: find companies and people, reach them on email, LinkedIn, WhatsApp, and phone, handle the replies with an AI SDR, book the meeting, and track the deal through a built-in CRM. Each customer gets a workspace with shared leads, campaigns, inbox, pipeline, team roles, and credits.",
    problem:
      "Outbound teams run on five or six disconnected tools — a data provider, an enrichment tool, a sequencer, a LinkedIn tool, a dialer, and a CRM — stitched together with CSV exports. Leads go stale between tools, replies sit unread, and nobody can see which campaign actually produced a deal. The product had to put the entire funnel behind one login, with the slow, costly work (sending, enrichment, AI replies) running reliably in the background.",
    built: [
      "AI Search: a plain-English prompt becomes structured filters, then a provider waterfall (Prospeo, GetLeads, Outscraper, AI Ark, Apollo) is queried in cost order — Apollo last because it's the most expensive",
      "People, companies, industries, and buying signals (hiring, funding, expansion), plus lists, CSV / Google Sheets import, and duplicate cleanup",
      "Enrichment workers that fill missing emails and phones (FullEnrich), with optional verification through MillionVerifier or ZeroBounce",
      "Multi-channel campaigns and multi-step sequences on email, LinkedIn, WhatsApp, and phone — templates with variables, sends spaced and rotated across the customer's own mailboxes (MailForge, SMTP, Resend)",
      "Email infrastructure module: domains, sending accounts, warm-up, deliverability checks, and daily sending capacity",
      "Unified inbox for email, LinkedIn, and WhatsApp with live updates over Socket.IO — read, reply, archive, snooze",
      "AI SDR that reads replies, drafts answers from the workspace playbook, qualifies the lead, and either waits for approval or sends — behind a fail-closed content check",
      "In-browser dialer (Twilio Voice SDK) and AI voice calls (ElevenLabs), with call history, analytics, and call analysis feeding an AI coach",
      "Sales CRM: pipelines with drag-and-drop deals, contacts, companies, tasks, and funnel / campaign / pipeline reports — a lead becomes a contact, then a deal",
      "Meetings booked through a scheduling integration with Google and Outlook calendars, and an AI copilot in the top bar",
      "Workspace roles (owner, admin, contributor, viewer), shared lead and AI credits, Stripe plans and checkout, a 7-day trial on platform keys, and a separate staff admin portal",
    ],
    arch: {
      cols: [
        { title: "find", items: ["AI search → filters", "provider waterfall"] },
        { title: "enrich", items: ["email + phone fill", "verification"] },
        { title: "reach", items: ["email · linkedin", "whatsapp · phone"] },
        { title: "reply", items: ["unified inbox", "AI SDR + approval"] },
        { title: "close", items: ["meetings", "CRM pipeline"] },
      ],
      caption: "Next.js → Express API → MySQL; sends, enrichment, and AI SDR work are queued on BullMQ + Redis and run by workers, never inside the HTTP request",
    },
    decisions: [
      {
        title: "Queue everything that can be slow",
        body: "Sends, enrichment, and AI SDR replies go through BullMQ on Redis, with three workers (campaigns, AI SDR, enrichment) started alongside the API and repeating jobs for inbox sync, warm-up, and billing. The HTTP request only records the intent, so a slow provider never stalls the UI and a crashed job can retry.",
      },
      {
        title: "Cheapest data provider first",
        body: "Lead search asks providers in order and stops once it has enough results. The order changes with the search, but Apollo always goes last because it costs the most. Credits are shared across the workspace, so this ordering is what keeps the unit economics working.",
      },
      {
        title: "AI drafts, rules decide whether it sends",
        body: "The AI SDR can reply on its own, but only through workspace approval rules and a fail-closed content check. If a draft has a blocking finding, it's held with a reason instead of sent. An outbound tool keeps trust by never sending copy it can't justify.",
      },
    ],
    outcome: [
      { value: "4", label: "outreach channels in one workspace" },
      { value: "5", label: "lead-data providers behind one search" },
      { value: "1", label: "product from first search to closed deal" },
    ],
  },
  {
    slug: "siteharvest",
    index: "04",
    featured: true,
    tags: ["desktop"],
    image: siteharvestImg,
    title: "SiteHarvest",
    tagline: "Retail shelf intelligence from any retailer URL",
    year: "2026",
    role: "Architecture · Full build",
    platform: "Desktop — Electron (Windows)",
    keyStack: ["Electron", "Node.js", "Headless Chromium", "Tesseract.js"],
    stack: [
      "Electron 33",
      "Node.js",
      "Chromium (hidden window)",
      "Tesseract.js OCR",
      "ExcelJS",
      "JSZip",
      "HTML · CSS · JavaScript",
      "JSON site recipes",
      "NSIS installer",
    ],
    overview:
      "A Windows desktop app for retail competitive intelligence. You paste a retailer URL and press Proceed. It opens the site like a real shopper would and extracts the commercial picture: banners, offers, categories, products, filters, and brand share of shelf, with the client's brands ranked against competitors like Samsung, LG, Bosch, Haier, and Hisense. Everything stays on the user's computer — no cloud login, no third-party platform.",
    problem:
      "Retail sites change every week: banners rotate, the brand mix shifts, and offers come and go. Category and trade teams kept track by clicking through competitor sites and copying notes into spreadsheets, with no way to repeat it or compare one week to the next. They needed a repeatable scan of the shelf that answers one question — how much of it is ours? — and that's honest when a site blocks the visit instead of reporting that nothing was found.",
    built: [
      "Three scan types from one input: a homepage gives campaigns, promo banners, and the category menu; a category listing gives products, filters, and brand share; in-app search gives results in shopper order and where the client's brand ranks",
      "Scrape pipeline that drives a hidden Chromium window from the office network, so retailers see a real browser fingerprint and accept visits a cloud bot would be blocked from",
      "Per-site JSON recipes matched by hostname that tune wait time, scrolling, and catalog-API enrichment, a generic extractor for unknown sites, and enrichment for Shopify stores from their public catalog API",
      "Brand share of shelf calculated from facet groups and option counts, checked against the page's own stated result total",
      "Tesseract.js OCR that reads offer text baked into banner images, with language data cached locally",
      "Detection of promotions (discounts, bundles, financing) and banners by slot, position, link, detected brand, and offer, with the creative saved",
      "Confidence score and a clear blocked warning when the page is a bot challenge rather than a real shelf",
      "Local run history kept to the newest 200 runs or about 500 MB, stored as an index so the list stays fast",
      "Exports to an Excel workbook (ExcelJS), a CSV bundle, JSON, or a ZIP of banner images (JSZip)",
      "Headless command-line mode for testing and automation — progress on stderr, result JSON on stdout — plus a Windows NSIS installer",
    ],
    arch: {
      cols: [
        { title: "input", items: ["retailer URL", "hostname → recipe"] },
        { title: "browse", items: ["hidden Chromium", "scroll + wait"] },
        { title: "extract", items: ["products · filters", "banners + OCR"] },
        { title: "analyze", items: ["brand share", "rank · confidence"] },
        { title: "keep", items: ["local history", "Excel · CSV · ZIP"] },
      ],
      caption: "a real browser on the office network, not a cloud scraper. Nothing leaves the machine, and a blocked site is reported as blocked, not as an empty shelf",
    },
    snippet: {
      file: "src/main/extract/page-extractor.js",
      lang: "js",
      note:
        "Scraped filter counts are meaningless without a denominator. This hunts the page's own \"N results\" figure across the likely containers, which both anchors share-of-shelf maths and cross-checks the summed facet counts.",
      code: `// The page's own "N results / N products" figure — the correct denominator
// for share-of-shelf, and a cross-check against summed filter counts.
function statedResultTotal() {
  // "of N products" / "N results found" is the TOTAL; "Showing 1–30 products"
  // is just the current page. Prefer the total, so match "of N …" first.
  const OF = /\\bof\\s+([\\d][\\d,\\.]{0,9})\\s*(?:results?|products?|items?|matches)\\b/i;
  const FOUND = /\\b([\\d][\\d,\\.]{0,9})\\s*(?:results?|products?|items?|item\\(s\\)|matches)\\s*(?:found|for\\b)/i;
  const RES = /\\b([\\d][\\d,\\.]{0,9})\\s*(?:results?|products?|items?|item\\(s\\)|matches)\\b/i;
  const toN = (m) => { if (!m) return null; const n = parseInt(m[1].replace(/[,\\.]/g, ''), 10); return (Number.isFinite(n) && n > 0 && n < 10000000) ? n : null; };
  const zones = document.querySelectorAll(
    '[class*="result" i], [class*="count" i], [class*="total" i], [class*="showing" i], ' +
    '[class*="toolbar" i], [class*="header" i], [class*="listing" i], h1, h2, main');
  let ofHit = null, foundHit = null, resHit = null;
  zones.forEach((z) => {
    const t = clean(z.innerText || '').slice(0, 300);
    if (ofHit === null) ofHit = toN(t.match(OF));
    if (foundHit === null) foundHit = toN(t.match(FOUND));
    if (resHit === null) resHit = toN(t.match(RES));
  });
  return ofHit != null ? ofHit : (foundHit != null ? foundHit : resHit);
}`,
    },
    decisions: [
      {
        title: "A desktop app, not a cloud scraper",
        body: "Electron runs a real Chromium inside a Windows program, so scans come from the office network with a genuine browser fingerprint. Many retailers accept that visit but block it from a data center. It also keeps the privacy story simple: there's no login and nothing is uploaded.",
      },
      {
        title: "A block is not a result",
        body: "If a site answers with a bot challenge, the scan says it was blocked and gives a confidence score. It never reports zero competitor activity. A report that mistakes a blocked page for an empty shelf is worse than no report at all.",
      },
      {
        title: "Recipes per site, a generic fallback for the rest",
        body: "Recipes are JSON files matched by hostname, so tuning a difficult retailer means editing a file, not changing the extractor. Sites without a recipe still get the generic extractor, which is how new markets are covered on day one.",
      },
    ],
    outcome: [
      { value: "128", label: "retailer sites in one test run" },
      { value: "~3 in 4", label: "returned usable shelf data" },
      { value: "100%", label: "local — no cloud, no login" },
    ],
  },
  {
    slug: "leadgen",
    index: "05",
    featured: false,
    tags: ["web", "ai"],
    image: leadgenImg,
    title: "LeadGen",
    tagline: "Local B2B lead finder — sourced, scored, and personalized",
    year: "2025",
    role: "Architecture · Full build",
    platform: "Web — Local (single machine)",
    keyStack: ["Python", "FastAPI", "SQLite", "OpenAI"],
    stack: [
      "Python",
      "FastAPI · Uvicorn",
      "SQLite (WAL)",
      "httpx",
      "OpenAI (gpt-4o-mini)",
      "HTML · CSS · JavaScript",
      "Prospeo API",
      "OpenStreetMap Overpass",
      "python-dotenv",
    ],
    overview:
      "A local web app for an internal sales team. It finds B2B companies and decision makers, scores every lead from 0 to 100, and stores them so the team can review them, write AI-personalized outreach, and export a CSV. It runs on one machine with no login and no cloud host, and targets the UAE and KSA by default (Dubai, Abu Dhabi, Sharjah, Riyadh).",
    problem:
      "The team was building prospect lists by hand: searching, copying names into spreadsheets, and guessing which companies deserved attention first. Paid data APIs help, but every lookup costs credits, so repeating a search or fixing a bad field mapping wastes money. The tool had to pull leads from several sources, drop duplicates, rank them on transparent rules, and keep enough raw data that nothing ever has to be paid for twice.",
    built: [
      "Three lead sources behind one run: Prospeo (company search, then people search, then bulk enrichment, with rate limiting and 429 backoff), OpenStreetMap Overpass for home services, and a self-hosted LeadCore app that crawls sites and verifies emails",
      "Nine seeded sectors, from manufacturing, construction, and HVAC to dental clinics and luxury car rental, each with editable titles, industries, sub-sectors, pain point, solution, hook, and outreach angle",
      "Transparent 100-point scoring: ICP fit (30), company quality (15), decision maker (15), and contactability (10) are automatic, while AI opportunity (25) and intent (5) are set by hand — tiers A to D",
      "Deduplication on normalized company name, website domain, and decision maker — two people at the same company are both kept, re-runs skip existing rows, and each company is capped at 3 decision makers",
      "Raw source JSON stored on every lead, so field mappings can be fixed later without spending API credits again",
      "Runs on in-process threads with live progress (phase, counts, errors); a restart marks unfinished runs as interrupted so they never block the next one",
      "Leads table with sorting, filters, expandable rows, inline editing of the manual scores, and outreach fields (status, last contact, next action, owner, notes)",
      "A needs-review queue for email/website domain mismatches (flagged, never deleted automatically) and leads missing a manual score",
      "Per-lead AI personalization on gpt-4o-mini, seeded from the sector's pain point, solution, hook, and angle",
      "CSV export in the master lead schema, plus scripts for sample data, CSV re-import with rescoring, and adding LeadCore sectors",
      "Settings for API keys kept only in .env, masked in the UI and never logged",
    ],
    arch: {
      cols: [
        { title: "source", items: ["Prospeo · OSM", "LeadCore import"] },
        { title: "enrich", items: ["bulk enrich", "429 backoff"] },
        { title: "dedup", items: ["name + domain + DM", "3 per company"] },
        { title: "score", items: ["70 auto + 30 manual", "tiers A–D"] },
        { title: "act", items: ["AI personalization", "CSV export"] },
      ],
      caption: "FastAPI + SQLite on one machine with no cloud and no login. Raw source JSON is kept on every lead, so fixing a mapping never costs another API call",
    },
    snippet: {
      file: "app/scoring.py",
      lang: "python",
      note:
        "Qualification scoring, component by component. Automated signals cap at 70; the remaining 30 are manual UI fields that count as zero while null — so an unreviewed lead can never fake its way into tier A.",
      code: `def score_lead(lead: dict, geo_countries=None, geo_cities=None) -> dict:
    """Compute automated components + total + tier. Preserves manual fields.

    geo_countries/geo_cities override the default UAE/KSA targets. LeadCore
    sectors pass their ICP's geography so a run outside the Gulf can still
    earn the 10 ICP-fit points; every existing caller omits them and scores
    exactly as before.
    """
    # ICP Fit (30): sourced via a sector-targeted run (10), geography (10), size known (10)
    icp = 10 if lead.get("sector") else 0
    countries = ({c.lower().strip() for c in geo_countries}
                 if geo_countries is not None else TARGET_COUNTRIES)
    cities = ({c.lower().strip() for c in geo_cities}
              if geo_cities is not None else TARGET_CITIES)
    country = (lead.get("country") or "").lower().strip()
    city = (lead.get("city") or "").lower().strip()
    if country in countries or city in cities:
        icp += 10
    if lead.get("employee_size"):
        icp += 10

    # Company Quality (15): website (8), employee count present (7)
    company = (8 if lead.get("website") else 0) + (7 if lead.get("employee_size") else 0)

    # Decision Maker (15): a named person with a job title
    dm = 15 if (lead.get("decision_maker") and lead.get("title")) else 0

    # Contactability (10): verified email (7), mobile (3)
    contact = (7 if lead.get("dm_email") else 0) + (3 if lead.get("dm_mobile") else 0)

    ai_opp = lead.get("score_ai_opportunity")
    intent = lead.get("score_intent")
    total = icp + company + dm + contact + (ai_opp or 0) + (intent or 0)

    return {
        "score_icp": icp,
        "score_company": company,
        "score_dm": dm,
        "score_contact": contact,
        "score_ai_opportunity": ai_opp,
        "score_intent": intent,
        "qualification_score": total,
        "tier": tier_for(total),
    }`,
    },
    decisions: [
      {
        title: "Humans own the judgment scores",
        body: "AI opportunity and intent can't be read reliably from a data provider, so they're typed in by the team and count as zero until then. A lead that hasn't been reviewed can't reach tier A on automatic signals alone, which caps out at 70.",
      },
      {
        title: "Keep the raw payload",
        body: "Every lead stores the source's original JSON. When a field mapping turns out wrong, it can be fixed and replayed locally instead of paying for the same Prospeo lookup twice.",
      },
      {
        title: "Local, boring, and fast to change",
        body: "FastAPI, SQLite in WAL mode, and plain HTML with the browser cache turned off. There's no build step, no hosting bill, and no login. An internal tool for one team didn't need more, and an edit shows up on the next reload.",
      },
    ],
    outcome: [
      { value: "3", label: "lead sources, 1 run" },
      { value: "100", label: "point transparent score, tiers A–D" },
      { value: "9", label: "seeded sectors" },
    ],
  },
  {
    slug: "mailforge",
    index: "06",
    featured: true,
    tags: ["web", "cloud"],
    image: mailforgeImg,
    title: "MailForge",
    tagline: "Mail infrastructure for cold outbound — domains, mailboxes, warming",
    year: "2025",
    role: "Architecture · Full build",
    platform: "Web — Self-hosted (VPS)",
    keyStack: ["Next.js", "TypeScript", "PostgreSQL", "Prisma ORM", "Docker"],
    stack: [
      "Next.js 15",
      "TypeScript",
      "PostgreSQL 16 · Prisma",
      "Mailcow",
      "Docker Compose",
      "React 19",
      "Nodemailer (SMTP)",
      "ImapFlow (IMAP)",
      "Cloudflare · Porkbun DNS",
      "Stripe",
      "OpenAPI REST",
      "MCP server",
    ],
    overview:
      "The infrastructure layer behind outbound campaigns, deliberately not a sequencer. You add domains, and MailForge publishes and checks SPF, DKIM, DMARC, and MX. It then creates real SMTP/IMAP mailboxes on Mailcow, which can be warmed, used from a built-in inbox, or exported straight into Instantly, Smartlead, Snov, or Lemlist.",
    problem:
      "Before a cold-email team can send a single message, someone has to buy domains, set up DNS authentication, create dozens of mailboxes, warm them for weeks, and copy the credentials into a sequencer. It's slow and full of hard-to-see mistakes, and a single wrong DNS record ruins deliverability. The product had to turn that setup into a few clicks, or a single API call from an agent, on infrastructure the team owns.",
    built: [
      "Domain management: live DNS checks, one-click publishing to Cloudflare or Porkbun (or manual records), nameserver delegation, redirects, and optional Porkbun domain search and purchase",
      "Background worker that rechecks delegated domains every few minutes",
      "Mailbox provisioning through the Mailcow API — create one or many, delete, and show SMTP/IMAP credentials, with passwords encrypted at rest",
      "Built-in inbox that lists, opens, sends, and deletes mail over SMTP (Nodemailer) and IMAP (ImapFlow)",
      "Warming with on/off, pause, and resume, plus 28-, 18-, or 12-day ramps, tracking daily volume, health score, inbox rate, spam rate, and activity",
      "CSV export in generic, Instantly, Smartlead, Snov, and Lemlist formats",
      "REST API v1 with an OpenAPI spec, bearer API keys (create, revoke, re-enable, delete), and in-app API docs",
      "MCP server for Cursor so an agent can manage domains, bulk-create mailboxes, export CSVs, and toggle warming",
      "Stripe subscriptions where each plan sets mailbox and domain limits — from 15 mailboxes up to 200",
      "Single-VPS deployment: Mailcow handles mail and HTTPS, and Docker Compose runs the app, Postgres, and the domain-setup and warming workers",
    ],
    arch: {
      cols: [
        { title: "domain", items: ["add · buy", "Cloudflare · Porkbun"] },
        { title: "verify", items: ["SPF · DKIM · DMARC · MX", "recheck worker"] },
        { title: "provision", items: ["Mailcow API", "SMTP · IMAP boxes"] },
        { title: "warm", items: ["12–28 day ramps", "health + spam rate"] },
        { title: "hand off", items: ["inbox · CSV export", "REST · MCP"] },
      ],
      caption: "infrastructure, not a sequencer. It builds and warms the mailboxes, then hands them to whatever tool does the sending",
    },
    snippet: {
      file: "src/services/warmingService.ts",
      lang: "ts",
      note:
        "Warm-up volume for a given day. A linear ramp is what burns domains, so progress runs through a smoothstep curve and starts at a floor of ~10% of target — early days stay deliberately, boringly low.",
      code: `/**
 * Winnr-like daily volume: volumePerDay is the ceiling.
 * Progress eases in over ramp duration; day 0 starts at ~1.
 */
export function todaysWarmingVolume(
  volumePerDay: number,
  ramp: WarmingRamp,
  dayIndex: number,
): number {
  const max = clampVolumePerDay(volumePerDay);
  const duration = rampDurationDays(ramp);
  const day = Math.max(0, dayIndex);
  const linear = Math.min(1, day / duration);
  // Gentle ease-in so early days stay low
  const eased = linear * linear * (3 - 2 * linear);
  const floor = Math.max(1, Math.round(max * 0.1));
  const today = Math.round(floor + (max - floor) * eased);
  return Math.min(max, Math.max(1, today));
}`,
    },
    decisions: [
      {
        title: "Infrastructure, not a sequencer",
        body: "Teams already have a sequencer they like. MailForge stops at ready, warmed mailboxes and exports them in each tool's own CSV format, so it fits into an existing outbound stack instead of competing with it.",
      },
      {
        title: "Warm slowly, on a curve",
        body: "A linear ramp is what burns new domains. Daily volume follows a smoothstep curve from a floor of about 10% of target, over 12, 18, or 28 days, so the early days stay deliberately low.",
      },
      {
        title: "Built for agents as well as people",
        body: "Everything in the UI is also available through a versioned REST API with bearer keys, and through an MCP server for Cursor. An agent can create 50 mailboxes and turn on warming without anyone clicking through a dashboard.",
      },
    ],
    outcome: [
      { value: "5", label: "sequencer export formats" },
      { value: "3", label: "warm-up ramps: 12, 18, 28 days" },
      { value: "1", label: "VPS runs the whole stack" },
    ],
  },
  {
    slug: "codevault",
    index: "07",
    featured: true,
    tags: ["desktop"],
    title: "CodeVault",
    tagline: "Local security scanner — your source never leaves the machine",
    year: "2026",
    role: "Architecture · Full build",
    platform: "Desktop — Electron",
    keyStack: ["Electron", "React", "Node.js", "Jest"],
    stack: [
      "Electron 33",
      "React 18",
      "Node.js worker_threads",
      "Babel AST",
      "Monaco Editor",
      "Tailwind CSS",
      "Chart.js",
      "React Router",
      "Electron Forge · Webpack",
      "electron-store",
      "OSV.dev (optional)",
      "CycloneDX · SARIF",
      "Jest",
    ],
    overview:
      "A desktop static-analysis (SAST) scanner that runs on the developer's own machine. You pick a project folder and run Analyze. It reads source, config, and dependency files and reports vulnerabilities, leaked secrets, risky dependencies, and weak infrastructure-as-code, then gives the codebase an A–F grade, compliance notes, and exportable reports. It never runs the code or touches live systems, and it's offline by default.",
    problem:
      "Most security scanners are cloud services that need your source code uploaded before they'll say anything — a non-starter for client work, regulated code, or anything under NDA. Teams either skip scanning or run a handful of single-purpose CLIs that each cover one slice. The tool had to cover code, secrets, dependencies, licenses, and infrastructure in one pass, fully on the local machine, with output a reviewer or auditor can actually use.",
    built: [
      "Parallel scan engine on Node worker_threads, with a single-thread fallback and a configurable worker count",
      "Taint tracking for JavaScript and TypeScript on the Babel AST, heuristic data-flow taint for Python, and curated regex rules for 12 more languages including Java, C#, C/C++, PHP, Go, Rust, Ruby, Swift, Kotlin, and SQL, plus Next.js and React rules",
      "Secret detection for AWS, GitHub, Stripe, and Google keys, private keys, JWTs, and database URIs",
      "Dependency checks through offline npm audit and a bundled CVE map, with an optional OSV.dev lookup that sends only the package name and version and is off by default",
      "CycloneDX 1.5 SBOM generation and license checks that flag copyleft/AGPL and missing licenses",
      "IaC rules for Terraform, Kubernetes, docker-compose, GitHub Actions, Dockerfiles, and .env files",
      "Weighted risk scoring into an A–F grade and health score, with prioritized recommendations",
      "Indicative compliance mapping to OWASP Top 10 (2021), PCI-DSS, SOC 2, NIST CSF, and OWASP ASVS",
      "React UI with a Monaco-highlighted snippet around every finding, Chart.js dashboards, scan history, local suppression rules, and dark mode",
      "Reports in PDF, HTML, JSON, CSV, and SARIF 2.1.0 — covered by 244 Jest tests across 25 suites",
    ],
    arch: {
      cols: [
        { title: "collect", items: ["pick folder", "skip rules"] },
        { title: "analyze", items: ["AST · taint · regex", "worker_threads"] },
        { title: "check", items: ["secrets · deps", "IaC · licenses"] },
        { title: "score", items: ["A–F grade", "compliance map"] },
        { title: "report", items: ["PDF · HTML · SARIF", "SBOM · CSV"] },
      ],
      caption: "everything runs in the Electron process on your machine. The only optional network call sends a package name and version to OSV.dev, never code",
    },
    snippet: {
      file: "src/scanner/riskScorer.js",
      lang: "js",
      note:
        "Raw CVSS treats every finding as equal; this doesn't. Categories carry multipliers (injection outranks misconfiguration), and low-impact types count at 35% of their weight, so a weak .env value can't drown out a real injection path.",
      code: `const CATEGORY_MULTIPLIERS = {
  'Injection Attacks': 1.4,
  'Cross-Site Scripting': 1.3,
  'Hardcoded Secrets': 1.35,
  'Insecure Deserialization': 1.3,
  'Authentication & Session': 1.2,
  'Vulnerable Dependencies': 1.15,
  'Security Misconfiguration': 1.0,
};

const SEVERITY_WEIGHTS = {
  CRITICAL: 22,
  HIGH: 14,
  MEDIUM: 6,
  LOW: 2,
  INFO: 0,
};

const LOW_IMPACT_TYPES = new Set([
  'WEAK_ENV_SECRET',
  'EMPTY_ENV_VALUE',
  'ENV_NOT_GITIGNORED',
]);

// inside RiskScorer.calculate(), once per finding:
let weight = SEVERITY_WEIGHTS[sev] || 2;
if (LOW_IMPACT_TYPES.has(issue.type)) {
  weight *= 0.35;
}
baseScore += weight * typePenalty;
const mult = CATEGORY_MULTIPLIERS[issue.category] || 1;
categoryBoost += weight * typePenalty * (mult - 1);`,
    },
    decisions: [
      {
        title: "Offline by default",
        body: "Source code never leaves the machine, and dependency checks run against a bundled CVE map and offline npm audit. OSV.dev is an opt-in toggle, and even then it only sends a package name and version. That's what makes the tool usable on code a cloud scanner could never be allowed to see.",
      },
      {
        title: "Match the analysis depth to the language",
        body: "JavaScript and TypeScript get real AST taint tracking, Python gets heuristic data-flow, and everything else gets curated regex rules. Deep analysis where it pays off and broad coverage everywhere else beats pretending every language gets the same depth. The limits are stated in the app.",
      },
      {
        title: "Weight findings, don't just count them",
        body: "Injection and leaked secrets carry more weight than misconfiguration, and low-impact .env noise is held back, so the grade reflects real risk. Compliance views are labeled as indicative mappings, not a certification.",
      },
    ],
    outcome: [
      { value: "15", label: "languages scanned" },
      { value: "5", label: "report formats incl. SARIF 2.1.0" },
      { value: "244", label: "Jest tests across 25 suites" },
    ],
  },
  {
    slug: "booking-platform",
    index: "08",
    featured: true,
    tags: ["web"],
    company: "Spark AI",
    image: bookingPlatformImg,
    title: "Booking Platform",
    tagline: "Multi-tenant appointment booking for service businesses",
    year: "2024 — 2025",
    role: "Product · Full build",
    platform: "Web — Multi-tenant SaaS",
    keyStack: ["Next.js", "NestJS", "Prisma ORM", "MySQL", "Redis", "Stripe"],
    stack: [
      "Next.js 14",
      "NestJS 10",
      "Prisma · MySQL",
      "Redis · BullMQ",
      "Stripe",
      "TypeScript",
      "React 18",
      "Tailwind CSS",
      "Radix UI",
      "Redux Toolkit",
      "React Hook Form · Zod",
      "Swagger",
      "Google · Microsoft Calendar",
      "Unipile (WhatsApp)",
      "OpenAI",
      "Sentry",
    ],
    overview:
      "A multi-tenant appointment booking platform. Businesses sign up as organizations, set up locations, staff, and services, and get their own booking site. Customers choose a service and a provider, pick an open slot, and confirm. Staff handle the calendar, approvals, payments, and reminders, and a platform admin layer sits above every organization.",
    problem:
      "Service businesses such as clinics, salons, and consultancies stitch together a booking widget, a calendar, a payment link, and manual reminder texts. Double bookings, unpaid no-shows, and forgotten appointments follow. The product had to handle the entire booking lifecycle for many independent businesses on one platform: accurate availability, payment at booking time, and reminders that go out without anyone remembering to send them.",
    built: [
      "Public booking pages, embeddable booking widgets, and short partner booking links that bring in referred customers",
      "Organizations, locations, providers, and services, with team invites and platform, admin, provider, and customer roles",
      "Availability engine in a shared scheduling-core package: weekly hours, blocked time, buffers, lead time, booking window, and cancellation cutoff",
      "Book, reschedule, and cancel flows, recurring series, and optional approval before a booking is confirmed",
      "Service intake questions, customer notes and reviews, and a waitlist with notify and leave when a slot is full",
      "Stripe for booking payments (full price or deposit, balance due, and no-show fees) and for organization plans, checkout, and invoice history",
      "Email and WhatsApp reminders run as BullMQ jobs on Redis, with editable notification templates",
      "Calendar sync so bookings show on Google and Microsoft calendars, plus meeting links on appointments",
      "Reports for providers, admins, and the platform, and API keys with outbound webhooks for integrations",
      "OpenAI-powered booking assistant for customers, plus AI-written service descriptions",
      "NestJS REST API documented in Swagger, with JWT auth, email verification, password reset, CSRF protection, rate limiting, Helmet, and Sentry monitoring",
    ],
    arch: {
      cols: [
        { title: "configure", items: ["org · locations", "staff · services"] },
        { title: "availability", items: ["scheduling-core", "buffers + rules"] },
        { title: "book", items: ["pages · widgets", "partner links"] },
        { title: "pay", items: ["deposits · balance", "no-show fees"] },
        { title: "remind", items: ["BullMQ jobs", "email · whatsapp"] },
      ],
      caption: "one platform, many organizations: Next.js → NestJS + Prisma → MySQL, with slot rules and types in shared packages",
    },
    decisions: [
      {
        title: "Scheduling rules in a shared package",
        body: "Availability logic lives in its own scheduling-core package, with a shared-types package alongside it, not inside a controller. Buffers, lead time, booking window, and blocked time are pure interval arithmetic that can be tested on its own and reused across the app.",
      },
      {
        title: "Charge at booking, not after",
        body: "Deposits, balances, and no-show fees are handled by Stripe as part of the booking itself. When a customer who didn't show up has already paid, the business isn't left chasing money.",
      },
      {
        title: "Reminders as jobs, not cron scripts",
        body: "Email and WhatsApp reminders and other background work run as BullMQ jobs on Redis, not inside the request. They survive an API restart, and the booking request returns without waiting on the email or WhatsApp provider.",
      },
    ],
    outcome: [
      { value: "4", label: "roles, platform to customer" },
      { value: "2", label: "calendar providers synced" },
      { value: "3", label: "booking entry points: page, widget, link" },
    ],
  },
  {
    slug: "video-funnels",
    index: "09",
    featured: false,
    tags: ["web", "ai", "cloud"],
    company: "Spark AI",
    image: videoFunnelsImg,
    title: "AI Video Funnels",
    tagline: "Conversion funnels with talking AI videos",
    year: "2024 — 2025",
    role: "Architecture · Full build",
    platform: "Web — SaaS",
    keyStack: ["React", "Vite", "Node.js", "MySQL", "HeyGen", "OpenAI"],
    stack: [
      "React 18",
      "Vite 5",
      "Node.js · Express 5",
      "MySQL",
      "HeyGen",
      "React Router 6",
      "Zustand",
      "React Query",
      "Tailwind CSS · styled-components",
      "Framer Motion",
      "react-dnd",
      "Recharts",
      "OpenAI",
      "Gemini",
      "Cloudinary",
      "Stripe",
    ],
    overview:
      "A SaaS product for building conversion funnels that include talking AI videos. Users design a multi-step journey, generate or choose an AI presenter and voice, publish a public funnel page, and review leads and performance. It's built for marketers, agencies, coaches, and e-commerce teams in the UAE and worldwide.",
    problem:
      "Video converts better than text, but producing it is slow and expensive — and funnel tools don't make video while video tools don't build funnels. Marketers ended up filming, editing, uploading, and wiring forms across several products. The product had to collapse that into one flow: build the journey, turn a script into a presenter video, publish, and see where people drop off.",
    built: [
      "Drag-and-drop funnel builder (react-dnd) with a template library, live preview, and 18 step types — video, question, form, quiz, pricing, timer, social proof, calendar, upload, waitlist, and more",
      "AI funnel assistant that suggests steps, flow, and copy from a goal and an audience",
      "Brand kit (logo, colors, tone) with an AI branding assistant powered by OpenAI",
      "HeyGen video pipeline: script-to-video in multiple languages from an avatar library or a custom photo upload",
      "Custom avatar photos get a quality check, with optional Gemini enhancement before rendering",
      "Standard and premium voices, with voice cloning on Pro and Elite plans",
      "Public funnel pages plus a dashboard with views, drop-off, and conversions, and per-funnel reports of leads, answers, and quiz data",
      "Stripe subscriptions across Trial, Core, Pro, and Elite tiers, with credits for paid AI generation and a cron job that expires plans",
      "JWT and Google sign-in, email verification, password reset, Cloudinary media storage, and Nodemailer email",
      "Admin console for users, subscriptions, funnels, avatar and voice libraries, and settings",
    ],
    arch: {
      cols: [
        { title: "design", items: ["drag & drop builder", "AI funnel assistant"] },
        { title: "brand", items: ["brand kit", "AI branding"] },
        { title: "generate", items: ["HeyGen avatars", "voices + cloning"] },
        { title: "publish", items: ["public funnel page", "lead capture"] },
        { title: "measure", items: ["views · drop-off", "per-funnel reports"] },
      ],
      caption: "React + Vite SPA → Express 5 API → MySQL. HeyGen renders the video, Cloudinary stores media, and Stripe credits pay for every AI generation",
    },
    decisions: [
      {
        title: "Check the photo before paying for a render",
        body: "Custom avatars fail quietly when the source photo is poor, and every render costs credits. Scoring the upload first — accept, enhance with Gemini, or reject — catches a bad photo before it becomes a wasted video.",
      },
      {
        title: "The assistant suggests, the creator decides",
        body: "The AI proposes funnel steps, flow, and copy but never publishes on its own. It removes the blank-canvas problem while leaving creative control, and accountability, with the marketer.",
      },
      {
        title: "Plans as product limits, credits as AI cost",
        body: "Each tier maps to clear limits: Trial can't create funnels, Core allows 10 funnels of 20 steps, and Pro removes the caps and adds voice cloning. Avatar and video generation are metered separately as credits, because that's where the real cost is.",
      },
    ],
    outcome: [
      { value: "18", label: "funnel step types" },
      { value: "4", label: "plan tiers, Trial to Elite" },
      { value: "0", label: "video production skills needed" },
    ],
  },
  {
    slug: "sales-crm",
    index: "10",
    featured: true,
    tags: ["web", "ai"],
    company: "Spark AI",
    image: salesCrmImg,
    title: "Sales CRM",
    tagline: "Multi-tenant sales CRM with a built-in AI assistant",
    year: "2026",
    role: "Product · Architecture · Full build",
    platform: "Web — Multi-tenant SaaS",
    keyStack: ["Next.js", "Node.js", "Prisma ORM", "MySQL", "Socket.IO", "OpenAI"],
    stack: [
      "Next.js 14",
      "Express · TypeScript",
      "Prisma · MySQL 8",
      "Socket.IO",
      "Bull · Redis",
      "React 18",
      "Tailwind CSS",
      "Radix UI",
      "Zustand",
      "Zod",
      "next-intl",
      "Recharts",
      "TipTap",
      "Hello Pangea DnD",
      "OpenAI",
      "Stripe",
      "Cloudinary · PDFKit",
      "Swagger",
      "Vitest · Playwright",
    ],
    overview:
      "A multi-tenant sales CRM where each organization gets its own workspace — contacts, deals, email, and billing — with roles, a subscription plan, and a 7-day trial. Teams run the whole sales cycle in one place: capture leads, move deals through pipelines, follow up by email and live chat, send quotes and invoices, and track pipeline and revenue on a dashboard. A built-in AI assistant drafts emails and summarizes timelines.",
    problem:
      "Small sales teams end up paying for a CRM, a separate email-sequence tool, a quoting and invoicing app, a live-chat widget, and a form builder, and still copy data between them by hand. Tools priced for enterprise also tend to assume US dollars and US time zones. The product had to cover the whole cycle from first form fill to paid invoice in one workspace, with enterprise-grade access control, and default to how teams in the Gulf actually work (AED and Asia/Dubai time, with exchange rates for other currencies).",
    built: [
      "Customer records: contacts, companies, and leads with stages and rule-based scoring, plus tags, custom fields, saved lists, duplicate handling, and CSV import",
      "Multiple Kanban deal pipelines (Hello Pangea DnD) with line items, products, documents, and commission plans",
      "Quotes with public e-sign links and invoices with public payment-status pages, rendered to PDF with PDFKit — no login needed to view them",
      "Email templates, sequences, and campaigns sent through Resend or Gmail, with opens tracked on the contact timeline and sequences run on Bull queues",
      "Unified inbox, a live chat widget, and in-app notifications over Socket.IO",
      "Built-in AI assistant on OpenAI for email drafts, timeline summaries, and chat",
      "Tasks, reminders, and a calendar with Google Calendar sync, plus public booking pages through a scheduling integration",
      "Embeddable web forms and no-code workflows (assign, tag, notify, webhook), with round-robin lead assignment",
      "Reports on pipeline, funnels, goals, and team performance",
      "Enterprise auth: JWT access and refresh tokens, Google sign-in, SSO over SAML and OpenID, LDAP, and TOTP two-factor",
      "Stripe Basic / Pro / Premium plans with feature gates, team roles (Admin, Manager, Sales Rep, Viewer), an audit log, API keys, outbound webhooks, and a separate platform admin area",
      "Ctrl+K command search, in-app page tours, and next-intl translations; Vitest on the API and Playwright smoke tests on the frontend",
    ],
    arch: {
      cols: [
        { title: "capture", items: ["forms · chat widget", "CSV · round-robin"] },
        { title: "qualify", items: ["lead stages", "rule-based scoring"] },
        { title: "sell", items: ["Kanban pipelines", "quotes + e-sign"] },
        { title: "follow up", items: ["sequences on Bull", "AI drafts"] },
        { title: "collect", items: ["invoices · PDF", "reports"] },
      ],
      caption: "Next.js → Express + Prisma → MySQL, with Socket.IO for chat and notifications, Bull on Redis for sequences and reminders, and public token pages for quotes, invoices, forms, and booking",
    },
    decisions: [
      {
        title: "Public pages without logins",
        body: "Quotes, invoices, forms, booking, and the chat widget are opened by a token or the organization's slug, so a customer can sign a quote or check an invoice without creating an account. Every step that needs a login loses deals at the finish line.",
      },
      {
        title: "Plans as feature gates",
        body: "Basic, Pro, and Premium unlock features, not only seats. Everyone gets the same product, and the gates decide what a workspace can use. Upgrading is a switch rather than a migration, and the 7-day trial shows the real product.",
      },
      {
        title: "Enterprise auth from day one",
        body: "SSO over SAML and OpenID, LDAP, TOTP two-factor, and an audit log are usually added later, after a big customer asks. Building them into the multi-tenant core meant larger teams could adopt the CRM without a security review blocking it.",
      },
    ],
    outcome: [
      { value: "4", label: "team roles, Admin to Viewer" },
      { value: "3", label: "Stripe plans with feature gates" },
      { value: "5", label: "no-login public pages" },
    ],
  },
  {
    slug: "matching-app",
    index: "11",
    featured: false,
    tags: ["web", "ai"],
    company: "Spark AI",
    image: matchingAppImg,
    title: "Matching & Community App",
    tagline: "Where people and opportunities meet — matching, community, and coaching",
    year: "2025",
    role: "Product · Full build",
    platform: "Web + Mobile (Expo)",
    keyStack: ["React", "React Native", "Expo", "Node.js", "MySQL", "Gemini"],
    stack: [
      "React 18",
      "React Native · Expo",
      "Node.js · Express",
      "MySQL · Sequelize",
      "TypeScript",
      "Vite",
      "Tailwind CSS",
      "Radix UI",
      "Framer Motion",
      "TanStack Query",
      "Wouter · React Navigation",
      "Zod",
      "OpenAI · Gemini",
      "Cloudinary",
      "Stripe",
    ],
    overview:
      "A relationship and community app. People set preferences, discover compatible matches, chat, join events and groups, and get coaching. Matching is rules-first: deal-breakers filter out poor fits, the rest are ranked by values, lifestyle, and communication style, and an AI model (Gemini, falling back to OpenAI) adds 28% of each score. A separate AI assistant helps with messages and relationship advice. Three apps — web, iOS/Android, and a shared API — run on one backend.",
    problem:
      "Most dating apps are built around endless swiping and leave everything else to the user: what to say, where to meet people, how to grow the relationship. Handing matching entirely to an AI model brings its own problem: the results can't be explained, and they can override what someone said they won't accept. The product had to rank matches mainly on transparent rules that respect deal-breakers, use AI only for nuance, learn from activity without overriding those boundaries, and add a social layer and coaching around the match.",
    built: [
      "Matching engine in two passes: hard deal-breaker filtering, then ranking by values, lifestyle, and communication style, blended 72 / 28 with a Gemini or OpenAI score and refined by likes, passes, and chats",
      "Onboarding and an optional AI Matchmaker questionnaire, with swipe-style discovery, filtered people browsing, and curated picks",
      "Chat with message requests, reactions, and voice messages",
      "AI assistant (OpenAI · Gemini) for rewriting messages, opening lines, tone, and relationship guidance — it never sends messages on its own",
      "Community layer with posts, stories, likes, comments, groups, and a people directory",
      "Events with venues, RSVPs, and event-specific match questionnaires",
      "Relationship coaches with profiles and bookings, plus courses",
      "Notifications, blocking, content moderation, and Stripe subscriptions",
      "Admin console covering users, posts, matches, messages, events, venues, coaches, courses, groups, AI, and analytics",
      "React Native (Expo) mobile app for Android, iOS, and web, sharing the API and branding with the React/Vite web app",
    ],
    arch: {
      cols: [
        { title: "profile", items: ["onboarding", "AI Matchmaker quiz"] },
        { title: "filter", items: ["deal-breakers", "hard boundaries"] },
        { title: "rank", items: ["values · lifestyle", "activity signals"] },
        { title: "connect", items: ["requests · chat", "AI assist"] },
        { title: "community", items: ["events · groups", "coaches · courses"] },
      ],
      caption: "rules carry 72% of every match score and AI adds the rest. Web (React + Vite) and mobile (Expo) share one Express + MySQL API",
    },
    decisions: [
      {
        title: "Rules first, AI for nuance",
        body: "The deterministic score carries 72% of every match and the model 28%, so rankings stay explainable while the AI picks up what rules miss. If Gemini and OpenAI are both down, matching falls back to rules alone and never stops working.",
      },
      {
        title: "Learn from activity, never past a boundary",
        body: "Likes, passes, and chats improve later rankings, but only after deal-breakers are applied. Behavior can reorder the shortlist, but it can't put someone back on a list they were filtered out of.",
      },
      {
        title: "One API for web and mobile",
        body: "The React web app, including its admin tools, and the Expo mobile app share one Express and MySQL API. Features reach iOS, Android, and the web together, and blocking and moderation are enforced in one place.",
      },
    ],
    outcome: [
      { value: "3", label: "apps: web, mobile, shared API" },
      { value: "2-pass", label: "matching: filter, then rank" },
      { value: "72 / 28", label: "rules / AI blend per match" },
    ],
  },
  {
    slug: "avatar-studio",
    index: "12",
    featured: false,
    tags: ["web", "ai"],
    company: "Spark AI",
    title: "Avatar Studio AI",
    tagline: "AI marketing creatives, from brief to video",
    year: "2026",
    role: "Architecture · Full build",
    platform: "Web — SaaS",
    keyStack: ["Next.js", "NestJS", "HeyGen", "OpenAI", "Stripe"],
    stack: ["Next.js", "NestJS", "OpenAI · Gemini", "HeyGen", "Cloudinary", "Stripe"],
    overview:
      "An AI creative platform that turns a structured brief into finished marketing assets — avatar videos, product videos, and image ads — with AI script strategy, reusable creative recipes, and market-trend style analysis.",
    problem:
      "Marketing teams burn budget on creative production: every campaign needs scripts, videos, and ad variations, and each one is a slow, expensive one-off. The platform needed to industrialize the process — brief in, platform-ready creatives out — without the output feeling templated.",
    built: [
      "Structured creative-brief flow that captures product, audience, and goal before any generation starts",
      "AI script strategy generation with multiple variants, CTA guidance, and per-platform content adaptations",
      "Avatar and product video generation via async job pipelines with polling and provider callbacks",
      "Reusable creative recipes and market-trend style analysis, so winning formats become repeatable",
      "Credit-based usage metering, encrypted provider credentials, audit logs, and admin billing controls",
    ],
    arch: {
      cols: [
        { title: "brief", items: ["structured intake", "audience + goal"] },
        { title: "strategy", items: ["AI script variants", "CTA guidance"] },
        { title: "generate", items: ["avatar video jobs", "provider callbacks"] },
        { title: "deliver", items: ["platform adaptations", "creative recipes"] },
        { title: "govern", items: ["credit metering", "audit logs"] },
      ],
      caption: "generation runs as async jobs with provider callbacks — briefs stay editable while renders complete",
    },
    decisions: [
      {
        title: "Brief before generation",
        body: "Free-prompt creative tools produce generic output. Forcing a structured brief first — product, audience, objective — gives the AI real constraints, and constraints are what make creative output usable.",
      },
      {
        title: "Recipes over one-offs",
        body: "When a creative performs, its structure becomes a reusable recipe — same strategy, new product. The platform compounds learning instead of starting from zero every campaign.",
      },
    ],
    outcome: [
      { value: "3", label: "creative formats — avatar, product, ads" },
      { value: "async", label: "render pipeline with callbacks" },
      { value: "credit", label: "metered usage billing" },
    ],
  },
  {
    slug: "ghertak",
    index: "13",
    featured: false,
    tags: ["web", "cloud"],
    company: "GherTak",
    title: "GherTak",
    tagline: "Multi-vendor marketplace for Pakistan — shop, sell, fulfill",
    year: "2026",
    role: "Full Stack Developer",
    platform: "Web — Marketplace (3 apps, 1 API)",
    keyStack: ["Next.js", "Python", "FastAPI", "PostgreSQL", "JazzCash · PayFast"],
    stack: [
      "Next.js 15 · 16",
      "Python 3.12 · FastAPI",
      "PostgreSQL",
      "SQLModel · SQLAlchemy",
      "JazzCash · PayFast",
      "React 19",
      "TypeScript",
      "Tailwind CSS 4",
      "Redux",
      "React Hook Form · Zod",
      "Alembic",
      "JWT · bcrypt",
      "uv · Gunicorn",
    ],
    overview:
      "A multi-vendor online marketplace for Pakistan. Customers browse and buy, sellers run their own shops, admins run the platform, and a fulfillment team ships the orders. It's three apps on one system: a customer website, a combined admin / vendor / fulfillment panel, and a single FastAPI backend that both frontends talk to.",
    problem:
      "Selling online in Pakistan means local payment rails and a lot of cash on delivery, and a marketplace adds sellers, commissions, and a warehouse team on top of that. Customers need a fast storefront with guest checkout. Sellers need their own shop, inventory, and withdrawals. Admins need to edit or substitute orders, manage delivery zones, and approve payouts. The fulfillment team needs a queue it can work through, all from one source of truth.",
    built: [
      "Customer storefront on Next.js 15 and React 19: browse by vertical, category, search, sales, new arrivals, and best sellers, with product pages, cart, wishlist, and checkout",
      "Guest checkout and registered accounts with Google login, addresses, order tracking and history, reviews, returns, a wallet, and notifications",
      "Payments through JazzCash and PayFast (card / online) alongside cash on delivery",
      "Coupons with usage limits and expiry, including QR coupons you can scan, open from a link, or upload as an image",
      "Seller tools: shop, products and attributes, banners, Excel product import, inventory, orders, returns, earnings, and withdrawal requests",
      "Admin panel on Next.js 16: users, roles, shop verification, vendors, catalog, orders with edits and substitutions, tax, shipping, delivery zones, banners, FAQs, emails, and site settings",
      "Commission, earnings, and withdrawal approvals, plus reports on sales, customers, sellers, fulfillment, and load-out",
      "Fulfillment order queue and dashboard for the team that packs and ships",
      "FastAPI backend on Python 3.12 with SQLModel / SQLAlchemy over PostgreSQL, Alembic migrations, and auto-generated API docs",
      "JWT auth with bcrypt, roles and permissions, security headers, rate limiting, order emails, and in-app notifications",
    ],
    arch: {
      cols: [
        { title: "shop", items: ["storefront", "cart · coupons"] },
        { title: "pay", items: ["JazzCash · PayFast", "cash on delivery"] },
        { title: "sell", items: ["vendor shops", "earnings · withdrawals"] },
        { title: "fulfill", items: ["order queue", "load-out reports"] },
        { title: "govern", items: ["roles · verification", "zones · commission"] },
      ],
      caption: "two Next.js frontends, one FastAPI + PostgreSQL API. Customers, vendors, admins, and the fulfillment team all work from the same orders",
    },
    decisions: [
      {
        title: "One API, two frontends",
        body: "The customer site and the admin / vendor / fulfillment panel are separate Next.js apps, but both call one FastAPI backend. Business rules for orders, coupons, and commission are enforced in a single place, whichever screen triggers them.",
      },
      {
        title: "Pay the way Pakistan pays",
        body: "JazzCash and PayFast handle card and online payments, and cash on delivery is supported from the start, not bolted on later. Guest checkout removes the account wall for first-time buyers.",
      },
      {
        title: "Fulfillment as a role",
        body: "Packing and shipping get their own queue, dashboard, and load-out reports instead of being an admin afterthought. Admins can edit or substitute items on an order when stock doesn't match what was sold.",
      },
    ],
    outcome: [
      { value: "3", label: "apps on one API" },
      { value: "4", label: "roles: customer, vendor, admin, fulfillment" },
      { value: "3", label: "ways to pay, incl. cash on delivery" },
    ],
  },
  {
    slug: "insyncx",
    index: "14",
    featured: false,
    tags: ["web"],
    title: "InsyncX",
    tagline: "Curated multi-vendor marketplace with Stripe Connect payouts",
    year: "2025",
    role: "Architecture · Full build",
    platform: "Web — Marketplace",
    keyStack: ["Next.js", "TypeScript", "Prisma ORM", "MySQL", "Stripe", "Three.js"],
    stack: [
      "Next.js 14 (App Router)",
      "TypeScript",
      "Prisma · MySQL",
      "Stripe Checkout · Connect",
      "NextAuth",
      "React 18",
      "Tailwind CSS",
      "Radix UI",
      "Framer Motion · GSAP",
      "Three.js · React Three Fiber",
      "Zustand",
      "React Hook Form · Zod",
      "Cloudinary · Sharp",
      "TipTap",
      "Recharts",
      "Resend",
    ],
    overview:
      "A curated multi-vendor marketplace where customers shop from independent stores and an official store in one cart. Vendors run their own shops with products, coupons, orders, payouts, and analytics, while admins approve stores, manage the catalog, and control commission, payouts, and platform settings. There are two kinds of vendor: independent sellers paid through their own Stripe Connect account, and team vendors who sell only on the official store.",
    problem:
      "A marketplace has three sets of users, and the money has to be right for all of them. Customers expect a normal checkout with coupons, shipping, and tax. Vendors need their own storefront and a clear record of what they're owed. The platform needs a commission on every sale and control over who gets to sell. Mixing independent sellers with in-house sellers on an official store makes it harder: the same checkout has to route earnings two different ways.",
    built: [
      "Storefront with a Three.js homepage hero, banners, featured stores, new arrivals, shop and product pages, and public store pages",
      "Cart, wishlist, 1–5 star reviews, and Stripe Checkout with percentage or fixed coupons, and shipping and tax driven by platform settings (free-shipping threshold, flat rate, optional tax)",
      "Vendor dashboard: product catalog with images, stock, SKU, tags, and featured / new-arrival flags; store profile; orders and returns; store coupons; payout requests; and sales analytics",
      "Store approval flow — a vendor's store isn't live until an admin approves it",
      "Two vendor models: independent vendors paid through their own Stripe Connect account, and admin-created team vendors whose official-store sales are credited to them",
      "Platform commission (10% by default) taken on every sale, with payouts tracked through pending, approved, paid, and rejected",
      "Admin console for users (including bans), vendors, team vendors, the official store, products, categories, orders, platform coupons, payouts, and analytics",
      "Platform settings for maintenance mode, homepage banners, featured stores, currency, shipping, and tax",
      "NextAuth with email/password (bcrypt) and Google, Customer / Vendor / Admin roles, and banned users blocked at sign-in",
      "Stripe webhooks, Cloudinary and Sharp image handling, TipTap rich text, Resend email, and newsletter signup",
    ],
    arch: {
      cols: [
        { title: "shop", items: ["stores + official", "cart · coupons"] },
        { title: "pay", items: ["Stripe Checkout", "webhooks"] },
        { title: "split", items: ["platform commission", "vendor earnings"] },
        { title: "payout", items: ["Stripe Connect", "team-vendor credit"] },
        { title: "govern", items: ["store approval", "settings · bans"] },
      ],
      caption: "one checkout, two earnings paths: independent vendors are paid through Stripe Connect, team vendors are credited for official-store sales, and the platform keeps its commission either way",
    },
    decisions: [
      {
        title: "Two vendor types, one checkout",
        body: "Independent sellers and in-house team sellers use the same cart and the same Stripe Checkout. Only the earnings path differs, so customers see one store while the ledger stays correct behind it.",
      },
      {
        title: "Approval before a store goes live",
        body: "A marketplace is only as good as its worst seller. New stores stay hidden until an admin approves them, and banned users are blocked at sign-in, so curation is built into the product and not left to cleanup afterward.",
      },
      {
        title: "Payouts as a tracked lifecycle",
        body: "Payout requests move through pending, approved, paid, and rejected, and never happen as a one-off transfer. Vendors can see what they're owed, and admins get an audit trail of every payment.",
      },
    ],
    outcome: [
      { value: "3", label: "roles: customer, vendor, admin" },
      { value: "2", label: "vendor payout models" },
      { value: "10%", label: "default platform commission" },
    ],
  },
];

/* One card per surface, each carrying the full set of tools used on it.
   This used to be two sections — these cards with a handful of icons, and a
   separate Skills grid listing the same technologies again by category — and
   the repetition made the page read longer than it was. Every skill in
   skillGroups appears on exactly the card it belongs to.

   Ordered in pairs of similar weight, since the grid runs two to a row and a
   row is as tall as its busier card. */
export const capabilities = [
  {
    label: "Frontend",
    mono: "frontend/",
    techs: [
      "React",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Radix UI",
      "Redux",
      "Zustand",
      "TanStack Query",
      "Zod",
      "Framer Motion",
      "Three.js",
    ],
    body: "Next.js and React apps for real product work: typed forms validated with Zod, server state in TanStack Query, drag-and-drop builders, dashboards, 3D and motion where they earn their place, and interfaces in five languages.",
  },
  {
    label: "Backend & APIs",
    mono: "backend/",
    techs: [
      "Node.js",
      "Express.js",
      "NestJS",
      "Python",
      "FastAPI",
      "Socket.IO",
      "BullMQ",
      "JWT",
      "SSO · 2FA",
    ],
    body: "Multi-tenant APIs in Express, NestJS, and FastAPI, with RBAC, JWT, SSO (SAML / OpenID), LDAP, and TOTP. Realtime inboxes over Socket.IO, and sends, enrichment, and AI work queued on BullMQ instead of blocking a request.",
  },
  {
    label: "Data",
    mono: "data/",
    techs: ["PostgreSQL", "MySQL", "SQLite", "MongoDB", "Firestore", "Redis", "Prisma ORM", "Sequelize"],
    body: "Schemas that hold up under multi-tenancy: Prisma and Sequelize over MySQL and PostgreSQL, SQLite for local-first tools, Redis for queues and realtime fan-out, and ordered SQL migrations.",
  },
  {
    label: "AI systems",
    mono: "ai/",
    techs: [
      "OpenAI",
      "Gemini",
      "ElevenLabs",
      "HeyGen",
      "LiveKit",
      "Twilio",
      "RAG · embeddings",
      "MCP",
    ],
    body: "LLMs put to work: AI SDRs behind approval gates, realtime transcription and streamed suggestions, phone agents on Twilio and ElevenLabs, HeyGen avatar video, RAG over your own documents, OCR, and MCP servers agents can drive.",
  },
  {
    label: "Payments & integrations",
    mono: "integrations/",
    techs: [
      "Stripe",
      "JazzCash",
      "PayFast",
      "QuickBooks",
      "Zapier",
      "Google Calendar",
      "Unipile",
      "Resend",
      "Cloudinary",
    ],
    body: "The connective tissue of SaaS: Stripe subscriptions, Connect payouts, deposits, and credits; JazzCash and PayFast; Google and Microsoft calendars; WhatsApp and LinkedIn through Unipile; transactional email; and outbound webhooks.",
  },
  {
    label: "DevOps & testing",
    mono: "ops/",
    techs: ["Docker", "Vercel", "Render", "Sentry", "Jest", "Vitest", "Playwright"],
    body: "Shipping and keeping it shipped: Docker Compose stacks on a single VPS, Vercel frontends and Render APIs, Sentry monitoring, and Jest, Vitest, and Playwright suites (244 tests on one scanner alone).",
  },
  {
    label: "Mobile",
    mono: "mobile/",
    techs: ["React Native", "Expo", "Flutter"],
    body: "Cross-platform apps with React Native, Expo, and Flutter that share the web product's API and branding, so iOS, Android, and the web get the same features at the same time.",
  },
  {
    label: "Desktop",
    mono: "desktop/",
    techs: ["Electron", "Node.js", "TypeScript"],
    body: "Windows apps on Electron: system-audio loopback capture, invisible-to-screen-share overlays, hidden-browser scraping, parallel worker_threads, and NSIS installers. Everything runs locally and nothing is uploaded.",
  },
];

/** The headline stack — one body per entry in the hero's orbital system, so
 *  this list is deliberately short: nine, each on its own visible orbit, one
 *  per surface I actually build on. Curated, not exhaustive — the full list
 *  lives in the Skills section. */
/* The hero's orbit bands. Radius means one thing and always the same thing:
   how far a technology sits from the code being written — the language and
   runtime at the centre, the frameworks built on them next, and the services
   those talk to furthest out. A new technology goes in the band its role
   belongs to; the rule is only worth having if it survives the next one. */
export type StackBand = {
  band: "core" | "frameworks" | "services";
  members: string[];
};

export const stackOrbits: StackBand[] = [
  { band: "core", members: ["TypeScript", "Node.js"] },
  {
    band: "frameworks",
    members: ["React", "Next.js", "NestJS", "Flutter", "Electron", "Tailwind CSS"],
  },
  {
    band: "services",
    members: ["PostgreSQL", "MongoDB", "Redis", "Prisma ORM", "Stripe", "Twilio", "OpenAI"],
  },
];

export const stackList = [
  "TypeScript", "React", "Next.js", "NestJS", "Node.js", "React Native",
  "Flutter", "Electron", "MySQL", "PostgreSQL", "MongoDB", "Redis",
  "Prisma ORM", "Tailwind CSS", "OpenAI · Gemini", "ElevenLabs", "Stripe",
  "JazzCash", "PayFast", "Python", "FastAPI",
  "Socket.IO", "BullMQ", "Docker", "Expo",
];

export type SkillGroup = {
  dir: string;
  skills: string[];
};

/* The terminal's `skills` command prints the same cards the Capabilities
   section shows, so the two can never list different things. */
export const skillGroups: SkillGroup[] = capabilities.map((c) => ({ dir: c.mono, skills: c.techs }));

export type Experience = {
  company: string;
  role: string;
  period: string;
  location: string;
  bullets: string[];
};

export const experience: Experience[] = [
  {
    company: "Spark AI",
    role: "Full Stack Developer",
    period: "2026 — present",
    location: "Remote · Dubai",
    bullets: [
      "Built 5 production AI SaaS platforms from scratch — a booking platform, an AI video funnel builder, Avatar Studio AI, AI voice agents, and an outbound sales copilot — all live and serving real users.",
      "Architected multi-tenant systems with RBAC, JWT + CSRF auth, Stripe subscriptions, credit-based billing, and webhook integrations across every platform.",
      "Integrated OpenAI, HeyGen, Twilio, LiveKit, Google Calendar, and WhatsApp into production workflows; built async media pipelines with Cloudinary and BullMQ.",
    ],
  },
  {
    company: "GherTak",
    role: "Full Stack Developer",
    period: "2026 — present",
    location: "Remote · Islamabad",
    bullets: [
      "Built customer-facing web and mobile e-commerce features — product discovery, cart, checkout, order tracking — with Next.js, TypeScript, and React.",
      "Contributed to multi-role platform workflows for customers, vendors, and administrators across auth, orders, inventory, and payments.",
    ],
  },
  {
    company: "NoveltySoft",
    role: "Full Stack Developer",
    period: "2023 — 2025",
    location: "Lahore, Pakistan",
    bullets: [
      "Cut document processing time ~90% with a marketing-collateral system featuring real-time status tracking and client assignment workflows.",
      "Automated ~85% of financial and onboarding processes via QuickBooks and Zapier; AI communication tools (ChatGPT + LiveKit + Twilio) automated ~80% of support interactions.",
      "Improved system performance ~40% through legacy refactoring; built SSO portal switching and a dynamic RBAC module.",
    ],
  },
];

export const contact = {
  email: "asadshah1024@gmail.com",
  phone: "+92 304 0630451",
  phoneHref: "tel:+923040630451",
  linkedin: "https://www.linkedin.com/in/asadshah2",
  github: "https://github.com/Asad1024",
  location: "Lahore, Pakistan · remote-first",
};
