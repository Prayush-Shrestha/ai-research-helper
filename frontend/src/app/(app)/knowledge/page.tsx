import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";

export default function KnowledgePage() {
  return (
    <div>
      <section className="pt-6 text-center sm:pt-10">
        <h1 className="type-heading-sm mx-auto" style={{ color: "var(--color-apple-ink)" }}>
          Your knowledge map
        </h1>
        <p className="mx-auto mt-3 max-w-xl" style={{ fontSize: 19, color: "var(--color-graphite)" }}>
          I plotted your papers by the ideas they have in common. The blue one is
          the paper the rest keep linking back to.
        </p>
      </section>

      <section aria-label="Your knowledge map" className="mt-8">
        <KnowledgeGraph />
      </section>

      <section className="gallery-card mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="How to read it">
        {[
          ["Blue dot", "The paper with the most links to the others."],
          ["Dark dots", "Each one is a paper. Bigger just means better connected."],
          ["Lines", "Two papers that share an idea."],
          ["Drift", "It takes a moment to settle, and where things land isn't a ranking."],
        ].map(([k, v]) => (
          <div key={k}>
            <p style={{ fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>{k}</p>
            <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)", lineHeight: 1.5 }}>{v}</p>
          </div>
        ))}
      </section>

      <p className="mt-5 text-center" style={{ fontSize: 13, color: "var(--color-slate)" }}>
        Early version for now. Proper topic clustering comes once the backend lands.
      </p>
    </div>
  );
}
