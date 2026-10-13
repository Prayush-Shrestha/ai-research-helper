"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { useCollections } from "@/hooks/useCollections";
import { useNotes } from "@/hooks/useNotes";
import { useHistory, recordHistory } from "@/hooks/useHistory";
import { DocumentRow } from "@/components/documents/DocumentRow";
import { UploadPanel } from "@/components/documents/UploadPanel";
import { NucleusLoader } from "@/components/research/Nucleus";
import { loadConversations } from "@/lib/research";
import { formatDate } from "@/lib/utils";
import { ApiError, getDashboard } from "@/lib/api";
import type { DashboardData } from "@/types/document";

function PanelHead({ title, href, link }: { title: string; href: string; link: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 21, fontWeight: 600, letterSpacing: "-0.012em", color: "var(--color-apple-ink)" }}>{title}</h2>
      <Link href={href} style={{ fontSize: 17, color: "var(--color-link-blue)" }}>{link} →</Link>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  // Newest-first library page (recent docs) + live search, both server-driven.
  const { documents: recent, total, loading, upload, error, refetch } = useDocuments({ sort: "newest", pageSize: 5 });
  const [search, setSearch] = useState("");
  const { documents: searchResults } = useDocuments({ search, pageSize: 5 });
  const { collections } = useCollections();
  const { notes } = useNotes();
  const { entries } = useHistory();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
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

  // Real counts from the backend — never fabricated.
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const data = await getDashboard();
        if (live) {
          setStats(data);
          setStatsError(null);
        }
      } catch (err) {
        if (live) setStatsError(err instanceof Error ? err.message : "Could not load stats.");
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const docCount = stats?.counts.total_documents ?? total;

  const filtered = useMemo(() => searchResults, [searchResults]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const conversations = useMemo(() => loadConversations().filter((m) => m.role === "user").slice(0, 3), [entries.length]);

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
      try {
        setStats(await getDashboard());
      } catch {
        /* stats refresh is best effort */
      }
      timers.current.push(window.setTimeout(() => {
        setUploading(false);
        setUploadOpen(false);
        setProgress(0);
        setPhaseOverride(null);
      }, 700));
    } catch (err) {
      setPhaseOverride(err instanceof ApiError ? err.message : "Upload failed");
      timers.current.push(window.setTimeout(() => {
        setUploading(false);
        setPhaseOverride(null);
      }, 1200));
    }
  }

  return (
    <div>
      <section className="pt-6 text-center sm:pt-10">
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>
          {docCount} {docCount === 1 ? "paper" : "papers"} in your library
        </p>
        <h1 className="type-heading-sm mx-auto mt-2" style={{ color: "var(--color-apple-ink)", maxWidth: 640 }}>
          Good to see you, {firstName}.
        </h1>
        <p className="mx-auto mt-3 max-w-xl" style={{ fontSize: 19, color: "var(--color-graphite)" }}>
          Search your papers, upload the next one, or carry on where you left off.
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={() => setUploadOpen((v) => !v)} className="primary-button">
            {uploadOpen ? "Close" : "Upload a paper"}
          </button>
          <Link href="/documents" className="ghost-pill">
            Open library
          </Link>
        </div>
      </section>

      <section aria-label="Search your papers" className="mx-auto mt-8" style={{ maxWidth: 680 }}>
        <div className="flex items-center gap-3 px-5 py-3" style={{ background: "var(--color-pure-white)", borderRadius: 12, border: "1px solid var(--color-line)" }}>
          <span aria-hidden style={{ color: "var(--color-slate)", fontSize: 17 }}>⌕</span>
          <label htmlFor="dash-search" className="sr-only">Search your papers</label>
          <input
            id="dash-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your papers"
            autoComplete="off"
            className="w-full bg-transparent text-[17px] outline-none"
            style={{ color: "var(--color-apple-ink)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" style={{ fontSize: 15, color: "var(--color-link-blue)" }}>Clear</button>
          )}
        </div>
        {search.trim() && (
          <div className="gallery-card mt-4 !p-4" aria-live="polite">
            {filtered.length === 0 ? (
              <p className="px-2 py-3" style={{ fontSize: 17, color: "var(--color-graphite)" }}>No papers match “{search}”.</p>
            ) : (
              filtered.map((d) => (
                <DocumentRow key={d.id} doc={d} />
              ))
            )}
          </div>
        )}
      </section>

      <div className="mt-4">
        <UploadPanel open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} uploading={uploading} progress={progress} phase={phase} />
      </div>
      {(error || statsError) && (
        <p role="alert" className="mt-4 text-center" style={{ fontSize: 15, color: "var(--color-alert)" }}>
          {error ?? statsError}{" "}
          <button onClick={() => void refetch()} className="ml-1" style={{ color: "var(--color-link-blue)" }}>Try again</button>
        </p>
      )}

      <section aria-label="At a glance" className="mt-8 grid gap-5 sm:grid-cols-3">
        {[
          ["Papers", String(docCount)],
          ["PDF", String(stats?.counts.pdf_count ?? "—")],
          ["Notes", String(stats?.counts.total_notes ?? notes.length)],
        ].map(([label, value]) => (
          <div key={label} className="gallery-card text-center">
            <p style={{ fontSize: 32, fontWeight: 600, color: "var(--color-apple-ink)" }}>{value}</p>
            <p className="mt-1" style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>{label.toUpperCase()}</p>
          </div>
        ))}
      </section>

      <section aria-label="Recently opened" className="gallery-card mt-5">
        <PanelHead title="Recently opened" href="/documents" link="See all" />
        <div className="mt-2">
          {loading ? (
            <NucleusLoader label="Loading your library" />
          ) : recent.length === 0 ? (
            <div className="py-8 text-center">
              <p style={{ fontSize: 21, fontWeight: 600, color: "var(--color-apple-ink)" }}>Your shelf is empty.</p>
              <p className="mx-auto mt-2 max-w-md" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
                Upload your first paper — PDF or DOCX, up to 15 MB — and it will appear here.
              </p>
              <button onClick={() => setUploadOpen(true)} className="primary-button mt-5">Upload a paper</button>
            </div>
          ) : (
            recent.map((d) => (
              <DocumentRow key={d.id} doc={d} />
            ))
          )}
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-3" aria-label="Workspace overview">
        <div className="gallery-card">
          <PanelHead title="Collections" href="/collections" link="Open" />
          <div className="mt-2">
            {collections.length === 0 ? (
              <p className="py-3" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
                No collections yet. Group papers that belong together.
              </p>
            ) : (
              collections.slice(0, 4).map((c) => (
                <Link key={c.id} href="/collections" className="flex items-baseline justify-between py-2.5" style={{ borderBottom: "1px solid var(--color-line)" }}>
                  <span className="truncate" style={{ fontSize: 17, color: "var(--color-apple-ink)" }}>{c.name}</span>
                  <span className="shrink-0" style={{ fontSize: 12, color: "var(--color-slate)" }}>{c.documentIds.length} papers</span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="gallery-card">
          <PanelHead title="Recent questions" href="/assistant" link="Open" />
          <div className="mt-2">
            {conversations.length === 0 ? (
              <p className="py-3" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
                No questions yet. Ask your first one in the Assistant.
              </p>
            ) : (
              conversations.map((m) => (
                <Link key={m.id} href="/assistant" className="block py-2.5" style={{ borderBottom: "1px solid var(--color-line)" }}>
                  <p className="truncate" style={{ fontSize: 17, color: "var(--color-apple-ink)" }}>{m.body}</p>
                  <p className="mt-0.5" style={{ fontSize: 12, color: "var(--color-slate)" }}>{formatDate(m.created_at)} · {(m.scope ?? "").slice(0, 50)}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="gallery-card">
          <PanelHead title="Saved notes" href="/notes" link="Open" />
          <div className="mt-2">
            {notes.length === 0 ? (
              <p className="py-3" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
                No notes yet. Pin observations to their source paper.
              </p>
            ) : (
              notes.slice(0, 4).map((n) => (
                <Link key={n.id} href="/notes" className="block py-2.5" style={{ borderBottom: "1px solid var(--color-line)" }}>
                  <p className="truncate" style={{ fontSize: 17, color: "var(--color-apple-ink)" }}>{n.title}</p>
                  <p className="mt-0.5 truncate" style={{ fontSize: 12, color: "var(--color-slate)" }}>
                    {(n.documentTitle ?? "No source")} · {formatDate(n.updated_at)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section aria-label="Activity" className="gallery-card mt-5">
        <PanelHead title="Activity" href="/history" link="Full history" />
        <div className="mt-2">
          {entries.length === 0 ? (
            <p className="py-3" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
              Uploads, readings, questions and notes will appear here.
            </p>
          ) : (
            entries.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-baseline gap-4 py-2.5" style={{ borderBottom: "1px solid var(--color-line)" }}>
                <span className="shrink-0" style={{ fontSize: 12, color: "var(--color-slate)" }}>
                  {formatDate(e.created_at)}
                </span>
                <div className="min-w-0">
                  <p className="truncate" style={{ fontSize: 17, color: "var(--color-apple-ink)" }}>{e.label}</p>
                  <p className="truncate" style={{ fontSize: 12, color: "var(--color-slate)" }}>{e.detail}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
