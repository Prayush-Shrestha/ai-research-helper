import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DocumentRow } from "@/components/documents/DocumentRow";
import type { ResearchDocument } from "@/types/document";

function Feature({ title, body, index }: { title: string; body: string; index: string }) {
  return (
    <div className="group flex gap-5 py-7" style={{ borderBottom: "1px solid var(--liquid-border-soft)" }}>
      <span className="mono-meta mt-1 shrink-0" style={{ fontSize: 12, color: "var(--color-electric-blue)" }}>{index}</span>
      <div>
        <h3 style={{ fontSize: 19, fontWeight: 650, letterSpacing: "-0.01em", lineHeight: 1.25, color: "var(--color-apple-ink)" }}>{title}</h3>
        <p className="mt-1.5 max-w-2xl" style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--color-graphite)" }}>{body}</p>
      </div>
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
];

function ProductPreview() {
  return (
    <div className="relative">
      <div aria-hidden className="orb" style={{ width: 420, height: 300, right: "-6%", top: "-12%", background: "radial-gradient(circle, rgba(157,231,193,0.18), transparent 65%)", filter: "blur(60px)" }} />
      <div
        aria-label="Illustrated preview of the Lumina workspace"
        className="gallery-card relative overflow-hidden !p-0"
        style={{ borderRadius: 28 }}
      >
        <div className="flex items-center gap-1.5 px-5 pt-4">
          <span style={{ width: 10, height: 10, borderRadius: 99, background: "rgba(255,255,255,0.16)" }} />
          <span style={{ width: 10, height: 10, borderRadius: 99, background: "rgba(255,255,255,0.16)" }} />
          <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--color-electric-blue)", boxShadow: "0 0 12px rgba(157,231,193,0.6)" }} />
          <span className="ml-2 tag-pill !text-[11px]">lumina · workspace</span>
        </div>
        <div className="grid md:grid-cols-[172px_1fr]">
          <div className="hidden p-4 md:block" style={{ borderRight: "1px solid var(--liquid-border-soft)" }}>
            <div className="mt-1 space-y-1">
              {["Overview", "My Research", "Collections", "Assistant", "Notes"].map((item, i) => (
                <p
                  key={item}
                  className="px-3 py-2"
                  style={{
                    fontSize: 13,
                    borderRadius: 12,
                    background: i === 1 ? "rgba(157,231,193,0.12)" : "transparent",
                    border: i === 1 ? "1px solid rgba(157,231,193,0.3)" : "1px solid transparent",
                    color: i === 1 ? "var(--color-apple-ink)" : "var(--color-graphite)",
                    fontWeight: i === 1 ? 600 : 450,
                  }}
                >
                  {item}
                </p>
              ))}
            </div>
            <div className="mt-4 rounded-2xl p-3" style={{ background: "rgba(157,231,193,0.08)", border: "1px solid rgba(157,231,193,0.2)" }}>
              <p style={{ fontSize: 12, fontWeight: 650, color: "var(--color-apple-ink)" }}>✦ 2 papers ready</p>
              <p style={{ fontSize: 11.5, color: "var(--color-graphite)" }}>Text extracted · linked</p>
            </div>
          </div>
          <div className="min-w-0">
            <div className="px-4 pt-4">
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-slate)" }}>A few papers, as an example</p>
            </div>
            <div className="px-2 pb-2">
              {PREVIEW_DOCS.map((d) => (
                <DocumentRow key={d.id} doc={d} />
              ))}
            </div>
            <div className="grid gap-px sm:grid-cols-2" style={{ borderTop: "1px solid var(--liquid-border-soft)", background: "var(--liquid-border-soft)" }}>
              <div className="p-5" style={{ background: "color-mix(in srgb, var(--color-pure-white) 82%, transparent)", backdropFilter: "blur(12px)" }}>
                <p className="tag-pill !text-[11px]">Currently reading</p>
                <p className="mt-2 truncate" style={{ fontSize: 14.5, fontWeight: 650, color: "var(--color-apple-ink)" }}>
                  Retrieval-Augmented Generation — A Survey
                </p>
                <p className="mt-1" style={{ fontSize: 12.5, color: "var(--color-slate)" }}>PDF · 42 pages · ready to read</p>
              </div>
              <div className="p-5" style={{ background: "color-mix(in srgb, var(--color-pure-white) 82%, transparent)", backdropFilter: "blur(12px)" }}>
                <p className="tag-pill crimson !text-[11px]">A note I left myself</p>
                <p className="mt-2" style={{ fontSize: 14, color: "var(--color-iron)", lineHeight: 1.55, fontStyle: "italic" }}>
                  “Three stages: parse it, index it, then check against the source.”
                </p>
                <p className="mt-2 flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600, color: "var(--color-electric-blue)" }}>
                  <span aria-hidden style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor", display: "inline-block", boxShadow: "0 0 8px currentColor" }} />
                  Saved
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2.5 text-right" style={{ fontSize: 12, color: "var(--color-slate)" }}>
        Illustrated preview — your library fills as you upload.
      </p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="page-enter min-h-screen">
      <Navbar />

      <main className="relative mx-auto px-5 sm:px-8" style={{ maxWidth: 1180 }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
          <div className="orb float-slow" style={{ width: 620, height: 420, left: "-12%", top: "4%", background: "radial-gradient(circle, rgba(157,231,193,0.13), transparent 65%)" }} />
          <div className="orb" style={{ width: 560, height: 380, right: "-10%", top: "30%", background: "radial-gradient(circle, rgba(138,180,248,0.1), transparent 65%)" }} />
        </div>

        {/* ——— HERO ——— */}
        <section className="relative grid items-center gap-12 pt-12 sm:pt-20 lg:grid-cols-[1fr_1.05fr]" aria-labelledby="hero-title" id="product" style={{ zIndex: 1 }}>
          <div className="rise rise-1">
            <span className="eyebrow"><span className="dot" /> Built for students drowning in PDFs</span>
            <h1 id="hero-title" className="font-editorial mt-5" style={{ fontSize: "clamp(46px,6vw,74px)", lineHeight: 1.02, color: "var(--color-apple-ink)" }}>
              A desk for<br />your <span style={{ background: "linear-gradient(120deg, var(--color-electric-blue), #8AB4F8)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>papers.</span>
            </h1>
            <p className="hero-sub mt-5 max-w-md">
              I started Lumina because my downloads folder was a mess of
              half-read papers. Upload them here, keep notes next to the source,
              and find things again. That is the whole idea.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register" className="primary-button" style={{ padding: "13px 30px", fontSize: 16 }}>
                Make an account
              </Link>
              <Link href="/dashboard" className="ghost-pill">
                Look inside →
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="tag-pill">PDF + Word</span>
              <span className="tag-pill">Free</span>
              <span className="tag-pill crimson">Private by default</span>
            </div>
          </div>
          <div className="rise rise-2">
            <ProductPreview />
          </div>
        </section>

        {/* ——— LOGOS / STATS STRIP ——— */}
        <section className="rise rise-3 relative mt-16 grid gap-3 sm:grid-cols-3" style={{ zIndex: 1 }}>
          {[
            ["15 MB", "per file, parsed instantly"],
            ["3 formats", "APA · IEEE · BibTeX in one click"],
            ["100%", "yours — isolated per account"],
          ].map(([v, l]) => (
            <div key={l} className="glass-stat">
              <p style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>{v}</p>
              <p className="mt-1" style={{ fontSize: 13.5, color: "var(--color-graphite)" }}>{l}</p>
            </div>
          ))}
        </section>

        {/* ——— FEATURES ——— */}
        <section id="features" className="relative mx-auto mt-24" aria-label="Features" style={{ maxWidth: 860, zIndex: 1 }}>
          <span className="eyebrow"><span className="dot" /> What you actually get</span>
          <h2 className="font-editorial mt-4" style={{ fontSize: "clamp(32px,4vw,50px)", lineHeight: 1.06, color: "var(--color-apple-ink)" }}>
            Less filing, more reading.
          </h2>
          <div className="gallery-card mt-8 !p-8">
            <Feature index="01" title="One list for everything" body="All your papers in a single searchable list. Filter by file type, sort a few ways. It is plain on purpose, so a hundred papers still feel manageable." />
            <Feature index="02" title="It reads the file for you" body="Upload a PDF or Word doc and the text comes out automatically. If a scan has no readable text, it tells you straight instead of showing a blank page." />
            <Feature index="03" title="Notes sit next to their paper" body="Jot down why a paper matters while you are reading it. The note stays attached to that paper, with a date, so you remember the context later." />
            <Feature index="04" title="Citations without the fuss" body="Fill in a small form and get APA, IEEE, or BibTeX back. There is also a checklist if you are writing and keep forgetting sections." />
            <div className="flex gap-5 py-7">
              <span className="mono-meta mt-1 shrink-0" style={{ fontSize: 12, color: "var(--color-electric-blue)" }}>05</span>
              <div>
                <h3 style={{ fontSize: 19, fontWeight: 650, color: "var(--color-apple-ink)" }}>Yours means yours</h3>
                <p className="mt-1.5" style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--color-graphite)" }}>You only ever see your own uploads. Every page checks that before showing anything.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ——— HOW IT WORKS ——— */}
        <section id="workflow" className="relative mx-auto mt-24" aria-label="How it works" style={{ maxWidth: 960, zIndex: 1 }}>
          <div className="text-center">
            <span className="eyebrow"><span className="dot" /> Getting started</span>
            <h2 className="font-editorial mt-4" style={{ fontSize: "clamp(32px,4vw,50px)", color: "var(--color-apple-ink)" }}>
              Up and running in minutes.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["01 · First", "Make an account", "Name, email, password. About half a minute.", "/register", "Register"],
              ["02 · Then", "Drop in a paper", "PDF or Word, up to 15 MB. Text pulls out by itself.", "/documents", "Open library"],
              ["03 · After that", "Read and scribble", "Read the text, save a note, grab a citation.", "/guide", "Read the guide"],
            ].map(([n, t, d, href, link]) => (
              <div key={t} className="gallery-card hover-lift !p-6">
                <p className="tag-pill crimson !text-[11px]">{n}</p>
                <p className="mt-3" style={{ fontSize: 18, fontWeight: 650, letterSpacing: "-0.01em", color: "var(--color-apple-ink)" }}>{t}</p>
                <p className="mt-1.5" style={{ fontSize: 14.5, color: "var(--color-graphite)", lineHeight: 1.6 }}>{d}</p>
                <Link href={href} className="mt-4 inline-block" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--color-link-blue)" }}>{link} →</Link>
              </div>
            ))}
          </div>
        </section>

        {/* ——— AI NOTE ——— */}
        <section className="relative mx-auto mt-16" aria-label="About future AI features" style={{ maxWidth: 960, zIndex: 1 }}>
          <div className="gallery-card relative overflow-hidden">
            <div aria-hidden className="orb" style={{ width: 380, height: 240, right: "-5%", top: "-30%", background: "radial-gradient(circle, rgba(196,181,253,0.16), transparent 65%)" }} />
            <span className="tag-pill crimson">✦ A note on AI</span>
            <h2 className="mt-3" style={{ fontSize: 24, fontWeight: 650, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
              Question answering is next. It will quote or stay quiet.
            </h2>
            <p className="mt-2 max-w-2xl" style={{ fontSize: 15.5, color: "var(--color-graphite)", lineHeight: 1.65 }}>
              Right now this is a solid base: uploads that work, text you can
              read, notes that stay put. The next step is asking questions over
              your own files with real quotes. The assistant pages are marked
              as early previews until that lands.
            </p>
          </div>
        </section>

        {/* ——— FINAL CTA ——— */}
        <section className="relative mx-auto mt-16 text-center" aria-label="Get started" style={{ maxWidth: 720, marginBottom: 24, zIndex: 1 }}>
          <div className="gallery-card !p-12" style={{ borderRadius: 32 }}>
            <div aria-hidden className="orb" style={{ width: 500, height: 300, left: "50%", top: "-40%", transform: "translateX(-50%)", background: "radial-gradient(circle, rgba(157,231,193,0.16), transparent 65%)" }} />
            <h2 className="font-editorial relative" style={{ fontSize: "clamp(34px,5vw,54px)", lineHeight: 1.05, color: "var(--color-apple-ink)" }}>
              Got one PDF lying around?
            </h2>
            <p className="relative mx-auto mt-4 max-w-md" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
              Put it here and see if this feels better than your downloads folder.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className="primary-button" style={{ padding: "13px 32px" }}>Make an account</Link>
              <Link href="/guide" className="ghost-pill">How it works</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
