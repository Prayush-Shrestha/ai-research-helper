import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ResearchNucleus } from "@/components/research/Nucleus";

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-8" style={{ borderBottom: "1px solid var(--color-line)" }}>
      <h3 style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.009em", lineHeight: 1.14, color: "var(--color-apple-ink)" }}>{title}</h3>
      <p className="mt-2 max-w-2xl" style={{ fontSize: 17, lineHeight: 1.47, letterSpacing: "-0.019em", color: "var(--color-graphite)" }}>{body}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="page-enter min-h-screen" style={{ background: "var(--color-fog-canvas)" }}>
      <Navbar />

      <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-max-width)" }}>
        {/* ——— HERO: product floating in fog, headline lower-left ——— */}
        <section className="pt-12 text-center sm:pt-20" aria-labelledby="hero-title" id="product">
          <p style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 21, fontWeight: 600, letterSpacing: "-0.012em", color: "var(--color-apple-ink)" }}>
            Lumina
          </p>
          <h1
            id="hero-title"
            className="type-hero mx-auto mt-3"
            style={{ color: "var(--color-apple-ink)", maxWidth: 900 }}
          >
            Read less.
            <br />
            Understand more.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl" style={{ fontSize: 21, lineHeight: 1.47, letterSpacing: "-0.01em", color: "var(--color-graphite)" }}>
            Upload your research papers, ask questions about them, and get answers
            that point to the exact page.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="primary-button">
              Start research
            </Link>
            <Link href="#workflow" className="secondary-button">
              See how it works →
            </Link>
          </div>
          <p className="mt-3" style={{ fontSize: 12, color: "var(--color-slate)" }}>
            PDF + DOCX · Free to start · Your files stay yours.
          </p>

          {/* hero visual — floating, frameless, centered */}
          <div className="mx-auto mt-10 w-full" style={{ maxWidth: 980 }}>
            <ResearchNucleus size={980} />
          </div>
          <p className="mt-2" style={{ fontSize: 12, color: "var(--color-slate)" }}>
            Your papers, connected by the ideas they share.
          </p>
        </section>

        {/* ——— START IN 2 MINUTES: three quiet steps ——— */}
        <section aria-label="Start in 2 minutes" className="mx-auto mt-20 grid gap-6 sm:grid-cols-3" style={{ maxWidth: 1024 }}>
          {[
            ["Create an account", "Free. Takes about 30 seconds."],
            ["Upload a paper", "PDF or DOCX, up to 25 MB."],
            ["Ask a question", "Try “What method is used?”"],
          ].map(([t, d], i) => (
            <div key={t} className="gallery-card text-center">
              <p style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 32, fontWeight: 600, color: "var(--color-apple-ink)" }}>{i + 1}</p>
              <p className="mt-2" style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--color-apple-ink)" }}>{t}</p>
              <p className="mt-1" style={{ fontSize: 17, color: "var(--color-graphite)" }}>{d}</p>
            </div>
          ))}
        </section>
        <div className="mt-6 text-center">
          <Link href="/guide" className="secondary-button">Read the beginner&rsquo;s guide →</Link>
        </div>

        {/* ——— FEATURES ——— */}
        <section id="features" className="mx-auto mt-24" aria-label="Features" style={{ maxWidth: 1024 }}>
          <div className="flex items-baseline justify-between">
            <h2 className="type-heading-sm" style={{ color: "var(--color-apple-ink)" }}>What you can do.</h2>
            <Link href="#workflow" className="secondary-button !p-0">How it works →</Link>
          </div>
          <div className="mt-4" style={{ borderTop: "1px solid var(--color-line)" }}>
            <Feature title="Ask questions" body="Ask anything about a paper — its findings, method, or limits. Every answer quotes the passage it came from and names the source." />
            <Feature title="Summaries with sources" body="Turn a 40-page paper into three short paragraphs: the claim, the method, and what the authors admit is missing. Each part links back to its page." />
            <Feature title="Compare papers" body="Select up to five papers and ask how their methods differ. Built for literature reviews and finding research gaps." />
            <Feature title="A library that stays findable" body="Every paper in one searchable list. Filter by type, sort by date or title, and reopen anything in one click." />
            <Feature title="Notes and collections" body="Group papers into collections, pin notes to the document they came from, and let history remember where you left off." />
            <Feature title="Citations, done right" body="Generate APA, IEEE, and BibTeX references from one form — plus a checklist that makes sure your paper has every section." />
          </div>
        </section>

        {/* ——— INSIDE: rounded feature visual ——— */}
        <section className="mt-24" aria-label="Inside the app">
          <h2 className="type-heading-sm mx-auto text-center" style={{ color: "var(--color-apple-ink)", maxWidth: 700 }}>Inside the app.</h2>
          <p className="mx-auto mt-3 max-w-xl text-center" style={{ fontSize: 19, color: "var(--color-graphite)" }}>
            The library and the assistant, working from the same files.
          </p>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="gallery-card">
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>YOUR LIBRARY</p>
              <div className="mt-4">
                {[
                  ["Retrieval-Augmented Generation — Survey", "PDF · 42 pages · Ready"],
                  ["Vector Databases — A Comparative Study", "PDF · 27 pages · Ready"],
                  ["Evaluation Metrics for Language Models", "PDF · 22 pages · Processing"],
                ].map(([t, m]) => (
                  <div key={t} className="flex items-center gap-3 py-3.5" style={{ borderBottom: "1px solid var(--color-line)" }}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate" style={{ fontSize: 17, fontWeight: 500, color: "var(--color-apple-ink)" }}>{t}</p>
                      <p style={{ fontSize: 12, color: "var(--color-slate)" }}>{m}</p>
                    </div>
                    <span aria-hidden style={{ color: "var(--color-link-blue)", fontSize: 17 }}>→</span>
                  </div>
                ))}
              </div>
              <p className="mt-4" style={{ fontSize: 12, color: "var(--color-slate)" }}>Example shown. Your library fills as you upload.</p>
            </div>
            <div className="gallery-card">
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>AN ANSWER, WITH ITS SOURCE</p>
              <p className="mt-4" style={{ fontSize: 12, color: "var(--color-slate)" }}>Q — What method does this paper use?</p>
              <p className="mt-2" style={{ fontSize: 17, lineHeight: 1.6, color: "var(--color-iron)" }}>
                Three stages: parse the text keeping page numbers, index the passages,
                then show each claim next to its source.
                <span style={{ color: "var(--color-apple-ink)", fontWeight: 500 }}> — p.14 (example)</span>
              </p>
              <div className="mt-5 flex items-center gap-3">
                <span className="primary-button" style={{ padding: "8px 20px", fontSize: 15 }}>Ask</span>
                <span style={{ fontSize: 17, color: "var(--color-link-blue)" }}>Copy answer</span>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link href="/dashboard" className="secondary-button">Open the live workspace →</Link>
          </div>
        </section>

        {/* ——— HOW IT WORKS ——— */}
        <section id="workflow" className="mx-auto mt-24" aria-label="How it works" style={{ maxWidth: 1024 }}>
          <h2 className="type-heading-sm" style={{ color: "var(--color-apple-ink)" }}>How it works.</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {[
              ["Upload", "Open the Library and upload a PDF or DOCX. The text is extracted automatically.", "/documents", "Go to Library"],
              ["Read & ask", "Read the paper, then ask in the Assistant — summaries, findings, methods.", "/assistant", "Go to Assistant"],
              ["Organise", "Save notes, group collections, generate citations.", "/collections", "Go to Collections"],
            ].map(([t, d, href, link]) => (
              <div key={t} className="gallery-card">
                <p style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.012em", color: "var(--color-apple-ink)" }}>{t}</p>
                <p className="mt-2" style={{ fontSize: 17, color: "var(--color-graphite)" }}>{d}</p>
                <Link href={href} className="mt-3 inline-block" style={{ fontSize: 17, color: "var(--color-link-blue)" }}>{link} →</Link>
              </div>
            ))}
          </div>
        </section>

        {/* ——— FINAL CTA ——— */}
        <section className="mx-auto mt-24 text-center" aria-label="Get started" style={{ maxWidth: 700, marginBottom: 40 }}>
          <h2 className="type-heading" style={{ color: "var(--color-apple-ink)" }}>
            Start with one paper.
          </h2>
          <p className="mx-auto mt-4 max-w-md" style={{ fontSize: 21, color: "var(--color-graphite)" }}>
            Create an account, upload a PDF, and ask your first question.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="primary-button">Start research</Link>
            <Link href="/guide" className="ghost-pill">Beginner&rsquo;s guide</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
