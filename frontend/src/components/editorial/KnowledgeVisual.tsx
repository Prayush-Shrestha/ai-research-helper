"use client";

import { ResearchNucleus } from "@/components/research/Nucleus";

/**
 * Legacy export kept for backwards compatibility.
 * Renders the liquid-glass research nucleus.
 */
export function KnowledgeVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="img"
      aria-label="Abstract liquid-glass visualization of connected research documents"
      className="gallery-card relative overflow-hidden"
      style={{
        minHeight: compact ? 320 : 420,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <span aria-hidden className="orb" style={{ width: 380, height: 380, left: "50%", top: "-140px", transform: "translateX(-50%)", background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent 65%)" }} />
      <div className="relative" style={{ zIndex: 1, width: "100%" }}>
        <ResearchNucleus size={compact ? 320 : 440} />
      </div>
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 py-3"
        style={{ borderTop: "1px solid var(--liquid-border-soft)", background: "rgba(0,0,0,0.18)", backdropFilter: "blur(12px)" }}
      >
        <p className="tech-label" style={{ color: "var(--color-electric-blue)" }}>
          Semantic field
        </p>
        <p className="tech-label" style={{ color: "var(--color-graphite)" }}>
          Fig. 01 — Liquid
        </p>
      </div>
    </div>
  );
}
