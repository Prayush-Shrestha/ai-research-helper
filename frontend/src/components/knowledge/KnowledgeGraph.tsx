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
 * Liquid knowledge map — glowing nodes on frosted depth.
 * Respects reduced motion.
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
      className="gallery-card relative overflow-hidden !p-0"
      style={{ height }}
    >
      <div aria-hidden className="absolute inset-0">
        <div className="orb" style={{ width: 420, height: 300, left: "10%", top: "5%", background: "radial-gradient(circle, rgba(157,231,193,0.16), transparent 65%)" }} />
        <div className="orb" style={{ width: 460, height: 320, right: "5%", bottom: "5%", background: "radial-gradient(circle, rgba(138,180,248,0.14), transparent 65%)" }} />
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        {links.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="rgba(157,231,193,0.28)" strokeWidth="0.35" vectorEffect="non-scaling-stroke" strokeDasharray={i % 3 === 0 ? "1.2 0.8" : undefined} />
        ))}
      </svg>
      {nodes.map((n) => (
        <div key={n.id} className="absolute" style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%,-50%)" }}>
          <div style={{ width: n.r * 5, height: n.r * 5, borderRadius: 99, background: n.id === 2 ? "rgba(157,231,193,0.22)" : "rgba(157,231,193,0.1)", filter: "blur(6px)" }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div style={{ width: n.r * 1.7, height: n.r * 1.7, borderRadius: 99, background: n.id === 2 ? "linear-gradient(180deg,#D6F9E5,var(--color-electric-blue))" : "var(--color-apple-ink)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: n.id === 2 ? "0 0 24px rgba(157,231,193,0.6)" : "0 4px 14px rgba(0,0,0,0.4)" }} className="relative" />
          <p className="tag-pill mt-2 whitespace-nowrap !text-[11px]" style={{ transform: "translateX(-50%)", marginLeft: "50%" }}>{n.label}</p>
        </div>
      ))}
      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between px-5 py-3" style={{ background: "rgba(10,14,12,0.55)", backdropFilter: "blur(16px)", border: "1px solid var(--liquid-border)", borderRadius: 18 }}>
        <p style={{ fontSize: 12.5, color: "var(--color-graphite)" }}>Papers → ideas → topics</p>
        <p className="tag-pill crimson hidden sm:inline-flex" style={{ fontSize: 11 }}>Live preview</p>
      </div>
    </div>
  );
}
