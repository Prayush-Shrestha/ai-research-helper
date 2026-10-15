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
  const scopeLabel = selected.length > 0 ? `${selected.length} you ticked` : allDocuments.length > 3 ? "the first 3 (tick up to 5 to change that)" : allDocuments.length > 0 ? "everything you have" : "nothing, because the shelf is empty";

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
    <div className="page-shell">
      <section className="relative pt-6 sm:pt-10">
        <span className="orb" aria-hidden style={{ width: 420, height: 420, top: -140, left: -120, background: "radial-gradient(circle, rgba(157,231,193,0.16), transparent 65%)" }} />
        <span className="orb" aria-hidden style={{ width: 460, height: 460, top: -160, right: -140, background: "radial-gradient(circle, rgba(138,180,248,0.14), transparent 65%)" }} />
        <div className="relative rise rise-1">
          <span className="eyebrow"><span className="dot" />Assistant</span>
          <h1 className="type-heading-sm mt-4" style={{ color: "var(--color-apple-ink)", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Poke at your papers.
          </h1>
          <p className="hero-sub mt-3 max-w-xl">
            Tick a few papers on the left, then ask like you would a friend.
            Right now looking at {scopeLabel}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setLeftOpen((v) => !v)} className="ghost-pill" style={{ fontSize: 14, padding: "8px 18px" }} aria-expanded={leftOpen} aria-pressed={leftOpen}>
              {leftOpen ? "Hide papers" : "Show papers"}
            </button>
            <button onClick={() => setRightOpen((v) => !v)} className="ghost-pill" style={{ fontSize: 14, padding: "8px 18px" }} aria-expanded={rightOpen} aria-pressed={rightOpen}>
              {rightOpen ? "Hide key points" : "Show key points"}
            </button>
          </div>
        </div>
      </section>

      <div className="relative mt-8 grid gap-5 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_280px]">
        {leftOpen && (
          <aside aria-label="Choose papers" className="gallery-card rise rise-2 !p-5 lg:sticky lg:top-[64px] lg:self-start">
            <p className="micro-label">Which papers? ({selectedIds.length}/5)</p>
            <div className="mt-2">
              {loading ? (
                <div className="py-3"><PageLoading label="Finding your papers" /></div>
              ) : allDocuments.length === 0 ? (
                <div className="py-3">
                  <p style={{ fontSize: 17, color: "var(--color-graphite)" }}>Shelf&rsquo;s empty, so there&rsquo;s nothing to ask yet.</p>
                  <Link href="/documents" className="primary-button mt-3" style={{ padding: "8px 20px", fontSize: 15 }}>Add one first</Link>
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
                        style={{ borderRadius: 999, border: on ? "1px solid rgba(157,231,193,0.5)" : "1.5px solid var(--color-line)", background: on ? "rgba(157,231,193,0.9)" : "transparent", color: "var(--color-fog-canvas)", fontSize: 13, fontWeight: 700, boxShadow: on ? "0 4px 16px rgba(157,231,193,0.35)" : undefined }}
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
              <button onClick={() => setSelectedIds([])} className="secondary-button mt-3" style={{ fontSize: 15 }}>
                Clear selection
              </button>
            )}
          </aside>
        )}

        <section aria-label="Conversation" className="rise rise-3">
          <CommandInput onAsk={handleAsk} />
          <div>
            {history.length === 0 ? (
              <div className="gallery-card mt-5">
                <p style={{ fontSize: 21, fontWeight: 600, color: "var(--color-apple-ink)", letterSpacing: "-0.02em" }}>Go on, ask something.</p>
                <p className="mt-2 max-w-md" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
                  “What is this actually about?” is a perfectly good first question.
                  {allDocuments.length === 0 ? " You'll need a paper first, though, or I have nothing to read." : ""}
                </p>
                {allDocuments.length === 0 && (
                  <Link href="/documents" className="primary-button mt-4">To the library</Link>
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

          <div className="mt-5 grid gap-4 sm:grid-cols-3" aria-label="How answers work">
            {[
              ["It quotes", "If the answer isn't in your files, it says so."],
              ["You pick the scope", "The ticked papers, or the first few if you tick nothing."],
              ["You can check", "Open the paper and find the line yourself. Please do."],
            ].map(([k, v], i) => (
              <div key={k} className={`glass-stat rise rise-${4 + i}`}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-apple-ink)" }}>{k}</p>
                <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)", lineHeight: 1.5 }}>{v}</p>
              </div>
            ))}
          </div>
        </section>

        {rightOpen && (
          <aside aria-label="Key points" className="gallery-card rise rise-4 !p-5 lg:sticky lg:top-[64px] lg:self-start">
            <p className="micro-label">The gist</p>
            {!insights ? (
              <p className="mt-2" style={{ fontSize: 17, color: "var(--color-graphite)" }}>Add a paper and I&rsquo;ll pull out what it seems to be about.</p>
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
                <Link href="/documents" className="secondary-button" style={{ fontSize: 15 }}>
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
