import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { DM_Serif_Display, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const editorialSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

const technicalMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-technical",
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
    default: "Lumina — Read Less. Understand More.",
    template: "%s · Lumina",
  },
  description:
    "Lumina is your AI-powered research workspace. Explore papers, uncover findings, and turn complex academic documents into actionable knowledge.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F2EC" },
    { media: "(prefers-color-scheme: dark)", color: "#101211" },
  ],
};

/**
 * Sets data-theme before first paint so the saved (or signature midnight) mode
 * applies with no flash. Mirrors ThemeProvider's logic.
 */
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("rl_theme");var t=s==="light"?"light":s==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):"dark";document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${editorialSerif.variable} ${technicalMono.variable} ${inter.variable} h-full`} suppressHydrationWarning>
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
