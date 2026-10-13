"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { getMockDocuments, saveMockDocuments, shouldUseMock } from "@/lib/mock";
import type { ResearchDocument } from "@/types/document";
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
  const noteTimer = useRef<number | null>(null);
  const { create: createNote } = useNotes();

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
          recordHistory({ kind: "document_opened", label: `Opened ${found.title}`, detail: `${found.file_type} · ${found.page_count} pages`, href: `/documents/${found.id}` });
        }
      } catch (err) {
        if (shouldUseMock() && err instanceof ApiError && err.status === 0) {
          const mock = getMockDocuments().find((d) => d.id === id) ?? null;
          if (live) {
            setDoc(mock);
            if (mock) {
              setTitle(mock.title);
              recordHistory({ kind: "document_opened", label: `Opened ${mock.title}`, detail: `${mock.file_type} · ${mock.page_count} pages`, href: `/documents/${mock.id}` });
            }
            if (!mock) setError("We couldn't find that paper in your library.");
          }
        } else if (live) {
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

  const summary = useMemo(() => (doc ? localSummary(doc.extracted_text || "", 3) : ""), [doc]);
  const headings = useMemo(() => (doc ? extractHeadings(doc.extracted_text || "") : []), [doc]);
  const terms = useMemo(() => (doc ? extractTerminology(doc.extracted_text || "", 8) : []), [doc]);
  const questions = useMemo(() => (doc ? extractQuestions(doc.extracted_text || "") : []), [doc]);

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
      if (shouldUseMock() && err instanceof ApiError && err.status === 0) {
        const next = getMockDocuments().map((d) => (d.id === doc.id ? { ...d, title: title.trim() } : d));
        saveMockDocuments(next);
        setDoc({ ...doc, title: title.trim() });
        setRenaming(false);
      } else {
        setRenameError(err instanceof Error ? err.message : "Rename failed. Please try again.");
      }
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
      if (shouldUseMock() && err instanceof ApiError && err.status === 0) {
        saveMockDocuments(getMockDocuments().filter((d) => d.id !== doc.id));
        router.push("/documents");
        return;
      }
      setRenameError(err instanceof Error ? err.message : "Delete failed. Please try again.");
      setBusy(false);
    }
  }

  function handleAsk(q: string) {
    if (!doc) return;
    const answer = answerFromText(q, [{ title: doc.title, text: doc.extracted_text || "" }]);
    const id = `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setQa((prev) => [{ id, q, a: answer }, ...prev].slice(0, 5));
    saveConversationPair(q, answer, `Paper: ${doc.title}`);
    recordHistory({ kind: "question_asked", label: `Asked: ${q.slice(0, 70)}`, detail: `About ${doc.title.slice(0, 50)}`, href: `/documents/${doc.id}` });
  }

  function handleSaveNote() {
    if (!doc || !noteBody.trim()) return;
    createNote({ title: `Note on ${doc.title.slice(0, 50)}`, body: noteBody.trim(), documentId: doc.id, documentTitle: doc.title });
    setNoteBody("");
    setNoteSaved(true);
    recordHistory({ kind: "note_created", label: `Saved note on ${doc.title.slice(0, 50)}`, detail: "Pinned to this paper", href: `/documents/${doc.id}` });
    if (noteTimer.current !== null) window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNoteSaved(false), 1800);
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
    <div>
      <nav aria-label="Back" className="flex items-center justify-between pt-2">
        <Link href="/documents" style={{ fontSize: 17, color: "var(--color-link-blue)" }}>
          ← Library
        </Link>
        <button onClick={() => setInsightsOpen((v) => !v)} className="lg:hidden" style={{ fontSize: 15, color: "var(--color-link-blue)" }} aria-expanded={insightsOpen}>
          {insightsOpen ? "Hide key points" : "Show key points"}
        </button>
      </nav>

      <section className="gallery-card mt-4">
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>{doc.file_type} · {doc.page_count} PAGES · {formatBytes(doc.file_size).toUpperCase()}</p>
        {renaming ? (
          <form
            className="mt-3 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
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
          <h1 className="mt-2" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: "clamp(28px,4vw,44px)", fontWeight: 600, letterSpacing: "-0.009em", lineHeight: 1.1, color: "var(--color-apple-ink)", maxWidth: 900 }}>
            {doc.title}
          </h1>
        )}
        <p className="mt-2" style={{ fontSize: 15, color: doc.status === "Failed" ? "var(--color-alert)" : "var(--color-graphite)" }}>
          {doc.status === "Ready" ? `Ready · Filed ${friendlyDate(doc.updated_at)}` : (doc.status ?? "Ready")} · {friendlyDate(doc.updated_at)}
        </p>
        {renameError && (
          <p role="alert" className="mt-2" style={{ fontSize: 15, color: "var(--color-alert)" }}>
            {renameError}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-5" aria-label="Paper actions">
          <button onClick={() => setRenaming(true)} style={{ fontSize: 17, color: "var(--color-link-blue)" }}>Rename</button>
          <button onClick={() => window.print()} style={{ fontSize: 17, color: "var(--color-link-blue)" }}>Print</button>
          <button onClick={handleDelete} disabled={busy} style={{ fontSize: 17, color: "var(--color-alert)" }}>Delete</button>
          <button onClick={() => setInsightsOpen((v) => !v)} className="hidden lg:block" style={{ fontSize: 15, color: "var(--color-slate)" }} aria-expanded={insightsOpen}>
            {insightsOpen ? "Hide key points" : "Show key points"}
          </button>
        </div>
      </section>

      <div className="mt-5">
        <DocumentReader text={doc.extracted_text || ""} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {insightsOpen && (
          <aside aria-label="Key points" className="gallery-card page-enter">
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>KEY POINTS — FROM YOUR FILE</p>
            <div className="mt-3 space-y-4">
              <div>
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

        <aside aria-label="Your note" className="gallery-card">
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>YOUR NOTE ON THIS PAPER</p>
          <label htmlFor="doc-note" className="sr-only">Write a note on this paper</label>
          <textarea
            id="doc-note"
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="What matters here, in your own words…"
            rows={4}
            className="field-input mt-3 !text-[17px]"
          />
          <button onClick={handleSaveNote} disabled={!noteBody.trim()} className="primary-button mt-3" style={{ fontSize: 15 }}>
            {noteSaved ? "Saved ✓" : "Save note"}
          </button>
          <p className="mt-2" style={{ fontSize: 12, color: "var(--color-slate)" }}>Pinned to this paper, kept on your device.</p>
        </aside>
      </div>

      <section aria-label="Ask about this paper" className="gallery-card mt-5">
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>ASK ABOUT THIS PAPER · ANSWERS QUOTE YOUR FILE</p>
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
