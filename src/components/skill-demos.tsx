import type { CSSProperties, ReactNode } from "react";
import { Bot, Check, CircleAlert, Database, FileText, Lock, Monitor, PhoneIncoming, Smartphone, User } from "lucide-react";
import { TechIcon } from "./tech-icon";

/* ── a small demo of each skill at work ─────────────────────────────────────
   One short scene per tool, shown under the skill cards while that tool is in
   the light: what it actually does in a product, played once in about three
   seconds. They are all built from the same few pieces (a line that fades
   in, a pop, typing, a bar filling, a voice, a light turning green), so the
   cards stay consistent while every tool gets its own scene.

   Every piece animates *from* a hidden state into its normal one, so with
   reduced motion (animations off) each scene simply shows its last frame. */

/** delay and duration, in seconds, as the custom properties the pieces read */
const at = (d: number, t?: number) => ({ "--d": `${d}s`, ...(t ? { "--t": `${t}s` } : {}) }) as CSSProperties;

const In = ({ d = 0, className = "", children }: { d?: number; className?: string; children?: ReactNode }) => (
  <div className={`dm-in ${className}`} style={at(d)}>
    {children}
  </div>
);
const Pop = ({ d = 0, className = "", children }: { d?: number; className?: string; children: ReactNode }) => (
  <div className={`dm-pop ${className}`} style={at(d)}>
    {children}
  </div>
);
/** text that types itself out */
const Type = ({ d = 0, t = 1, className = "", children }: { d?: number; t?: number; className?: string; children: ReactNode }) => (
  <span className={`dm-type inline-block max-w-full ${className}`} style={at(d, t)}>
    {children}
  </span>
);
/** a bar that fills from the left */
const Fill = ({ d = 0, t = 1, className = "" }: { d?: number; t?: number; className?: string }) => (
  <div className={`h-1 overflow-hidden rounded-full bg-white/10 ${className}`}>
    <div className="dm-fill h-full rounded-full bg-[var(--c)]" style={at(d, t)} />
  </div>
);
/** a voice, as bars rising and falling */
const Wave = ({ n = 16, className = "" }: { n?: number; className?: string }) => (
  <div aria-hidden className={`dm-wave flex h-6 items-center gap-[3px] ${className}`}>
    {Array.from({ length: n }, (_, i) => (
      <span key={i} className="h-full w-[3px] rounded-full bg-[var(--c)]" style={{ animationDelay: `${(i * 89) % 550}ms` }} />
    ))}
  </div>
);
/** a light that turns green at its moment */
const Go = ({ d = 0 }: { d?: number }) => <span className="dm-go inline-block size-1.5 shrink-0 rounded-full bg-emerald-400" style={at(d)} />;
const Ok = ({ d = 0, children }: { d?: number; children: ReactNode }) => (
  <Pop d={d} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10.5px] text-emerald-300">
    <Check aria-hidden className="size-3" />
    {children}
  </Pop>
);
/** a code or terminal line */
const Code = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`whitespace-nowrap font-mono text-[10.5px] leading-[1.7] ${className}`}>{children}</div>
);
const Bubble = ({ me = false, children }: { me?: boolean; children: ReactNode }) => (
  <div
    className={`max-w-[88%] rounded-xl px-2.5 py-1.5 text-[11px] leading-snug ${
      me ? "self-end rounded-br-sm bg-[color-mix(in_oklab,var(--c)_20%,transparent)] text-fg" : "self-start rounded-bl-sm bg-white/[0.07] text-fg/85"
    }`}
  >
    {children}
  </div>
);
const Tag = ({ children }: { children: ReactNode }) => <span className="text-[10.5px] text-muted">{children}</span>;
const kw = "text-[#c792ea]";
const str = "text-[#c3e88d]";
const fn = "text-[#82aaff]";

const DEMOS: Record<string, () => ReactNode> = {
  /* ── AI ── */
  OpenAI: () => (
    <div className="flex h-full flex-col gap-2">
      <In className="self-end">
        <Bubble me>Write a follow-up for Sara at Acme</Bubble>
      </In>
      <In d={0.6} className="self-start">
        <Bubble>
          <Type d={0.7} t={1.6} className="dm-caret">
            Hi Sara, great speaking today. Here&apos;s the pilot plan we discussed…
          </Type>
        </Bubble>
      </In>
      <In d={2.3} className="mt-auto">
        <Tag>drafted in 0.8 s · waiting for your approval</Tag>
      </In>
    </div>
  ),
  Gemini: () => (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <In className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2 py-1.5 text-[10.5px]">
          <User aria-hidden className="size-3" /> Ayesha · designer
        </In>
        <In d={0.3} className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2 py-1.5 text-[10.5px]">
          <User aria-hidden className="size-3" /> Omar · founder
        </In>
      </div>
      <Fill d={0.7} t={1.3} />
      <Pop d={2} className="self-center text-center">
        <p className="text-[22px] font-semibold leading-none text-[var(--c)]">92%</p>
        <Tag>match · shared goals, same city</Tag>
      </Pop>
    </div>
  ),
  ElevenLabs: () => (
    <div className="flex h-full flex-col justify-center gap-3">
      <In>
        <Bubble>“Thanks for calling. How can I help you today?”</Bubble>
      </In>
      <In d={0.8} className="flex items-center gap-3">
        <Wave n={22} />
      </In>
      <In d={1.4}>
        <Tag>voice: warm, en-US · streamed in 180 ms</Tag>
      </In>
    </div>
  ),
  Twilio: () => (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <In className="flex items-center gap-2.5">
        <span className="dm-ping flex size-8 items-center justify-center rounded-full border border-[var(--c)]">
          <PhoneIncoming aria-hidden className="size-3.5 text-[var(--c)]" />
        </span>
        <div>
          <p className="text-[11.5px]">Incoming · +1 (415) ··· 0142</p>
          <Tag>ringing…</Tag>
        </div>
      </In>
      <Ok d={1.1}>Connected · 00:01</Ok>
      <In d={1.8}>
        <Tag>→ routed to the AI agent, recorded, transcribed</Tag>
      </In>
    </div>
  ),
  HeyGen: () => (
    <div className="flex h-full items-center gap-3">
      <Pop className="relative flex h-full max-h-28 w-24 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-b from-white/10 to-white/[0.02]">
        <User aria-hidden className="size-10 text-fg/70" />
        <span className="dm-talk mt-1 h-1 w-4 rounded-full bg-[var(--c)]" />
      </Pop>
      <div className="min-w-0 flex-1 space-y-2">
        <Type d={0.4} t={1.3} className="text-[11px] text-fg/85">
          “Hi! Here&apos;s your 30-second demo.”
        </Type>
        <Fill d={0.6} t={1.8} />
        <In d={2.4}>
          <Tag>avatar video rendered · 1080p</Tag>
        </In>
      </div>
    </div>
  ),
  LiveKit: () => (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <In className="dm-speak flex flex-col items-center gap-1 rounded-lg bg-white/[0.05] py-2.5">
          <User aria-hidden className="size-5" />
          <span className="text-[10px]">You</span>
        </In>
        <In d={0.3} className="dm-speak-2 flex flex-col items-center gap-1 rounded-lg bg-white/[0.05] py-2.5">
          <Bot aria-hidden className="size-5 text-[var(--c)]" />
          <span className="text-[10px]">AI agent</span>
        </In>
      </div>
      <In d={0.8}>
        <Tag>room: sales-call · live audio · 42 ms round trip</Tag>
      </In>
    </div>
  ),
  "RAG · embeddings": () => (
    <div className="flex h-full flex-col gap-2">
      <In className="self-end">
        <Bubble me>What&apos;s the refund window?</Bubble>
      </In>
      <In d={0.9} className="self-start">
        <Bubble>30 days from delivery, unused items only.</Bubble>
      </In>
      <Pop d={1.7} className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-fg/80">
        <FileText aria-hidden className="size-3 text-[var(--c)]" />
        source: returns-policy.pdf · p. 4
      </Pop>
    </div>
  ),
  MCP: () => (
    <div className="flex h-full flex-col justify-center">
      <In>
        <Code>
          <span className="text-[var(--c)]">→</span> search_leads(<span className={str}>&quot;Dubai&quot;</span>)
        </Code>
      </In>
      <In d={0.6}>
        <Code className="text-muted">← 24 results</Code>
      </In>
      <In d={1.2}>
        <Code>
          <span className="text-[var(--c)]">→</span> create_campaign(<span className={str}>&quot;Q3 outreach&quot;</span>)
        </Code>
      </In>
      <In d={1.8}>
        <Code className="text-muted">← campaign #318</Code>
      </In>
      <div className="mt-1.5">
        <Ok d={2.3}>the agent did it through the product</Ok>
      </div>
    </div>
  ),

  /* ── SaaS ── */
  "Next.js": () => (
    <div className="flex h-full flex-col gap-2">
      <In className="flex items-center gap-2 rounded-md bg-white/[0.05] px-2 py-1">
        <Lock aria-hidden className="size-2.5 text-muted" />
        <span className="font-mono text-[10px] text-fg/80">app.acme.com/deals</span>
      </In>
      <Fill d={0.2} t={0.8} />
      <div className="grid flex-1 grid-cols-3 gap-1.5">
        <In d={1} className="col-span-3 h-3 rounded bg-white/10" />
        <In d={1.15} className="rounded bg-white/[0.07]" />
        <In d={1.3} className="rounded bg-white/[0.07]" />
        <In d={1.45} className="rounded bg-[color-mix(in_oklab,var(--c)_25%,transparent)]" />
      </div>
      <In d={1.9}>
        <Tag>rendered on the server · 120 ms</Tag>
      </In>
    </div>
  ),
  React: () => (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-fg/80">Cart</span>
        <Pop d={0.9} className="flex size-5 items-center justify-center rounded-full bg-[var(--c)] text-[10px] font-semibold text-black">
          3
        </Pop>
      </div>
      <div className="rounded-md bg-white/[0.05] px-2 py-1.5 text-[10.5px]">Desk lamp · $39</div>
      <div className="rounded-md bg-white/[0.05] px-2 py-1.5 text-[10.5px]">Notebook · $12</div>
      <In d={0.9} className="rounded-md border border-[color-mix(in_oklab,var(--c)_40%,transparent)] bg-[color-mix(in_oklab,var(--c)_12%,transparent)] px-2 py-1.5 text-[10.5px]">
        Headphones · $89
      </In>
      <In d={1.5} className="mt-auto">
        <Tag>state changed, only that row re-rendered</Tag>
      </In>
    </div>
  ),
  TypeScript: () => (
    <div className="flex h-full flex-col justify-center gap-1.5">
      <Code>
        <span className={kw}>const</span> total: <span className={fn}>number</span> = <span className="dm-squiggle">{`"42"`}</span>;
      </Code>
      <Pop d={0.8} className="flex items-center gap-1.5 self-start rounded-md border border-rose-400/30 bg-rose-400/10 px-2 py-1 text-[10px] text-rose-300">
        <CircleAlert aria-hidden className="size-3" />
        Type &apos;string&apos; is not assignable to type &apos;number&apos;.
      </Pop>
      <In d={1.6}>
        <Code>
          <span className={kw}>const</span> total: <span className={fn}>number</span> = 42;
        </Code>
      </In>
      <div>
        <Ok d={2.1}>caught before it shipped</Ok>
      </div>
    </div>
  ),
  NestJS: () => (
    <div className="flex h-full flex-col justify-center">
      <Code>
        <span className={fn}>@Roles</span>(<span className={str}>&apos;admin&apos;</span>)
      </Code>
      <Code>
        <span className={fn}>@Get</span>(<span className={str}>&apos;billing&apos;</span>)
      </Code>
      <Code>
        <span className={fn}>getBilling</span>(<span className={kw}>@Tenant</span>() t) {"{ … }"}
      </Code>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Pop d={0.9} className="rounded-md bg-rose-400/12 px-2 py-0.5 font-mono text-[10px] text-rose-300">
          viewer → 403
        </Pop>
        <Pop d={1.5} className="rounded-md bg-emerald-400/12 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
          admin → 200
        </Pop>
      </div>
    </div>
  ),
  "Node.js": () => (
    <div className="flex h-full flex-col justify-center">
      <Code>
        <span className="text-muted">$</span> node server.js
      </Code>
      <In d={0.6}>
        <Code className="text-emerald-300">✓ listening on :3000</Code>
      </In>
      <In d={1.1}>
        <Code>
          GET /api/deals <span className="text-emerald-300">200</span> <span className="text-muted">12 ms</span>
        </Code>
      </In>
      <In d={1.5}>
        <Code>
          POST /api/leads <span className="text-emerald-300">201</span> <span className="text-muted">18 ms</span>
        </Code>
      </In>
      <In d={1.9}>
        <Code>
          job email.send <span className="text-[var(--c)]">queued</span>
        </Code>
      </In>
    </div>
  ),
  FastAPI: () => (
    <div className="flex h-full flex-col justify-center gap-1.5">
      <Code>
        <span className={fn}>@app.get</span>(<span className={str}>&quot;/leads/{"{id}"}&quot;</span>)
      </Code>
      <Code>
        <span className={kw}>async def</span> <span className={fn}>lead</span>(id: <span className={fn}>int</span>) -&gt; Lead:
      </Code>
      <Pop d={1} className="mt-1 self-start rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5">
        <Code>
          {"{ "}
          <span className={str}>&quot;id&quot;</span>: 42, <span className={str}>&quot;score&quot;</span>: 87{" }"}
        </Code>
      </Pop>
      <In d={1.6}>
        <Tag>validated, typed, documented automatically</Tag>
      </In>
    </div>
  ),
  PostgreSQL: () => (
    <div className="flex h-full flex-col gap-1.5">
      <Code>
        <Type t={1.1}>
          <span className={kw}>SELECT</span> * <span className={kw}>FROM</span> deals <span className={kw}>WHERE</span> tenant = 7
        </Type>
      </Code>
      {[
        ["Acme renewal", "$12,000"],
        ["Globex pilot", "$4,500"],
        ["Initech seats", "$2,250"],
      ].map(([n, v], i) => (
        <In key={n} d={1.2 + i * 0.25} className="flex justify-between rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[10px]">
          <span>{n}</span>
          <span className="text-[var(--c)]">{v}</span>
        </In>
      ))}
      <In d={2.1}>
        <Tag>3 rows · only tenant 7 can see them</Tag>
      </In>
    </div>
  ),
  Redis: () => (
    <div className="flex h-full flex-col justify-center gap-1.5">
      {["email.send #1041", "enrich.lead #1042", "video.render #1043"].map((j, i) => (
        <In key={j} d={i * 0.25} className="flex items-center gap-2 rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[10px]">
          <span className="flex-1">{j}</span>
          <Go d={1 + i * 0.4} />
          <span className="dm-done text-emerald-300" style={at(1 + i * 0.4)}>
            done
          </span>
        </In>
      ))}
      <In d={2.3}>
        <Tag>slow work runs in the background, the click never waits</Tag>
      </In>
    </div>
  ),

  /* ── payments & infrastructure ── */
  Stripe: () => (
    <div className="flex h-full flex-col justify-center gap-2">
      <In className="flex items-center justify-between rounded-md bg-white/[0.05] px-2.5 py-1.5 text-[10.5px]">
        <span className="font-mono">•••• 4242</span>
        <span className="text-muted">12 / 28</span>
      </In>
      <In d={0.5} className="rounded-md bg-white/90 px-2.5 py-1.5 text-center text-[11px] font-semibold text-[#0b0e16]">
        Subscribe · $49 / month
      </In>
      <Fill d={0.9} t={0.8} />
      <div>
        <Ok d={1.8}>Payment succeeded · invoice sent</Ok>
      </div>
    </div>
  ),
  JazzCash: () => (
    <div className="flex h-full items-center gap-3">
      <In className="flex h-full max-h-28 w-20 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03]">
        <Smartphone aria-hidden className="size-5" />
        <span className="text-[9.5px] text-muted">JazzCash</span>
      </In>
      <div className="min-w-0 flex-1 space-y-2">
        <In d={0.3} className="text-[11.5px]">
          Pay <span className="font-semibold">PKR 2,500</span>
        </In>
        <In d={0.7} className="flex gap-1.5">
          {[0, 1, 2, 3].map((k) => (
            <span key={k} className="dm-pop size-2 rounded-full bg-fg/70" style={at(0.8 + k * 0.15)} />
          ))}
        </In>
        <Ok d={1.8}>Paid from wallet</Ok>
      </div>
    </div>
  ),
  PayFast: () => (
    <div className="flex h-full flex-col justify-center gap-2">
      <In className="flex justify-between text-[11px]">
        <span>Order #2282</span>
        <span className="font-semibold">PKR 1,200</span>
      </In>
      <In d={0.4} className="flex gap-1.5">
        {["Card", "Bank"].map((m, i) => (
          <span key={m} className={`rounded-md px-2 py-1 text-[10px] ${i === 0 ? "bg-[color-mix(in_oklab,var(--c)_20%,transparent)] text-fg" : "bg-white/[0.05] text-muted"}`}>
            {m}
          </span>
        ))}
      </In>
      <Fill d={0.8} t={0.9} />
      <div>
        <Ok d={1.8}>Approved · order confirmed</Ok>
      </div>
    </div>
  ),
  Docker: () => (
    <div className="flex h-full flex-col justify-center gap-1.5">
      <Code className="text-muted">$ docker compose up -d</Code>
      {["web", "api", "postgres", "redis"].map((c, i) => (
        <In key={c} d={0.3 + i * 0.15} className="flex items-center gap-2 rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[10px]">
          <Go d={1 + i * 0.35} />
          <span className="flex-1">{c}</span>
          <span className="dm-done text-emerald-300" style={at(1 + i * 0.35)}>
            healthy
          </span>
        </In>
      ))}
    </div>
  ),
  Vercel: () => (
    <div className="flex h-full flex-col justify-center gap-2">
      <Code className="text-muted">git push origin main</Code>
      <In d={0.3}>
        <Code>Building…</Code>
      </In>
      <Fill d={0.4} t={1.4} />
      <div>
        <Ok d={1.9}>Ready · acme.vercel.app</Ok>
      </div>
      <In d={2.3}>
        <Tag>every push, a fresh deploy</Tag>
      </In>
    </div>
  ),
  Sentry: () => (
    <div className="flex h-full flex-col justify-center gap-2">
      <Pop className="relative rounded-lg border border-rose-400/30 bg-rose-400/10 px-2.5 py-1.5">
        <p className="flex items-center gap-1.5 text-[10.5px] text-rose-300">
          <CircleAlert aria-hidden className="size-3" /> TypeError: cannot read &apos;id&apos;
        </p>
        <p className="font-mono text-[9.5px] text-muted">checkout.ts:42 · 3 users</p>
        <span aria-hidden className="dm-strike absolute inset-x-2 top-1/2 h-px bg-rose-300/70" style={at(1.6)} />
      </Pop>
      <In d={0.8}>
        <Tag>alert sent, stack trace attached</Tag>
      </In>
      <div>
        <Ok d={1.8}>Fixed in v1.43 · resolved</Ok>
      </div>
    </div>
  ),
  Playwright: () => (
    <div className="flex h-full flex-col justify-center gap-1">
      {["logs in", "adds to cart", "checks out", "gets the receipt"].map((t, i) => (
        <In key={t} d={i * 0.45} className="flex items-center gap-2 text-[10.5px]">
          <span className="dm-pop flex size-3.5 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300" style={at(i * 0.45 + 0.25)}>
            <Check aria-hidden className="size-2.5" />
          </span>
          {t}
        </In>
      ))}
      <div className="mt-1.5">
        <Ok d={2.1}>4 passed · in a real browser</Ok>
      </div>
    </div>
  ),
  Cloudinary: () => (
    <div className="flex h-full items-center gap-3">
      <div className="relative flex h-full max-h-28 flex-1 items-center justify-center">
        <div className="dm-shrink aspect-[4/3] w-full rounded-lg bg-gradient-to-br from-sky-400/50 via-violet-400/40 to-amber-300/40" style={at(0.6, 1.2)} />
      </div>
      <div className="w-24 shrink-0 space-y-1.5">
        <In className="font-mono text-[10px] text-muted line-through">4.2 MB · png</In>
        <In d={1.5} className="font-mono text-[10px] text-[var(--c)]">
          84 KB · webp
        </In>
        <In d={1.9}>
          <Tag>resized for every screen</Tag>
        </In>
      </div>
    </div>
  ),

  /* ── desktop & mobile ── */
  Electron: () => (
    <div className="flex h-full items-center justify-center">
      <Pop className="w-full overflow-hidden rounded-lg border border-white/10 bg-black/40">
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-2 py-1">
          <Monitor aria-hidden className="size-3 text-muted" />
          <span className="text-[9.5px] text-fg/80">SparkCue · Windows</span>
        </div>
        <div className="space-y-1.5 p-2">
          <p className="text-[10px] text-muted">Prospect: “What does onboarding look like?”</p>
          <In d={0.9} className="rounded-md border border-[color-mix(in_oklab,var(--c)_40%,transparent)] bg-[color-mix(in_oklab,var(--c)_12%,transparent)] px-2 py-1 text-[10.5px]">
            Say this: “Two short calls and you&apos;re live in a week.”
          </In>
          <In d={1.6}>
            <Tag>a native app, hidden from screen share</Tag>
          </In>
        </div>
      </Pop>
    </div>
  ),
  "React Native": () => (
    <div className="flex h-full items-center justify-center gap-3">
      <div className="flex h-full max-h-32 w-24 flex-col gap-1 rounded-[0.9rem] border border-white/12 bg-black/40 p-1.5">
        <div className="mx-auto h-0.5 w-6 rounded-full bg-white/20" />
        {["Today", "Bookings", "Messages"].map((r, i) => (
          <In key={r} d={0.2 + i * 0.3} className="rounded bg-white/[0.06] px-1.5 py-1 text-[9px]">
            {r}
          </In>
        ))}
        <div className="mt-auto flex justify-around">
          {[0, 1, 2].map((k) => (
            <span key={k} className={`size-1.5 rounded-full ${k === 0 ? "bg-[var(--c)]" : "bg-white/20"}`} />
          ))}
        </div>
      </div>
      <In d={1.3} className="max-w-[9rem] space-y-1">
        <p className="text-[11px]">iOS and Android</p>
        <Tag>one codebase, the same API as the web</Tag>
      </In>
    </div>
  ),
  Expo: () => (
    <div className="flex h-full flex-col justify-center gap-2">
      <In className="flex items-center gap-2 text-[11px]">
        <Smartphone aria-hidden className="size-3.5" /> Update available · v1.4
      </In>
      <Fill d={0.5} t={1.2} />
      <div>
        <Ok d={1.8}>Updated over the air</Ok>
      </div>
      <In d={2.2}>
        <Tag>no app-store wait for a fix</Tag>
      </In>
    </div>
  ),
  Flutter: () => (
    <div className="flex h-full items-center justify-center gap-3">
      {["iOS", "Android"].map((os, k) => (
        <div key={os} className="flex h-full max-h-32 w-20 flex-col gap-1 rounded-[0.9rem] border border-white/12 bg-black/40 p-1.5">
          <p className="text-center text-[8.5px] text-muted">{os}</p>
          <Pop d={0.6} className="rounded-md bg-[color-mix(in_oklab,var(--c)_18%,transparent)] px-1.5 py-1.5 text-[9px]">
            Match found
          </Pop>
          <In d={1 + k * 0.05} className="rounded bg-white/[0.06] px-1.5 py-1 text-[9px]">
            Say hello
          </In>
        </div>
      ))}
      <In d={1.6} className="max-w-[6.5rem]">
        <Tag>one build, pixel-identical on both</Tag>
      </In>
    </div>
  ),
  SQLite: () => (
    <div className="flex h-full flex-col justify-center gap-1.5">
      <In className="flex items-center gap-2 text-[11px]">
        <Database aria-hidden className="size-3.5 text-[var(--c)]" /> scans.db · on this computer
      </In>
      {["scan #31 · grade A", "scan #32 · grade C", "scan #33 · grade B"].map((r, i) => (
        <In key={r} d={0.5 + i * 0.3} className="rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[10px]">
          {r}
        </In>
      ))}
      <div className="mt-1">
        <Ok d={1.8}>0 bytes uploaded</Ok>
      </div>
    </div>
  ),
};

/** The scene for one tool; tools without one show their mark, large. */
export function SkillDemo({ tech }: { tech: string }) {
  const Demo = DEMOS[tech];
  if (Demo) return <>{Demo()}</>;
  return (
    <div className="flex h-full items-center justify-center">
      <Pop>
        <TechIcon name={tech} size={40} />
      </Pop>
    </div>
  );
}

