import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
    default: "Lumina — Read Less. Understand More.",
    template: "%s · Lumina",
  },
  description:
    "Lumina is your AI-powered research workspace. Explore papers, uncover findings, and turn complex academic documents into actionable knowledge.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f3fa" },
    { media: "(prefers-color-scheme: dark)", color: "#050510" },
  ],
};

/**
 * Sets data-theme before first paint so the saved (or signature midnight) mode
 * applies with no flash. Mirrors ThemeProvider's logic.
 */
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("rl_theme");var t=s==="light"?"light":s==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):"dark";document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${inter.variable} h-full`} suppressHydrationWarning>
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
