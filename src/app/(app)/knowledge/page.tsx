import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";
import { SectionDivider } from "@/components/editorial/TechnicalLabel";

export default function KnowledgePage() {
  return (
    <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
      <section className="pt-12 sm:pt-16">
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>OBSERVATORY / 04 — PREVIEW</p>
        <h1 className="font-display mt-2" style={{ fontSize: "clamp(48px,7vw,84px)", lineHeight: 0.95, letterSpacing: "-2px" }}>
          Knowledge
          <br />
          Map
        </h1>
        <p className="mt-4 max-w-md text-[15px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
          Papers become concepts. Concepts become topics. Topics reveal how your field fits together.
        </p>
      </section>

      <section aria-label="Knowledge visualization" className="mt-10">
        <KnowledgeGraph />
      </section>

      <div className="mt-10"><SectionDivider label="LEGEND" /></div>
      <section className="grid gap-6 py-8 sm:grid-cols-4" aria-label="Legend">
        {[
          ["#B7FFDF", "CORE PAPERS", "Highest semantic weight in your library."],
          ["#8CC8FF", "BRIDGE CONCEPTS", "Ideas that connect distant clusters."],
          ["#E7E7E2", "TOPICS", "Stable themes across many documents."],
          ["#62686A", "SIGNALS", "Weak links worth investigating."],
        ].map(([c, k, v]) => (
          <div key={k}>
            <span className="inline-block" style={{ width: 10, height: 10, borderRadius: 99, background: c }} />
            <p className="micro-label mt-3" style={{ color: "var(--color-primary-text)" }}>{k}</p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--color-secondary-text)" }}>{v}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
