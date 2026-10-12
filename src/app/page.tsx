import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { KnowledgeVisual } from "@/components/editorial/KnowledgeVisual";

const PILLS = ["01 LIBRARY", "02 DOCUMENTS", "03 KNOWLEDGE", "04 AI ASSISTANT"];

export default function LandingPage() {
  return (
    <div className="page-enter min-h-screen" style={{ background: "var(--color-void)" }}>
      <Navbar />

      <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
        {/* hero */}
        <section className="pt-16 text-center sm:pt-24" aria-labelledby="hero-title">
          <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>
            RESEARCHOS SYSTEM / 01
          </p>
          <h1
            id="hero-title"
            className="font-display mx-auto mt-6"
            style={{ fontSize: "clamp(42px, 8vw, 96px)", lineHeight: 0.95, letterSpacing: "-3px", color: "var(--color-primary-text)", maxWidth: 900 }}
          >
            Research
            <br />
            Becomes
            <br />
            <em style={{ fontStyle: "italic" }}>Knowledge.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-[16px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
            Upload papers, explore your documents,
            <br />
            and build an intelligent research workspace.
          </p>
          <p className="font-tech mt-6" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
            DOCUMENT INTELLIGENCE / ONLINE&nbsp;&nbsp;&nbsp;●&nbsp;&nbsp;&nbsp;SYSTEM READY
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="font-tech rounded-full px-8 py-3.5"
              style={{ background: "#202124", border: "1px solid #292B2D", color: "#E7E7E2", fontSize: 11, borderRadius: 100 }}
            >
              ENTER WORKSPACE
            </Link>
            <Link href="/dashboard" className="font-tech px-4 py-3" style={{ color: "#92989A", fontSize: 11 }}>
              VIEW HOW IT WORKS →
            </Link>
          </div>
        </section>

        {/* cinematic visual */}
        <section className="mt-12 sm:mt-16" aria-label="Knowledge visualization preview">
          <KnowledgeVisual />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2" aria-label="Research sections">
            {PILLS.map((p) => (
              <Link
                key={p}
                href="/dashboard"
                className="font-tech rounded-full px-5 py-2.5"
                style={{ background: "#202124", border: "1px solid #292B2D", color: "#92989A", fontSize: 10, borderRadius: 100 }}
              >
                {p}
              </Link>
            ))}
          </div>
        </section>

        {/* editorial strips */}
        <section className="mt-20 sm:mt-28" aria-label="Principles">
          <div className="h-px" style={{ background: "#292B2D" }} />
          <div className="grid gap-10 py-12 sm:grid-cols-3 sm:py-16">
            {[
              ["ARCHIVE", "Documents treated as knowledge objects. Every paper preserved, indexed, and citable."],
              ["INSTRUMENT", "AI treated as a research instrument — precise, quiet, and traceable to source."],
              ["OBSERVATORY", "A digital observatory for your field. Watch themes, gaps, and signals emerge."],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="font-tech" style={{ color: "var(--color-research-accent)", fontSize: 10 }}>{k}</p>
                <p className="mt-3 max-w-[32ch] text-[15px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>{v}</p>
              </div>
            ))}
          </div>
          <div className="h-px" style={{ background: "#292B2D" }} />
        </section>

        {/* statement */}
        <section className="py-16 text-center sm:py-24" aria-label="Invitation">
          <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>02 / ENTER</p>
          <h2 className="font-display mx-auto mt-4" style={{ fontSize: "clamp(30px,4.5vw,52px)", lineHeight: 1.05, maxWidth: 700 }}>
            A quiet, intelligent room for serious reading.
          </h2>
          <div className="mt-8">
            <Link href="/register" className="font-tech rounded-full px-8 py-3.5" style={{ background: "#E7E7E2", color: "#050505", fontSize: 11, borderRadius: 100 }}>
              BEGIN RESEARCH →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
