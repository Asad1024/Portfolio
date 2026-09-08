import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
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

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jet",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // TODO: replace with the real domain before deploying
  metadataBase: new URL("https://asadshah.example.com"),
  title: "Asad — Full-Stack Developer",
  description:
    "Full-stack developer shipping complete products across web, desktop (Electron), cloud, and AI systems.",
  openGraph: {
    title: "Asad — Full-Stack Developer",
    description:
      "Full-stack developer shipping complete products across web, desktop (Electron), cloud, and AI systems.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
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
          <main className="relative z-10 flex-1">{children}</main>
          <Terminal />
          <CommandPalette />
          <MatrixRain />
          <ConsoleEgg />
          <StatusBar />
        </ThemeProvider>
      </body>
    </html>
  );
}
