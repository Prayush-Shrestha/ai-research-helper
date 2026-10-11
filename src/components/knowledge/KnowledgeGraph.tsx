"use client";

import { useEffect, useState } from "react";

interface Node {
  id: number;
  x: number;
  y: number;
  r: number;
  label: string;
  color: string;
  vx: number;
  vy: number;
}

/**
 * Slow-drifting academic knowledge graph placeholder.
 * Canvas-free SVG with requestAnimationFrame-free CSS drift + interval nudges.
 */
export function KnowledgeGraph() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 0, x: 18, y: 42, r: 5, label: "RAG SURVEY", color: "#B7FFDF", vx: 0.08, vy: 0.05 },
    { id: 1, x: 34, y: 26, r: 3, label: "RETRIEVAL", color: "#8CC8FF", vx: -0.06, vy: 0.07 },
    { id: 2, x: 50, y: 50, r: 7, label: "METHODS", color: "#E7E7E2", vx: 0.05, vy: -0.06 },
    { id: 3, x: 66, y: 30, r: 3.5, label: "VECTORS", color: "#B7FFDF", vx: 0.07, vy: 0.06 },
    { id: 4, x: 82, y: 55, r: 4, label: "EVAL", color: "#8CC8FF", vx: -0.05, vy: -0.05 },
    { id: 5, x: 30, y: 70, r: 2.5, label: "CITATIONS", color: "#62686A", vx: 0.06, vy: -0.07 },
    { id: 6, x: 58, y: 74, r: 3, label: "SYNTHESIS", color: "#92989A", vx: -0.07, vy: 0.05 },
    { id: 7, x: 74, y: 72, r: 2.5, label: "GAPS", color: "#B7FFDF", vx: 0.05, vy: 0.08 },
  ]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setNodes((prev) =>
        prev.map((n) => {
          let nx = n.x + n.vx;
          let ny = n.y + n.vy;
          let vx = n.vx;
          let vy = n.vy;
          if (nx < 8 || nx > 92) vx = -vx;
          if (ny < 12 || ny > 88) vy = -vy;
          nx = Math.min(92, Math.max(8, nx));
          ny = Math.min(88, Math.max(12, ny));
          return { ...n, x: nx, y: ny, vx, vy };
        })
      );
    }, 90);
    return () => window.clearInterval(t);
  }, []);

  const links: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [2, 4], [0, 5], [2, 6], [4, 7], [3, 4], [5, 6]];

  return (
    <div
      role="img"
      aria-label="Knowledge map showing papers linked to concepts, topics and relationships"
      className="relative overflow-hidden"
      style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-media)", background: "var(--color-graphite)", height: 520 }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        {links.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="#292B2D" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {nodes.map((n) => (
        <div key={n.id} className="absolute" style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%,-50%)" }}>
          <div style={{ width: n.r * 3, height: n.r * 3, borderRadius: 99, background: n.color, opacity: 0.14 }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div style={{ width: n.r * 1.4, height: n.r * 1.4, borderRadius: 99, background: n.color, opacity: 0.9 }} className="relative" />
          <p className="micro-label mt-2 whitespace-nowrap text-center" style={{ color: "var(--color-secondary-text)" }}>{n.label}</p>
        </div>
      ))}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #292B2D", background: "rgba(5,5,5,0.75)", backdropFilter: "blur(8px)" }}>
        <p className="font-tech" style={{ color: "var(--color-secondary-text)", fontSize: 10 }}>RESEARCH PAPERS → CONCEPTS → TOPICS → RELATIONSHIPS</p>
        <p className="font-tech hidden sm:block" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>MAP / PREVIEW — MONTH 02</p>
      </div>
    </div>
  );
}
