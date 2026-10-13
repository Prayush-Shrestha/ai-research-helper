"use client";

import { useEffect, useState } from "react";

interface Node {
  id: number;
  x: number;
  y: number;
  r: number;
  label: string;
  vx: number;
  vy: number;
}

/**
 * Gallery knowledge map — ink dots on white, drifting slowly.
 * Flat, no shadows. Respects reduced motion.
 */
export function KnowledgeGraph({ height = 480 }: { height?: number }) {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 0, x: 18, y: 42, r: 5, label: "RAG Survey", vx: 0.08, vy: 0.05 },
    { id: 1, x: 34, y: 26, r: 3, label: "Retrieval", vx: -0.06, vy: 0.07 },
    { id: 2, x: 50, y: 50, r: 7, label: "Methods", vx: 0.05, vy: -0.06 },
    { id: 3, x: 66, y: 30, r: 3.5, label: "Vectors", vx: 0.07, vy: 0.06 },
    { id: 4, x: 82, y: 55, r: 4, label: "Eval", vx: -0.05, vy: -0.05 },
    { id: 5, x: 30, y: 70, r: 2.5, label: "Citations", vx: 0.06, vy: -0.07 },
    { id: 6, x: 58, y: 74, r: 3, label: "Synthesis", vx: -0.07, vy: 0.05 },
    { id: 7, x: 74, y: 72, r: 2.5, label: "Gaps", vx: 0.05, vy: 0.08 },
  ]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
    }, 120);
    return () => window.clearInterval(t);
  }, []);

  const links: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [2, 4], [0, 5], [2, 6], [4, 7], [3, 4], [5, 6]];

  return (
    <div
      role="img"
      aria-label="Map showing your papers linked by shared ideas"
      className="relative overflow-hidden"
      style={{ borderRadius: 28, background: "var(--color-pure-white)", height }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        {links.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="var(--color-line)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {nodes.map((n) => (
        <div key={n.id} className="absolute" style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%,-50%)" }}>
          <div style={{ width: n.r * 3, height: n.r * 3, borderRadius: 99, background: n.id === 2 ? "rgba(10,132,255,0.18)" : "color-mix(in srgb, var(--color-electric-blue) 8%, transparent)" }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div style={{ width: n.r * 1.5, height: n.r * 1.5, borderRadius: 99, background: n.id === 2 ? "var(--color-electric-blue)" : "var(--color-apple-ink)" }} className="relative" />
          <p className="mt-1.5 whitespace-nowrap text-center" style={{ fontSize: 12, color: "var(--color-iron)" }}>{n.label}</p>
        </div>
      ))}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-6 py-3.5" style={{ background: "color-mix(in srgb, var(--color-pure-white) 88%, transparent)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--color-line)" }}>
        <p style={{ fontSize: 12, color: "var(--color-graphite)" }}>Papers → ideas → topics</p>
        <p className="hidden sm:block" style={{ fontSize: 12, color: "var(--color-slate)" }}>Live preview</p>
      </div>
    </div>
  );
}
