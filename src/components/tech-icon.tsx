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
  siAnthropic,
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
  siSocketdotio,
  siQuickbooks,
  type SimpleIcon,
} from "simple-icons";

/* Brand icons rendered in their real brand color (near-black logos fall back
   to the theme foreground so they stay visible in dark mode). */
const ICONS: Record<string, SimpleIcon> = {
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
  "Headless Chromium": siGooglechrome,
  "Framer Motion": siFramer,
  "LLM APIs": siAnthropic,
  "OpenAI · Gemini": siGooglegemini,
  Gemini: siGooglegemini,
  ElevenLabs: siElevenlabs,
  Stripe: siStripe,
  "Stripe billing": siStripe,
  "CI/CD": siGithubactions,
  WebSockets: siSocketdotio,
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
  SSE: siSocketdotio,
};

/* Accent-colored fallback glyphs for skills without a brand icon (stroke paths). */
const FALLBACKS: Record<string, string> = {
  // phone handset
  Twilio:
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z",
  // video camera
  HeyGen:
    "M22 8l-6 4 6 4V8zM2 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z",
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
  // mobile wallet
  JazzCash:
    "M21 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2M22 9h-6a3 3 0 0 0 0 6h6V9z",
  // card + lightning bolt
  PayFast:
    "M22 11V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8M2 10h20M18 13l-3 4.5h4L16 22",
  "JazzCash · PayFast":
    "M21 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2M22 9h-6a3 3 0 0 0 0 6h6V9z",
  // six-point spark
  OpenAI:
    "M12 2.5l1.6 6.3 6.3 1.6-6.3 1.6L12 18.3l-1.6-6.3L4.1 10.4l6.3-1.6L12 2.5z",
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
  return name in ICONS || name in FALLBACKS;
}
