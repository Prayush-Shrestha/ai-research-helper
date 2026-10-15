import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";

export default function KnowledgePage() {
  return (
    <div className="page-shell">
      <section className="relative pt-6 text-center sm:pt-10">
        <span className="orb" aria-hidden style={{ width: 420, height: 420, top: -140, left: "8%", background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent 65%)" }} />
        <span className="orb" aria-hidden style={{ width: 460, height: 460, top: -160, right: "8%", background: "radial-gradient(circle, rgba(255,255,255,0.13), transparent 65%)" }} />
        <div className="relative rise rise-1">
          <span className="eyebrow"><span className="dot" />Knowledge map</span>
          <h1 className="type-heading-sm mx-auto mt-4" style={{ color: "var(--color-apple-ink)", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Your knowledge map
          </h1>
          <p className="hero-sub mx-auto mt-3 max-w-xl">
            I plotted your papers by the ideas they have in common. The blue one is
            the paper the rest keep linking back to.
          </p>
        </div>
      </section>

      <section aria-label="Your knowledge map" className="relative mt-8 rise rise-2">
        <KnowledgeGraph />
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="How to read it">
        {[
          ["Blue dot", "The paper with the most links to the others."],
          ["Dark dots", "Each one is a paper. Bigger just means better connected."],
          ["Lines", "Two papers that share an idea."],
          ["Drift", "It takes a moment to settle, and where things land isn't a ranking."],
        ].map(([k, v], i) => (
          <div key={k} className={`glass-stat rise rise-${3 + i}`}>
            <p style={{ fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>{k}</p>
            <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)", lineHeight: 1.5 }}>{v}</p>
          </div>
        ))}
      </section>

      <p className="mt-5 text-center footnote">
        Early version for now. Proper topic clustering comes once the backend lands.
      </p>
    </div>
  );
}
