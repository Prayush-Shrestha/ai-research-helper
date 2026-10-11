"use client";

import { useMemo } from "react";

/**
 * Cinematic abstract knowledge map — pure SVG, no imagery.
 * Documents / nodes / semantic links rendered as laboratory instrumentation.
 */
export function KnowledgeVisual({ compact = false }: { compact?: boolean }) {
  const nodes = useMemo(
    () => [
      { x: 120, y: 140, r: 3, c: "#B7FFDF", o: 0.9 },
      { x: 260, y: 90, r: 2, c: "#8CC8FF", o: 0.7 },
      { x: 380, y: 170, r: 4, c: "#E7E7E2", o: 0.5 },
      { x: 500, y: 100, r: 2.5, c: "#B7FFDF", o: 0.8 },
      { x: 640, y: 160, r: 3, c: "#8CC8FF", o: 0.6 },
      { x: 760, y: 90, r: 2, c: "#E7E7E2", o: 0.4 },
      { x: 880, y: 150, r: 3.5, c: "#B7FFDF", o: 0.7 },
      { x: 200, y: 240, r: 2, c: "#62686A", o: 0.8 },
      { x: 430, y: 260, r: 3, c: "#8CC8FF", o: 0.5 },
      { x: 580, y: 250, r: 2, c: "#B7FFDF", o: 0.6 },
      { x: 740, y: 250, r: 4, c: "#E7E7E2", o: 0.35 },
      { x: 950, y: 240, r: 2, c: "#62686A", o: 0.7 },
    ],
    []
  );

  const links: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [1, 7],
    [2, 8],
    [4, 9],
    [5, 10],
    [6, 11],
    [8, 9],
    [9, 10],
  ];

  return (
    <div
      role="img"
      aria-label="Abstract visualization of connected research documents and concepts"
      className="relative overflow-hidden"
      style={{
        background: "var(--color-graphite)",
        border: "1px solid var(--color-hairline)",
        borderRadius: 20,
        height: compact ? 320 : 480,
      }}
    >
      {/* faint grid */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="kg-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0v48" fill="none" stroke="#202124" strokeWidth="0.6" opacity="0.7" />
          </pattern>
          <radialGradient id="kg-glow" cx="50%" cy="42%" r="55%">
            <stop offset="0%" stopColor="#B7FFDF" stopOpacity="0.07" />
            <stop offset="55%" stopColor="#8CC8FF" stopOpacity="0.03" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#kg-grid)" />
        <rect width="100%" height="100%" fill="url(#kg-glow)" />
      </svg>

      {/* document plates */}
      <div aria-hidden className="absolute inset-0 hidden sm:block">
        <div
          className="drift absolute"
          style={{
            left: "8%", top: "18%", width: 180, padding: "14px 14px 10px",
            background: "#0A0A0A", border: "1px solid #292B2D", borderRadius: 8,
          }}
        >
          <p className="micro-label" style={{ color: "#62686A" }}>DOC / 014 — PDF</p>
          <div className="mt-2 space-y-1.5">
            {[92, 78, 84].map((w, i) => (
              <div key={i} style={{ width: `${w}%`, height: 5, background: "#202124", borderRadius: 2 }} />
            ))}
          </div>
          <p className="micro-label mt-2" style={{ color: "#B7FFDF" }}>INDEXED / 98%</p>
        </div>
        <div
          className="absolute"
          style={{
            right: "7%", bottom: "16%", width: 200, padding: "14px 14px 10px",
            background: "#0A0A0A", border: "1px solid #292B2D", borderRadius: 8,
          }}
        >
          <p className="micro-label" style={{ color: "#62686A" }}>DOC / 021 — PDF</p>
          <div className="mt-2 space-y-1.5">
            {[88, 96, 70].map((w, i) => (
              <div key={i} style={{ width: `${w}%`, height: 5, background: "#202124", borderRadius: 2 }} />
            ))}
          </div>
          <p className="micro-label mt-2" style={{ color: "#8CC8FF" }}>LINKED / 12 NODES</p>
        </div>
      </div>

      <svg
        viewBox="0 0 1080 360"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {links.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
            stroke="#2A2E31" strokeWidth="1"
            opacity={0.9}
          />
        ))}
        {links.slice(0, 4).map(([a, b], i) => (
          <line
            key={`a-${i}`}
            x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
            stroke="#B7FFDF" strokeWidth="1"
            opacity={0.28}
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={n.r * 4.5} fill={n.c} opacity={0.06} />
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.c} opacity={n.o} />
          </g>
        ))}
        <circle cx={500} cy={175} r={52} fill="none" stroke="#292B2D" strokeWidth="1" />
        <circle cx={500} cy={175} r={78} fill="none" stroke="#202124" strokeWidth="1" strokeDasharray="3 6" />
      </svg>

      {/* instrumentation footer */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 py-3"
        style={{ borderTop: "1px solid #292B2D", background: "rgba(5,5,5,0.72)", backdropFilter: "blur(8px)" }}
      >
        <p className="font-tech" style={{ color: "var(--color-secondary-text)", fontSize: 10 }}>
          <span className="pulse-dot inline-block" style={{ width: 6, height: 6, borderRadius: 99, background: "#B7FFDF", marginRight: 8, verticalAlign: "1px" }} />
          SEMANTIC FIELD / LIVE
        </p>
        <p className="font-tech hidden sm:block" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
          024 DOCS — 312 CONCEPTS — 48 CLUSTERS
        </p>
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
          FIG. 01
        </p>
      </div>
    </div>
  );
}
