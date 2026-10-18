"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import { downloadUrl, getIndexingStatus, reindexDocument } from "@/lib/api";
import { statusLabel, type ResearchDocument } from "@/types/document";
import { DocumentReader } from "@/components/documents/DocumentReader";
import { CommandInput } from "@/components/assistant/CommandInput";
import { AIResponse, UserPrompt } from "@/components/assistant/AIResponse";
import { PageLoading } from "@/components/ui/Loading";
import { formatBytes } from "@/lib/utils";
import { answerFromText, extractHeadings, extractQuestions, extractTerminology, localSummary, saveConversationPair } from "@/lib/research";
import { useNotes } from "@/hooks/useNotes";
import { recordHistory } from "@/hooks/useHistory";

function friendlyDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<ResearchDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [qa, setQa] = useState<Array<{ id: string; q: string; a: string }>>([]);
  const [noteBody, setNoteBody] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const noteTimer = useRef<number | null>(null);
  const { create: createNote } = useNotes();
  const [indexingStatus, setIndexingStatus] = useState<string | null>(null);
  const [reindexing, setReindexing] = useState(false);

  useEffect(() => {
    return () => {
      if (noteTimer.current !== null) window.clearTimeout(noteTimer.current);
    };
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const found = await api.getDocument(id);
        if (live) {
          setDoc(found);
          setTitle(found.title);
          recordHistory({ kind: "document_opened", label: `Opened ${found.title}`, detail: `${found.file_type} · ${found.page_count ?? "—"} pages`, href: `/documents/${found.id}` });
        }
      } catch (err) {
        if (live) {
          setError(err instanceof Error ? err.message : "Could not load this paper.");
        }
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [id]);

  const loadIndexingStatus = useCallback(async () => {
    try {
      const status = await getIndexingStatus(id);
      setIndexingStatus(status.indexing_status);
    } catch {
      /* indexing status is optional UI */
    }
  }, [id]);

  useEffect(() => {
    void loadIndexingStatus();
  }, [loadIndexingStatus]);

  const text = doc?.extracted_text ?? "";
  const summary = useMemo(() => localSummary(text, 3), [text]);
  const headings = useMemo(() => extractHeadings(text), [text]);
  const terms = useMemo(() => extractTerminology(text, 8), [text]);
  const questions = useMemo(() => extractQuestions(text), [text]);

  async function handleRename() {
    if (!doc || !title.trim()) {
      setRenameError("Please enter a document name.");
      return;
    }
    setRenameError(null);
    setBusy(true);
    try {
      const updated = await api.renameDocument(doc.id, title.trim());
      setDoc(updated);
      setRenaming(false);
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Rename failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!doc || !window.confirm(`Delete “${doc.title}”? This can't be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteDocument(doc.id);
      router.push("/documents");
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Delete failed. Please try again.");
      setBusy(false);
    }
  }

  async function handleRetry() {
    if (!doc) return;
    setBusy(true);
    setRenameError(null);
    try {
      const updated = await api.retryExtraction(doc.id);
      setDoc(updated);
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Retry failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleAsk(q: string) {
    if (!doc) return;
    const answer = answerFromText(q, [{ title: doc.title, text: doc.extracted_text ?? "" }]);
    const id = `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setQa((prev) => [{ id, q, a: answer }, ...prev].slice(0, 5));
    saveConversationPair(q, answer, `Paper: ${doc.title}`);
    recordHistory({ kind: "question_asked", label: `Asked: ${q.slice(0, 70)}`, detail: `About ${doc.title.slice(0, 50)}`, href: `/documents/${doc.id}` });
  }

  async function handleSaveNote() {
    if (!doc || !noteBody.trim()) return;
    setNoteError(null);
    try {
      await createNote({ title: `Note on ${doc.title.slice(0, 50)}`, body: noteBody.trim(), documentId: doc.id, documentTitle: doc.title });
      setNoteBody("");
      setNoteSaved(true);
      recordHistory({ kind: "note_created", label: `Saved note on ${doc.title.slice(0, 50)}`, detail: "Pinned to this paper", href: `/documents/${doc.id}` });
      if (noteTimer.current !== null) window.clearTimeout(noteTimer.current);
      noteTimer.current = window.setTimeout(() => setNoteSaved(false), 1800);
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Could not save your note. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="pt-10">
        <PageLoading label="Opening your paper" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="gallery-card mt-8 text-center">
        <p className="tech-label" style={{ color: "var(--color-alert)", fontSize: 12 }}>{(error ?? "Not found")}</p>
        <Link href="/documents" className="secondary-button mt-3">← Back to library</Link>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <nav aria-label="Back" className="relative flex items-center justify-between pt-2 rise rise-1">
        <Link href="/documents" className="ghost-pill" style={{ fontSize: 14, padding: "8px 18px", textDecoration: "none" }}>
          ← Library
        </Link>
        <button onClick={() => setInsightsOpen((v) => !v)} className="ghost-pill lg:hidden" style={{ fontSize: 14, padding: "8px 18px" }} aria-expanded={insightsOpen} aria-pressed={insightsOpen}>
          {insightsOpen ? "Hide key points" : "Show key points"}
        </button>
      </nav>

      <section className="relative mt-4 rise rise-1">
        <span className="orb" aria-hidden style={{ width: 420, height: 420, top: -120, left: -120, background: "radial-gradient(circle, rgba(157,231,193,0.14), transparent 65%)" }} />
        <span className="orb" aria-hidden style={{ width: 440, height: 440, top: -140, right: -120, background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 65%)" }} />
        <div className="gallery-card relative">
          <div className="flex flex-wrap gap-2">
            <span className="eyebrow" style={{ fontSize: 11 }}><span className="dot" />{doc.file_type}</span>
            <span className="tag-pill">{doc.page_count ?? "—"} pages</span>
            <span className="tag-pill">{formatBytes(doc.file_size).toUpperCase()}</span>
            <span className={`tag-pill${doc.extraction_status === "failed" ? " crimson" : ""}`}>{statusLabel(doc.extraction_status)}</span>
            <span className={`tag-pill${indexingStatus === "failed" ? " crimson" : ""}`}>
              {indexingStatus === "completed" ? "Indexed" : indexingStatus === "processing" ? "Indexing…" : indexingStatus === "failed" ? "Index failed" : "Not indexed"}
            </span>
          </div>
          {renaming ? (
            <form
              className="mt-4 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                void handleRename();
              }}
            >
              <label htmlFor="rename" className="sr-only">Paper title</label>
              <input
                id="rename" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                className="field-input w-full !text-[19px]"
                style={{ fontWeight: 600 }}
              />
              <div className="flex shrink-0 gap-2">
                <button type="submit" disabled={busy} className="primary-button" style={{ padding: "8px 22px", fontSize: 15 }}>Save</button>
                <button type="button" onClick={() => { setRenaming(false); setTitle(doc.title); }} className="secondary-button" style={{ fontSize: 15 }}>Cancel</button>
              </div>
            </form>
          ) : (
            <h1 className="mt-3" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: "clamp(28px,4vw,44px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--color-apple-ink)", maxWidth: 900 }}>
              {doc.title}
            </h1>
          )}
          <p className="hero-sub mt-2" style={{ fontSize: 15 }}>
            {statusLabel(doc.extraction_status)} · Filed {friendlyDate(doc.updated_at)}
          </p>
          {doc.extraction_error && (
            <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)" }}>
              {doc.extraction_error}
            </p>
          )}
          {(doc.extraction_status === "failed" || doc.extraction_status === "requires_ocr") && (
            <div className="mt-2">
              <button onClick={() => void handleRetry()} disabled={busy} className="ghost-pill" style={{ fontSize: 14, padding: "8px 18px" }}>
                {busy ? "Retrying…" : "Retry extraction"}
              </button>
            </div>
          )}
          {(indexingStatus === "failed" || indexingStatus === null || indexingStatus === "pending") && (
            <div className="mt-2">
              <button onClick={() => { setReindexing(true); void reindexDocument(id).then(() => { setReindexing(false); void loadIndexingStatus(); }).catch(() => setReindexing(false)) }} disabled={busy || reindexing} className="ghost-pill" style={{ fontSize: 14, padding: "8px 18px" }}>
                {reindexing ? "Indexing…" : "Index for Q&A"}
              </button>
            </div>
          )}
          {renameError && (
            <p role="alert" className="mt-2" style={{ fontSize: 15, color: "var(--color-alert)" }}>
              {renameError}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3" aria-label="Paper actions">
            <button onClick={() => setRenaming(true)} className="ghost-pill" style={{ fontSize: 14, padding: "8px 18px" }}>Rename</button>
            <a href={downloadUrl(doc.id)} download={doc.original_filename} className="ghost-pill" style={{ fontSize: 14, padding: "8px 18px", textDecoration: "none" }}>Download</a>
            <button onClick={handleDelete} disabled={busy} className="ghost-pill" style={{ fontSize: 14, padding: "8px 18px", color: "var(--color-alert)" }}>Delete</button>
            <button onClick={() => setInsightsOpen((v) => !v)} className="ghost-pill hidden lg:inline-flex" style={{ fontSize: 14, padding: "8px 18px" }} aria-expanded={insightsOpen} aria-pressed={insightsOpen}>
              {insightsOpen ? "Hide key points" : "Show key points"}
            </button>
          </div>
        </div>
      </section>

      <div className="mt-5 rise rise-2">
        <DocumentReader text={text} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {insightsOpen && (
          <aside aria-label="Key points" className="gallery-card page-enter rise rise-3">
            <p className="micro-label">Key points — from your file</p>
            <div className="mt-3 space-y-4">
              <div className="glass-stat">
                <p style={{ fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>In short</p>
                <p className="mt-1" style={{ fontSize: 17, color: "var(--color-iron)", lineHeight: 1.6 }}>{summary || "No summary line found — start at the first section instead."}</p>
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>Sections</p>
                <ul className="mt-1 space-y-1">
                  {headings.length === 0 && <li style={{ fontSize: 15, color: "var(--color-slate)" }}>No section headings found.</li>}
                  {headings.map((h, i) => (
                    <li key={`${i}-${h.slice(0, 40)}`} style={{ fontSize: 15, color: "var(--color-iron)" }}>{i + 1}. {h.slice(0, 60)}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>Key terms</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {terms.length === 0 && <span style={{ fontSize: 15, color: "var(--color-slate)" }}>—</span>}
                  {terms.map((t) => (
                    <span key={t} className="tag-pill">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>Questions to explore</p>
                <ol className="mt-1 space-y-1.5">
                  {questions.map((q, i) => (
                    <li key={i} style={{ fontSize: 15, color: "var(--color-iron)", lineHeight: 1.5 }}>
                      {q}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </aside>
        )}

        <aside aria-label="Your note" className="gallery-card rise rise-4">
          <p className="micro-label">Your note on this paper</p>
          <label htmlFor="doc-note" className="sr-only">Write a note on this paper</label>
          <textarea
            id="doc-note"
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="What matters here, in your own words…"
            rows={4}
            className="field-input mt-3 !text-[17px]"
          />
          <button onClick={() => void handleSaveNote()} disabled={!noteBody.trim()} className="primary-button mt-3" style={{ fontSize: 15 }}>
            {noteSaved ? "Saved ✓" : "Save note"}
          </button>
          {noteError && (
            <p role="alert" className="mt-2" style={{ fontSize: 15, color: "var(--color-alert)" }}>
              {noteError}
            </p>
          )}
          <p className="footnote mt-2">Pinned to this paper, saved to your library.</p>
        </aside>
      </div>

      <section aria-label="Ask about this paper" className="gallery-card mt-5 rise rise-5">
        <p className="micro-label">Ask about this paper · answers quote your file</p>
        <div className="mt-3">
          <CommandInput onAsk={handleAsk} />
        </div>
        <div>
          {qa.length === 0 && (
            <p className="mt-4" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
              Try “summarise this paper”, “what method is used?”, or “what are the limitations?”
            </p>
          )}
          {qa.map((item) => (
            <div key={item.id}>
              <UserPrompt query={item.q} />
              <AIResponse query={item.q} answer={item.a} scope={`From: ${doc.title}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
