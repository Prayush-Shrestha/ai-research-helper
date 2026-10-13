import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";

export default function KnowledgePage() {
  return (
    <div>
      <section className="pt-6 text-center sm:pt-10">
        <h1 className="type-heading-sm mx-auto" style={{ color: "var(--color-apple-ink)" }}>
          Knowledge map.
        </h1>
        <p className="mx-auto mt-3 max-w-xl" style={{ fontSize: 19, color: "var(--color-graphite)" }}>
          Your papers, plotted by the ideas they share. The blue dot is the paper
          everything else connects to.
        </p>
      </section>

      <section aria-label="Your knowledge map" className="mt-8">
        <KnowledgeGraph />
      </section>

      <section className="gallery-card mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="How to read it">
        {[
          ["Blue dot", "The most connected paper in your library."],
          ["Dark dots", "Papers. Bigger means more connections."],
          ["Lines", "A shared idea between two papers."],
          ["Drift", "The map settles slowly — positions aren't rankings."],
        ].map(([k, v]) => (
          <div key={k}>
            <p style={{ fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>{k}</p>
            <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)", lineHeight: 1.5 }}>{v}</p>
          </div>
        ))}
      </section>

      <p className="mt-5 text-center" style={{ fontSize: 12, color: "var(--color-slate)" }}>
        Preview — full topic clustering arrives with the backend.
      </p>
    </div>
  );
}
