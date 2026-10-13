import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DocumentRow } from "@/components/documents/DocumentRow";
import type { ResearchDocument } from "@/types/document";

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-7" style={{ borderBottom: "1px solid var(--color-line)" }}>
      <h3 style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2, color: "var(--color-apple-ink)" }}>{title}</h3>
      <p className="mt-2 max-w-2xl" style={{ fontSize: 16, lineHeight: 1.6, color: "var(--color-graphite)" }}>{body}</p>
    </div>
  );
}

/** Static preview docs — illustration only, clearly labelled as such. */
const PREVIEW_DOCS: ResearchDocument[] = [
  {
    id: "preview-1",
    title: "Retrieval-Augmented Generation — A Survey",
    original_filename: "rag-survey-2025.pdf",
    file_type: "PDF",
    file_size: 5221376,
    page_count: 42,
    extraction_status: "completed",
    extraction_error: null,
    created_at: "2026-09-02T10:00:00Z",
    updated_at: "2026-09-02T10:00:00Z",
  },
  {
    id: "preview-2",
    title: "Vector Databases — A Comparative Study",
    original_filename: "vector-databases.pdf",
    file_type: "PDF",
    file_size: 3102912,
    page_count: 27,
    extraction_status: "completed",
    extraction_error: null,
    created_at: "2026-08-28T10:00:00Z",
    updated_at: "2026-08-28T10:00:00Z",
  },
  {
    id: "preview-3",
    title: "Evaluation Metrics for Language Models",
    original_filename: "lm-evaluation.pdf",
    file_type: "PDF",
    file_size: 2088960,
    page_count: 22,
    extraction_status: "processing",
    extraction_error: null,
    created_at: "2026-08-25T10:00:00Z",
    updated_at: "2026-08-25T10:00:00Z",
  },
];

function ProductPreview() {
  return (
    <div
      aria-label="Illustrated preview of the Lumina workspace"
      className="overflow-hidden"
      style={{ border: "1px solid var(--color-line)", borderRadius: 14, background: "var(--color-pure-white)" }}
    >
      <div className="grid md:grid-cols-[168px_1fr]">
        {/* miniature sidebar */}
        <div className="hidden p-4 md:block" style={{ borderRight: "1px solid var(--color-line)", background: "var(--surface-sidebar)" }}>
          <p className="mono-meta" style={{ fontSize: 11, color: "var(--color-slate)" }}>LUMINA</p>
          <div className="mt-4 space-y-1">
            {["Overview", "My Research", "Collections", "Assistant", "Notes"].map((item, i) => (
              <p
                key={item}
                className="px-3 py-1.5"
                style={{
                  fontSize: 13,
                  borderRadius: 8,
                  background: i === 1 ? "var(--surface-elevated)" : "transparent",
                  borderLeft: i === 1 ? "2px solid var(--color-electric-blue)" : "2px solid transparent",
                  color: i === 1 ? "var(--color-apple-ink)" : "var(--color-graphite)",
                  fontWeight: i === 1 ? 600 : 400,
                }}
              >
                {item}
              </p>
            ))}
          </div>
        </div>
        {/* document list + detail + notes */}
        <div className="min-w-0">
          <div className="px-4 pt-4">
            <p className="mono-meta" style={{ fontSize: 11, color: "var(--color-slate)" }}>MY RESEARCH · 3 PAPERS</p>
          </div>
          <div className="px-2 pb-2">
            {PREVIEW_DOCS.slice(0, 2).map((d) => (
              <DocumentRow key={d.id} doc={d} />
            ))}
          </div>
          <div className="grid gap-px sm:grid-cols-2" style={{ borderTop: "1px solid var(--color-line)", background: "var(--color-line)" }}>
            <div className="p-4" style={{ background: "var(--color-pure-white)" }}>
              <p className="mono-meta" style={{ fontSize: 11, color: "var(--color-slate)" }}>READING NOW</p>
              <p className="mt-1.5 truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--color-apple-ink)" }}>
                Retrieval-Augmented Generation — A Survey
              </p>
              <p className="mono-meta mt-1" style={{ fontSize: 11, color: "var(--color-slate)" }}>PDF · 42 PAGES · READY</p>
            </div>
            <div className="p-4" style={{ background: "var(--color-pure-white)" }}>
              <p className="mono-meta" style={{ fontSize: 11, color: "var(--color-slate)" }}>PINNED NOTE</p>
              <p className="mt-1.5" style={{ fontSize: 14, color: "var(--color-iron)", lineHeight: 1.5 }}>
                “Three-stage pipeline: parse, index, verify against source.”
              </p>
              <p className="mono-meta mt-1.5 flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--color-electric-blue)" }}>
                <span aria-hidden style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor", display: "inline-block" }} />
                SAVED · SYNCED
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="page-enter min-h-screen" style={{ background: "var(--color-fog-canvas)" }}>
      <Navbar />

      <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: 1120 }}>
        {/* ——— HERO: split editorial ——— */}
        <section className="grid items-center gap-10 pt-12 sm:pt-20 lg:grid-cols-[1fr_1.1fr]" aria-labelledby="hero-title" id="product">
          <div>
            <p className="mono-meta" style={{ fontSize: 12, letterSpacing: "0.08em", color: "var(--color-electric-blue)" }}>
              PERSONAL RESEARCH WORKSPACE
            </p>
            <h1 id="hero-title" className="font-editorial mt-4" style={{ fontSize: "clamp(44px,6vw,72px)", lineHeight: 1.04, color: "var(--color-apple-ink)" }}>
              Your research, connected.
            </h1>
            <p className="mt-5 max-w-md" style={{ fontSize: 18, lineHeight: 1.6, color: "var(--color-graphite)" }}>
              Lumina keeps your papers, notes, and references in one quiet
              workspace — organised today, ready for AI assistance tomorrow.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link href="/register" className="primary-button">
                Start researching
              </Link>
              <Link href="/dashboard" style={{ fontSize: 16, color: "var(--color-link-blue)" }}>
                Explore the workspace →
              </Link>
            </div>
            <p className="mono-meta mt-5" style={{ fontSize: 12, color: "var(--color-slate)" }}>
              PDF + DOCX · FREE TO START · YOUR FILES STAY YOURS
            </p>
          </div>
          <div>
            <ProductPreview />
            <p className="mt-2 text-right" style={{ fontSize: 12, color: "var(--color-slate)" }}>
              Illustrated preview — your library fills as you upload.
            </p>
          </div>
        </section>

        {/* ——— FEATURES ——— */}
        <section id="features" className="mx-auto mt-24" aria-label="Features" style={{ maxWidth: 860 }}>
          <p className="mono-meta" style={{ fontSize: 12, letterSpacing: "0.08em", color: "var(--color-electric-blue)" }}>WHAT IT DOES</p>
          <h2 className="font-editorial mt-3" style={{ fontSize: "clamp(32px,4vw,48px)", lineHeight: 1.08, color: "var(--color-apple-ink)" }}>
            A workspace, not another folder.
          </h2>
          <div className="mt-6" style={{ borderTop: "1px solid var(--color-line)" }}>
            <Feature title="Document library" body="Every paper in one searchable list — filter by type, sort by date or title, paginate through hundreds. Extraction status is always visible." />
            <Feature title="Real text extraction" body="PDFs and DOCX files are parsed on upload. Scanned documents say so honestly instead of pretending." />
            <Feature title="Notes that stay attached" body="Pin observations to their source paper. Saved to your library with timestamps — never lost silently." />
            <Feature title="Citations and structure" body="Generate APA, IEEE, and BibTeX references from one form, and tick through a paper checklist as you write." />
            <Feature title="Private by default" body="Your library is scoped to your account. Ownership is checked on every read, rename, download, and delete." />
          </div>
        </section>

        {/* ——— HOW IT WORKS ——— */}
        <section id="workflow" className="mx-auto mt-24" aria-label="How it works" style={{ maxWidth: 860 }}>
          <p className="mono-meta" style={{ fontSize: 12, letterSpacing: "0.08em", color: "var(--color-electric-blue)" }}>HOW IT WORKS</p>
          <h2 className="font-editorial mt-3" style={{ fontSize: "clamp(32px,4vw,48px)", lineHeight: 1.08, color: "var(--color-apple-ink)" }}>
            Three steps to an organised library.
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {[
              ["01", "Create an account", "Free. Takes about 30 seconds.", "/register", "Register"],
              ["02", "Upload a paper", "PDF or DOCX, up to 15 MB. Text extracts automatically.", "/documents", "Open library"],
              ["03", "Read and note", "Read the extracted text, pin notes, build citations.", "/guide", "Read the guide"],
            ].map(([n, t, d, href, link]) => (
              <div key={t} className="gallery-card">
                <p className="mono-meta" style={{ fontSize: 13, color: "var(--color-electric-blue)" }}>{n}</p>
                <p className="mt-2" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--color-apple-ink)" }}>{t}</p>
                <p className="mt-1.5" style={{ fontSize: 15, color: "var(--color-graphite)", lineHeight: 1.55 }}>{d}</p>
                <Link href={href} className="mt-3 inline-block" style={{ fontSize: 15, color: "var(--color-link-blue)" }}>{link} →</Link>
              </div>
            ))}
          </div>
        </section>

        {/* ——— HONEST AI NOTE ——— */}
        <section className="mx-auto mt-24" aria-label="About future AI features" style={{ maxWidth: 860 }}>
          <div className="gallery-card">
            <p className="mono-meta" style={{ fontSize: 12, letterSpacing: "0.08em", color: "var(--color-electric-blue)" }}>ROADMAP</p>
            <h2 className="mt-3" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--color-apple-ink)" }}>
              AI answers are coming — grounded or not at all.
            </h2>
            <p className="mt-2 max-w-2xl" style={{ fontSize: 16, color: "var(--color-graphite)", lineHeight: 1.6 }}>
              Phase 1 is the foundation: reliable uploads, real extraction, and
              organised notes. Phase 2 will add question answering over your
              documents with quoted sources. Until then, the assistant and
              insights pages are clearly labelled previews — nothing is
              fabricated.
            </p>
          </div>
        </section>

        {/* ——— FINAL CTA ——— */}
        <section className="mx-auto mt-24 text-center" aria-label="Get started" style={{ maxWidth: 680, marginBottom: 48 }}>
          <h2 className="font-editorial" style={{ fontSize: "clamp(36px,5vw,56px)", lineHeight: 1.06, color: "var(--color-apple-ink)" }}>
            Start with one paper.
          </h2>
          <p className="mx-auto mt-4 max-w-md" style={{ fontSize: 18, color: "var(--color-graphite)" }}>
            Create an account, upload a PDF, and read it properly.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="primary-button">Start researching</Link>
            <Link href="/guide" className="ghost-pill">Beginner&rsquo;s guide</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
