import type { StaticImageData } from "next/image";

import sparkcueImg from "@/assets/sparkcue.png";
import circlevoiceImg from "@/assets/circlevoice.png";
import leadsreachImg from "@/assets/leadsreach.png";
import siteharvestImg from "@/assets/siteharvest.png";
import leadgenImg from "@/assets/leadgen.png";
import slotwiseImg from "@/assets/slotwise.png";
import funnelflowImg from "@/assets/funnelflow.png";
import sparkCrmImg from "@/assets/sparkai-crm.png";
import matchifyImg from "@/assets/matchify.png";
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

export const projects: Project[] = [
  {
    slug: "sparkcue",
    index: "01",
    featured: true,
    tags: ["desktop", "ai"],
    image: sparkcueImg,
    title: "SparkCue",
    tagline: "Real-time AI call copilot for sales teams",
    year: "2026",
    role: "Design · Architecture · Full build",
    platform: "Desktop — Electron",
    stack: ["Electron", "React", "TypeScript", "Node.js", "WebSockets", "LLM APIs"],
    overview:
      "A desktop copilot that listens to live sales calls, transcribes them in real time, and surfaces objection-handling cues, battlecards, and next-best questions — while the rep is still on the call.",
    problem:
      "Sales reps lose deals in the seconds after a hard objection. Coaching happens days later in call reviews, when the deal is already gone. The product needed to close that gap to zero — sub-second guidance, on any call platform, without joining the meeting as a bot.",
    built: [
      "System-level audio capture that works across Zoom, Meet, and phone bridges — no meeting bots, no integrations required",
      "Streaming transcription pipeline with speaker diarization, feeding a low-latency LLM prompt loop",
      "A cue engine that classifies live objections and retrieves the matching playbook card in under a second",
      "Always-on-top overlay UI designed to be glanceable at 200ms — one cue at a time, never a wall of text",
      "Auto-update pipeline with code signing and staged rollouts for Windows and macOS",
    ],
    arch: {
      cols: [
        { title: "capture", items: ["system audio tap", "speaker diarization"] },
        { title: "stream", items: ["STT websocket", "moment classifier"] },
        { title: "reason", items: ["fast-model gate", "playbook retrieval"] },
        { title: "overlay", items: ["cue card UI", "always-on-top"] },
      ],
      caption: "audio → cue in <1s: a small model filters every moment; the big model only speaks when confident",
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
        title: "Native capture over meeting bots",
        body: "Bots that join calls are visible to prospects and break on every platform update. Capturing at the OS audio layer made the product invisible and platform-agnostic — at the cost of harder engineering, which became the moat.",
      },
      {
        title: "Two-stage LLM loop",
        body: "A small fast model classifies the live moment; a larger model composes guidance only when the classification is confident. Cut token cost ~70% and kept p95 latency under a second.",
      },
    ],
    outcome: [
      { value: "<1s", label: "objection → cue latency" },
      { value: "2", label: "platforms shipped, one codebase" },
      { value: "0", label: "meeting bots required" },
    ],
  },
  {
    slug: "circlevoice",
    index: "02",
    featured: true,
    tags: ["web", "ai", "cloud"],
    company: "Spark AI",
    link: "https://circlevoiceai.vercel.app/",
    image: circlevoiceImg,
    title: "CircleVoice AI",
    tagline: "AI voice agents that answer the phone",
    year: "2026",
    role: "Architecture · Full build",
    platform: "Web — Cloud + Telephony",
    stack: ["React", "NestJS", "PostgreSQL", "Twilio", "OpenAI · Gemini", "ElevenLabs", "Stripe"],
    overview:
      "A platform where businesses spin up AI voice agents that answer real phone calls — qualifying callers, answering questions from the business's own knowledge, and booking appointments, 24/7.",
    problem:
      "Small businesses miss a huge share of inbound calls, and every missed call is revenue walking away. A voice agent only works if it feels like talking to a person: sub-second responses, natural interruption handling, and zero hallucinated answers about the business.",
    built: [
      "Full-duplex telephony pipeline: streaming speech-to-text, LLM reasoning, and streaming text-to-speech stitched under a strict latency budget",
      "Barge-in support — the agent stops talking the instant the caller speaks, like a human would",
      "Grounded answering: responses constrained to the business's ingested knowledge, with graceful hand-off to a human when confidence drops",
      "Real actions mid-call: lead qualification, appointment booking, and CRM logging through tool calls",
      "Owner dashboard with call recordings, transcripts, and outcome tagging",
      "Campaign builder with knowledge-base setup, voice selection and cloning, test calls, and live launch/pause/resume controls",
      "Fully localized product — launched Azerbaijani-first on a multi-language architecture",
    ],
    arch: {
      cols: [
        { title: "telephony", items: ["call stream", "VAD + barge-in"] },
        { title: "understand", items: ["streaming STT", "intent tracking"] },
        { title: "reason", items: ["grounded LLM", "tool calls"] },
        { title: "respond", items: ["streaming TTS", "phrase cache"] },
        { title: "act", items: ["book · capture", "CRM log"] },
      ],
      caption: "every stage streams — the agent starts speaking before the full sentence is even composed",
    },
    snippet: {
      file: "src/services/elevenlabsService.js",
      lang: "js",
      note:
        "Prompt construction is the actual craft in a voice agent. The campaign's own opening is templated in when it exists, the knowledge base is folded into the system persona, and the style rules exist to stop the agent sounding like a bot on a real phone line.",
      code: `  generateConversationalPrompt(campaignData) {
    const leadName = campaignData.leadName || 'there';
    const agentName = campaignData.agentName || 'Sarah';

    // Use the campaign's script opening if available, otherwise use default
    let opening;
    if (campaignData.scriptOpening) {
      opening = campaignData.scriptOpening
        .replace(/{name}/g, leadName)
        .replace(/\\{\\{agent_name\\}\\}/g, agentName)
        .replace(/\\{agent_name\\}/g, agentName);
    } else {
      opening = \`Hi \${leadName}, this is \${agentName} calling. I hope I'm not catching you at a bad time? I wanted to reach out about something that might be really helpful for you. Do you have a quick moment to chat?\`;
    }

    // Enhanced system prompt with campaign context
    const knowledgeBase = campaignData.knowledgeBase || [];
    const knowledgeContext = knowledgeBase.length > 0 ? 
      \`\\n\\nKnowledge Base Information:\\n\${knowledgeBase.map(kb => \`- \${kb.name || kb.description || 'Product information'}\`).join('\\n')}\` : '';

    const system = \`You are \${agentName}, a warm, friendly, and highly conversational sales representative. You're having a genuine, human conversation over the phone.

CONVERSATION STYLE:
- Be extremely natural and human-like - use "um", "you know", "actually", "really"
- Show genuine interest in what they're saying
- React emotionally to their responses (excited, concerned, understanding)
- Use their name naturally throughout the conversation
- Ask follow-up questions that show you're listening
- Share brief personal touches when appropriate
- Use conversational fillers and natural speech patterns

RESPONSE GUIDELINES:
- Keep responses natural and conversational (10-20 seconds)
- Ask open-ended questions to keep them talking
- Show empathy and understanding
- Use phrases like "I totally understand", "That makes sense", "I hear you"
- If they seem busy, offer to call back at a better time
- If interested, guide them naturally toward next steps
- If not interested, gracefully end the call

KNOWLEDGE & CONTEXT:
Campaign Context: \${campaignData.firstPrompt || 'General business outreach'}
System Persona: \${campaignData.systemPersona || 'Professional sales representative'}\${knowledgeContext}

CRITICAL: This is a REAL conversation. Listen actively, respond naturally, and be genuinely helpful. Use the knowledge base to provide accurate, helpful information when relevant.\`;

    return { opening, system };
  }`,
    },
    decisions: [
      {
        title: "Latency budget as a contract",
        body: "Each pipeline stage got a hard millisecond budget, enforced in monitoring. When a stage blows its budget, the agent uses conversational filler naturally instead of dead air — the way humans buy time.",
      },
      {
        title: "Refuse over hallucinate",
        body: "The agent answers only from ingested business knowledge. Anything outside it triggers a polite hand-off. A voice agent that invents a price or opening hours costs more trust than it saves labor.",
      },
    ],
    outcome: [
      { value: "24/7", label: "call coverage, no staff" },
      { value: "<800ms", label: "response latency target" },
      { value: "100%", label: "calls transcribed & logged" },
    ],
  },
  {
    slug: "leadsreach",
    index: "03",
    featured: true,
    tags: ["web", "ai", "cloud"],
    company: "Spark AI",
    link: "https://leadsreachai.com/",
    image: leadsreachImg,
    title: "LeadsReach",
    tagline: "Omni-channel AI outreach — goal in, campaigns out",
    year: "2025 — 2026",
    role: "Product · Architecture · Full build",
    platform: "Web — Cloud",
    stack: ["Next.js", "Node.js/Express", "MySQL", "OpenAI · Gemini", "ElevenLabs", "Unipile", "Airtable", "Stripe"],
    overview:
      "An AI outreach platform that turns a sales goal into launched campaigns: it generates and enriches leads, scores them, drafts personalized messaging, and runs outreach across email, LinkedIn, WhatsApp, and AI voice calls — from one campaign builder.",
    problem:
      "Outbound teams juggle five disconnected tools — one for leads, one for enrichment, one for email, one for LinkedIn, one for calls — and glue them together with spreadsheets. The product needed to collapse the whole workflow: describe the goal, and the platform prepares everything.",
    built: [
      "Goal-to-strategy planner — describe your ideal customer and objective, and the AI composes the campaign structure",
      "Lead generation with enrichment and fit/intent scoring built in before any message is drafted",
      "Omni-channel campaign engine: email, LinkedIn, WhatsApp, and configurable AI voice calls from one builder",
      "AI-personalized messaging per lead, with a review-and-approve flow before launch",
      "Full CRM layer — deals, contacts, companies, tasks, activity timelines, and pipeline reports — with team workspaces and lead ownership",
      "Real-time analytics across channels — opens, replies, call outcomes — feeding continuous optimization",
      "Integrations with HubSpot, Airtable, Google Sheets, and WhatsApp/LinkedIn via Unipile",
    ],
    arch: {
      cols: [
        { title: "goal", items: ["strategy planner", "ICP definition"] },
        { title: "leads", items: ["generate + enrich", "fit scoring"] },
        { title: "compose", items: ["AI personalization", "review gate"] },
        { title: "launch", items: ["email · linkedin", "whatsapp · voice"] },
        { title: "optimize", items: ["channel analytics", "AI tuning"] },
      ],
      caption: "one campaign brain, four channels — every channel is an output of the same sequencing engine, not a separate tool",
    },
    snippet: {
      file: "src/jobs/aiSdr.worker.ts",
      lang: "ts",
      note:
        "The fail-closed gate. Before any autonomous send, the draft is re-inspected; findings are reused if already stored, recomputed if not. A blocking finding returns a reason string instead of sending — the agent never ships copy it cannot justify.",
      code: `async function contentBlockSkipReason(actionId: number): Promise<string | null> {
  const action = await AiSdrPendingAction.findByPk(actionId);
  if (!action) return null;

  const stored = Array.isArray(action.content_findings)
    ? (action.content_findings as ContentFinding[])
    : null;
  const findings =
    stored ??
    inspectDraftContent(
      action.edited_body ?? action.proposed_body,
      action.edited_subject ?? action.proposed_subject
    );

  if (!hasBlockingFinding(findings)) return null;
  return \`content_blocked:\${summarizeFindings(findings)}\`.slice(0, 64);
}`,
    },
    decisions: [
      {
        title: "One sequencing engine, many channels",
        body: "Email, LinkedIn, WhatsApp, and voice aren't four features — they're four outputs of one campaign state machine. Adding a channel means adding an adapter, not rebuilding cadence logic.",
      },
      {
        title: "AI prepares, human approves the launch",
        body: "The AI does the heavy lifting — leads, segments, drafts — but campaigns launch through an explicit review step. Trust in an outbound tool is earned by showing your work before it sends.",
      },
    ],
    outcome: [
      { value: "4", label: "channels in one campaign builder" },
      { value: "7", label: "CRM & data integrations" },
      { value: "minutes", label: "from goal to launched campaign" },
    ],
  },
  {
    slug: "siteharvest",
    index: "04",
    featured: true,
    tags: ["desktop"],
    image: siteharvestImg,
    title: "SiteHarvest",
    tagline: "Competitive intelligence, on autopilot",
    year: "2026",
    role: "Architecture · Full build",
    platform: "Desktop — Electron",
    stack: ["Electron", "TypeScript", "Headless Chromium", "SQLite", "Node.js"],
    overview:
      "A desktop app that monitors competitor websites — pricing pages, changelogs, job boards — extracts structured data, and diffs it over time, so teams see competitor moves the day they happen.",
    problem:
      "Competitive research was a quarterly copy-paste ritual. Data lived in stale spreadsheets, and by the time anyone looked, pricing had changed twice. It needed to be continuous, structured, and resilient against anti-bot walls.",
    built: [
      "Headless browsing engine with human-like session behavior that passes Cloudflare and similar challenges reliably",
      "Declarative extraction recipes — point at a page, define the fields, get typed rows back on every run",
      "A diffing layer that turns raw scrapes into change events: price moved, plan added, role opened",
      "Local-first SQLite storage with one-click export to CSV and JSON — no data ever leaves the machine",
      "Scheduling engine with per-site politeness controls, backoff, and failure quarantine",
    ],
    arch: {
      cols: [
        { title: "schedule", items: ["politeness rules", "backoff + quarantine"] },
        { title: "browse", items: ["headless chromium", "human-like sessions"] },
        { title: "extract", items: ["recipe engine", "typed rows"] },
        { title: "intelligence", items: ["diff engine", "change events"] },
      ],
      caption: "local-first by design — every user is their own residential IP, and nothing is ever uploaded",
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
  });`,
    },
    decisions: [
      {
        title: "Local-first, not SaaS",
        body: "Scraping from a customer's own machine sidesteps the IP-reputation arms race entirely — every user is their own residential IP. It also made the privacy story trivial: nothing is uploaded, ever.",
      },
      {
        title: "Diffs as the product",
        body: "Raw scraped data is noise. Modeling everything as change events turned a scraper into an intelligence feed — the UI shows 'what changed this week', not ten thousand rows.",
      },
    ],
    outcome: [
      { value: "40+", label: "sites verified end-to-end" },
      { value: "100%", label: "local — zero data uploaded" },
      { value: "daily", label: "diffs instead of quarterly audits" },
    ],
  },
  {
    slug: "leadgen",
    index: "05",
    featured: false,
    tags: ["web", "cloud"],
    image: leadgenImg,
    title: "LeadGen",
    tagline: "B2B lead discovery, enriched and scored",
    year: "2025",
    role: "Architecture · Full build",
    platform: "Web — Cloud",
    stack: ["Next.js", "Node.js", "PostgreSQL", "Worker queues", "Enrichment APIs"],
    overview:
      "A B2B lead-generation platform that discovers companies across multiple sources, enriches them with contacts and firmographics, scores them against an ideal customer profile, and delivers clean, deduplicated lists.",
    problem:
      "Bought lead lists are stale, duplicated, and untargeted — teams pay per row and throw half away. The product needed to build lists the way a good researcher would: multiple sources cross-checked, contacts verified, and every row scored against who the customer actually sells to.",
    built: [
      "Multi-source discovery pipeline pulling from directories, registries, and web signals in parallel",
      "Enrichment layer resolving companies to verified contacts, emails, and firmographic data",
      "ICP scoring engine — configurable weights over industry, size, tech stack, and growth signals",
      "Cross-source entity resolution and dedup so the same company never appears twice",
      "Export pipeline: clean CSV and direct CRM handoff, with per-batch quality reports",
    ],
    arch: {
      cols: [
        { title: "discover", items: ["parallel sources", "web signals"] },
        { title: "enrich", items: ["contact resolution", "email verification"] },
        { title: "score", items: ["ICP weights", "growth signals"] },
        { title: "deliver", items: ["dedup + merge", "CSV / CRM sync"] },
      ],
      caption: "quality over volume: every row is cross-checked between sources before it earns a place in the export",
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
        title: "Score before enrich, enrich before deliver",
        body: "Enrichment APIs cost money per lookup. Scoring on cheap signals first and only enriching leads above the ICP threshold cut per-list cost dramatically without losing quality.",
      },
      {
        title: "Dedup as a first-class stage",
        body: "The same company appears differently in every source. A dedicated entity-resolution pass — name normalization, domain matching, fuzzy merge — is what separates a clean list from a bought one.",
      },
    ],
    outcome: [
      { value: "6", label: "sources merged per search" },
      { value: "0", label: "duplicate rows delivered" },
      { value: "2x", label: "cheaper than bought lists" },
    ],
  },
  {
    slug: "mailforge",
    index: "06",
    featured: false,
    tags: ["web", "cloud"],
    image: mailforgeImg,
    title: "Mailforge",
    tagline: "Cold-email infrastructure that lands in inboxes",
    year: "2025",
    role: "Architecture · Full build",
    platform: "Web — Cloud",
    stack: ["Next.js", "Node.js", "DNS automation", "SMTP", "PostgreSQL", "Cloud jobs"],
    overview:
      "Sending infrastructure for outbound teams: automated domain setup, mailbox warm-up, send rotation, and deliverability monitoring — the plumbing that decides whether cold email lands in the inbox or the void.",
    problem:
      "Deliverability is the silent killer of outbound: teams write great emails that never get seen because their domain reputation is burned. Setup is arcane (SPF, DKIM, DMARC), warm-up is tedious, and by the time open rates crater, the damage is done.",
    built: [
      "One-click domain provisioning: DNS records, SPF/DKIM/DMARC configured and verified automatically",
      "Warm-up network — mailboxes exchange realistic conversations on a ramp schedule to build sender reputation",
      "Send engine with mailbox rotation, per-domain throttling, and timezone-aware windows",
      "Reputation monitoring: bounce classification, spam-trap signals, and blacklist checks with automatic slow-down",
      "Health dashboard that turns deliverability voodoo into a single per-domain score",
    ],
    arch: {
      cols: [
        { title: "provision", items: ["DNS automation", "SPF · DKIM · DMARC"] },
        { title: "warm up", items: ["pod conversations", "ramp scheduler"] },
        { title: "send", items: ["rotation + throttle", "send windows"] },
        { title: "protect", items: ["bounce classifier", "auto slow-down"] },
      ],
      caption: "reputation is the asset: the system automatically slows any domain showing early damage signals",
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
        title: "Protect reputation over hitting quota",
        body: "When bounce or spam signals rise, the engine cuts volume automatically — even mid-campaign. Missing a day's quota is recoverable; a burned domain takes months. The system makes that trade without asking.",
      },
      {
        title: "Boring SMTP, clever scheduling",
        body: "No exotic sending tricks — deliverability comes from behaving like a human sender at scale: realistic volumes, natural ramps, believable send windows. The intelligence is all in the scheduler.",
      },
    ],
    outcome: [
      { value: "3-min", label: "domain setup, fully verified" },
      { value: "14-day", label: "automated warm-up ramp" },
      { value: "1", label: "score that explains deliverability" },
    ],
  },
  {
    slug: "codevault",
    index: "07",
    featured: false,
    tags: ["web", "cloud"],
    title: "CodeVault",
    tagline: "Dependency risk, scanned at the source",
    year: "2026",
    role: "Architecture · Full build",
    platform: "Web — Cloud",
    stack: ["Next.js", "Node.js", "OSV", "Worker queues", "PostgreSQL"],
    overview:
      "A security scanner that inspects a codebase's dependency graph, cross-references it against vulnerability feeds, and reports exploitable risk — built to grow into an enterprise-grade audit tool.",
    problem:
      "Dependency alerts are noisy: hundreds of CVEs, most unreachable from the actual code. Teams tune them out. The scanner needed to rank what is actually exploitable in this codebase, not what is theoretically vulnerable somewhere.",
    built: [
      "Full dependency-graph resolution across lockfile ecosystems, including transitive dependencies",
      "Vulnerability matching against the OSV feed with severity normalization across advisory sources",
      "Reachability heuristics that separate 'installed' from 'actually imported and called'",
      "Concurrent scan workers with queue-based scheduling for large monorepos",
      "Report views built for two audiences: a triage list for engineers, a risk summary for leadership",
    ],
    arch: {
      cols: [
        { title: "resolve", items: ["lockfile graphs", "transitive deps"] },
        { title: "match", items: ["OSV advisories", "severity normalize"] },
        { title: "reach", items: ["import graph", "call heuristics"] },
        { title: "report", items: ["engineer triage", "exec summary"] },
      ],
      caption: "exploitability over CVSS: a medium CVE in your auth path outranks a critical one you never import",
    },
    snippet: {
      file: "src/scanner/riskScorer.js",
      lang: "js",
      note:
        "Raw CVSS treats every finding as equal; this doesn't. Categories carry multipliers (injection outranks misconfiguration), and a set of low-impact types is held back so a weak .env value can't drown out a real injection path.",
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
  'ENV_NOT_GITIGNORED',`,
    },
    decisions: [
      {
        title: "Rank by exploitability, not CVSS",
        body: "A critical CVE in a package you never import matters less than a medium one in your auth path. Ranking by reachability made the report actionable instead of alarming.",
      },
      {
        title: "Feeds as data, not truth",
        body: "Advisory sources disagree constantly. Normalizing them into one internal severity model — and keeping the raw source attached — meant the tool could explain every score it gave.",
      },
    ],
    outcome: [
      { value: "10k+", label: "dependencies resolved per scan" },
      { value: "2", label: "audiences, one report" },
      { value: "OSV", label: "live advisory feed integration" },
    ],
  },
  {
    slug: "slotwise",
    index: "08",
    featured: false,
    tags: ["web"],
    company: "Spark AI",
    link: "https://slotwiseai.vercel.app/",
    image: slotwiseImg,
    title: "Slotwise",
    tagline: "The operating system for scheduling-led businesses",
    year: "2024 — 2025",
    role: "Product · Full build",
    platform: "Web — SaaS",
    stack: ["Next.js", "NestJS", "MySQL", "Redis + BullMQ", "Stripe", "Google Calendar", "SSE"],
    overview:
      "A premium scheduling platform that replaces fragmented booking tools with one operating system — conversion-first booking for customers, focused surfaces for staff and managers, and a live operating board for leadership.",
    problem:
      "Scheduling-led businesses — clinics, legal teams, advisory firms — run bookings in one tool and operations in spreadsheets. Staff can't see load, leadership can't see risk, and no-shows quietly eat revenue. Booking capture without operational visibility is only half a product.",
    built: [
      "Conversion-first booking flow with service intelligence and staff routing, embeddable on any website",
      "Live operating board: today's bookings, pending load, and no-show risk in one real-time view",
      "Role-based surfaces — admins, managers, and staff each get a focused workspace with scoped permissions",
      "Reminder automation over email and WhatsApp with clear delivery visibility",
      "Multi-location operations: one governance model, location-specific scheduling",
      "Waitlists, intake forms, and real-time dashboard refresh over Server-Sent Events",
      "Stripe payments, Google Calendar sync, HMAC-signed webhooks, API key management, and team invites",
    ],
    arch: {
      cols: [
        { title: "capture", items: ["web + embedded booking", "service routing"] },
        { title: "orchestrate", items: ["staff logic", "capacity balancing"] },
        { title: "operate", items: ["live operating board", "roles + audit"] },
        { title: "retain", items: ["reminder cadence", "no-show risk"] },
      ],
      caption: "booking is the front door — the product is the operating layer behind it, shared by staff and leadership",
    },
    snippet: {
      file: "packages/scheduling-core/src/slots.ts",
      lang: "ts",
      note:
        "Availability is interval arithmetic, not a calendar loop. A block splits a window into the parts that survive it, and applying every block is a flatMap over that — which is why overlapping staff, buffers and multi-location rules compose without special cases.",
      code: `function subtractInterval(
  base: TimeInterval,
  block: TimeInterval,
): TimeInterval[] {
  if (!overlaps(base, block)) return [base];
  const result: TimeInterval[] = [];
  if (block.startUtc > base.startUtc) {
    result.push({ startUtc: base.startUtc, endUtc: block.startUtc });
  }
  if (block.endUtc < base.endUtc) {
    result.push({ startUtc: block.endUtc, endUtc: base.endUtc });
  }
  return result;
}

function applyBlocks(intervals: TimeInterval[], blocks: TimeInterval[]): TimeInterval[] {
  let current = intervals;
  for (const block of blocks) {
    current = current.flatMap((i) => subtractInterval(i, block));
  }
  return current;
}`,
    },
    decisions: [
      {
        title: "An operating board, not an admin panel",
        body: "Most booking tools bolt a settings page onto a calendar. Building a live board around pending load and no-show risk made the tool something leadership opens every morning, not just staff.",
      },
      {
        title: "Roles as the product",
        body: "Admins, managers, staff, and customers each get a purpose-built surface instead of one crowded dashboard with permissions. Focused views are what made teams actually faster.",
      },
    ],
    outcome: [
      { value: "+27%", label: "show-up rate uplift" },
      { value: "-61%", label: "manual ops reduced" },
      { value: "2m 14s", label: "avg. booking completion" },
    ],
  },
  {
    slug: "funnelflow",
    index: "09",
    featured: false,
    tags: ["web", "ai", "cloud"],
    company: "Spark AI",
    link: "https://funnel-flow-frontend-v1.vercel.app/",
    image: funnelflowImg,
    title: "FunnelFlow AI",
    tagline: "AI video funnels with talking avatars",
    year: "2024 — 2025",
    role: "Architecture · Full build",
    platform: "Web — Cloud",
    stack: ["React", "Vite", "Node.js/Express", "MySQL", "HeyGen", "OpenAI · Gemini", "Cloudinary", "Stripe"],
    overview:
      "A funnel builder where every step can carry an AI-generated talking-avatar video — script in, professional video out — combined with a drag-and-drop journey editor, A/B testing, and per-funnel analytics. No video production skills required.",
    problem:
      "Video converts dramatically better than text, but producing it is slow and expensive — and funnel tools don't do video while video tools don't do funnels. Marketers needed both in one loop: build the journey, generate the videos, measure the conversions.",
    built: [
      "Drag-and-drop funnel builder combining videos, forms, quizzes, and interactive steps",
      "AI video generation: talking avatars rendered from scripts in minutes, with a deep avatar library plus custom uploads",
      "AI voice layer — standard and premium voices with cloning on higher tiers",
      "AI funnel assistant: describe the goal and audience, get suggested steps, flow, and messaging",
      "Brand alignment with live preview editing before publish — logos, look, and tone applied automatically",
      "Advanced analytics with A/B testing and per-funnel submission reports — leads, answers, and quiz data",
    ],
    arch: {
      cols: [
        { title: "design", items: ["drag & drop builder", "AI assistant"] },
        { title: "generate", items: ["avatar video render", "TTS + cloning"] },
        { title: "brand", items: ["auto theming", "live preview"] },
        { title: "publish", items: ["hosted funnels", "forms + quizzes"] },
        { title: "optimize", items: ["A/B testing", "per-funnel reports"] },
      ],
      caption: "video generation runs as queued jobs — the funnel stays editable while renders complete in the background",
    },
    snippet: {
      file: "src/services/avatarQualityService.js",
      lang: "js",
      note:
        "The model returns a quality score, but never gets to decide the verdict alone. The score is clamped to a sane range and mapped to a status by fixed thresholds — so a hallucinated 900 can't wave a bad photo through to render.",
      code: `const clampScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 60;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const normalizeStatus = (status, score) => {
  if (['accepted', 'needs_enhancement', 'rejected'].includes(status)) return status;
  if (score >= 80) return 'accepted';
  if (score >= 55) return 'needs_enhancement';
  return 'rejected';
};`,
    },
    decisions: [
      {
        title: "Async render pipeline",
        body: "Video generation takes minutes, not milliseconds. Treating renders as queued background jobs — with the builder fully usable meanwhile — kept the creative loop fast even when the GPU work wasn't.",
      },
      {
        title: "The assistant suggests, the creator decides",
        body: "The AI proposes funnel structure and messaging but never auto-publishes. It removes the blank-canvas problem while leaving creative control — and accountability — with the marketer.",
      },
    ],
    outcome: [
      { value: "minutes", label: "script → published avatar video" },
      { value: "A/B", label: "testing built into every funnel" },
      { value: "0", label: "video production skills needed" },
    ],
  },
  {
    slug: "sparkai-crm",
    index: "10",
    featured: false,
    tags: ["web", "ai"],
    company: "Spark AI",
    link: "https://spark-ai-crm.vercel.app/",
    image: sparkCrmImg,
    title: "SparkCRM",
    tagline: "A CRM that fills itself in",
    year: "2026",
    role: "Product · Architecture · Full build",
    platform: "Web — Cloud",
    stack: ["Next.js", "Node.js", "PostgreSQL", "LLM APIs", "Email/Calendar sync"],
    overview:
      "An AI-native CRM where activity logs itself: emails and meetings sync in, deals summarize themselves, and every record carries an AI-suggested next action — so the pipeline reflects reality instead of what reps remembered to type.",
    problem:
      "CRMs fail for one reason: nobody fills them in. The data model is fine; the data entry is the product flaw. The fix isn't more required fields — it's a CRM that observes the work and writes itself.",
    built: [
      "Complete CRM core: contacts and companies with custom fields, tags, merge tools, and CSV import",
      "Email and calendar sync that auto-attaches every touchpoint to the right contact and deal",
      "LLM summarization turning threads and meeting notes into a running deal narrative",
      "Next-action suggestions per deal — grounded in the actual conversation history, never generic",
      "Pipeline view with health scoring: deals flag themselves when momentum stalls",
      "Zero-required-fields design: a new deal needs one click, everything else fills in from activity",
    ],
    arch: {
      cols: [
        { title: "sync", items: ["email + calendar", "auto-attach"] },
        { title: "understand", items: ["thread summaries", "entity linking"] },
        { title: "suggest", items: ["next actions", "stall detection"] },
        { title: "pipeline", items: ["health scores", "forecast view"] },
      ],
      caption: "the CRM observes the work — reps read it instead of feeding it",
    },
    snippet: {
      file: "src/lib/enrichment.ts",
      lang: "ts",
      note:
        "Every enrichment provider names its fields differently. Rather than branching per provider, the first non-empty candidate key wins — so adding a new source means extending an array, not rewriting the mapper.",
      code: `export function pickEnrichmentString(
  data: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

export function normalizeContactEnrichment(raw: Record<string, unknown>): Record<string, unknown> {
  const suggestedTitle = pickEnrichmentString(raw, ['suggestedTitle', 'title', 'jobTitle', 'job_title']);
  const linkedinUrl = pickEnrichmentString(raw, [
    'linkedinUrl',
    'linkedin',
    'linkedInUrl',
    'linkedin_url',
    'linkedIn',
  ]);
  const summary = pickEnrichmentString(raw, [
    'summary',
    'leadInsights',
    'insights',
    'overview',
    'description',
    'lead_insights',
  ]);
  const industry = pickEnrichmentString(raw, ['industry', 'suggestedIndustry', 'companyIndustry']);

  return {
    ...raw,
    ...(suggestedTitle ? { suggestedTitle } : {}),
    ...(linkedinUrl ? { linkedinUrl } : {}),
    ...(summary ? { summary } : {}),
    ...(industry ? { industry } : {}),
  };`,
    },
    decisions: [
      {
        title: "Zero required fields",
        body: "Every required field is a tax on adoption. The schema is rich, but all of it fills from synced activity — the rep's only job is selling. Adoption is the feature.",
      },
      {
        title: "Suggestions must cite their source",
        body: "Every AI next-action links to the emails or meetings that justify it. Reps trust suggestions they can verify in one click — and distrust everything after one hallucination.",
      },
    ],
    outcome: [
      { value: "0", label: "required fields per deal" },
      { value: "auto", label: "activity capture from sync" },
      { value: "cited", label: "every AI suggestion sourced" },
    ],
  },
  {
    slug: "matchify",
    index: "11",
    featured: false,
    tags: ["web", "ai"],
    company: "Spark AI",
    link: "https://matchify-frontend-v1.vercel.app/",
    image: matchifyImg,
    title: "Matchify",
    tagline: "The relationship app where serious people meet",
    year: "2025",
    role: "Product · Full build",
    platform: "Web — SaaS",
    stack: ["Next.js", "Node.js", "PostgreSQL", "LLM APIs", "Realtime chat", "Subscriptions"],
    overview:
      "A relationship platform built for intention, not swiping: an AI Matchmaker that curates matches from a guided questionnaire, Luna — an AI coach for individuals and couples — plus chat, events, and coaching in one app with tiered subscriptions.",
    problem:
      "Dating apps optimize for endless swiping because engagement is the business model — but serious users want outcomes, not feeds. The product needed to invert the incentive: fewer, better matches, real conversation support, and monetization through genuine AI value instead of paywalled likes.",
    built: [
      "AI Matchmaker: a guided questionnaire builds a compatibility blueprint, then curates roughly one match every 48 hours",
      "Luna — an AI relationship coach with a global chat and shared 'partner spaces' for couples",
      "Message-request system with daily limits and recipient acceptance, replacing open DMs",
      "Realtime chat, events with RSVP, and human coach booking in one journey",
      "Four-tier subscription model (Free / Plus / Premium / Elite) with per-feature AI usage metering",
      "Verification-friendly profiles with privacy controls and community standards",
    ],
    arch: {
      cols: [
        { title: "profile", items: ["guided questionnaire", "compatibility blueprint"] },
        { title: "match", items: ["AI curation", "48h cadence"] },
        { title: "connect", items: ["request + accept", "realtime chat"] },
        { title: "grow", items: ["luna coach", "events + coaching"] },
        { title: "monetize", items: ["4 tiers", "usage metering"] },
      ],
      caption: "scarcity by design — one curated match per cadence beats a thousand swipes, and caps AI cost per user",
    },
    snippet: {
      file: "src/aiMatchRank.ts",
      lang: "ts",
      note:
        "Compatibility before the model runs. Intent is scored as a graded relation rather than an equality check, and blueprint overlap is plain Jaccard — cheap deterministic maths narrows the pool so the LLM only ever ranks a shortlist.",
      code: `function intentCompatibility(a: unknown, b: unknown): number {
  const x = normalizeIntent(a);
  const y = normalizeIntent(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (
    (x === 'marriage' && y === 'serious') ||
    (x === 'serious' && (y === 'marriage' || y === 'casual')) ||
    (x === 'casual' && y === 'serious')
  ) {
    return 0.55;
  }
  return 0.1;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union > 0 ? inter / union : 0;
}`,
    },
    decisions: [
      {
        title: "Curated cadence over infinite swipe",
        body: "Delivering ~one AI-curated match every 48 hours makes each match an event, filters for serious users, and keeps LLM cost per user predictable. The constraint is the product.",
      },
      {
        title: "Meter the AI, not the love",
        body: "Core discovery and chat stay available on every tier; what scales with price is Luna's message limits and matchmaker access. Users pay for AI depth — never to simply talk to a match.",
      },
    ],
    outcome: [
      { value: "48h", label: "curated match cadence" },
      { value: "2", label: "AI products in one app — matchmaker + coach" },
      { value: "4", label: "subscription tiers, usage-metered" },
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
];

export const capabilities = [
  {
    label: "Web",
    mono: "web/",
    techs: ["React", "Next.js", "TypeScript", "NestJS", "PostgreSQL"],
    body: "Production SaaS end to end — Next.js and React frontends, NestJS and Node APIs, multi-tenant architecture with RBAC, and the unglamorous details that make software feel finished.",
  },
  {
    label: "Mobile",
    mono: "mobile/",
    techs: ["React Native", "Flutter"],
    body: "Cross-platform apps with Flutter and React Native — shared logic with the web product, native feel on both stores, one team shipping every surface.",
  },
  {
    label: "Desktop",
    mono: "desktop/",
    techs: ["Electron", "TypeScript", "Node.js"],
    body: "Electron apps that feel native, not wrapped — system integrations, always-on-top overlays, auto-updates, and cross-platform builds from one codebase.",
  },
  {
    label: "Cloud",
    mono: "cloud/",
    techs: ["Redis", "Node.js", "CI/CD"],
    body: "The infrastructure under it all — Redis and BullMQ job queues, async media pipelines, webhooks, observability, and deployments that don't need babysitting.",
  },
  {
    label: "AI systems",
    mono: "ai/",
    techs: ["OpenAI", "Gemini", "ElevenLabs", "Twilio", "LiveKit"],
    body: "LLMs put to work, not demoed — OpenAI and Gemini pipelines, voice agents with ElevenLabs and Twilio, avatar video with HeyGen, and latency budgets in milliseconds.",
  },
  {
    label: "Payments & integrations",
    mono: "payments/",
    techs: ["Stripe", "JazzCash", "PayFast", "QuickBooks"],
    body: "The connective tissue of SaaS — Stripe, JazzCash, and PayFast checkouts, subscription and credit-based billing, Google Calendar and OAuth, HMAC webhooks, and CRM and enrichment APIs.",
  },
];

/** The headline stack — one body per entry in the hero's orbital system, so
 *  this list is deliberately short: nine, each on its own visible orbit, one
 *  per surface I actually build on. Curated, not exhaustive — the full list
 *  lives in the Skills section. */
export const featuredStack = [
  "TypeScript",      // language
  "React",           // web
  "Next.js",         // framework
  "Tailwind CSS",    // styling
  "Node.js",         // runtime
  "NestJS",          // services
  "PostgreSQL",      // data
  "MongoDB",         // documents
  "Redis",           // cache + queues
  "React Native",    // mobile
  "Electron",        // desktop
  "OpenAI · Gemini", // ai
  "Twilio",          // telephony
  "Stripe",          // payments
];

export const stackList = [
  "TypeScript", "React", "Next.js", "NestJS", "Node.js", "React Native",
  "Flutter", "Electron", "MySQL", "PostgreSQL", "MongoDB", "Redis",
  "Prisma ORM", "Tailwind CSS", "OpenAI · Gemini", "ElevenLabs", "Stripe",
  "JazzCash", "PayFast", "WebSockets", "CI/CD",
];

export type SkillGroup = {
  dir: string;
  skills: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    dir: "frontend/",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Redux", "Radix UI"],
  },
  {
    dir: "backend/",
    skills: ["Node.js", "NestJS", "Express.js", "JWT", "WebSockets"],
  },
  {
    dir: "databases/",
    skills: ["MySQL", "PostgreSQL", "MongoDB", "Firestore", "Prisma ORM", "Redis"],
  },
  {
    dir: "ai-integrations/",
    skills: [
      "OpenAI",
      "Gemini",
      "ElevenLabs",
      "HeyGen",
      "LiveKit",
      "Twilio",
      "Google Calendar",
      "Cloudinary",
    ],
  },
  {
    dir: "mobile-desktop/",
    skills: ["React Native", "Flutter", "Electron"],
  },
  {
    dir: "payments/",
    skills: ["Stripe", "JazzCash", "PayFast", "QuickBooks", "Zapier"],
  },
];

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
      "Built 5 production AI SaaS platforms from scratch — Slotwise, FunnelFlow AI, Avatar Studio AI, CircleVoice AI, and LeadsReach — all live and serving real users.",
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
