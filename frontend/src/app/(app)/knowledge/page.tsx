"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  getKnowledgeGraphData,
  getKnowledgeEntities,
  getKnowledgeRelationships,
  reprocessDocumentKnowledgeGraph,
  type KnowledgeEntity,
  type KnowledgeGraphData,
  type KnowledgeRelationship,
} from "@/lib/api";
import { PageLoading } from "@/components/ui/Loading";
import { formatDate } from "@/lib/utils";

const ENTITY_TYPES = [
  "person",
  "organization",
  "technology",
  "research_topic",
  "scientific_concept",
  "dataset",
  "method",
  "keyword",
] as const;

const TYPE_COLORS: Record<string, string> = {
  person: "#9DE7C1",
  organization: "#7DD3FC",
  technology: "#FBBF24",
  research_topic: "#A78BFA",
  scientific_concept: "#F472B6",
  dataset: "#34D399",
  method: "#F87171",
  keyword: "#CBD5E1",
};

interface GraphNode {
  id: string;
  name: string;
  entity_type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed: boolean;
  confidence: number;
  is_inferred: boolean;
  source_document_title: string | null;
  source_page_number: number | null;
  relationship_count: number;
}

interface GraphLink {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
  confidence: number;
  is_inferred: boolean;
}

export default function KnowledgeGraphPage() {
  const { user } = useAuth();
  const [graph, setGraph] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | "">("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [reprocessing, setReprocessing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // Load graph data.
  const loadGraph = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getKnowledgeGraphData(
        entityTypeFilter || undefined,
        undefined,
        search || undefined,
        0,
        true,
        200,
        400
      );
      setGraph(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load knowledge graph."
      );
    } finally {
      setLoading(false);
    }
  }, [search, entityTypeFilter]);

  useEffect(() => {
    void loadGraph();
  }, [loadGraph]);

  // Transform backend data into graph nodes/links for rendering.
  const nodes: GraphNode[] = useMemo(() => {
    if (!graph) return [];
    const now = Date.now();
    return graph.nodes.map((n, i) => ({
      id: n.id,
      name: n.name,
      entity_type: n.entity_type,
      x: 10 + (i % 15) * 6,
      y: 10 + Math.floor(i / 15) * 6,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      fixed: false,
      confidence: n.confidence,
      is_inferred: n.is_inferred,
      source_document_title: n.source_document_title,
      source_page_number: n.source_page_number,
      relationship_count: n.relationship_count,
    }));
  }, [graph]);

  const links: GraphLink[] = useMemo(() => {
    if (!graph) return [];
    return graph.edges.map((e) => ({
      id: e.id,
      source: e.source_entity_id,
      target: e.target_entity_id,
      relationship_type: e.relationship_type,
      confidence: e.confidence,
      is_inferred: e.is_inferred,
    }));
  }, [graph]);

  // Filter nodes/links based on search and type.
  const filteredNodes = useMemo(() => {
    if (!nodes.length) return [];
    const s = search.toLowerCase();
    return nodes.filter(
      (n) =>
        n.name.toLowerCase().includes(s) &&
        (entityTypeFilter === "" || n.entity_type === entityTypeFilter)
    );
  }, [nodes, search, entityTypeFilter]);

  const nodeIdSet = useMemo(
    () => new Set(filteredNodes.map((n) => n.id)),
    [filteredNodes]
  );

  const filteredLinks = useMemo(() => {
    if (!links.length) return [];
    return links.filter(
      (l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target)
    );
  }, [links, nodeIdSet]);

  // Connected links for the selected node.
  const connectedLinks = useMemo(() => {
    if (!selectedNodeId) return [];
    return filteredLinks.filter(
      (l) => l.source === selectedNodeId || l.target === selectedNodeId
    );
  }, [filteredLinks, selectedNodeId]);

  // Selected node details.
  const selectedNode = useMemo(
    () => graph?.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [graph, selectedNodeId]
  );

  // --- Zoom / pan handlers ---
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const newZoom = Math.min(Math.max(zoom + delta, 0.3), 3);
      const rect = containerRef.current!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setZoom(newZoom);
      setPan((p) => ({
        x: p.x - (cx - p.x) * (newZoom / zoom - 1),
        y: p.y - (cy - p.y) * (newZoom / zoom - 1),
      }));
    },
    [zoom]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = pan;
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPan({ x: panStart.current.x + dx / zoom, y: panStart.current.y + dy / zoom });
    },
    [zoom]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleNodeClick = (id: string) => {
    setSelectedNodeId(id === selectedNodeId ? null : id);
  };

  const handleReprocess = async (docId: string) => {
    setReprocessing(docId);
    try {
      const result = await reprocessDocumentKnowledgeGraph(docId);
      setNotice(
        `Graph reprocessed: ${result.entities_created} entities, ${result.relationships_created} relationships.`
      );
      void loadGraph();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reprocessing failed.");
    } finally {
      setReprocessing(null);
    }
  };

  // Empty state.
  if (loading) {
    return (
      <div className="page-shell pt-20 text-center">
        <PageLoading label="Building your knowledge graph" />
      </div>
    );
  }

  if (error && !graph) {
    return (
      <div className="page-shell pt-20 text-center">
        <p className="hand" style={{ color: "var(--color-alert)" }}>{error}</p>
        <button
          onClick={() => void loadGraph()}
          className="primary-button mt-4"
          style={{ padding: "10px 24px" }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="page-shell pt-20">
        <section className="rise rise-1 pt-6 text-center sm:pt-10">
          <span className="eyebrow"><span className="dot" />Knowledge map</span>
          <h1 className="mt-4" style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
            No knowledge graph yet
          </h1>
          <p className="hero-sub mx-auto mt-3 max-w-xl">
            Upload and index some documents to generate entities and
            relationships. Once documents are indexed, click "Reprocess graph"
            on a document to extract its concepts.
          </p>
        </section>
        <div className="mx-auto mt-10" style={{ maxWidth: 560 }}>
          <button
            onClick={() => void loadGraph()}
            className="primary-button"
            style={{ padding: "12px 32px", fontSize: 16 }}
          >
            Refresh graph
          </button>
        </div>
      </div>
    );
  }

  const width = 900;
  const height = 600;

  return (
    <div className="page-shell">
      {notice && (
        <p role="status" className="rise rise-2 mt-6 rounded-2xl px-5 py-3" style={{ fontSize: 14.5, background: "rgba(127,127,133,0.12)", border: "1px solid var(--liquid-border)", color: "var(--color-apple-ink)" }}>
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded-2xl px-5 py-3" style={{ fontSize: 14.5, color: "var(--color-alert)", background: "rgba(255,155,138,0.08)", border: "1px solid rgba(255,155,138,0.25)" }}>
          {error}
        </p>
      )}

      <section className="rise rise-1 relative pt-6 sm:pt-10">
        <span className="eyebrow"><span className="dot" />Knowledge map</span>
        <h1 className="mt-4" style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
          Your knowledge graph
        </h1>
        <p className="hero-sub mt-3 max-w-xl">
          Entities extracted from your documents, linked by co-occurrence.
          Click a node to inspect its source. Node border style shows
          confidence — solid for observed, dashed for inferred.
        </p>
      </section>

      {/* Controls */}
      <section className="rise rise-2 mt-8 flex flex-wrap gap-4" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="liquid-search flex items-center gap-3 px-5 py-3" style={{ borderRadius: 999, minWidth: 260 }}>
          <span aria-hidden style={{ color: "var(--color-slate)", fontSize: 16 }}>✦</span>
          <label htmlFor="kg-search" className="sr-only">Search entities</label>
          <input
            id="kg-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entities…"
            autoComplete="off"
            className="w-full bg-transparent text-[15px] outline-none"
            style={{ color: "var(--color-apple-ink)" }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12.5, color: "var(--color-slate)" }}>Type:</span>
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="field-input"
            style={{ fontSize: 13, minWidth: 150 }}
          >
            <option value="">All types</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => void loadGraph()}
            disabled={reprocessing !== null}
            className="ghost-pill"
            style={{ fontSize: 14, padding: "8px 18px", opacity: reprocessing !== null ? 0.6 : 1 }}
          >
            {reprocessing ? "Reprocessing…" : "Refresh graph"}
          </button>
        </div>
      </section>

      {/* Graph surface */}
      <section aria-label="Knowledge graph visualization" className="rise rise-3 mt-8 relative" style={{ height: height + 40 }}>
        <div
          ref={containerRef}
          className="absolute inset-0 bg-[#171B19] rounded-2xl border border-[#2A312D] shadow-2xl overflow-hidden"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ touchAction: "none" }}
        >
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              cursor: isDragging.current ? "grabbing" : "grab",
            }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-slate)" />
              </marker>
            </defs>

            {/* Links */}
            {filteredLinks.map((link) => {
              const source = nodes.find((n) => n.id === link.source);
              const target = nodes.find((n) => n.id === link.target);
              if (!source || !target) return null;
              const isConnected = connectedLinks.some((l) => l.id === link.id);
              return (
                <line
                  key={link.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isConnected ? "var(--color-apple-ink)" : "rgba(255,255,255,0.15)"}
                  strokeWidth={isConnected ? 2 : 1}
                  opacity={isConnected ? 0.9 : 0.4}
                  strokeDasharray={link.is_inferred ? "4 2" : undefined}
                  markerEnd="url(#arrowhead)"
                />
              );
            })}

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isConnected = connectedLinks.some(
                (l) => l.source === node.id || l.target === node.id
              );
              const color = TYPE_COLORS[node.entity_type] || "#9DE7C1";
              return (
                <g
                  key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={Math.max(5, Math.min(10, 4 + node.confidence * 6))}
                    fill={isConnected || isSelected ? color : "rgba(255,255,255,0.08)"}
                    stroke={isSelected ? "var(--color-electric-blue)" : color}
                    strokeWidth={isSelected ? 3 : node.is_inferred ? 1 : 2}
                    strokeDasharray={node.is_inferred ? "3 3" : undefined}
                    opacity={isSelected || isConnected ? 1 : 0.85}
                  />
                  <text
                    x={node.x}
                    y={node.y + 18}
                    textAnchor="middle"
                    fill="var(--color-apple-ink)"
                    fontSize={11}
                    fontWeight={isSelected ? 700 : 500}
                    pointerEvents="none"
                    opacity={isConnected || isSelected ? 1 : 0.7}
                  >
                    {node.name.length > 18 ? node.name.slice(0, 18) + "…" : node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* Selected node details panel */}
      {selectedNode && (
        <aside className="rise rise-4 mt-8 gallery-card !p-6" style={{ maxWidth: 420, marginLeft: 0 }}>
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <div>
              <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)" }}>
                Entity details
              </p>
              <h2 style={{ fontSize: 20, fontWeight: 650, letterSpacing: "-0.01em", color: "var(--color-apple-ink)" }}>
                {selectedNode.name}
              </h2>
            </div>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="ghost-pill"
              style={{ fontSize: 13, padding: "6px 14px" }}
            >
              Close
            </button>
          </div>

          <div className="space-y-3">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="tag-pill"
                style={{ background: TYPE_COLORS[selectedNode.entity_type], color: "#06110C", fontWeight: 700 }}
              >
                {selectedNode.entity_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
              <span
                className={selectedNode.is_inferred ? "tag-pill crimson" : "tag-pill"}
                style={{ fontSize: 11 }}
              >
                {selectedNode.is_inferred ? "Inferred" : "Observed"}
              </span>
              <span className="tag-pill" style={{ fontSize: 11 }}>
                Confidence: {(selectedNode.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {selectedNode.source_document_title && (
              <div style={{ borderTop: "1px solid var(--liquid-border-soft)", paddingTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)" }}>
                  Source
                </p>
                <Link
                  href={`/documents/${selectedNode.source_document_id ?? ""}`}
                  className="mt-1 block"
                  style={{ fontSize: 15, fontWeight: 600, color: "var(--color-link-blue)" }}
                >
                  {selectedNode.source_document_title}
                </Link>
                {selectedNode.source_page_number !== null && (
                  <p className="mt-0.5" style={{ fontSize: 13, color: "var(--color-slate)" }}>
                    Page {selectedNode.source_page_number}
                  </p>
                )}
              </div>
            )}

            {selectedNode.source_text_snippet && (
              <div style={{ borderTop: "1px solid var(--liquid-border-soft)", paddingTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)" }}>
                  Source text
                </p>
                <p className="mt-1" style={{ fontSize: 13.5, color: "var(--color-iron)", lineHeight: 1.6, fontStyle: "italic" }}>
                  “{selectedNode.source_text_snippet}”
                </p>
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--liquid-border-soft)", paddingTop: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)" }}>
                Connections ({connectedLinks.length})
              </p>
              {connectedLinks.length === 0 ? (
                <p className="mt-1" style={{ fontSize: 13.5, color: "var(--color-graphite)" }}>
                  No relationships shown for this entity.
                </p>
              ) : (
                <ul className="mt-1 space-y-1.5" style={{ fontSize: 13, color: "var(--color-apple-ink)" }}>
                  {connectedLinks.map((l) => {
                    const otherId = l.source === selectedNodeId ? l.target : l.source;
                    const other = graph.nodes.find((n) => n.id === otherId);
                    return (
                      <li key={l.id} className="flex items-start gap-2">
                        <span style={{ fontSize: 11, color: "var(--color-slate)" }}>{l.relationship_type}</span>
                        <span style={{ fontSize: 13.5 }}>{other?.name || "Unknown entity"}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </aside>
      )}

      <p className="mt-6 text-center footnote">
        {graph.nodes.length} entities · {graph.edges.length} relationships.
        Inferred links (dashed) are co-occurrence suggestions — always verify
        against the source document.
      </p>
    </div>
  );
}
