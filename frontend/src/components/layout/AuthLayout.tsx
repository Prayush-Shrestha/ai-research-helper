import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "./Logo";

const bullets = [
  { title: "Private by default", text: "Your library stays yours. Organized, searchable, citable." },
  { title: "Built for papers", text: "PDF and DOCX ingestion with clean extracted text." },
  { title: "AI-ready foundation", text: "Structured now for citations and answers later." },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell grid min-h-screen lg:grid-cols-2" style={{ background: "transparent" }}>
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <span aria-hidden className="orb" style={{ width: 420, height: 420, left: "-120px", top: "-120px", background: "radial-gradient(circle, rgba(157,231,193,0.14), transparent 65%)" }} />
        <div className="gallery-card relative flex flex-1 flex-col justify-between" style={{ zIndex: 1 }}>
          <Link href="/" className="flex items-center gap-2.5" aria-label="Home">
            <span style={{ filter: "drop-shadow(0 0 10px rgba(157,231,193,0.45))", display: "inline-flex" }}>
              <LogoMark />
            </span>
            <span className="tech-label" style={{ color: "var(--color-apple-ink)" }}>Lumina — Workspace</span>
          </Link>
          <div className="py-10">
            <p className="eyebrow"><span className="dot" aria-hidden /> Calm research home</p>
            <h2 className="mt-4 max-w-md" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--color-apple-ink)" }}>
              A calm home for your research library.
            </h2>
            <p className="mt-3 max-w-md text-[15px]" style={{ color: "var(--color-graphite)", lineHeight: 1.7 }}>
              Upload papers, keep extracted text readable, and prepare every document for
              trustworthy AI-powered research.
            </p>
            <ul className="mt-8 space-y-4">
              {bullets.map((b) => (
                <li key={b.title} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-bold"
                    style={{ background: "rgba(157,231,193,0.16)", color: "var(--color-electric-blue)", border: "1px solid rgba(157,231,193,0.45)", borderRadius: 9999, boxShadow: "var(--liquid-glow-mint)" }}
                  >
                    ✓
                  </span>
                  <span>
                    <span className="block text-sm font-medium" style={{ color: "var(--color-apple-ink)" }}>{b.title}</span>
                    <span className="block text-sm" style={{ color: "var(--color-graphite)" }}>{b.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="footnote">Foundation first — grounded answers, citations, and collections.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="gallery-card rise rise-2 w-full max-w-[440px] page-enter">{children}</div>
      </div>
    </div>
  );
}
