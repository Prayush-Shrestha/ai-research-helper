"use client";

import { useEffect, useState } from "react";
import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";
import { getKnowledgeGraph, type KnowledgeOut } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function KnowledgePage() {
  const { user } = useAuth();
  const [graph, setGraph] = useState<KnowledgeOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getKnowledgeGraph();
        if (!cancelled) setGraph(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load knowledge map."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-shell pt-20 text-center">
        <p className="hand" style={{ color: "var(--color-graphite)" }}>
          Building your knowledge map…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell pt-20 text-center">
        <p className="hand" style={{ color: "var(--color-alert)" }}>{error}</p>
        {user && (
          <p className="mt-2" style={{ fontSize: 14, color: "var(--color-slate)" }}>
            Upload and index some documents to see your knowledge map.
          </p>
        )}
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="page-shell pt-20 text-center">
        <p className="hand" style={{ color: "var(--color-graphite)" }}>
          No knowledge data available.
        </p>
      </div>
    );
  }

  const nodes = graph.nodes.length > 0 ? graph.nodes : undefined;
  const edges = graph.edges.length > 0 ? graph.edges : undefined;

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
            Your papers plotted by the ideas they share. Node size reflects
            distinct terminology; links show topic overlap.
          </p>
        </div>
      </section>

      <section aria-label="Your knowledge map" className="relative mt-8 rise rise-2">
        <KnowledgeGraph height={520} backendNodes={nodes} backendEdges={edges} />
      </section>

      {graph.nodes.length > 0 && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Knowledge stats">
          <div className="glass-stat rise rise-1">
            <p style={{ fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>
              {graph.nodes.length}
            </p>
            <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)", lineHeight: 1.5 }}>
              papers in the map
            </p>
          </div>
          <div className="glass-stat rise rise-2">
            <p style={{ fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>
              {graph.edges.length}
            </p>
            <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)", lineHeight: 1.5 }}>
              topic connections
            </p>
          </div>
          <div className="glass-stat rise rise-3">
            <p style={{ fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>{"—"}</p>
            <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)", lineHeight: 1.5 }}>
              isolated papers
            </p>
          </div>
          <div className="glass-stat rise rise-4">
            <p style={{ fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>{"—"}</p>
            <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)", lineHeight: 1.5 }}>
              most-connected topic
            </p>
          </div>
        </section>
      )}

      <p className="mt-5 text-center footnote">
        Knowledge graph is built from your indexed documents&apos; text. Reindex
        documents after upload to refresh the map.
      </p>
    </div>
  );
}
