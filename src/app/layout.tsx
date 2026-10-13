import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ResearchOS — Read Less. Understand More.",
    template: "%s · ResearchOS",
  },
  description:
    "ResearchOS is your AI-powered research workspace. Explore papers, uncover findings, and turn complex academic documents into actionable knowledge.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

/**
 * Sets data-theme before first paint so the saved (or OS) mode
 * applies with no flash. Mirrors ThemeProvider's logic.
 */
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("rl_theme");var t=s==="light"||s==="dark"?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${interTight.variable} ${inter.variable} h-full`} suppressHydrationWarning>
      <body
        className="min-h-full antialiased"
        style={{ background: "var(--color-fog-canvas)", color: "var(--color-apple-ink)" }}
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
