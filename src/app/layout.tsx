import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-display",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lemma — Research Workspace",
    template: "%s · Lemma",
  },
  description:
    "Lemma is a quiet research laboratory where papers become stepping stones to your thesis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} ${plexMono.variable} h-full`}>
      <body
        className="min-h-full antialiased"
        style={{ background: "var(--color-void)", color: "var(--color-primary-text)" }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
