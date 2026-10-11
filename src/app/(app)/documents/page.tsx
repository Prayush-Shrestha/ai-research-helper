"use client";

import { useMemo, useState } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentRow } from "@/components/documents/DocumentRow";
import { UploadPanel } from "@/components/documents/UploadPanel";
import { ApiError } from "@/lib/api";

type Filter = "ALL" | "PDF" | "DOCX";
type Sort = "newest" | "oldest" | "name";

export default function DocumentsPage() {
  const { documents, loading, error, upload } = useDocuments();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("newest");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("Extracting text");

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = [...documents];
    if (filter !== "ALL") out = out.filter((d) => d.file_type === filter);
    if (q) out = out.filter((d) => d.title.toLowerCase().includes(q) || d.original_filename.toLowerCase().includes(q));
    if (sort === "oldest") out.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else if (sort === "name") out.sort((a, b) => a.title.localeCompare(b.title));
    else out.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return out;
  }, [documents, search, filter, sort]);

  async function handleUpload(file: File) {
    setUploading(true);
    setProgress(4);
    setPhase("Extracting text");
    const timer = window.setInterval(() => {
      setProgress((p) => {
        if (p < 40) return p + 4;
        if (p < 80) {
          setPhase("Indexing passages");
          return p + 3;
        }
        setPhase("Linking concepts");
        return Math.min(p + 2, 96);
      });
    }, 160);
    try {
      await upload(file, (p) => setProgress(Math.max(p, 20)));
      setProgress(100);
      setPhase("Document indexed");
      window.setTimeout(() => {
        setUploading(false);
        setUploadOpen(false);
        setProgress(0);
      }, 700);
    } catch (err) {
      setPhase(err instanceof ApiError ? err.message : "Upload failed");
      window.setTimeout(() => setUploading(false), 1200);
    } finally {
      window.clearInterval(timer);
    }
  }

  const pill = (active: boolean): React.CSSProperties => ({
    border: "1px solid var(--color-hairline)",
    background: active ? "var(--color-primary-text)" : "var(--color-control)",
    color: active ? "#050505" : "var(--color-secondary-text)",
    borderRadius: 100,
    fontSize: 10,
  });

  return (
    <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
      <section className="pt-12 sm:pt-16">
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>ARCHIVE / 02</p>
        <h1 className="font-display mt-2" style={{ fontSize: "clamp(48px,7vw,84px)", lineHeight: 0.95, letterSpacing: "-2px" }}>
          Research
          <br />
          Library
        </h1>
        <p className="mt-4 text-[15px]" style={{ color: "var(--color-secondary-text)" }}>
          A structured archive of your research material.
        </p>
      </section>

      {/* command utility */}
      <section aria-label="Library controls" className="mt-10" style={{ borderTop: "1px solid var(--color-hairline)", borderBottom: "1px solid var(--color-hairline)", padding: "20px 0" }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <span className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>⌕</span>
            <label htmlFor="doc-search" className="sr-only">Search documents</label>
            <input
              id="doc-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH DOCUMENTS —"
              autoComplete="off"
              className="font-tech w-full bg-transparent py-2 outline-none placeholder:text-[#62686A]"
              style={{ color: "var(--color-primary-text)", fontSize: 12 }}
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search" className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>CLEAR ✕</button>
            )}
          </div>
          <button
            onClick={() => setUploadOpen((v) => !v)}
            className="font-tech shrink-0 rounded-full px-6 py-3"
            style={{ background: "var(--color-primary-text)", color: "#050505", fontSize: 11, borderRadius: 100 }}
          >
            {uploadOpen ? "CLOSE PANEL" : "UPLOAD DOCUMENT +"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="micro-label mr-1" style={{ color: "var(--color-tertiary-text)" }}>FILTER</span>
          {(["ALL", "PDF", "DOCX"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className="font-tech rounded-full px-4 py-1.5" style={pill(filter === f)}>{f}</button>
          ))}
          <span className="micro-label ml-4 mr-1" style={{ color: "var(--color-tertiary-text)" }}>SORT</span>
          {(["newest", "oldest", "name"] as Sort[]).map((s) => (
            <button key={s} onClick={() => setSort(s)} aria-pressed={sort === s} className="font-tech rounded-full px-4 py-1.5" style={pill(sort === s)}>{s === "newest" ? "RECENT" : s === "oldest" ? "OLDEST" : "A-Z"}</button>
          ))}
          <span className="font-tech ml-auto" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
            {String(list.length).padStart(2, "0")} RESULTS {error ? "— STALE" : ""}
          </span>
        </div>
      </section>

      <div className="mt-6">
        <UploadPanel open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} uploading={uploading} progress={progress} phase={phase} />
      </div>

      {/* rows */}
      <section aria-label="Documents" aria-live="polite" className="mt-4">
        <div className="font-tech hidden grid-cols-[56px_1fr_90px_80px_130px_90px_32px] gap-6 px-4 pb-3 sm:grid" style={{ color: "var(--color-tertiary-text)", fontSize: 9 }}>
          <span>N°</span><span>DOCUMENT</span><span>TYPE</span><span>PAGES</span><span>DATE</span><span>STATUS</span><span />
        </div>
        {loading ? (
          <p className="font-tech pulse-dot py-10" style={{ color: "var(--color-secondary-text)" }}>READING ARCHIVE…</p>
        ) : error && list.length === 0 ? (
          <div className="py-12"><p className="font-tech" style={{ color: "#ff9d9d", fontSize: 11 }}>{error.toUpperCase()}</p></div>
        ) : list.length === 0 ? (
          <div className="py-12">
            <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>{search ? "NO RESULTS" : "ARCHIVE EMPTY"}</p>
            <p className="mt-2 text-[15px]" style={{ color: "var(--color-secondary-text)" }}>
              {search ? `Nothing matches “${search}”. Try a different term.` : "Introduce your first document to begin."}
            </p>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid var(--color-hairline)" }}>
            {list.map((d, i) => (
              <DocumentRow key={d.id} doc={d} index={i} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
