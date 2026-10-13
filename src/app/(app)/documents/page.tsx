"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentRow } from "@/components/documents/DocumentRow";
import { UploadPanel } from "@/components/documents/UploadPanel";
import { PageLoading } from "@/components/ui/Loading";
import { recordHistory } from "@/hooks/useHistory";
import { ApiError } from "@/lib/api";

type Filter = "ALL" | "PDF" | "DOCX";
type Sort = "newest" | "oldest" | "name";

export default function DocumentsPage() {
  const { documents, loading, error, upload, refetch } = useDocuments();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("newest");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phaseOverride, setPhaseOverride] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const stash = timers.current;
    return () => {
      stash.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, []);

  // Derived during render — never setState inside another updater/effect.
  // Terminal messages (indexed / failed) win; otherwise phase follows progress.
  const phase =
    phaseOverride ??
    (uploading
      ? progress < 40
        ? "Extracting text"
        : progress < 80
          ? "Indexing passages"
          : "Linking concepts"
      : "Extracting text");

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = [...documents];
    if (filter !== "ALL") out = out.filter((d) => d.file_type === filter);
    if (q) out = out.filter((d) => (d.title ?? "").toLowerCase().includes(q) || (d.original_filename ?? "").toLowerCase().includes(q));
    if (sort === "oldest") out.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else if (sort === "name") out.sort((a, b) => a.title.localeCompare(b.title));
    else out.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return out;
  }, [documents, search, filter, sort]);

  async function handleUpload(file: File) {
    setUploading(true);
    setProgress(4);
    setPhaseOverride(null);
    const timer = window.setInterval(() => {
      setProgress((p) => {
        if (p < 40) return p + 4;
        if (p < 80) return p + 3;
        return Math.min(p + 2, 96);
      });
    }, 160);
    try {
      const created = await upload(file, (p) => setProgress(Math.max(p, 20)));
      setProgress(100);
      setPhaseOverride("Document indexed");
      recordHistory({ kind: "document_uploaded", label: `Uploaded ${created.title}`, detail: `${created.file_type} · ${created.page_count} pages`, href: `/documents/${created.id}` });
      timers.current.push(window.setTimeout(() => {
        setUploading(false);
        setUploadOpen(false);
        setProgress(0);
      }, 700));
    } catch (err) {
      setPhaseOverride(err instanceof ApiError ? err.message : "Upload failed");
      timers.current.push(window.setTimeout(() => setUploading(false), 1200));
    } finally {
      window.clearInterval(timer);
    }
  }

  const chip = (active: boolean): CSSProperties => ({
    border: "none",
    background: active ? "var(--color-apple-ink)" : "var(--color-ash)",
    color: active ? "var(--color-fog-canvas)" : "var(--color-apple-ink)",
    borderRadius: 999,
    fontSize: 15,
  });

  return (
    <div>
      <section className="pt-6 text-center sm:pt-10">
        <h1 className="type-heading-sm mx-auto" style={{ color: "var(--color-apple-ink)" }}>
          Library.
        </h1>
        <p className="mx-auto mt-3 max-w-xl" style={{ fontSize: 19, color: "var(--color-graphite)" }}>
          Every paper you&rsquo;ve uploaded, searchable in one place. Open any row to read it.
        </p>
        <div className="mt-5">
          <button onClick={() => setUploadOpen((v) => !v)} className="primary-button">
            {uploadOpen ? "Close" : "Upload a paper +"}
          </button>
        </div>
      </section>

      <section aria-label="Find a paper" className="mx-auto mt-8" style={{ maxWidth: 680 }}>
        <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: "var(--color-pure-white)", borderRadius: 980, border: "1px solid var(--color-line)" }}>
          <span aria-hidden style={{ color: "var(--color-slate)", fontSize: 17 }}>⌕</span>
          <label htmlFor="doc-search" className="sr-only">Search your papers</label>
          <input
            id="doc-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or filename"
            autoComplete="off"
            className="w-full bg-transparent text-[17px] outline-none"
            style={{ color: "var(--color-apple-ink)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" style={{ fontSize: 15, color: "var(--color-link-blue)" }}>Clear</button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {(["ALL", "PDF", "DOCX"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className="px-4 py-1.5" style={chip(filter === f)}>{f === "ALL" ? "All" : f}</button>
          ))}
          <span aria-hidden style={{ color: "var(--color-line)", margin: "0 4px" }}>|</span>
          {(["newest", "oldest", "name"] as Sort[]).map((s) => (
            <button key={s} onClick={() => setSort(s)} aria-pressed={sort === s} className="px-4 py-1.5" style={chip(sort === s)}>{s === "newest" ? "Newest" : s === "oldest" ? "Oldest" : "A–Z"}</button>
          ))}
        </div>
        <p className="mt-3 text-center" style={{ fontSize: 12, color: "var(--color-slate)" }}>
          {list.length} {list.length === 1 ? "paper" : "papers"} {error ? "· showing saved copy" : ""}
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
            <p style={{ fontSize: 21, fontWeight: 600, color: "var(--color-apple-ink)" }}>{search ? "No matches." : "Nothing here yet."}</p>
            <p className="mx-auto mt-2 max-w-md" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
              {search ? `Nothing matches “${search}”. Try fewer words.` : "Upload your first paper to start your library."}
            </p>
            {!search && (
              <button onClick={() => setUploadOpen(true)} className="primary-button mt-5">Upload a paper</button>
            )}
          </div>
        ) : (
          list.map((d, i) => (
            <DocumentRow key={d.id} doc={d} index={i} />
          ))
        )}
      </section>

      <p className="mt-5 text-center" style={{ fontSize: 12, color: "var(--color-slate)" }}>
        Open a row to read, rename, or delete. Deleting asks first and can&rsquo;t be undone.
      </p>
    </div>
  );
}
