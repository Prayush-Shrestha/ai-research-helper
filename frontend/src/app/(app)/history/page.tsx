"use client";

import Link from "next/link";
import { useHistory } from "@/hooks/useHistory";
import { formatDate } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  document_opened: "Read",
  document_uploaded: "Uploaded",
  question_asked: "Asked",
  note_created: "Note",
  collection_updated: "Collection",
};

export default function HistoryPage() {
  const { entries, clear } = useHistory();

  return (
    <div>
      <section className="pt-6 text-center sm:pt-10">
        <h1 className="type-heading-sm mx-auto" style={{ color: "var(--color-apple-ink)" }}>
          Where you&rsquo;ve been.
        </h1>
        <p className="mx-auto mt-3 max-w-xl" style={{ fontSize: 19, color: "var(--color-graphite)" }}>
          Everything you&rsquo;ve done, newest first, so it&rsquo;s easy to pick up where you left off.
        </p>
      </section>

      <section className="gallery-card mt-8 flex items-center justify-between !py-4">
        <p style={{ fontSize: 15, color: "var(--color-graphite)" }}>{entries.length} {entries.length === 1 ? "item" : "items"}</p>
        {entries.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm("Clear your history on this device?")) clear();
            }}
            style={{ fontSize: 15, color: "var(--color-alert)" }}
          >
            Clear history
          </button>
        )}
      </section>

      <section aria-label="Your history" className="gallery-card mt-5 !p-4 sm:!p-5">
        {entries.length === 0 ? (
          <div className="py-8 text-center">
            <p style={{ fontSize: 21, fontWeight: 600, color: "var(--color-apple-ink)" }}>Your trail hasn&rsquo;t started yet.</p>
            <p className="mx-auto mt-2 max-w-md" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
              Open a paper or ask something and I&rsquo;ll start keeping track here.
            </p>
            <Link href="/documents" className="primary-button mt-5">Open library</Link>
          </div>
        ) : (
          <ol>
            {entries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--color-line)" }}>
                <span className="tag-pill shrink-0">{KIND_LABEL[e.kind] ?? e.kind}</span>
                <div className="min-w-0 flex-1">
                  {e.href ? (
                    <Link href={e.href} className="block truncate" style={{ fontSize: 17, color: "var(--color-apple-ink)" }}>
                      {e.label} →
                    </Link>
                  ) : (
                    <p className="truncate" style={{ fontSize: 17, color: "var(--color-apple-ink)" }}>{e.label}</p>
                  )}
                  <p className="truncate" style={{ fontSize: 13, color: "var(--color-slate)" }}>{e.detail} · {formatDate(e.created_at)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
