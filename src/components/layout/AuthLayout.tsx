import Link from "next/link";
import { LogoMark } from "./Logo";

const bullets = [
  { title: "Private by default", text: "Your library stays yours. Organized, searchable, citable." },
  { title: "Built for papers", text: "PDF and DOCX ingestion with clean extracted text." },
  { title: "AI-ready foundation", text: "Structured now for citations and answers later." },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-[#F8FAFC] lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-[#0F172A] p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Home">
          <LogoMark />
          <span className="text-[15px] font-semibold">ResearchOS — Student Workspace</span>
        </Link>
        <div>
          <h2 className="max-w-md text-[30px] font-semibold leading-[1.2] tracking-tight">
            A calmer home for your research library.
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-7 text-[#CBD5E1]">
            Upload papers, keep extracted text readable, and prepare every document for
            trustworthy AI-powered research.
          </p>
          <ul className="mt-8 space-y-4">
            {bullets.map((b) => (
              <li key={b.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4F46E5] text-[11px] font-bold"
                >
                  ✓
                </span>
                <span>
                  <span className="block text-sm font-medium">{b.title}</span>
                  <span className="block text-sm text-[#94A3B8]">{b.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[13px] text-[#64748B]">Foundation first — RAG, citations, and answers come next.</p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[420px] page-enter">{children}</div>
      </div>
    </div>
  );
}
