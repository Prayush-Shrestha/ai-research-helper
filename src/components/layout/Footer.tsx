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

/** Gallery footer — small slate type on fog, links grouped quietly. */
export function Footer() {
  return (
    <footer style={{ background: "var(--color-fog-canvas)", marginTop: 120 }}>
      <div
        className="mx-auto px-5 py-10 sm:px-8"
        style={{ maxWidth: "var(--page-max-width)", borderTop: "1px solid var(--color-line)" }}
      >
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs" style={{ fontSize: 12, lineHeight: 1.33, letterSpacing: "-0.022em", color: "var(--color-slate)" }}>
              A quiet workspace for difficult papers. Upload, ask, cite — in one place.
            </p>
          </div>
          {COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-apple-ink)" }}>{col.title}</p>
              <ul className="mt-2.5 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} style={{ fontSize: 12, color: "var(--color-iron)" }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: "1px solid var(--color-line)", paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: "var(--color-slate)" }}>© 2026 Lumina. Your files stay yours.</p>
          <p style={{ fontSize: 12, color: "var(--color-slate)" }}>Set in Inter Tight and Inter.</p>
        </div>
      </div>
    </footer>
  );
}
