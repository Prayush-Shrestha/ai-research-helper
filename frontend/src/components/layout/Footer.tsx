"use client";

import Link from "next/link";
import { Wordmark } from "@/components/layout/Logo";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Workspace", href: "/dashboard" },
      { label: "Library", href: "/documents" },
      { label: "Assistant", href: "/assistant" },
      { label: "Guide", href: "/guide" },
    ],
  },
  {
    title: "Desk",
    links: [
      { label: "Collections", href: "/collections" },
      { label: "Notes", href: "/notes" },
      { label: "History", href: "/history" },
      { label: "Settings", href: "/settings" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Contact", href: "/guide" },
      { label: "Privacy", href: "/guide" },
      { label: "Terms", href: "/guide" },
    ],
  },
];

/** Liquid footer — floating glass sheet, quiet type. */
export function Footer() {
  return (
    <footer style={{ marginTop: 100, padding: "0 16px 24px" }}>
      <div
        className="mx-auto px-6 py-10 sm:px-10"
        style={{
          maxWidth: "var(--page-max-width)",
          borderRadius: 28,
          background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02)), color-mix(in srgb, var(--color-pure-white) 72%, transparent)",
          backdropFilter: "blur(24px) saturate(170%)",
          WebkitBackdropFilter: "blur(24px) saturate(170%)",
          border: "1px solid var(--liquid-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 var(--liquid-shine)",
        }}
      >
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs" style={{ fontSize: 14, lineHeight: 1.6, color: "var(--color-graphite)" }}>
              Made for late-night reading. One liquid shelf for papers, notes, and citations.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="tag-pill crimson"><span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor" }} /> Live</span>
              <span className="tag-pill">v2 · liquid</span>
            </div>
          </div>
          {COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p style={{ fontSize: 12, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)" }}>{col.title}</p>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} style={{ fontSize: 14, color: "var(--color-iron)" }} className="hover:underline underline-offset-4">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: "1px solid var(--liquid-border)", paddingTop: 18 }}>
          <p style={{ fontSize: 12.5, color: "var(--color-slate)" }}>© 2026 Lumina · poured in glass, built for readers.</p>
          <p style={{ fontSize: 12.5, color: "var(--color-slate)" }}>Your files stay yours, always. Lumina claims no copyright over your uploads or notes.</p>
        </div>
      </div>
    </footer>
  );
}
