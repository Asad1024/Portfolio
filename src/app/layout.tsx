import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Terminal } from "@/components/terminal";
import { Cursor } from "@/components/cursor";
import { Preloader } from "@/components/preloader";
import { SmoothScroll } from "@/components/smooth-scroll";
import { Starfield } from "@/components/space/starfield";
import { CommandPalette } from "@/components/command-palette";
import { MatrixRain } from "@/components/matrix-rain";
import { ConsoleEgg } from "@/components/console-egg";
import { StatusBar } from "@/components/status-bar";
import { Flyby } from "@/components/space/flyby";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jet",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Full-stack developer shipping complete products across web, desktop (Electron), cloud, and AI systems.";

export const metadata: Metadata = {
  /* Every relative image in this file resolves against it, so an unset value
     is what makes a shared link show a broken preview card. Set
     NEXT_PUBLIC_SITE_URL and the OG image, sitemap and robots all follow. */
  metadataBase: new URL(siteUrl),
  title: {
    default: "Asad — Full-Stack Developer",
    // case studies set their own; this keeps the suffix off the home page
    template: "%s",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Asad — Full-Stack Developer",
    description: DESCRIPTION,
    url: "/",
    siteName: "Asad Shah",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Asad — Full-Stack Developer",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* First stop for a keyboard or screen reader: the page opens with a
            fixed header and a WebGL hero, so without this the way to the
            content is through all of it. Parked off-screen with a translate
            rather than collapsed to 1px with sr-only: it keeps its real size
            the whole time, so what slides in on focus is exactly what was
            measured, with no reset to lose. */}
        <a
          href="#main"
          className="fixed left-4 top-4 z-[200] -translate-y-24 rounded-sm border border-accent bg-bg px-4 py-2 font-mono text-xs text-accent transition-transform duration-200 focus:translate-y-0"
        >
          skip to content
        </a>
        <Preloader />
        <SmoothScroll />
        <Cursor />
        <Nav />
        {/* Page-wide sky: starfield plus two nebula washes, fixed behind every
            section so the site reads as one continuous piece of space rather
            than a stack of separately dark panels. */}
        <div aria-hidden className="nebula pointer-events-none fixed inset-0 z-0">
          <Starfield />
        </div>
        <main id="main" tabIndex={-1} className="relative z-10 flex-1 outline-none">{children}</main>
        <Terminal />
        <CommandPalette />
        <MatrixRain />
        <ConsoleEgg />
        <StatusBar />
        <Flyby />
      </body>
    </html>
  );
}
