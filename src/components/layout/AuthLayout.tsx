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
    <div className="grid min-h-screen lg:grid-cols-2" style={{ background: "#000" }}>
      <div className="hidden flex-col justify-between p-10 lg:flex" style={{ background: "#000", borderRight: "1px solid rgba(204,204,204,0.12)" }}>
        <Link href="/" className="flex items-center gap-2.5" aria-label="Home">
          <LogoMark />
          <span className="text-[13px] font-bold uppercase" style={{ color: "var(--color-frost)" }}>ResearchOS — Workspace</span>
        </Link>
        <div>
          <h2 className="max-w-md text-[30px] font-bold uppercase leading-[1.05]" style={{ color: "var(--color-frost)" }}>
            A calm home for your research library.
          </h2>
          <p className="mt-3 max-w-md text-[15px]" style={{ color: "var(--color-ash)", lineHeight: 1.7 }}>
            Upload papers, keep extracted text readable, and prepare every document for
            trustworthy AI-powered research.
          </p>
          <ul className="mt-8 space-y-4">
            {bullets.map((b) => (
              <li key={b.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-bold"
                  style={{ background: "var(--color-crimson-signal)", color: "#fff", borderRadius: 9999 }}
                >
                  ✓
                </span>
                <span>
                  <span className="block text-sm font-medium" style={{ color: "var(--color-frost)" }}>{b.title}</span>
                  <span className="block text-sm" style={{ color: "var(--color-ash)" }}>{b.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[13px]" style={{ color: "var(--color-graphite)" }}>Foundation first — grounded answers, citations, and collections.</p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[420px] page-enter">{children}</div>
      </div>
    </div>
  );
}
