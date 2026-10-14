"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useNotes } from "@/hooks/useNotes";
import { useDocuments } from "@/hooks/useDocuments";
import { recordHistory } from "@/hooks/useHistory";
import { formatDate } from "@/lib/utils";

export default function NotesPage() {
  const { notes, create, update, remove } = useNotes();
  const { documents: allDocuments } = useDocuments({ pageSize: 100 });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [docId, setDocId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || (n.documentTitle ?? "").toLowerCase().includes(q));
  }, [notes, search]);

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const trimmedTitle = title.trim();
    const doc = allDocuments.find((d) => d.id === docId) ?? null;
    const finalTitle = trimmedTitle || `Note · ${formatDate(new Date().toISOString())}`;
    create({ title: finalTitle, body: body.trim(), documentId: doc?.id ?? null, documentTitle: doc?.title ?? null });
    recordHistory({ kind: "note_created", label: `Wrote “${finalTitle.slice(0, 50)}”`, detail: doc ? `On ${doc.title.slice(0, 50)}` : "No paper attached", href: "/notes" });
    setTitle("");
    setBody("");
    setDocId("");
  }

  return (
    <div>
      <section className="pt-6 sm:pt-10">
        <h1 className="type-heading-sm" style={{ color: "var(--color-apple-ink)" }}>
          Margin scribbles, kept.
        </h1>
        <p className="mt-3 max-w-xl" style={{ fontSize: 19, color: "var(--color-graphite)" }}>
          The half-thoughts you have while reading. Attach the paper if you want, or don&rsquo;t.
        </p>
      </section>

      <section aria-label="Write a note" className="gallery-card mt-8">
        <form onSubmit={handleCreate} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_280px]">
            <div>
              <label htmlFor="note-title" className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>Give it a name</label>
              <input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. why the method section bugs me" className="field-input" />
            </div>
            <div>
              <label htmlFor="note-doc" className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>Paper <span style={{ color: "var(--color-slate)" }}>(optional)</span></label>
              <select
                id="note-doc"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                className="field-input"
                style={{ background: "var(--color-pure-white)" }}
              >
                <option value="">None</option>
                {allDocuments.map((d) => (
                  <option key={d.id} value={d.id}>{d.title.slice(0, 60)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="note-body" className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>Note</label>
            <textarea id="note-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="What stuck with you? Write it like you'd tell a friend…" rows={3} className="field-input" />
          </div>
          <div>
            <button type="submit" disabled={!body.trim()} className="primary-button">
              Save note
            </button>
          </div>
        </form>
      </section>

      <section aria-label="Find a note" className="mx-auto mt-5" style={{ maxWidth: 680 }}>
        <div className="flex items-center gap-3 px-5 py-3" style={{ background: "var(--color-pure-white)", borderRadius: 12, border: "1px solid var(--color-line)" }}>
          <span aria-hidden style={{ color: "var(--color-slate)", fontSize: 17 }}>⌕</span>
          <label htmlFor="notes-search" className="sr-only">Search notes</label>
          <input
            id="notes-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Dig through old notes…"
            autoComplete="off"
            className="w-full bg-transparent text-[17px] outline-none"
            style={{ color: "var(--color-apple-ink)" }}
          />
          <span className="shrink-0" style={{ fontSize: 12, color: "var(--color-slate)" }}>{filtered.length}</span>
        </div>
      </section>

      <section aria-label="Your notes" className="mt-5">
        {filtered.length === 0 ? (
          <div className="gallery-card py-10 text-center">
            <p style={{ fontSize: 21, fontWeight: 600, color: "var(--color-apple-ink)" }}>{search ? "Nothing with those words." : "Blank page. For now."}</p>
            <p className="mx-auto mt-2 max-w-md" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
              {search ? "Happens a lot. Try one distinctive word instead of three vague ones." : "Write something small above. It doesn't have to be clever, just yours."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filtered.map((n) => (
              <article key={n.id} className="gallery-card">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--color-apple-ink)" }}>{n.title}</h2>
                  <p style={{ fontSize: 12, color: "var(--color-slate)" }}>{formatDate(n.updated_at)}</p>
                </div>
                {editing === n.id ? (
                  <form
                    className="mt-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!editBody.trim()) return;
                      update(n.id, { body: editBody.trim() });
                      setEditing(null);
                    }}
                  >
                    <label htmlFor={`edit-body-${n.id}`} className="sr-only">Edit note</label>
                    <textarea id={`edit-body-${n.id}`} value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={4} className="field-input" />
                    <div className="mt-3 flex gap-4">
                      <button type="submit" style={{ fontSize: 17, color: "var(--color-link-blue)" }}>Save</button>
                      <button type="button" onClick={() => setEditing(null)} style={{ fontSize: 17, color: "var(--color-graphite)" }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-2 max-w-3xl" style={{ fontSize: 17, color: "var(--color-iron)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{n.body}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3" style={{ borderTop: "1px solid var(--color-line)", paddingTop: 12 }}>
                  {n.documentId ? (
                    <Link href={`/documents/${n.documentId}`} className="tag-pill">From: {(n.documentTitle ?? "Paper").slice(0, 50)}</Link>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--color-slate)" }}>No paper attached</span>
                  )}
                  {editing !== n.id && (
                    <button onClick={() => { setEditing(n.id); setEditBody(n.body); }} style={{ fontSize: 15, color: "var(--color-link-blue)" }}>Edit</button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this note?")) remove(n.id);
                    }}
                    style={{ fontSize: 15, color: "var(--color-alert)" }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
