import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PlayerProvider } from "@/components/player-provider";
import { NowPlayingBar } from "@/components/now-playing-bar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sans = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
});

const heading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Music Cloud",
  description:
    "An album-first listening library. Play the shelf, or import files from this computer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${heading.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <ThemeProvider>
          <PlayerProvider>
            <div className="flex min-h-svh flex-col pb-[7.5rem] md:pb-28">
              {children}
            </div>
            <div className="fixed inset-x-0 bottom-0 z-30">
              <NowPlayingBar />
            </div>
            <Toaster />
          </PlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
