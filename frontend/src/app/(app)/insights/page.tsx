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
    <div className="page-shell">
      <section className="relative pt-6 text-center sm:pt-10">
        <span className="orb" aria-hidden style={{ width: 420, height: 420, top: -140, left: "8%", background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent 65%)" }} />
        <span className="orb" aria-hidden style={{ width: 460, height: 460, top: -160, right: "8%", background: "radial-gradient(circle, rgba(255,255,255,0.13), transparent 65%)" }} />
        <div className="relative rise rise-1">
          <span className="eyebrow"><span className="dot" />Insights</span>
          <h1 className="type-heading-sm mx-auto mt-4" style={{ color: "var(--color-apple-ink)", fontWeight: 600, letterSpacing: "-0.03em" }}>
            What&rsquo;s actually on your shelf.
          </h1>
          <p className="hero-sub mx-auto mt-3 max-w-xl">
            I counted what&rsquo;s really in your files, like what you have and the words that pop up most.
          </p>
        </div>
      </section>

      <section aria-label="Your library at a glance" className="gallery-card mt-8 rise rise-2">
        {allDocuments.length === 0 ? (
          <div className="py-8 text-center">
            <p style={{ fontSize: 21, fontWeight: 600, color: "var(--color-apple-ink)", letterSpacing: "-0.02em" }}>No summary to show yet.</p>
            <p className="mx-auto mt-2 max-w-md" style={{ fontSize: 17, color: "var(--color-graphite)" }}>Once you upload a few papers I&rsquo;ll put the overview here.</p>
            <Link href="/documents" className="primary-button mt-5">Open library</Link>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between py-3" style={{ borderBottom: "1px solid var(--color-line)" }}>
              <p style={{ fontSize: 19, fontWeight: 600, color: "var(--color-apple-ink)", letterSpacing: "-0.02em" }}>Your library</p>
              <p style={{ fontSize: 15, color: "var(--color-graphite)" }}>
                {total} {total === 1 ? "paper" : "papers"} · {allDocuments.filter((d) => d.file_type === "PDF").length} PDF · {allDocuments.filter((d) => d.file_type === "DOCX").length} DOCX
              </p>
            </div>
            <div className="py-3" style={{ borderBottom: "1px solid var(--color-line)" }}>
              <p style={{ fontSize: 19, fontWeight: 600, color: "var(--color-apple-ink)", letterSpacing: "-0.02em" }}>Words in your titles</p>
              <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)" }}>
                {terms.length ? terms.slice(0, 6).join(" · ") : "Upload papers to see shared vocabulary."}
              </p>
            </div>
            <div className="py-3">
              <p style={{ fontSize: 19, fontWeight: 600, color: "var(--color-apple-ink)", letterSpacing: "-0.02em" }}>Honest limits</p>
              <p className="mt-1" style={{ fontSize: 15, color: "var(--color-graphite)" }}>
                These numbers come straight from your library. Deeper topic analysis shows up once AI indexing lands.
              </p>
            </div>
          </>
        )}
      </section>

      <section className="gallery-card mt-5 rise rise-3" aria-label="Shared words">
        <p className="micro-label">Words your titles share</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {terms.length === 0 ? (
            <span style={{ fontSize: 17, color: "var(--color-slate)" }}>—</span>
          ) : (
            terms.map((t) => <span key={t} className="tag-pill" style={{ fontSize: 15, padding: "6px 14px" }}>{t}</span>)
          )}
        </div>
      </section>

      <section className="rise rise-4 mt-6 text-center" aria-label="Next">
        <Link href="/assistant" className="secondary-button">Ask about your library →</Link>
      </section>
    </div>
  );
}
