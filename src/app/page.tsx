import Link from "next/link";
import { Wordmark } from "@/components/layout/Logo";
import { KnowledgeVisual } from "@/components/editorial/KnowledgeVisual";

const PILLS = ["01 LIBRARY", "02 DOCUMENTS", "03 KNOWLEDGE", "04 AI ASSISTANT"];

export default function LandingPage() {
  return (
    <div className="page-enter min-h-screen" style={{ background: "var(--color-void)" }}>
      {/* 72px header */}
      <header
        className="flex items-center"
        style={{ height: 72, borderBottom: "1px solid #292B2D", background: "#050505" }}
      >
        <div className="mx-auto flex w-full items-center justify-between px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
          <Wordmark />
          <nav aria-label="Primary" className="hidden items-center gap-2 md:flex">
            {["LIBRARY", "RESEARCH", "ASSISTANT", "INSIGHTS"].map((l) => (
              <Link
                key={l}
                href="/dashboard"
                className="font-tech rounded-full px-4 py-2"
                style={{ fontSize: 10, border: "1px solid #292B2D", background: "#202124", color: "#92989A" }}
              >
                {l}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="font-tech rounded-full px-4 py-2" style={{ fontSize: 10, background: "#202124", border: "1px solid #292B2D", color: "#92989A", borderRadius: 100 }}>
              SEARCH
            </Link>
            <Link href="/register" className="font-tech rounded-full px-4 py-2" style={{ fontSize: 10, background: "#E7E7E2", color: "#050505", borderRadius: 100 }}>
              ENTER
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
        {/* hero */}
        <section className="pt-16 text-center sm:pt-24" aria-labelledby="hero-title">
          <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>
            AI RESEARCH SYSTEM / 01
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

      <footer style={{ borderTop: "1px solid #292B2D" }}>
        <div className="mx-auto flex flex-col gap-2 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
          <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>[AI] RESEARCH — KNOWLEDGE LABORATORY</p>
          <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>VOiD / 050505 — EDITION 01</p>
        </div>
      </footer>
    </div>
  );
}
