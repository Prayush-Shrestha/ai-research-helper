import { SectionDivider } from "@/components/editorial/TechnicalLabel";

const CLUSTERS = [
  ["RETRIEVAL-AUGMENTED GENERATION", "09 DOCS", "92%", "The dominant cluster. Dense citation links to evaluation and vector storage."],
  ["VECTOR REPRESENTATION", "06 DOCS", "78%", "Comparative studies converge on hybrid lexical + semantic pipelines."],
  ["EVALUATION METHODOLOGY", "05 DOCS", "64%", "Sparse coverage. Long-context benchmarks are the clear gap."],
  ["RESEARCH WORKFLOWS", "04 DOCS", "51%", "Emerging theme: team knowledge practices and citation discipline."],
];

export default function InsightsPage() {
  return (
    <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
      <section className="pt-12 sm:pt-16">
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>SIGNALS / 05 — PREVIEW</p>
        <h1 className="font-display mt-2" style={{ fontSize: "clamp(48px,7vw,84px)", lineHeight: 0.95, letterSpacing: "-2px" }}>
          Research
          <br />
          Signals
        </h1>
        <p className="mt-4 max-w-md text-[15px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
          Editorial metrics drawn quietly from your archive. No dashboards shouting for attention.
        </p>
      </section>

      <div className="mt-10"><SectionDivider label="TOPIC CLUSTERS" /></div>

      <section aria-label="Topic clusters" style={{ borderTop: "1px solid var(--color-hairline)" }}>
        {CLUSTERS.map(([title, docs, conf, desc], i) => (
          <div key={title} className="grid gap-3 py-6 sm:grid-cols-[56px_1fr_120px] sm:items-baseline" style={{ borderBottom: "1px solid var(--color-hairline)" }}>
            <span className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h2 className="text-[17px] font-medium tracking-tight" style={{ color: "var(--color-primary-text)" }}>{title}</h2>
              <p className="mt-1 max-w-xl text-[14px]" style={{ color: "var(--color-secondary-text)" }}>{desc}</p>
              {/* restrained bar — thin, mono, no color explosion */}
              <div className="mt-3 h-[3px] w-full max-w-xl" style={{ background: "var(--color-control)", borderRadius: 99 }}>
                <div style={{ width: conf, height: "100%", background: i === 0 ? "var(--color-research-accent)" : i === 1 ? "var(--color-ai-accent)" : "#3A3D40", borderRadius: 99 }} />
              </div>
            </div>
            <div className="font-tech sm:text-right" style={{ color: "var(--color-secondary-text)", fontSize: 10 }}>
              {docs}<br /><span style={{ color: "var(--color-tertiary-text)" }}>{conf} COHERENCE</span>
            </div>
          </div>
        ))}
      </section>

      <div className="mt-6"><SectionDivider label="EMERGING" /></div>
      <section className="grid gap-8 py-8 sm:grid-cols-3" aria-label="Emerging themes">
        {[
          ["RESEARCH GAPS", "Long-context evaluation and multilingual retrieval are under-represented."],
          ["MOST REFERENCED", "“Attention Is All You Need” anchors 7 of your 24 documents."],
          ["DOCUMENT SIMILARITY", "RAG Survey ↔ Vector Databases share 68% conceptual overlap."],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>{k}</p>
            <p className="mt-2 text-[14px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>{v}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
