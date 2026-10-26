"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  addDocumentToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  getCollections,
  removeDocumentFromCollection,
  type CollectionDocumentWithDoc,
  type ResearchCollection,
} from "@/lib/api";
import { PageLoading } from "@/components/ui/Loading";

export default function CollectionsPage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<ResearchCollection[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ResearchCollection & { documents: CollectionDocumentWithDoc[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");

  const loadCollections = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCollections(search || undefined, 1, 100);
      setCollections(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load collections.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  const openCollection = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = await getCollection(id);
      setDetail({
        id: data.id,
        owner_id: data.owner_id,
        name: data.name,
        description: data.description,
        document_count: data.document_count,
        created_at: data.created_at,
        updated_at: data.updated_at,
        documents: data.documents,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load collection.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await createCollection({ name: addName, description: addDesc || undefined });
      setNotice(`Collection “${created.name}” created.`);
      setAddOpen(false);
      setAddName("");
      setAddDesc("");
      await loadCollections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create collection.");
    } finally {
      setBusy(false);
    }
  }, [addName, addDesc, loadCollections]);

  const handleRename = useCallback(async () => {
    if (!detail) return;
    const name = window.prompt("New collection name:", detail.name);
    if (!name || name === detail.name) return;
    setBusy(true);
    try {
      const updated = await createCollection({ name, description: detail.description || undefined });
      // Replace in list
      setCollections((prev) => prev.map((c) => (c.id === detail.id ? { ...c, name } : c)));
      setDetail((d) => d ? { ...d, name } : null);
      setNotice(`Collection renamed to “${name}”.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed.");
    } finally {
      setBusy(false);
    }
  }, [detail]);

  const handleDelete = useCallback(async () => {
    if (!detail) return;
    if (!window.confirm(`Delete collection “${detail.name}”? The documents themselves are not deleted.`)) return;
    setBusy(true);
    try {
      await deleteCollection(detail.id);
      setCollections((prev) => prev.filter((c) => c.id !== detail.id));
      setSelectedId(null);
      setDetail(null);
      setNotice(`Collection “${detail.name}” deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }, [detail]);

  const toggleDoc = useCallback(async (docId: string) => {
    if (!detail) return;
    const already = detail.documents.some((d) => d.document_id === docId);
    try {
      if (already) {
        await removeDocumentFromCollection(detail.id, docId);
      } else {
        await addDocumentToCollection(detail.id, { document_id: docId });
      }
      setNotice(already ? "Document removed from collection." : "Document added to collection.");
      // Refresh detail
      if (detail.id) {
        const refreshed = await getCollection(detail.id);
        setDetail({
          ...detail,
          documents: refreshed.documents,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update collection.");
    }
  }, [detail]);

  if (loading) {
    return (
      <div className="page-shell pt-20 text-center">
        <PageLoading label="Loading your collections" />
      </div>
    );
  }

  if (error && collections.length === 0) {
    return (
      <div className="page-shell pt-20 text-center">
        <p className="hand" style={{ color: "var(--color-alert)" }}>{error}</p>
        <button onClick={() => void loadCollections()} className="primary-button mt-4" style={{ padding: "10px 24px" }}>Try again</button>
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
          <button onClick={() => void loadCollections()} className="ml-1 underline underline-offset-4">Try again</button>
        </p>
      )}

      <section className="rise rise-1 relative pt-6 sm:pt-10">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <span className="eyebrow"><span className="dot" />Collections</span>
            <h1 className="mt-4" style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
              Research collections
            </h1>
            <p className="hero-sub mt-3 max-w-xl">
              Organize your documents into collections or projects. Each
              collection is private to your account.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddOpen((v) => !v)}
              className="primary-button"
              style={{ padding: "10px 24px", fontSize: 14.5 }}
            >
              {addOpen ? "Close" : "New collection +"}
            </button>
          </div>
        </div>
        {addOpen && (
          <form onSubmit={handleCreate} className="mt-4 flex flex-wrap gap-3" style={{ maxWidth: 600 }}>
            <input
              name="name"
              placeholder="Collection name"
              defaultValue=""
              className="field-input"
              style={{ minWidth: 220 }}
              required
            />
            <input
              name="description"
              placeholder="Description (optional)"
              defaultValue=""
              className="field-input"
              style={{ minWidth: 260 }}
            />
            <button type="submit" disabled={busy} className="primary-button" style={{ padding: "10px 20px", fontSize: 14, opacity: busy ? 0.6 : 1 }}>
              {busy ? "Creating…" : "Create"}
            </button>
          </form>
        )}
      </section>

      <section aria-label="Your collections" className="rise rise-2 mt-8 gallery-card !p-6">
        {collections.length === 0 ? (
          <div className="py-10 text-center">
            <p style={{ fontSize: 17, color: "var(--color-graphite)" }}>
              You haven’t created any collections yet.
            </p>
            <p className="mt-2" style={{ fontSize: 14.5, color: "var(--color-slate)" }}>
              Group related papers together to keep your research organized.
              Ask the AI about a collection, or generate a collection summary.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {collections.map((c) => {
              const active = selectedId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => void openCollection(c.id)}
                  aria-pressed={active}
                  className="flex w-full items-center gap-3.5 px-3 py-3.5 text-left"
                  style={{
                    borderBottom: "1px solid var(--liquid-border-soft)",
                    background: active ? "rgba(127,127,133,0.1)" : undefined,
                    borderRadius: 16,
                  }}
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-[15px] font-semibold"
                    style={{ borderRadius: 14, background: "rgba(127,127,133,0.14)", border: "1px solid var(--liquid-border)", color: "var(--color-apple-ink)" }}
                  >
                    {(c.name.trim().charAt(0).toUpperCase() || "?")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate" style={{ fontSize: 15.5, fontWeight: 600, color: "var(--color-apple-ink)" }}>
                      {c.name}
                    </span>
                    <span className="mono-meta block truncate" style={{ fontSize: 12, color: "var(--color-slate)" }}>
                      {c.document_count} paper{c.document_count !== 1 ? "s" : ""} · created {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    {c.description && (
                      <p className="mt-0.5" style={{ fontSize: 12.5, color: "var(--color-graphite)" }}>{c.description}</p>
                    )}
                  </span>
                  <span aria-hidden style={{ color: "var(--color-slate)" }}>→</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {detail && (
        <aside className="rise rise-3 mt-8 gallery-card !p-6" style={{ maxWidth: 460 }}>
          <div className="flex items-baseline justify-between gap-3 mb-5">
            <div>
              <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)" }}>
                Collection: {detail.name}
              </p>
              {detail.description && (
                <p className="mt-0.5" style={{ fontSize: 13.5, color: "var(--color-iron)" }}>{detail.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRename}
                disabled={busy}
                className="ghost-pill"
                style={{ fontSize: 13, padding: "6px 14px", opacity: busy ? 0.6 : 1 }}
              >
                Rename
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                style={{ fontSize: 14.5, fontWeight: 600, color: "var(--color-alert)", opacity: busy ? 0.5 : 1 }}
              >
                Delete collection…
              </button>
            </div>
          </div>

          <div className="mt-4">
            <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)", marginBottom: 8 }}>
              Documents in collection ({detail.documents.length})
            </p>
            {detail.documents.length === 0 ? (
              <p style={{ fontSize: 14.5, color: "var(--color-graphite)" }}>No documents yet. Add papers from your library.</p>
            ) : (
              <div className="space-y-2">
                {detail.documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-2 py-2" style={{ borderBottom: "1px solid var(--liquid-border-soft)" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleDoc(d.document_id); }}
                      className="flex h-5 w-5 shrink-0 items-center justify-center"
                      style={{
                        borderRadius: 999,
                        border: "1.5px solid var(--color-line)",
                        background: "transparent",
                        color: "var(--color-fog-canvas)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </button>
                    <Link
                      href={`/documents/${d.document_id}`}
                      className="min-w-0 flex-1"
                      style={{ fontSize: 14.5, color: "var(--color-apple-ink)" }}
                    >
                      {d.document_title}
                    </Link>
                    <span className="mono-meta shrink-0" style={{ fontSize: 11.5, color: "var(--color-slate)" }}>
                      {d.document_file_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
