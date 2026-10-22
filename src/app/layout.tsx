import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/site";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Terminal } from "@/components/terminal";
import { Preloader } from "@/components/preloader";
import { SmoothScroll } from "@/components/smooth-scroll";
import { Starfield } from "@/components/space/starfield";
import { CommandPalette } from "@/components/command-palette";
import { MatrixRain } from "@/components/matrix-rain";
import { ConsoleEgg } from "@/components/console-egg";
import { SkyDimmer } from "@/components/sky-dimmer";
import { Assistant } from "@/components/assistant/assistant";
import { RouteVeil } from "@/components/route-veil";

/* One face: Geist carries everything, headlines, labels and text alike, with
   accent words picked out in colour rather than a second typeface. Geist Mono,
   from the same family, is kept for code. */
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Full-stack developer shipping complete products across web, desktop (Electron), cloud, and AI systems.";

export const metadata: Metadata = {
  /* Every relative image in this file resolves against it, so an unset value
     is what makes a shared link show a broken preview card. Set
     NEXT_PUBLIC_SITE_URL and the OG image, sitemap and robots all follow. */
  metadataBase: new URL(siteUrl),
  /* One name on every tab, case studies included: a portfolio is one site,
     and a tab reading a product name says nothing about whose it is. */
  title: "Asad Shah — Full Stack Developer",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Asad Shah — Full Stack Developer",
    description: DESCRIPTION,
    url: "/",
    siteName: "Asad Shah",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Asad Shah — Full Stack Developer",
    description: DESCRIPTION,
  },
};

/* On Android the on-screen keyboard otherwise slides over fixed panels; with
   this the page shrinks above it instead, so the assistant's input, the
   palette and the terminal stay visible while typing. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // the boot-flag script below may add data-booted before React hydrates
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Runs before first paint: a visitor who has already seen the intro
            this session must not get even a frame of its cover. */}
        <Script id="boot-flag" strategy="beforeInteractive">
          {"try{if(sessionStorage.getItem('booted')==='1')document.documentElement.setAttribute('data-booted','')}catch(e){}"}
        </Script>
        {/* First stop for a keyboard or screen reader: the page opens with a
            fixed header and a WebGL hero, so without this the way to the
            content is through all of it. Parked off-screen with a translate
            rather than collapsed to 1px with sr-only: it keeps its real size
            the whole time, so what slides in on focus is exactly what was
            measured, with no reset to lose. */}
        <a
          href="#main"
          className="fixed left-4 top-4 z-[200] -translate-y-24 rounded-sm border border-accent bg-bg px-4 py-2 font-sans text-xs text-accent transition-transform duration-200 focus:translate-y-0"
        >
          skip to content
        </a>
        <Preloader />
        <SmoothScroll />
        <Nav />
        {/* Page-wide sky: starfield plus two nebula washes, fixed behind every
            section so the site reads as one continuous piece of space rather
            than a stack of separately dark panels. */}
        <div aria-hidden className="nebula pointer-events-none fixed inset-0 z-0">
          <Starfield />
        </div>
        <main id="main" tabIndex={-1} className="relative flex-1 outline-none">{children}</main>
        {/* The curtain between pages: here rather than in the page template so
            it can start on the press of a link, before the next page exists. */}
        <RouteVeil />
        <Terminal />
        <CommandPalette />
        <MatrixRain />
        <ConsoleEgg />
        <SkyDimmer />
        <Assistant />
      </body>
    </html>
  );
}
