"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCollections } from "@/hooks/useCollections";
import { useDocuments } from "@/hooks/useDocuments";
import { recordHistory } from "@/hooks/useHistory";

export default function CollectionsPage() {
  const { collections, create, rename, remove, toggleDoc } = useCollections();
  const { allDocuments } = useDocuments();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const col = create(name, desc);
    recordHistory({ kind: "collection_updated", label: `Created “${col.name}”`, detail: "New collection", href: "/collections" });
    setName("");
    setDesc("");
  }

  return (
    <div>
      <section className="pt-6 text-center sm:pt-10">
        <h1 className="type-heading-sm mx-auto" style={{ color: "var(--color-apple-ink)" }}>
          Collections.
        </h1>
        <p className="mx-auto mt-3 max-w-xl" style={{ fontSize: 19, color: "var(--color-graphite)" }}>
          Group papers that belong together — by topic, course, or project.
          Kept on this device.
        </p>
      </section>

      <section aria-label="New collection" className="gallery-card mt-8">
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="col-name" className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>Name</label>
            <input id="col-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Thesis background" className="field-input" />
          </div>
          <div>
            <label htmlFor="col-desc" className="mb-1.5 block text-[17px]" style={{ color: "var(--color-apple-ink)" }}>What goes in <span style={{ color: "var(--color-slate)" }}>(optional)</span></label>
            <input id="col-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Everything on retrieval" className="field-input" />
          </div>
          <button type="submit" disabled={!name.trim()} className="primary-button">
            Create
          </button>
        </form>
      </section>

      <section aria-label="Your collections" className="mt-5">
        {collections.length === 0 ? (
          <div className="gallery-card py-10 text-center">
            <p style={{ fontSize: 21, fontWeight: 600, color: "var(--color-apple-ink)" }}>No collections yet.</p>
            <p className="mx-auto mt-2 max-w-md" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
              Name one above, then tick the papers that belong in it.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {collections.map((c) => {
              const docs = allDocuments.filter((d) => c.documentIds.includes(d.id));
              const open = openId === c.id;
              return (
                <div key={c.id} className="gallery-card">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <div className="min-w-0 flex-1">
                      {editing === c.id ? (
                        <form
                          className="flex flex-col gap-2 sm:flex-row sm:items-center"
                          onSubmit={(e) => {
                            e.preventDefault();
                            rename(c.id, editName);
                            setEditing(null);
                          }}
                        >
                          <label htmlFor={`edit-${c.id}`} className="sr-only">Collection name</label>
                          <input id={`edit-${c.id}`} value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className="field-input" />
                          <div className="flex shrink-0 gap-3">
                            <button type="submit" style={{ fontSize: 17, color: "var(--color-link-blue)" }}>Save</button>
                            <button type="button" onClick={() => setEditing(null)} style={{ fontSize: 17, color: "var(--color-graphite)" }}>Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.012em", color: "var(--color-apple-ink)" }}>{c.name}</p>
                          {c.description && <p className="mt-0.5" style={{ fontSize: 15, color: "var(--color-graphite)" }}>{c.description}</p>}
                        </>
                      )}
                      <p className="mt-1" style={{ fontSize: 12, color: "var(--color-slate)" }}>
                        {docs.length} {docs.length === 1 ? "paper" : "papers"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-4">
                      <button onClick={() => setOpenId(open ? null : c.id)} style={{ fontSize: 17, color: "var(--color-link-blue)" }} aria-expanded={open}>
                        {open ? "Done" : "Add papers"}
                      </button>
                      <button onClick={() => { setEditing(c.id); setEditName(c.name); }} style={{ fontSize: 17, color: "var(--color-graphite)" }}>Rename</button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete “${c.name}”? Your papers stay in the library.`)) {
                            remove(c.id);
                            recordHistory({ kind: "collection_updated", label: `Deleted “${c.name}”`, detail: "Papers kept in library", href: "/collections" });
                          }
                        }}
                        style={{ fontSize: 17, color: "var(--color-alert)" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {open && (
                    <div className="mt-4" style={{ borderTop: "1px solid var(--color-line)", paddingTop: 8 }}>
                      {allDocuments.length === 0 ? (
                        <p style={{ fontSize: 17, color: "var(--color-graphite)" }}>
                          Your library is empty. <Link href="/documents" style={{ color: "var(--color-link-blue)" }}>Upload a paper first →</Link>
                        </p>
                      ) : (
                        <>
                        <p style={{ fontSize: 12, color: "var(--color-slate)" }}>
                          Showing {Math.min(allDocuments.length, 20)} of {allDocuments.length} papers
                        </p>
                        <ul>
                          {allDocuments.slice(0, 20).map((d) => {
                            const inCol = c.documentIds.includes(d.id);
                            return (
                              <li key={d.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    toggleDoc(c.id, d.id);
                                    recordHistory({ kind: "collection_updated", label: `${inCol ? "Removed from" : "Added to"} “${c.name}”`, detail: d.title.slice(0, 60), href: "/collections" });
                                  }}
                                  aria-pressed={inCol}
                                  className="flex w-full items-center gap-3 py-2.5 text-left"
                                >
                                  <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center" style={{ borderRadius: 999, border: inCol ? "none" : "1.5px solid var(--color-line)", background: inCol ? "var(--color-electric-blue)" : "transparent", color: "#fff", fontSize: 13, fontWeight: 600 }}>
                                    {inCol ? "✓" : ""}
                                  </span>
                                  <span className="truncate" style={{ fontSize: 17, color: "var(--color-apple-ink)" }}>{d.title}</span>
                                  <span className="tag-pill ml-auto shrink-0">{d.file_type}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                        </>
                      )}
                      {docs.length > 0 && (
                        <div className="mt-3">
                          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>IN THIS COLLECTION</p>
                          <ul className="mt-1.5 space-y-1">
                            {docs.map((d) => (
                              <li key={d.id}>
                                <Link href={`/documents/${d.id}`} style={{ fontSize: 17, color: "var(--color-link-blue)" }}>
                                  {d.title} →
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
