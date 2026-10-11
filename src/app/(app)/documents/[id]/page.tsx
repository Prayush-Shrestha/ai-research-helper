"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { getMockDocuments, saveMockDocuments, shouldUseMock } from "@/lib/mock";
import type { ResearchDocument } from "@/types/document";
import { DocumentReader } from "@/components/documents/DocumentReader";
import { formatBytes } from "@/lib/utils";

function techDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
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

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const found = await api.getDocument(id);
        if (live) {
          setDoc(found);
          setTitle(found.title);
        }
      } catch (err) {
        if (shouldUseMock() && err instanceof ApiError && err.status === 0) {
          const mock = getMockDocuments().find((d) => d.id === id) ?? null;
          if (live) {
            setDoc(mock);
            if (mock) setTitle(mock.title);
            if (!mock) setError("Document not found in this workspace.");
          }
        } else if (live) {
          setError(err instanceof Error ? err.message : "Could not load document.");
        }
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [id]);

  async function handleRename() {
    if (!doc || !title.trim()) return;
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
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!doc || !window.confirm(`Delete “${doc.title}”? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteDocument(doc.id);
      router.push("/documents");
    } catch (err) {
      if (shouldUseMock() && err instanceof ApiError && err.status === 0) {
        saveMockDocuments(getMockDocuments().filter((d) => d.id !== doc.id));
        router.push("/documents");
      }
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
        <p className="font-tech pulse-dot pt-16" style={{ color: "var(--color-secondary-text)" }}>OPENING DOCUMENT…</p>
      </main>
    );
  }

  if (error || !doc) {
    return (
      <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
        <section className="pt-16">
          <p className="font-tech" style={{ color: "#ff9d9d" }}>{(error ?? "NOT FOUND").toUpperCase()}</p>
          <Link href="/documents" className="font-tech mt-4 inline-block" style={{ color: "var(--color-secondary-text)" }}>← RETURN TO ARCHIVE</Link>
        </section>
      </main>
    );
  }

  const actionStyle = {
    border: "1px solid var(--color-hairline)",
    background: "var(--color-control)",
    color: "var(--color-secondary-text)",
    borderRadius: 100,
    fontSize: 10,
  } as const;

  return (
    <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
      <nav aria-label="Breadcrumb" className="pt-10">
        <Link href="/documents" className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
          ← ARCHIVE
        </Link>
      </nav>

      <section className="pt-4">
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>DOCUMENT / {doc.id.slice(-3).toUpperCase()}</p>
        {renaming ? (
          <form
            className="mt-3 flex max-w-xl items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void handleRename();
            }}
          >
            <label htmlFor="rename" className="sr-only">Document title</label>
            <input
              id="rename" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
              className="w-full bg-transparent py-2 text-[20px] outline-none"
              style={{ borderBottom: "1px solid var(--color-research-accent)", color: "var(--color-primary-text)" }}
            />
            <button type="submit" disabled={busy} className="font-tech rounded-full px-5 py-2" style={{ background: "var(--color-primary-text)", color: "#050505", fontSize: 10 }}>SAVE</button>
            <button type="button" onClick={() => { setRenaming(false); setTitle(doc.title); }} className="font-tech px-2" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>CANCEL</button>
          </form>
        ) : (
          <h1 className="font-display mt-3" style={{ fontSize: "clamp(36px,5.5vw,64px)", lineHeight: 1, letterSpacing: "-1.5px", maxWidth: 800 }}>
            {doc.title}
          </h1>
        )}
        <div className="font-tech mt-5 flex flex-wrap gap-x-6 gap-y-2" style={{ color: "var(--color-secondary-text)", fontSize: 10 }}>
          <span>{doc.file_type}</span>
          <span>{doc.page_count} PAGES</span>
          <span>{formatBytes(doc.file_size).toUpperCase()}</span>
          <span style={{ color: "var(--color-research-accent)" }}>{doc.status.toUpperCase()}</span>
          <span>{techDate(doc.updated_at)}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Document actions">
          <button onClick={() => setRenaming(true)} className="font-tech rounded-full px-5 py-2" style={actionStyle}>RENAME</button>
          <button onClick={() => window.print()} className="font-tech rounded-full px-5 py-2" style={actionStyle}>DOWNLOAD</button>
          <button onClick={handleDelete} disabled={busy} className="font-tech rounded-full px-5 py-2" style={{ ...actionStyle, color: "#ff9d9d" }}>DELETE</button>
        </div>
      </section>

      <section aria-label="Reading environment" className="mt-10">
        <DocumentReader text={doc.extracted_text || ""} />
      </section>

      <section aria-label="Ask about this document" className="mt-10" style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-panel)", background: "var(--color-deep-black)", padding: "28px clamp(20px,4vw,40px)" }}>
        <p className="font-tech" style={{ color: "var(--color-ai-accent)", fontSize: 10 }}>AI ASSISTANT — SCOPED TO THIS DOCUMENT</p>
        <p className="mt-2 text-[15px]" style={{ color: "var(--color-secondary-text)" }}>
          Month-02 intelligence will answer from this artifact with page-level citations.
        </p>
        <Link href="/assistant" className="font-tech mt-4 inline-block rounded-full px-6 py-3" style={{ background: "var(--color-control)", border: "1px solid var(--color-hairline)", color: "var(--color-primary-text)", fontSize: 10 }}>
          ASK ABOUT THIS DOCUMENT →
        </Link>
      </section>
    </main>
  );
}
