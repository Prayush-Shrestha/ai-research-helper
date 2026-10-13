import Link from "next/link";

const STEPS = [
  {
    n: "1",
    title: "Create your account",
    body: "Tap Start research and enter your name, email, and a password (6+ characters). Your library is ready immediately — no setup, no waiting.",
  },
  {
    n: "2",
    title: "Upload your first paper",
    body: "Open the Library and tap “Upload a paper”. Pick a PDF or DOCX (up to 25 MB). The text is extracted automatically and the paper appears at the top.",
  },
  {
    n: "3",
    title: "Read it",
    body: "Tap any row to open the reader: contents on the left, clean text on the right. Search within the paper, rename it inline, or print it.",
  },
  {
    n: "4",
    title: "Ask it questions",
    body: "Open the Assistant, pick the paper (or a few), and ask — “summarise this”, “what method is used?”, “what are the limitations?” Answers quote the file.",
  },
  {
    n: "5",
    title: "Keep what matters",
    body: "Pin notes to their source paper, group papers into collections, and generate APA, IEEE or BibTeX citations in the Toolkit. History remembers the rest.",
  },
];

export default function GuidePage() {
  return (
    <div>
      <section className="pt-6 text-center sm:pt-10">
        <h1 className="type-heading mx-auto" style={{ color: "var(--color-apple-ink)" }}>
          Five minutes,
          <br />
          then file something.
        </h1>
        <p className="mx-auto mt-4 max-w-xl" style={{ fontSize: 21, color: "var(--color-graphite)" }}>
          New here? This page shows where everything lives and what to tap first.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="primary-button">
            Create account
          </Link>
          <Link href="/documents" className="ghost-pill">
            Skip to library
          </Link>
        </div>
      </section>

      <section className="gallery-card mt-10 grid gap-6 lg:grid-cols-2" aria-label="What this app is">
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>WHAT IT IS</p>
          <p className="mt-2" style={{ fontSize: 17, color: "var(--color-iron)", lineHeight: 1.6 }}>
            A private shelf for your papers. Upload PDFs, read them cleanly,
            ask questions that quote the page, and keep notes and citations together.
          </p>
          <p className="mt-3" style={{ fontSize: 17, color: "var(--color-iron)", lineHeight: 1.6 }}>
            Answers come from your uploaded files — open the reader any time
            to verify a line word for word.
          </p>
        </div>
        <div style={{ background: "var(--color-fog-canvas)", borderRadius: 18, padding: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>WHERE THINGS LIVE</p>
          <ul className="mt-2.5 space-y-2" style={{ fontSize: 15, color: "var(--color-iron)", lineHeight: 1.55 }}>
            <li>· <strong style={{ color: "var(--color-apple-ink)" }}>Library</strong> — every paper, searchable.</li>
            <li>· <strong style={{ color: "var(--color-apple-ink)" }}>Assistant</strong> — questions and summaries.</li>
            <li>· <strong style={{ color: "var(--color-apple-ink)" }}>Collections & Notes</strong> — your organisation.</li>
            <li>· <strong style={{ color: "var(--color-apple-ink)" }}>Toolkit</strong> — citations and checklists.</li>
          </ul>
        </div>
      </section>

      <section className="mt-8" aria-label="First steps">
        <h2 className="type-heading-sm" style={{ color: "var(--color-apple-ink)" }}>First time? Do this in order.</h2>
        <div className="gallery-card mt-4 !p-4 sm:!p-5">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="flex gap-4 py-4"
              style={{ borderBottom: "1px solid var(--color-line)" }}
            >
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center"
                style={{ borderRadius: 999, background: "var(--color-apple-ink)", color: "var(--color-fog-canvas)", fontSize: 15, fontWeight: 600 }}
              >
                {s.n}
              </span>
              <div>
                <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--color-apple-ink)" }}>
                  {s.title}
                </h3>
                <p className="mt-1 max-w-xl" style={{ fontSize: 17, color: "var(--color-iron)", lineHeight: 1.55 }}>
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-label="Troubleshooting">
        <h2 className="type-heading-sm" style={{ color: "var(--color-apple-ink)" }}>If something looks off.</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Sent back to login?", "Your session expired or was cleared. Sign in again — your papers stay put."],
            ["Upload won't go through?", "Check it's a PDF or DOCX under 25 MB, then try again."],
            ["Library is empty?", "You haven't uploaded yet, or the demo data was reset. Upload one paper."],
            ["No text in the reader?", "Some scanned PDFs have no selectable text. Try another file."],
            ["Want a fresh start?", "Settings lets you reset the demo library on this browser."],
            ["Which files work?", "PDF and DOCX. Anything else is turned away at upload."],
          ].map(([q, a]) => (
            <div key={q} className="gallery-card">
              <p style={{ fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>{q}</p>
              <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)", lineHeight: 1.55 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="gallery-card mb-4 mt-8 text-center">
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>READY WHEN YOU ARE</p>
        <p className="mx-auto mt-2" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 32, fontWeight: 600, maxWidth: 560, lineHeight: 1.15, color: "var(--color-apple-ink)" }}>
          Upload one paper. That&rsquo;s the whole trick.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/documents" className="primary-button">
            Open my library
          </Link>
          <Link href="/dashboard" className="secondary-button">
            Back to dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
