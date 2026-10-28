"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useDocuments } from "@/hooks/useDocuments";
import { CommandInput } from "@/components/assistant/CommandInput";
import { AIResponse, UserPrompt } from "@/components/assistant/AIResponse";
import { PageLoading } from "@/components/ui/Loading";
import { useAuth } from "@/hooks/useAuth";
import {
  askQuestion,
  createConversation,
  getConversation,
  getConversations,
  summarizeDocuments,
  type AskResponse,
  type Conversation,
  type ConversationMessage,
  type SummarizeOut,
} from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function AssistantPage() {
  const { user } = useAuth();
  const { documents: allDocuments, loading } = useDocuments({ pageSize: 12 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [asking, setAsking] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [askError, setAskError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummarizeOut | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const selected = useMemo(
    () => allDocuments.filter((d) => selectedIds.includes(d.id)),
    [allDocuments, selectedIds]
  );
  const scopeDocs = selected.length > 0 ? selected : allDocuments.slice(0, 3);

  const scopeLabel = selected.length > 0
    ? `${selected.length} you ticked`
    : allDocuments.length > 3
      ? "the first 3 (tick up to 5 to change that)"
      : allDocuments.length > 0
        ? "everything you have"
        : "nothing, because the shelf is empty";

  // Load conversations on mount.
  useEffect(() => {
    (async () => {
      try {
        const data = await getConversations();
        const convs = data.conversations;
        setConversations(convs);
        if (convs.length > 0 && !activeConversationId) {
          setActiveConversationId(convs[0].id);
          await loadConversation(convs[0].id);
        }
      } catch {
        /* conversations load failed — user can still start a new one */
      }
    })();
  }, [activeConversationId]);

  const loadConversation = useCallback(
    async (id: string) => {
      try {
        const detail = await getConversation(id);
        setMessages(detail.messages);
      } catch {
        setMessages([]);
      }
    },
    []
  );

  const toggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) =>
        prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id].slice(0, 5)
      );
    },
    []
  );

  const handleAsk = useCallback(
    async (q: string) => {
      setAskError(null);
      setAsking(true);
      try {
        const response: AskResponse = await askQuestion({
          question: q,
          conversation_id: activeConversationId ?? undefined,
          document_ids: selectedIds.length > 0 ? selectedIds : undefined,
        });

        // Create a new conversation if this was the first message.
        if (!activeConversationId) {
          setActiveConversationId(response.conversation_id);
          setConversations((prev) => [
            {
              id: response.conversation_id,
              title: q.slice(0, 60),
              document_ids: selectedIds,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              message_count: 0,
            },
            ...prev,
          ]);
        }

        // Optimistically append messages.
        const userMsg: ConversationMessage = {
          id: `opt-${Date.now()}`,
          role: "user",
          content: q,
          citations: [],
          created_at: new Date().toISOString(),
        };
        const assistantMsg: ConversationMessage = {
          id: response.conversation_id,
          role: "assistant",
          content: response.answer,
          citations: response.citations,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg, assistantMsg]);

        // Refresh conversation list to get updated title/message_count.
        try {
          const convs = await getConversations();
          setConversations(convs.conversations);
          // Re-select the active conversation.
          const updated = convs.conversations.find(
            (c) => c.id === response.conversation_id
          );
          if (updated) {
            setMessages(
              (await getConversation(response.conversation_id)).messages
            );
          }
        } catch {
          /* best effort */
        }
      } catch (err) {
        setAskError(
          err instanceof Error
            ? err.message
            : "Failed to get an answer. Please try again."
        );
      } finally {
        setAsking(false);
      }
    },
    [activeConversationId, selectedIds]
  );

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setAskError(null);
  }, []);

  const handleSummarize = useCallback(async () => {
    setSummaryError(null);
    setSummarizing(true);
    try {
      const ids = selectedIds.length > 0 ? selectedIds : undefined;
      const data: SummarizeOut = await summarizeDocuments({ document_ids: ids });
      setSummary(data);
    } catch (err) {
      setSummaryError(
        err instanceof Error
          ? err.message
          : "Failed to summarize. Please try again."
      );
    } finally {
      setSummarizing(false);
    }
  }, [selectedIds]);

  if (loading) {
    return (
      <div className="pt-10"><PageLoading label="Finding your papers" /></div>
    );
  }

  return (
    <div className="page-shell">
      <section className="relative pt-6 sm:pt-10"><div className="relative rise rise-1">
          <span className="eyebrow"><span className="dot" />Assistant</span>
          <h1 className="type-heading-sm mt-4" style={{ color: "var(--color-apple-ink)", fontWeight: 600, letterSpacing: "-0.03em" }}>
            Ask about your papers.
          </h1>
          <p className="hero-sub mt-3 max-w-xl">
            Pick papers on the left, then ask a question. Answers are grounded
            in your uploaded documents with citations.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setLeftOpen((v) => !v)} className="ghost-pill" style={{ fontSize: 14, padding: "8px 18px" }} aria-expanded={leftOpen} aria-pressed={leftOpen}>
              {leftOpen ? "Hide papers" : "Show papers"}
            </button>
            <button onClick={() => setRightOpen((v) => !v)} className="ghost-pill" style={{ fontSize: 14, padding: "8px 18px" }} aria-expanded={rightOpen} aria-pressed={rightOpen}>
              {rightOpen ? "Hide key points" : "Show key points"}
            </button>
            {activeConversationId && (
              <button onClick={startNewConversation} className="ghost-pill" style={{ fontSize: 14, padding: "8px 18px" }}>
                New conversation
              </button>
            )}
            <button onClick={handleSummarize} disabled={summarizing || scopeDocs.length === 0} className="ghost-pill" style={{ fontSize: 14, padding: "8px 18px" }}>
              {summarizing ? "Summarizing…" : "Summarize papers"}
            </button>
          </div>
          {askError && (
            <p className="mt-2" style={{ fontSize: 14.5, color: "var(--color-alert)" }}>{askError}</p>
          )}
          {summaryError && (
            <p className="mt-2" style={{ fontSize: 14.5, color: "var(--color-alert)" }}>{summaryError}</p>
          )}
        </div>
      </section>

      <div className="relative mt-8 grid gap-5 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_280px]">
        {leftOpen && (
          <aside aria-label="Choose papers" className="gallery-card rise rise-2 !p-5 lg:sticky lg:top-[64px] lg:self-start">
            <p className="micro-label">Which papers? ({selectedIds.length}/5)</p>
            <div className="mt-2">
              {allDocuments.length === 0 ? (
                <div className="py-3">
                  <p style={{ fontSize: 17, color: "var(--color-graphite)" }}>Shelf's empty, so there's nothing to ask yet.</p>
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
                        style={{ borderRadius: 999, border: on ? "1px solid rgba(255,255,255,0.5)" : "1.5px solid var(--color-line)", background: on ? "rgba(255,255,255,0.9)" : "transparent", color: "var(--color-fog-canvas)", fontSize: 13, fontWeight: 700, boxShadow: on ? "0 4px 16px rgba(255,255,255,0.35)" : undefined }}
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
              {selectedIds.length > 0 && (
                <button onClick={() => setSelectedIds([])} className="secondary-button mt-3" style={{ fontSize: 15 }}>
                  Clear selection
                </button>
              )}
            </div>
          </aside>
        )}

        <section aria-label="Conversation" className="rise rise-3">
          <CommandInput
            onAsk={handleAsk}
            disabled={asking || allDocuments.length === 0}
          />
          <div className="min-h-[300px]">
            {messages.length === 0 && !asking && (
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
            )}
            {messages.map((m) => (
              <div key={m.id} className="mt-4">
                {m.role === "user" ? (
                  <UserPrompt query={m.content} />
                ) : (
                  <AIResponse
                    query={m.content}
                    answer={m.content}
                    citations={m.citations}
                    scope={m.role === "assistant" ? "From your documents" : undefined}
                    onRetry={() => {
                      const q = m.content;
                      setAsking(true);
                      handleAsk(q);
                    }}
                  />
                )}
              </div>
            ))}
            {asking && (
              <div className="gallery-card mt-5">
                <div className="flex items-center gap-3 py-4">
                  <span className="tech-label pulse-dot" style={{ color: "var(--color-graphite)" }}>Thinking…</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3" aria-label="How answers work">
            {[
              ["It quotes", "Answers cite your document passages directly."],
              ["You pick the scope", "The ticked papers, or your whole library."],
              ["Not enough evidence", "It will say so instead of guessing."],
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
            {scopeDocs.length === 0 ? (
              <p className="mt-2" style={{ fontSize: 17, color: "var(--color-graphite)" }}>Pick a paper to see a quick summary.</p>
            ) : summary ? (
              <div className="mt-2 space-y-3">
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-apple-ink)" }}>Summary</p>
                  <p className="mt-0.5" style={{ fontSize: 14, color: "var(--color-iron)", lineHeight: 1.6 }}>{summary.summary}</p>
                </div>
                {summary.key_points.length > 0 && (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-apple-ink)" }}>Key points</p>
                    <ul className="mt-0.5 space-y-1" style={{ fontSize: 13.5, color: "var(--color-iron)", lineHeight: 1.5, listStyle: "disc", paddingLeft: 18 }}>
                      {summary.key_points.map((kp, i) => (
                        <li key={i}>{kp.point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {summary.study_questions.length > 0 && (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-apple-ink)" }}>Study questions</p>
                    <ul className="mt-0.5 space-y-1" style={{ fontSize: 13.5, color: "var(--color-iron)", lineHeight: 1.5, listStyle: "disc", paddingLeft: 18 }}>
                      {summary.study_questions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p style={{ fontSize: 12, color: "var(--color-slate)" }}>{scopeDocs.length} {scopeDocs.length === 1 ? "paper" : "papers"} in scope · generated with {summary.provider}</p>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-3">
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-apple-ink)" }}>Selected papers</p>
                  <p className="mt-0.5" style={{ fontSize: 15, color: "var(--color-iron)", lineHeight: 1.5 }}>{scopeDocs.map(d => d.title).join(", ")}</p>
                  <p className="mt-0.5" style={{ fontSize: 12, color: "var(--color-slate)" }}>{scopeDocs.length} {scopeDocs.length === 1 ? "paper" : "papers"} in scope</p>
                </div>
                <Link href="/documents" className="secondary-button" style={{ fontSize: 15 }}>
                  Open library →
                </Link>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

