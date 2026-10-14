"use client";

import { useState, type CSSProperties } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentRow } from "@/components/documents/DocumentRow";
import { UploadPanel } from "@/components/documents/UploadPanel";
import { PageLoading } from "@/components/ui/Loading";
import { recordHistory } from "@/hooks/useHistory";
import { ApiError } from "@/lib/api";

type Filter = "ALL" | "PDF" | "DOCX";
type Sort = "newest" | "oldest" | "name";

const PAGE_SIZE = 12;

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  const { documents: list, total, loading, error, upload, refetch } = useDocuments({
    search,
    type: filter,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phaseOverride, setPhaseOverride] = useState<string | null>(null);

  // Derived during render — terminal messages win, otherwise phase follows progress.
  const phase =
    phaseOverride ??
    (uploading
      ? progress < 40
        ? "Extracting text"
        : progress < 80
          ? "Indexing passages"
          : "Linking concepts"
      : "Extracting text");

  function resetPage() {
    setPage(1);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setProgress(4);
    setPhaseOverride(null);
    try {
      const created = await upload(file, (p) => setProgress(Math.max(p, 20)));
      setProgress(100);
      setPhaseOverride("Document indexed");
      recordHistory({ kind: "document_uploaded", label: `Uploaded ${created.title}`, detail: `${created.file_type} · ${created.page_count ?? "—"} pages`, href: `/documents/${created.id}` });
      await refetch();
    } catch (err) {
      setPhaseOverride(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadOpen(false);
      setProgress(0);
      setPhaseOverride(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const chip = (active: boolean): CSSProperties => ({
    border: "none",
    background: active ? "var(--color-apple-ink)" : "var(--color-ash)",
    color: active ? "var(--color-fog-canvas)" : "var(--color-apple-ink)",
    borderRadius: 999,
    fontSize: 15,
  });

  return (
    <div>
      <section className="pt-6 sm:pt-10">
        <h1 className="type-heading-sm" style={{ color: "var(--color-apple-ink)" }}>
          {total === 0 ? "Your shelf is waiting." : "Your papers."}
        </h1>
        <p className="mt-3 max-w-xl" style={{ fontSize: 19, color: "var(--color-graphite)" }}>
          {total === 0
            ? "Everything you upload lands here. Start with one."
            : "Everything in one place. Click a row to actually read it."}
        </p>
        <div className="mt-5">
          <button onClick={() => setUploadOpen((v) => !v)} className="primary-button">
            {uploadOpen ? "Close" : total === 0 ? "Put the first one here +" : "Add another +"}
          </button>
        </div>
      </section>

      <section aria-label="Find a paper" className="mx-auto mt-8" style={{ maxWidth: 680 }}>
        <div className="liquid-search flex items-center gap-3 px-5 py-3">
          <span aria-hidden style={{ color: "var(--color-slate)", fontSize: 17 }}>⌕</span>
          <label htmlFor="doc-search" className="sr-only">Search your papers</label>
          <input
            id="doc-search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            placeholder="Type a bit of the title…"
            autoComplete="off"
            className="w-full bg-transparent text-[17px] outline-none"
            style={{ color: "var(--color-apple-ink)" }}
          />
          {search && (
            <button onClick={() => { setSearch(""); resetPage(); }} aria-label="Clear search" style={{ fontSize: 15, color: "var(--color-link-blue)" }}>Clear</button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {(["ALL", "PDF", "DOCX"] as Filter[]).map((f) => (
            <button key={f} onClick={() => { setFilter(f); resetPage(); }} aria-pressed={filter === f} className="px-4 py-1.5" style={chip(filter === f)}>{f === "ALL" ? "All" : f}</button>
          ))}
          <span aria-hidden style={{ color: "var(--color-line)", margin: "0 4px" }}>|</span>
          {(["newest", "oldest", "name"] as Sort[]).map((s) => (
            <button key={s} onClick={() => { setSort(s); resetPage(); }} aria-pressed={sort === s} className="px-4 py-1.5" style={chip(sort === s)}>{s === "newest" ? "Newest" : s === "oldest" ? "Oldest" : "A–Z"}</button>
          ))}
        </div>
        <p className="mt-3 text-center" style={{ fontSize: 12, color: "var(--color-slate)" }}>
          {total} {total === 1 ? "paper" : "papers"}
          {error && (
            <button onClick={() => void refetch()} className="ml-2" style={{ color: "var(--color-link-blue)" }}>Try again</button>
          )}
        </p>
      </section>

      <div className="mt-5">
        <UploadPanel open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} uploading={uploading} progress={progress} phase={phase} />
      </div>

      <section aria-label="Papers" aria-live="polite" className="gallery-card mt-5 !p-4 sm:!p-5">
        {loading ? (
          <PageLoading label="Reading your library" />
        ) : error && list.length === 0 ? (
          <div className="py-10 text-center">
            <p style={{ fontSize: 17, color: "var(--color-alert)" }}>{error}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button onClick={() => void refetch()} className="primary-button">Try again</button>
              <button onClick={() => setUploadOpen(true)} className="ghost-pill">Upload instead</button>
            </div>
          </div>
        ) : list.length === 0 ? (
          <div className="py-10 text-center">
            <p style={{ fontSize: 21, fontWeight: 600, color: "var(--color-apple-ink)" }}>{search ? "Couldn't find that one." : "Nothing filed yet."}</p>
            <p className="mx-auto mt-2 max-w-md" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
              {search ? `Nothing with “${search}” in it. Fewer words usually works better.` : "Drop in the PDF that's been sitting open in a tab for a week."}
            </p>
            {!search && (
              <button onClick={() => setUploadOpen(true)} className="primary-button mt-5">Add a paper</button>
            )}
          </div>
        ) : (
          list.map((d) => (
            <DocumentRow key={d.id} doc={d} />
          ))
        )}
      </section>

      {totalPages > 1 && (
        <nav aria-label="Library pages" className="mt-5 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="ghost-pill"
            style={{ fontSize: 15, opacity: page <= 1 ? 0.5 : 1 }}
          >
            ← Newer
          </button>
          <p style={{ fontSize: 15, color: "var(--color-graphite)" }}>
            Page {page} of {totalPages}
          </p>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="ghost-pill"
            style={{ fontSize: 15, opacity: page >= totalPages ? 0.5 : 1 }}
          >
            Older →
          </button>
        </nav>
      )}

      <p className="mt-5 text-center" style={{ fontSize: 12, color: "var(--color-slate)" }}>
        Click a row to read it. Deleting asks first, and there is no undo, so careful.
      </p>
    </div>
  );
}
