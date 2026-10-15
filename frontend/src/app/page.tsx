import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/motion/Reveal";
import { Spotlight } from "@/components/motion/Spotlight";
import { DocumentRow } from "@/components/documents/DocumentRow";
import type { ResearchDocument } from "@/types/document";

function Feature({ title, body, aside, index }: { title: string; body: string; aside: string; index: string }) {
  return (
    <div className="group flex gap-5 py-7" style={{ borderBottom: "1px solid var(--liquid-border-soft)" }}>
      <span className="mono-meta mt-1 shrink-0" style={{ fontSize: 12, color: "var(--color-slate)" }}>{index}</span>
      <div>
        <h3 style={{ fontSize: 19, fontWeight: 650, letterSpacing: "-0.01em", lineHeight: 1.25, color: "var(--color-apple-ink)" }}>{title}</h3>
        <p className="mt-1.5 max-w-2xl" style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--color-graphite)" }}>{body}</p>
        <p className="hand mt-1.5" style={{ fontSize: 15, color: "var(--color-slate)" }}>{aside}</p>
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

const TICKER = [
  "47 half-read tabs",
  "final_final_v2.pdf",
  "citations at 2am",
  "“where did I save that?”",
  "one more paper, then sleep",
  "notes on napkins",
];

function ProductPreview() {
  return (
    <div className="relative">
      <div
        aria-label="Illustrated preview of the Lumina workspace"
        className="gallery-card taped tilt-r relative overflow-hidden !p-0"
        style={{ borderRadius: 28 }}
      >
        <div className="flex items-center gap-1.5 px-5 pt-4">
          <span style={{ width: 10, height: 10, borderRadius: 99, background: "rgba(127,127,133,0.4)" }} />
          <span style={{ width: 10, height: 10, borderRadius: 99, background: "rgba(127,127,133,0.4)" }} />
          <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--color-apple-ink)" }} />
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
                    background: i === 1 ? "rgba(127,127,133,0.14)" : "transparent",
                    border: i === 1 ? "1px solid var(--liquid-border)" : "1px solid transparent",
                    color: i === 1 ? "var(--color-apple-ink)" : "var(--color-graphite)",
                    fontWeight: i === 1 ? 600 : 450,
                  }}
                >
                  {item}
                </p>
              ))}
            </div>
            <div className="mt-4 rounded-2xl p-3" style={{ background: "rgba(127,127,133,0.1)", border: "1px solid var(--liquid-border-soft)" }}>
              <p style={{ fontSize: 12, fontWeight: 650, color: "var(--color-apple-ink)" }}>2 papers ready</p>
              <p style={{ fontSize: 11.5, color: "var(--color-graphite)" }}>text extracted · linked</p>
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
                <p className="mt-1" style={{ fontSize: 12.5, color: "var(--color-slate)" }}>PDF · 42 pages · page 17 of 42, obviously</p>
              </div>
              <div className="p-5" style={{ background: "color-mix(in srgb, var(--color-pure-white) 82%, transparent)", backdropFilter: "blur(12px)" }}>
                <p className="tag-pill crimson !text-[11px]">A note I left myself</p>
                <p className="hand mt-2" style={{ fontSize: 15.5, color: "var(--color-iron)", lineHeight: 1.55 }}>
                  “Three stages: parse it, index it, then check against the source!!”
                </p>
                <p className="mt-2 flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600, color: "var(--color-graphite)" }}>
                  <span aria-hidden style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor", display: "inline-block" }} />
                  Saved at 1:47am
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="hand mt-3 text-right" style={{ fontSize: 14, color: "var(--color-slate)" }}>
        my actual library — paper names changed to protect the guilty (me)
      </p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="page-enter min-h-screen">
      <Navbar />

      <main className="relative mx-auto px-5 sm:px-8" style={{ maxWidth: 1180 }}>
        {/* ——— HERO ——— */}
        <section className="relative grid items-center gap-12 overflow-visible pt-10 sm:pt-16 lg:grid-cols-[1fr_1.05fr]" aria-labelledby="hero-title" id="product" style={{ zIndex: 1 }}>
          <Spotlight />
          <div className="rise rise-1 relative" style={{ zIndex: 1 }}>
            <p className="hand" style={{ fontSize: 19, color: "var(--color-graphite)" }}>
              from a downloads folder with 400+ unread PDFs —
            </p>
            <h1 id="hero-title" className="mt-3" style={{ fontSize: "clamp(46px,6vw,74px)", fontWeight: 650, letterSpacing: "-0.035em", lineHeight: 1.0, color: "var(--color-apple-ink)" }}>
              A desk for<br />your <span className="hand" style={{ letterSpacing: "-0.01em" }}>papers.</span>
            </h1>
            <p className="hero-sub mt-5 max-w-md">
              Hi, I&apos;m the person who kept losing papers in browser tabs.
              So I built a shelf: drop your PDFs in, scribble notes next to
              them, grab citations when it&apos;s 2am and the deadline is real.
              That&apos;s the whole pitch.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register" className="primary-button" style={{ padding: "14px 32px", fontSize: 16 }}>
                Get started — it&apos;s free
              </Link>
              <Link href="/dashboard" className="ghost-pill">
                Look inside →
              </Link>
            </div>
            <p className="mt-5" style={{ fontSize: 13.5, color: "var(--color-slate)" }}>
              PDFs + Word · no credit card · I never see your uploads
            </p>
          </div>
          <div className="rise rise-2 relative">
            {/* hand-drawn nudge */}
            <div aria-hidden className="drift absolute -top-12 left-2 z-10 hidden items-center gap-2 sm:flex">
              <svg className="doodle-draw" width="72" height="46" viewBox="0 0 72 46" fill="none" aria-hidden>
                <path d="M4 6 C 24 4, 48 8, 62 34 M62 34 l-9 -3 M62 34 l1 -9" stroke="var(--color-slate)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="hand" style={{ fontSize: 16, color: "var(--color-slate)" }}>this bit is real, go click it</span>
            </div>
            <ProductPreview />
          </div>
        </section>

        {/* ——— TICKER ——— */}
        <Reveal className="relative mt-14" style={{ zIndex: 1 } as never}>
          <div className="marquee gallery-card !p-0" aria-hidden>
            <div className="marquee-track py-3.5">
              {[...TICKER, ...TICKER].map((t, i) => (
                <span key={i} className="flex items-center" style={{ fontSize: 14.5, color: "var(--color-graphite)", whiteSpace: "nowrap" }}>
                  <span className="hand px-6" style={{ fontSize: 16 }}>{t}</span>
                  <span aria-hidden style={{ color: "var(--color-slate)" }}>✦</span>
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ——— HONEST NUMBERS ——— */}
        <Reveal className="relative mt-6 grid gap-3 sm:grid-cols-3" style={{ zIndex: 1 } as never}>
          {[
            ["15 MB", "biggest file it'll swallow. most papers are ~3."],
            ["3", "citation styles. APA, IEEE, BibTeX — that's all I know."],
            ["0", "trackers, ads, or 'AI insights' dashboards."],
          ].map(([v, l]) => (
            <div key={l} className="glass-stat">
              <p style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>{v}</p>
              <p className="mt-1" style={{ fontSize: 13.5, color: "var(--color-graphite)", lineHeight: 1.55 }}>{l}</p>
            </div>
          ))}
        </Reveal>

        {/* ——— FEATURES ——— */}
        <Reveal as="section" id="features" className="relative mx-auto mt-24" aria-label="Features" style={{ maxWidth: 860, zIndex: 1 } as never}>
          <p className="hand" style={{ fontSize: 19, color: "var(--color-graphite)" }}>what you actually get (no more, no less)</p>
          <h2 className="mt-2" style={{ fontSize: "clamp(32px,4vw,50px)", fontWeight: 650, letterSpacing: "-0.03em", lineHeight: 1.05, color: "var(--color-apple-ink)" }}>
            Less filing, more reading.
          </h2>
          <div className="gallery-card mt-8 !p-8">
            <Feature index="01" title="One list for everything" body="All your papers in a single searchable list. Filter by file type, sort a few ways. Deliberately plain — a hundred papers still feel manageable." aside="yes, I tried folders. no, they didn't survive contact with me." />
            <Feature index="02" title="It reads the file for you" body="Upload a PDF or Word doc and the text comes out on its own. Scanned image with no readable text? It says so straight, instead of a mysterious blank page." aside="OCR for scans is on the someday list. someday is doing great." />
            <Feature index="03" title="Notes sit next to their paper" body="Jot down why a paper matters while reading it. The note stays attached, dated, so future-you remembers the context." aside="future-me has thanked past-me twice. a record." />
            <Feature index="04" title="Citations without the fuss" body="Small form in, APA / IEEE / BibTeX out. Plus a writing checklist, because I kept forgetting the limitations section." aside="the checklist is just my supervisor's comments, formatted." />
            <div className="flex gap-5 py-7">
              <span className="mono-meta mt-1 shrink-0" style={{ fontSize: 12, color: "var(--color-slate)" }}>05</span>
              <div>
                <h3 style={{ fontSize: 19, fontWeight: 650, color: "var(--color-apple-ink)" }}>Yours means yours</h3>
                <p className="mt-1.5" style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--color-graphite)" }}>You only ever see your own uploads. Every page checks first. I can&apos;t see your files, which is good, because my curiosity is boundless.</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ——— HOW IT WORKS ——— */}
        <Reveal as="section" id="workflow" className="relative mx-auto mt-24" aria-label="How it works" style={{ maxWidth: 960, zIndex: 1 } as never}>
          <div className="text-center">
            <p className="hand" style={{ fontSize: 19, color: "var(--color-graphite)" }}>the whole onboarding, honestly</p>
            <h2 className="mt-2" style={{ fontSize: "clamp(32px,4vw,50px)", fontWeight: 650, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
              Up and running in minutes.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["step one", "Get started", "Name, email, password. About half a minute, I timed it.", "/register", "Create account →"],
              ["step two", "Drop in a paper", "PDF or Word, up to 15 MB. The one that's been open in a tab for a week.", "/documents", "Open the library →"],
              ["step three", "Read & scribble", "Read the text, save a note, steal a citation at 2am.", "/guide", "Read the guide →"],
            ].map(([n, t, d, href, link]) => (
              <div key={t} className="gallery-card hover-lift !p-6">
                <p className="hand" style={{ fontSize: 16, color: "var(--color-slate)" }}>{n}</p>
                <p className="mt-2" style={{ fontSize: 18, fontWeight: 650, letterSpacing: "-0.01em", color: "var(--color-apple-ink)" }}>{t}</p>
                <p className="mt-1.5" style={{ fontSize: 14.5, color: "var(--color-graphite)", lineHeight: 1.6 }}>{d}</p>
                <Link href={href} className="mt-4 inline-block" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--color-link-blue)" }}>{link}</Link>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ——— FIELD NOTES ——— */}
        <Reveal as="section" className="relative mx-auto mt-16" aria-label="Field notes" style={{ maxWidth: 860, zIndex: 1 } as never}>
          <div className="gallery-card tilt-l !p-8">
            <div className="flex items-baseline justify-between gap-4">
              <h2 style={{ fontSize: 24, fontWeight: 650, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
                Field notes
              </h2>
              <p className="hand shrink-0" style={{ fontSize: 15, color: "var(--color-slate)" }}>stuff I&apos;ve fixed lately</p>
            </div>
            <div className="mt-4">
              {[
                ["Oct 12", "Uploads used to choke on 14.9 MB files. Off by one. Classic. Fixed."],
                ["Oct 03", "Word docs with footnotes rendered as soup. Less soupy now."],
                ["Sep 27", "Someone (me) deleted a note with no undo. Delete asks first now."],
              ].map(([date, note]) => (
                <div key={date} className="flex gap-4 py-3.5" style={{ borderTop: "1px solid var(--liquid-border-soft)" }}>
                  <span className="mono-meta shrink-0 pt-0.5" style={{ fontSize: 12, color: "var(--color-slate)" }}>{date}</span>
                  <p style={{ fontSize: 15.5, color: "var(--color-iron)", lineHeight: 1.6 }}>{note}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ——— PEOPLE ASK ——— */}
        <Reveal as="section" className="relative mx-auto mt-16" aria-label="Questions people actually ask" style={{ maxWidth: 860, zIndex: 1 } as never}>
          <h2 className="text-center" style={{ fontSize: "clamp(28px,3.5vw,40px)", fontWeight: 650, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
            Things people ask me
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["“Is it free?”", "Yes. I'm a student. Charging students would be a bold move."],
              ["“Do you train AI on my PDFs?”", "No. I can barely afford the server. Your files stay yours."],
              ["“What if I upload garbage?”", "It'll hold your garbage lovingly. Search still works. No judgment."],
            ].map(([q, a]) => (
              <div key={q} className="gallery-card !p-6">
                <p className="hand" style={{ fontSize: 17, color: "var(--color-apple-ink)" }}>{q}</p>
                <p className="mt-2" style={{ fontSize: 14.5, color: "var(--color-graphite)", lineHeight: 1.6 }}>{a}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ——— AI NOTE ——— */}
        <Reveal as="section" className="relative mx-auto mt-16" aria-label="About future AI features" style={{ maxWidth: 860, zIndex: 1 } as never}>
          <div className="gallery-card">
            <span className="tag-pill">a note on AI, since everyone asks</span>
            <h2 className="mt-3" style={{ fontSize: 24, fontWeight: 650, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
              Question answering is next. It will quote or stay quiet.
            </h2>
            <p className="mt-2 max-w-2xl" style={{ fontSize: 15.5, color: "var(--color-graphite)", lineHeight: 1.65 }}>
              Right now this is a solid base: uploads that work, text you can
              read, notes that stay put. Next: asking questions over your own
              files, with real quotes. The assistant pages wear an &ldquo;early
              preview&rdquo; badge until then — I&apos;d rather under-promise.
            </p>
          </div>
        </Reveal>

        {/* ——— FINAL CTA ——— */}
        <Reveal as="section" className="relative mx-auto mt-16 text-center" aria-label="Get started" style={{ maxWidth: 720, marginBottom: 24, zIndex: 1 } as never}>
          <div className="gallery-card taped !p-12" style={{ borderRadius: 32 }}>
            <p className="hand" style={{ fontSize: 18, color: "var(--color-graphite)" }}>no sales call, I promise. there&apos;s no sales team. it&apos;s me.</p>
            <h2 className="mt-3" style={{ fontSize: "clamp(34px,5vw,54px)", fontWeight: 650, letterSpacing: "-0.03em", lineHeight: 1.04, color: "var(--color-apple-ink)" }}>
              Got one PDF lying around?
            </h2>
            <p className="mx-auto mt-4 max-w-md" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
              Put it here. If it doesn&apos;t feel better than your downloads folder, tell me why — I read everything.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className="primary-button" style={{ padding: "14px 34px", fontSize: 16 }}>Get started</Link>
              <Link href="/guide" className="ghost-pill">How it works</Link>
            </div>
          </div>
        </Reveal>
      </main>

      <Footer />
    </div>
  );
}
