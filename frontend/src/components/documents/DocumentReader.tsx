"use client";

import { useMemo, useState } from "react";
import { splitParagraphs } from "@/lib/research";

export function DocumentReader({ text }: { text: string }) {
  const paragraphs = useMemo(() => splitParagraphs(text), [text]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const headings = useMemo(() => {
    const out: Array<{ label: string; index: number }> = [];
    paragraphs.forEach((p, i) => {
      if (/^\d\.\s[A-Z]/.test(p.slice(0, 24)) && p.length < 140) out.push({ label: p.slice(0, 60), index: i });
    });
    return out.slice(0, 8);
  }, [paragraphs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return paragraphs
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.toLowerCase().includes(q))
      .slice(0, 12);
  }, [paragraphs, query]);

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <aside aria-label="Contents" className="gallery-card !p-5">
        <p className="micro-label">Contents</p>
        <div className="mt-3">
          <label htmlFor="reader-search" className="sr-only">Search in this paper</label>
          <input
            id="reader-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a word…"
            autoComplete="off"
            className="field-input !rounded-full !px-4 !py-2.5 !text-[15px]"
          />
        </div>
        {filtered ? (
          <div className="mt-3">
            <p style={{ fontSize: 12, color: "var(--color-slate)" }}>{filtered.length} matches</p>
            <ol className="mt-1.5 space-y-2">
              {filtered.map(({ p, i }) => (
                <li key={i}>
                  <a href={`#reader-p-${i}`} className="block text-[15px]" style={{ color: "var(--color-iron)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--color-link-blue)" }}>¶{i + 1} · </span>
                    {p.slice(0, 88)}…
                  </a>
                </li>
              ))}
            </ol>
            {filtered.length === 0 && <p className="mt-2" style={{ fontSize: 15, color: "var(--color-slate)" }}>No matches. Try fewer letters.</p>}
          </div>
        ) : (
          <ol className="mt-2">
            {headings.length === 0 && (
              <li style={{ fontSize: 15, color: "var(--color-slate)", lineHeight: 1.5 }}>This paper runs straight through, with no section headings.</li>
            )}
            {headings.map((h, i) => (
              <li key={`${h.index}-${i}`} style={{ borderBottom: "1px solid var(--color-line)" }}>
                <a
                  href={`#reader-p-${h.index}`}
                  onClick={() => setActive(i)}
                  className="flex items-baseline justify-between gap-2 py-2"
                  style={{ fontSize: 15, color: i === active ? "var(--color-electric-blue)" : "var(--color-apple-ink)", fontWeight: i === active ? 600 : 400 }}
                >
                  <span className="truncate">{h.label}</span>
                  <span className="shrink-0" style={{ fontSize: 12, color: "var(--color-slate)" }}>¶{h.index + 1}</span>
                </a>
              </li>
            ))}
          </ol>
        )}
        <p className="footnote mt-4">
          Extracted from your file, pages kept. Check any line against the original.
        </p>
      </aside>

      <article className="gallery-card reader-scroll max-h-[78vh] overflow-y-auto">
        <p className="micro-label">Reading view</p>
        <div className="mt-4 max-w-[66ch] space-y-5">
          {paragraphs.length === 0 && (
            <p style={{ fontSize: 17, color: "var(--color-graphite)" }}>No text came out of this file. Try uploading it again.</p>
          )}
          {paragraphs.map((p, i) => {
            const isHeading = /^\d\.\s[A-Z]/.test(p.slice(0, 24)) && p.length < 140;
            if (isHeading) {
              return (
                <h3 key={i} id={`reader-p-${i}`} style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-apple-ink)", paddingTop: 8 }}>
                  {p}
                </h3>
              );
            }
            const q = query.trim().toLowerCase();
            const highlight = q && p.toLowerCase().includes(q);
            return (
              <p key={i} id={`reader-p-${i}`} style={{ fontSize: 17, lineHeight: 1.65, color: "var(--color-iron)", background: highlight ? "rgba(255,255,255,0.16)" : undefined, borderRadius: 8, padding: highlight ? "2px 6px" : undefined }}>
                {p}
              </p>
            );
          })}
        </div>
        <p className="footnote mt-8" style={{ borderTop: "1px solid var(--color-line)", paddingTop: 12 }}>
          End of extracted text · ∎
        </p>
      </article>
    </div>
  );
}
