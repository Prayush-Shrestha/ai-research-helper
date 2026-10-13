"use client";

import { ResearchNucleus } from "@/components/research/Nucleus";

/**
 * Legacy export kept for backwards compatibility.
 * Now renders the monochrome research nucleus (no gradients, no color).
 */
export function KnowledgeVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="img"
      aria-label="Abstract monochrome visualization of connected research documents"
      className="relative overflow-hidden"
      style={{
        background: "#000",
        borderTop: "1px solid rgba(204,204,204,0.14)",
        borderBottom: "1px solid rgba(204,204,204,0.14)",
        minHeight: compact ? 320 : 420,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <ResearchNucleus size={compact ? 320 : 440} />
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 py-3"
        style={{ borderTop: "1px solid rgba(204,204,204,0.12)", background: "rgba(0,0,0,0.8)" }}
      >
        <p className="tech-label" style={{ color: "var(--color-ash)", fontSize: 10 }}>
          Semantic field
        </p>
        <p className="tech-label" style={{ color: "var(--color-graphite)", fontSize: 10 }}>
          Fig. 01 — Monochrome
        </p>
      </div>
    </div>
  );
}
