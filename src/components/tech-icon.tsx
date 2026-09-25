import {
  siReact,
  siNextdotjs,
  siTypescript,
  siNodedotjs,
  siElectron,
  siPostgresql,
  siSqlite,
  siTailwindcss,
  siGooglechrome,
  siFramer,
  siGithubactions,
  siNestjs,
  siMysql,
  siMongodb,
  siRedis,
  siPrisma,
  siFlutter,
  siStripe,
  siElevenlabs,
  siFirebase,
  siExpress,
  siVite,
  siRedux,
  siRadixui,
  siGooglegemini,
  siLivekit,
  siZapier,
  siCloudinary,
  siGooglecalendar,
  siJsonwebtokens,
  siResend,
  siAirtable,
  siHubspot,
  siWhatsapp,
  siQuickbooks,
  siZod,
  siReactquery,
  siReacthookform,
  siGsap,
  siThreedotjs,
  siI18next,
  siSocketdotio,
  siSequelize,
  siSwagger,
  siDocker,
  siVercel,
  siRender,
  siSentry,
  siJest,
  siVitest,
  siExpo,
  siPython,
  siFastapi,
  siModelcontextprotocol,
} from "simple-icons";

/** A single-colour mark on a 24x24 grid — the shape simple-icons uses. */
type BrandMark = { path: string; hex: string };

/* Official marks simple-icons no longer ships. Twilio and OpenAI were both
   in the set until the brands asked for removal; these are the exact paths
   from simple-icons 11.15.0, which were drawn from each company's own brand
   assets (twilio.com/company/brand, openai.com). OpenAI's mark is officially
   monochrome, so it is given white and follows the theme foreground like
   Next.js does. */
const siTwilio: BrandMark = {
  hex: "F22F46",
  path: "M12 0C5.381-.008.008 5.352 0 11.971V12c0 6.64 5.359 12 12 12 6.64 0 12-5.36 12-12 0-6.641-5.36-12-12-12zm0 20.801c-4.846.015-8.786-3.904-8.801-8.75V12c-.014-4.846 3.904-8.786 8.75-8.801H12c4.847-.014 8.786 3.904 8.801 8.75V12c.015 4.847-3.904 8.786-8.75 8.801H12zm5.44-11.76c0 1.359-1.12 2.479-2.481 2.479-1.366-.007-2.472-1.113-2.479-2.479 0-1.361 1.12-2.481 2.479-2.481 1.361 0 2.481 1.12 2.481 2.481zm0 5.919c0 1.36-1.12 2.48-2.481 2.48-1.367-.008-2.473-1.114-2.479-2.48 0-1.359 1.12-2.479 2.479-2.479 1.361-.001 2.481 1.12 2.481 2.479zm-5.919 0c0 1.36-1.12 2.48-2.479 2.48-1.368-.007-2.475-1.113-2.481-2.48 0-1.359 1.12-2.479 2.481-2.479 1.358-.001 2.479 1.12 2.479 2.479zm0-5.919c0 1.359-1.12 2.479-2.479 2.479-1.367-.007-2.475-1.112-2.481-2.479 0-1.361 1.12-2.481 2.481-2.481 1.358 0 2.479 1.12 2.479 2.481z",
};
const siOpenai: BrandMark = {
  hex: "FFFFFF",
  path: "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z",
};
/* Chromium's mark is the same three-segment wheel as Chrome's — the projects
   share the geometry and differ only in colour — so Chrome's official path in
   Chromium's blue is Chromium's logo, not an approximation of it. */
const siChromium: BrandMark = { hex: "4285F4", path: siGooglechrome.path };

/* Marks that only exist as full-colour artwork, served from /public/brand and
   drawn as images rather than tinted paths. Both are cut from each company's
   own logo file: JazzCash's mark is the red and yellow shapes of the SVG on
   jazzcash.com.pk with the wordmark removed, HeyGen's is the gradient gem
   from the logo on heygen.com, and PayFast's is the double-P from
   premierpayfast.com (where gopayfast.com now redirects) — the white version
   PayFast itself uses on dark backgrounds, since its green-over-navy one
   loses the navy half entirely against this page. */
const IMAGES: Record<string, string> = {
  HeyGen: "/brand/heygen.png",
  JazzCash: "/brand/jazzcash.svg",
  PayFast: "/brand/payfast.png",
  "JazzCash · PayFast": "/brand/jazzcash.svg",
};

/* Brand icons rendered in their real brand color (near-black logos fall back
   to the theme foreground so they stay visible in dark mode). */
const ICONS: Record<string, BrandMark> = {
  React: siReact,
  "React Native": siReact,
  "Next.js": siNextdotjs,
  TypeScript: siTypescript,
  "Node.js": siNodedotjs,
  "Node.js/Express": siNodedotjs,
  "Express.js": siExpress,
  NestJS: siNestjs,
  Electron: siElectron,
  Flutter: siFlutter,
  PostgreSQL: siPostgresql,
  MySQL: siMysql,
  MongoDB: siMongodb,
  Firestore: siFirebase,
  SQLite: siSqlite,
  Redis: siRedis,
  "Redis + BullMQ": siRedis,
  "Prisma ORM": siPrisma,
  "Tailwind CSS": siTailwindcss,
  Redux: siRedux,
  "Radix UI": siRadixui,
  Vite: siVite,
  "Headless Chromium": siChromium,
  "Framer Motion": siFramer,
  "OpenAI · Gemini": siGooglegemini,
  Gemini: siGooglegemini,
  ElevenLabs: siElevenlabs,
  Stripe: siStripe,
  "Stripe billing": siStripe,
  "CI/CD": siGithubactions,
  JWT: siJsonwebtokens,
  "JWT · SSO · HMAC": siJsonwebtokens,
  LiveKit: siLivekit,
  "Google Calendar": siGooglecalendar,
  "Google Calendar · OAuth": siGooglecalendar,
  Zapier: siZapier,
  "Zapier · QuickBooks": siZapier,
  QuickBooks: siQuickbooks,
  Cloudinary: siCloudinary,
  "Cloudinary · BullMQ": siCloudinary,
  Resend: siResend,
  "SendGrid · Resend": siResend,
  Airtable: siAirtable,
  HubSpot: siHubspot,
  WhatsApp: siWhatsapp,
  Twilio: siTwilio,
  OpenAI: siOpenai,
  Zod: siZod,
  "TanStack Query": siReactquery,
  "React Hook Form": siReacthookform,
  GSAP: siGsap,
  "Three.js": siThreedotjs,
  i18next: siI18next,
  "Socket.IO": siSocketdotio,
  Sequelize: siSequelize,
  Swagger: siSwagger,
  Docker: siDocker,
  Vercel: siVercel,
  Render: siRender,
  Sentry: siSentry,
  Jest: siJest,
  Vitest: siVitest,
  Expo: siExpo,
  Python: siPython,
  FastAPI: siFastapi,
  MCP: siModelcontextprotocol,
  "Electron Forge": siElectron,
};

/* Accent-colored fallback glyphs for skills without a brand icon (stroke paths). */
const FALLBACKS: Record<string, string> = {
  /* Protocols and categories with no logo of their own. These used to borrow
     Socket.io's mark (WebSockets, SSE) and Anthropic's (LLM APIs), which
     claimed a specific library or vendor the projects don't necessarily use.
     A plain glyph in the accent colour says "concept", not "brand". */
  // two-way arrows
  WebSockets: "M4 8h14l-3.5-3.5M20 16H6l3.5 3.5",
  // one-way stream
  SSE: "M3 7h12M3 12h16M3 17h9M16 5l3 7-3 7",
  // sparkles
  "LLM APIs":
    "M12 3l1.9 5.7L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.3L12 3zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8L19 17z",
  // shield
  "Multi-tenant + RBAC":
    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  // sparkles
  "Agent workflows":
    "M12 3l1.9 5.7L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.3L12 3zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8L19 17z",
  // stacked layers
  "Cross-platform builds":
    "M12 2l10 5.5-10 5.5L2 7.5 12 2zM2 12.5l10 5.5 10-5.5M2 17l10 5.5L22 17",
  // target / enrichment
  "Apollo · enrichment APIs":
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  // stacked layers — a job queue
  BullMQ:
    "M12 2l10 5.5-10 5.5L2 7.5 12 2zM2 12.5l10 5.5 10-5.5M2 17l10 5.5L22 17",
  // stacked coins — state store
  Zustand:
    "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  // bar chart
  Recharts: "M4 20V10M10 20V4M16 20v-8M22 20H2",
  // padlock
  NextAuth: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  // shield with key slot
  "SSO · 2FA": "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 9v4",
  // play triangle in a frame — browser test runner
  Playwright: "M3 4h18v16H3zM10 9l5 3-5 3z",
  // documents + search
  "RAG · embeddings": "M6 2h9l5 5v8M6 2v20h8M15 2v5h5M17 17a3 3 0 1 0 0 .01M19.2 19.2L22 22",
  // eye — OCR reads images
  "Tesseract.js": "M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  // calendar
  "Microsoft Calendar": "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4",
  // envelope
  SendGrid: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  // plug / connector
  Unipile:
    "M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V7zM12 16v5",
  // telephony wave
  Telephony:
    "M2 12h3l2-7 4 14 3-10 2 3h6",
  // stacked layers (reused)
  "Worker queues":
    "M12 2l10 5.5-10 5.5L2 7.5 12 2zM2 12.5l10 5.5 10-5.5M2 17l10 5.5L22 17",
  // target (reused)
  "Enrichment APIs":
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  // globe
  "DNS automation":
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
  // envelope
  SMTP: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  "Email/Calendar sync":
    "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  // cloud
  "Cloud jobs": "M17.5 19a4.5 4.5 0 0 0 0-9 7 7 0 0 0-13.6 2A4.5 4.5 0 0 0 6 19h11.5",
  // shield
  OSV: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  // chat bubble
  "Realtime chat":
    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z",
  // recurring arrows
  Subscriptions:
    "M23 4v6h-6M1 20v-6h6M20.5 9A9 9 0 0 0 5.6 5.6L1 10m22 4l-4.6 4.4A9 9 0 0 1 3.5 15",
  // stacked coins
  "Credit-based usage":
    "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
};

function brandColor(hex: string): string {
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  // Monochrome brand marks — near-black (Next.js, Express) and near-white
  // (LiveKit) — follow the theme so they stay visible in both modes.
  return lum < 0.16 || lum > 0.85 ? "var(--fg)" : `#${hex}`;
}

export function TechIcon({ name, size = 16 }: { name: string; size?: number }) {
  const image = IMAGES[name];
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a 16px static mark; next/image adds nothing but a wrapper
      <img src={image} width={size} height={size} alt="" aria-hidden className="shrink-0 object-contain" />
    );
  }
  const icon = ICONS[name];
  if (icon) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={brandColor(icon.hex)}
        aria-hidden
        className="shrink-0"
      >
        <path d={icon.path} />
      </svg>
    );
  }
  const fallback = FALLBACKS[name];
  if (fallback) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="shrink-0"
      >
        <path d={fallback} />
      </svg>
    );
  }
  return null;
}

export function hasTechIcon(name: string) {
  return name in IMAGES || name in ICONS || name in FALLBACKS;
}

/**
 * The raw glyph behind a tech's icon, for consumers that need to draw it
 * themselves rather than mount an <svg> — the WebGL scene paints these onto a
 * canvas and orbits them as sprites. Both sets share a 24x24 viewBox; the
 * brand marks are filled and the hand-drawn fallbacks are stroked, hence the
 * flag.
 */
export function techGlyph(name: string): { path: string; stroked: boolean } | null {
  const icon = ICONS[name];
  if (icon) return { path: icon.path, stroked: false };
  const fallback = FALLBACKS[name];
  if (fallback) return { path: fallback, stroked: true };
  return null;
}

/**
 * A tech's brand colour as a plain hex string, for consumers that can't use a
 * CSS variable — the WebGL scene, in practice, where planets are tinted per
 * technology. Monochrome marks (Next.js, Express) would render as black
 * spheres, so anything near the ends of the luminance range is replaced with
 * the theme accent rather than passed through.
 */
export function techColor(name: string, fallback = "#38bdf8") {
  const hex = ICONS[name]?.hex;
  if (!hex) return fallback;
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum < 0.18 || lum > 0.9 ? fallback : `#${hex}`;
}
