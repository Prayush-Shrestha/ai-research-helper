"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDocuments } from "@/hooks/useDocuments";
import { CommandInput } from "@/components/assistant/CommandInput";
import { AIResponse, UserPrompt } from "@/components/assistant/AIResponse";
import { PageLoading } from "@/components/ui/Loading";
import { answerFromText, extractTerminology, loadConversations, localSummary, saveConversationPair } from "@/lib/research";
import { recordHistory } from "@/hooks/useHistory";
import { formatDate } from "@/lib/utils";

export default function AssistantPage() {
  const { documents: allDocuments, loading } = useDocuments({ pageSize: 12 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<Array<{ id: string; q: string; a: string; scope: string }>>([]);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      const prev = loadConversations();
      if (prev.length > 0) {
        const pairs: Array<{ id: string; q: string; a: string; scope: string }> = [];
        for (let i = 0; i < prev.length - 1; i += 2) {
          const q = prev[i];
          const a = prev[i + 1];
          if (q?.role === "user" && a?.role === "assistant") {
            pairs.push({ id: q.id, q: q.body, a: a.body, scope: q.scope ?? "" });
          }
          if (pairs.length >= 3) break;
        }
        // Stored newest-first; keep that order to match newly asked items.
        setHistory(pairs);
      }
    })();
  }, []);

  const selected = useMemo(() => allDocuments.filter((d) => selectedIds.includes(d.id)), [allDocuments, selectedIds]);
  const scopeDocs = selected.length > 0 ? selected : allDocuments.slice(0, 3);
  const scopeLabel = selected.length > 0 ? `${selected.length} selected` : allDocuments.length > 3 ? "first 3 of your library (pick up to 5 to widen scope)" : allDocuments.length > 0 ? "whole library" : "no papers yet";

  const insights = useMemo(() => {
    if (scopeDocs.length === 0) return null;
    const primary = scopeDocs[0];
    if (!primary) return null;
    return {
      title: primary.title,
      summary: localSummary(primary.extracted_text ?? "", 2),
      terms: extractTerminology(primary.extracted_text ?? "", 6),
    };
  }, [scopeDocs]);

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 5)));
  }

  function handleAsk(q: string) {
    const docs = (selected.length > 0 ? selected : allDocuments.slice(0, 3)).map((d) => ({ title: d.title, text: d.extracted_text ?? "" }));
    const answer = answerFromText(q, docs);
    const scope = selected.length > 0 ? `From ${selected.length} selected papers` : "From your library (first 3 papers)";
    const id = `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setHistory((h) => [{ id, q, a: answer, scope }, ...h].slice(0, 8));
    saveConversationPair(q, answer, scope);
    recordHistory({ kind: "question_asked", label: `Asked: ${q.slice(0, 70)}`, detail: scope, href: "/assistant" });
  }

  return (
    <div>
      <section className="pt-6 text-center sm:pt-10">
        <h1 className="type-heading-sm mx-auto" style={{ color: "var(--color-apple-ink)" }}>
          Ask your papers.
        </h1>
        <p className="mx-auto mt-3 max-w-xl" style={{ fontSize: 19, color: "var(--color-graphite)" }}>
          Pick up to five papers, ask in plain words, and get answers that quote the page.
          Currently asking {scopeLabel}.
        </p>
        <div className="mt-3 flex justify-center gap-5">
          <button onClick={() => setLeftOpen((v) => !v)} style={{ fontSize: 15, color: "var(--color-link-blue)" }} aria-expanded={leftOpen}>
            {leftOpen ? "Hide papers" : "Show papers"}
          </button>
          <button onClick={() => setRightOpen((v) => !v)} style={{ fontSize: 15, color: "var(--color-link-blue)" }} aria-expanded={rightOpen}>
            {rightOpen ? "Hide key points" : "Show key points"}
          </button>
        </div>
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_280px]">
        {leftOpen && (
          <aside aria-label="Choose papers" className="gallery-card page-enter !p-5 lg:sticky lg:top-[64px] lg:self-start">
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>PAPERS · UP TO 5 ({selectedIds.length}/5)</p>
            <div className="mt-2">
              {loading ? (
                <div className="py-3"><PageLoading label="Loading papers" /></div>
              ) : allDocuments.length === 0 ? (
                <div className="py-3">
                  <p style={{ fontSize: 17, color: "var(--color-graphite)" }}>No papers yet.</p>
                  <Link href="/documents" className="primary-button mt-3" style={{ padding: "8px 20px", fontSize: 15 }}>Upload one</Link>
                </div>
              ) : (
                allDocuments.slice(0, 12).map((d) => {
                  const on = selectedIds.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggle(d.id)}
                      aria-pressed={on}
                      className="flex w-full items-center gap-3 py-2.5 text-left"
                      style={{ borderBottom: "1px solid var(--color-line)" }}
                    >
                      <span
                        aria-hidden
                        className="flex h-6 w-6 shrink-0 items-center justify-center"
                        style={{ borderRadius: 999, border: on ? "none" : "1.5px solid var(--color-line)", background: on ? "var(--color-electric-blue)" : "transparent", color: "var(--color-fog-canvas)", fontSize: 13, fontWeight: 600 }}
                      >
                        {on ? "✓" : ""}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate" style={{ fontSize: 15, color: "var(--color-apple-ink)" }}>{d.title}</span>
                        <span className="block" style={{ fontSize: 12, color: "var(--color-slate)" }}>{d.file_type} · {d.page_count} pages</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            {selectedIds.length > 0 && (
              <button onClick={() => setSelectedIds([])} className="mt-3" style={{ fontSize: 15, color: "var(--color-link-blue)" }}>
                Clear selection
              </button>
            )}
          </aside>
        )}

        <section aria-label="Conversation">
          <CommandInput onAsk={handleAsk} />
          <div>
            {history.length === 0 ? (
              <div className="gallery-card mt-5 text-center">
                <p style={{ fontSize: 21, fontWeight: 600, color: "var(--color-apple-ink)" }}>Ask your first question.</p>
                <p className="mx-auto mt-2 max-w-md" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
                  Try “Summarise this paper” or “What method is used?”
                  {allDocuments.length === 0 ? " First upload a paper so answers have something to quote." : ""}
                </p>
                {allDocuments.length === 0 && (
                  <Link href="/documents" className="primary-button mt-4">Go to library</Link>
                )}
              </div>
            ) : (
              history.map((h) => (
                <div key={h.id}>
                  <UserPrompt query={h.q} />
                  <AIResponse query={h.q} answer={h.a} scope={h.scope} onRetry={() => handleAsk(h.q)} />
                </div>
              ))
            )}
          </div>

          <div className="gallery-card mt-5 grid gap-4 sm:grid-cols-3" aria-label="How answers work">
            {[
              ["Quoted", "Every claim comes from your files. Nothing invented."],
              ["Scoped", "Ask the whole library or just the papers you pick."],
              ["Checkable", "Open the reader to verify any line."],
            ].map(([k, v]) => (
              <div key={k}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-apple-ink)" }}>{k}</p>
                <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)", lineHeight: 1.5 }}>{v}</p>
              </div>
            ))}
          </div>
        </section>

        {rightOpen && (
          <aside aria-label="Key points" className="gallery-card page-enter !p-5 lg:sticky lg:top-[64px] lg:self-start">
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>KEY POINTS</p>
            {!insights ? (
              <p className="mt-2" style={{ fontSize: 17, color: "var(--color-graphite)" }}>Upload a paper and its key points will appear here.</p>
            ) : (
              <div className="mt-2 space-y-3">
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-apple-ink)" }}>Reading now</p>
                  <p className="mt-0.5" style={{ fontSize: 15, color: "var(--color-iron)", lineHeight: 1.5 }}>{insights.title}</p>
                  <p className="mt-0.5" style={{ fontSize: 12, color: "var(--color-slate)" }}>{scopeDocs.length} {scopeDocs.length === 1 ? "paper" : "papers"} · {scopeDocs[0] ? formatDate(scopeDocs[0].updated_at) : "—"}</p>
                </div>
                <div style={{ borderTop: "1px solid var(--color-line)", paddingTop: 12 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-apple-ink)" }}>In short</p>
                  <p className="mt-0.5" style={{ fontSize: 15, color: "var(--color-iron)", lineHeight: 1.55 }}>{insights.summary || "—"}</p>
                </div>
                <div style={{ borderTop: "1px solid var(--color-line)", paddingTop: 12 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-apple-ink)" }}>Key terms</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {insights.terms.map((t) => (
                      <span key={t} className="tag-pill">{t}</span>
                    ))}
                  </div>
                </div>
                <Link href="/documents" style={{ fontSize: 15, color: "var(--color-link-blue)" }}>
                  Open reader →
                </Link>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
