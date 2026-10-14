"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useDocuments } from "@/hooks/useDocuments";
import { extractTerminology } from "@/lib/research";

export default function InsightsPage() {
  // List responses omit full text (by design), so shared vocabulary is
  // counted honestly from titles — labelled as such below.
  const { documents: allDocuments, total } = useDocuments({ pageSize: 100 });

  const terms = useMemo(() => {
    const combined = allDocuments.map((d) => d.title).join("\n").slice(0, 20000);
    return extractTerminology(combined, 12);
  }, [allDocuments]);

  return (
    <div>
      <section className="pt-6 text-center sm:pt-10">
        <h1 className="type-heading-sm mx-auto" style={{ color: "var(--color-apple-ink)" }}>
          What&rsquo;s actually on your shelf.
        </h1>
        <p className="mx-auto mt-3 max-w-xl" style={{ fontSize: 19, color: "var(--color-graphite)" }}>
          I counted what&rsquo;s really in your files, like what you have and the words that pop up most.
        </p>
      </section>

      <section aria-label="Your library at a glance" className="gallery-card mt-8">
        {allDocuments.length === 0 ? (
          <div className="py-8 text-center">
            <p style={{ fontSize: 21, fontWeight: 600, color: "var(--color-apple-ink)" }}>No summary to show yet.</p>
            <p className="mx-auto mt-2 max-w-md" style={{ fontSize: 17, color: "var(--color-graphite)" }}>Once you upload a few papers I&rsquo;ll put the overview here.</p>
            <Link href="/documents" className="primary-button mt-5">Open library</Link>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between py-3" style={{ borderBottom: "1px solid var(--color-line)" }}>
              <p style={{ fontSize: 19, fontWeight: 600, color: "var(--color-apple-ink)" }}>Your library</p>
              <p style={{ fontSize: 15, color: "var(--color-graphite)" }}>
                {total} {total === 1 ? "paper" : "papers"} · {allDocuments.filter((d) => d.file_type === "PDF").length} PDF · {allDocuments.filter((d) => d.file_type === "DOCX").length} DOCX
              </p>
            </div>
            <div className="py-3" style={{ borderBottom: "1px solid var(--color-line)" }}>
              <p style={{ fontSize: 19, fontWeight: 600, color: "var(--color-apple-ink)" }}>Words in your titles</p>
              <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)" }}>
                {terms.length ? terms.slice(0, 6).join(" · ") : "Upload papers to see shared vocabulary."}
              </p>
            </div>
            <div className="py-3">
              <p style={{ fontSize: 19, fontWeight: 600, color: "var(--color-apple-ink)" }}>Honest limits</p>
              <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)" }}>
                These numbers come straight from your library. Deeper topic analysis shows up once AI indexing lands.
              </p>
            </div>
          </>
        )}
      </section>

      <section className="gallery-card mt-5" aria-label="Shared words">
        <p style={{ fontSize: 13, color: "var(--color-slate)" }}>Words your titles share</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {terms.length === 0 ? (
            <span style={{ fontSize: 17, color: "var(--color-slate)" }}>—</span>
          ) : (
            terms.map((t) => <span key={t} className="tag-pill" style={{ fontSize: 15, padding: "6px 14px" }}>{t}</span>)
          )}
        </div>
      </section>

      <section className="mt-6 text-center" aria-label="Next">
        <Link href="/assistant" className="secondary-button">Ask about your library →</Link>
      </section>
    </div>
  );
}
