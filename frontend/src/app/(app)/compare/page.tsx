"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import {
  compareDocuments,
  type DocumentComparison,
  type ComparisonSection,
} from "@/lib/api";
import { PageLoading } from "@/components/ui/Loading";

type CompareField = "objectives" | "methodology" | "findings" | "datasets" | "limitations" | "similarities" | "differences" | "gaps";

const FIELD_LABELS: Record<CompareField, string> = {
  objectives: "Objectives",
  methodology: "Methodology",
  findings: "Main Findings",
  datasets: "Datasets",
  limitations: "Limitations",
  similarities: "Similarities",
  differences: "Differences",
  gaps: "Research Gaps",
};

export default function ResearchComparisonPage() {
  const { user } = useAuth();
  const { documents: allDocuments, loading: docsLoading, refetch } =
    useDocuments({ pageSize: 100 });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<DocumentComparison | null>(null);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selected = useMemo(
    () => allDocuments.filter((d) => selectedIds.includes(d.id)),
    [allDocuments, selectedIds]
  );

  const canCompare = selected.length >= 2;

  const toggleDoc = useCallback(
    (id: string) => {
      setSelectedIds((prev) =>
        prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id]
      );
    },
    []
  );

  const handleCompare = useCallback(async () => {
    if (!canCompare) return;
    setComparing(true);
    setError(null);
    try {
      const result: DocumentComparison = await compareDocuments({
        document_ids: selectedIds,
      });
      setComparison(result);
      setNotice(
        `Comparison generated from ${result.document_titles.length} documents using ${result.provider}.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Comparison failed. Please try again."
      );
    } finally {
      setComparing(false);
    }
  }, [selectedIds, canCompare]);

  if (docsLoading) {
    return (
      <div className="page-shell pt-20 text-center">
        <PageLoading label="Loading your papers" />
      </div>
    );
  }

  if (allDocuments.length === 0) {
    return (
      <div className="page-shell pt-20 text-center">
        <section className="rise rise-1 pt-6 sm:pt-10">
          <span className="eyebrow"><span className="dot" />Research comparison</span>
          <h1 className="mt-4" style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
            Compare your research
          </h1>
          <p className="hero-sub mx-auto mt-3 max-w-xl">
            You don’t have any papers yet. Upload at least two documents to
            compare their objectives, methodology, findings, and more.
          </p>
        </section>
        <div className="mx-auto mt-10" style={{ maxWidth: 560 }}>
          <Link href="/documents" className="primary-button" style={{ padding: "12px 32px", fontSize: 16 }}>
            Upload your first paper
          </Link>
        </div>
      </div>
    );
  }

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
          <button onClick={() => void refetch()} className="ml-1 underline underline-offset-4">Try again</button>
        </p>
      )}

      <section className="rise rise-1 relative pt-6 sm:pt-10">
        <span className="eyebrow"><span className="dot" />Research comparison</span>
        <h1 className="mt-4" style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
          Compare research papers
        </h1>
        <p className="hero-sub mt-3 max-w-xl">
          Select two or more documents to compare objectives, methodology,
          findings, datasets, limitations, similarities, differences, and
          research gaps. Every conclusion cites its source documents.
        </p>
      </section>

      <div className="rise rise-2 mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Document picker */}
        <aside className="gallery-card rise rise-3 !p-5 lg:sticky lg:top-[80px] lg:self-start">
          <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)", marginBottom: 12 }}>
            Select papers ({selectedIds.length} selected)
          </p>
          <div className="max-h-[500px] overflow-y-auto space-y-1">
            {allDocuments.length === 0 ? (
              <p className="py-4 text-center" style={{ fontSize: 14.5, color: "var(--color-graphite)" }}>
                No papers available.
              </p>
            ) : (
              allDocuments.map((d) => {
                const on = selectedIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDoc(d.id)}
                    aria-pressed={on}
                    className="flex w-full items-center gap-3 py-2.5 text-left"
                    style={{
                      borderBottom: "1px solid var(--color-line)",
                      borderRadius: 12,
                      background: on ? "rgba(127,127,133,0.1)" : undefined,
                    }}
                  >
                    <span
                      aria-hidden
                      className="flex h-5 w-5 shrink-0 items-center justify-center"
                      style={{
                        borderRadius: 999,
                        border: on ? "1px solid rgba(255,255,255,0.5)" : "1.5px solid var(--color-line)",
                        background: on ? "rgba(255,255,255,0.9)" : "transparent",
                        color: "var(--color-fog-canvas)",
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: on ? "0 4px 12px rgba(255,255,255,0.35)" : undefined,
                      }}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate" style={{ fontSize: 14.5, color: "var(--color-apple-ink)" }}>
                        {d.title}
                      </span>
                      <span className="block" style={{ fontSize: 11.5, color: "var(--color-slate)" }}>
                        {d.file_type} · {d.page_count} pages
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
          {canCompare && (
            <div className="mt-4">
              <button
                onClick={handleCompare}
                disabled={comparing}
                className="primary-button w-full"
                style={{ padding: "10px 20px", fontSize: 15, opacity: comparing ? 0.6 : 1 }}
              >
                {comparing ? "Comparing…" : "Compare selected"}
              </button>
            </div>
          )}
          {!canCompare && selectedIds.length > 0 && (
            <p className="mt-3" style={{ fontSize: 13, color: "var(--color-slate)" }}>
              Select {2 - selectedIds.length} more paper{2 - selectedIds.length !== 1 ? "s" : ""} to compare.
            </p>
          )}
        </aside>

        {/* Comparison results */}
        <section className="rise rise-3">
          {!comparison && (
            <div className="gallery-card mt-5 !p-6">
              <p style={{ fontSize: 21, fontWeight: 600, color: "var(--color-apple-ink)", letterSpacing: "-0.02em" }}>
                Select papers to compare
              </p>
              <p className="mt-2 max-w-md" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
                Tick two or more papers on the left, then click “Compare
                selected.” The analysis covers objectives, methodology,
                findings, datasets, limitations, similarities, differences,
                and research gaps — all with citations.
              </p>
            </div>
          )}

          {comparison && (
            <>
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <div>
                  <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)" }}>
                    Comparison results
                  </p>
                  <h2 style={{ fontSize: 20, fontWeight: 650, letterSpacing: "-0.01em", color: "var(--color-apple-ink)" }}>
                    Comparing {comparison.document_titles.length} papers
                  </h2>
                </div>
                <p className="mono-meta" style={{ fontSize: 12.5, color: "var(--color-slate)" }}>
                  Generated with {comparison.provider} · {comparison.model}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                {[
                  ["Documents", comparison.document_titles.length],
                  ["Sections", comparison.sections.length],
                  ["Similarities", comparison.similarities.length],
                  ["Differences", comparison.differences.length],
                  ["Research gaps", comparison.research_gaps.length],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl p-4" style={{ background: "rgba(127,127,133,0.08)", border: "1px solid var(--liquid-border-soft)" }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: "var(--color-apple-ink)" }}>{value}</p>
                    <p className="mt-0.5" style={{ fontSize: 12.5, color: "var(--color-slate)" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Sections */}
              <div className="space-y-5">
                {comparison.sections.map((section, i) => (
                  <div key={i} className="gallery-card !p-5">
                    <div className="flex items-baseline justify-between gap-3 mb-3">
                      <h3 style={{ fontSize: 16, fontWeight: 650, color: "var(--color-apple-ink)" }}>
                        {section.title}
                      </h3>
                      {section.citations.length > 0 && (
                        <span className="tag-pill" style={{ fontSize: 11 }}>
                          {section.citations.length} source{section.citations.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, color: "var(--color-iron)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {section.content}
                    </p>
                    {section.citations.length > 0 && (
                      <p className="mt-2" style={{ fontSize: 12, color: "var(--color-slate)" }}>
                        Sources: {section.citations.join(", ")}
                      </p>
                    )}
                  </div>
                ))}

                {comparison.similarities.length > 0 && (
                  <div className="gallery-card !p-5">
                    <h3 style={{ fontSize: 16, fontWeight: 650, color: "var(--color-apple-ink)", marginBottom: 12 }}>
                      Similarities
                    </h3>
                    <ul className="space-y-2" style={{ fontSize: 14, color: "var(--color-iron)", lineHeight: 1.7, listStyle: "disc", paddingLeft: 20 }}>
                      {comparison.similarities.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {comparison.differences.length > 0 && (
                  <div className="gallery-card !p-5">
                    <h3 style={{ fontSize: 16, fontWeight: 650, color: "var(--color-apple-ink)", marginBottom: 12 }}>
                      Differences
                    </h3>
                    <ul className="space-y-2" style={{ fontSize: 14, color: "var(--color-iron)", lineHeight: 1.7, listStyle: "disc", paddingLeft: 20 }}>
                      {comparison.differences.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {comparison.research_gaps.length > 0 && (
                  <div className="gallery-card !p-5">
                    <h3 style={{ fontSize: 16, fontWeight: 650, color: "var(--color-apple-ink)", marginBottom: 12 }}>
                      Research Gaps
                    </h3>
                    <ul className="space-y-2" style={{ fontSize: 14, color: "var(--color-iron)", lineHeight: 1.7, listStyle: "disc", paddingLeft: 20 }}>
                      {comparison.research_gaps.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
