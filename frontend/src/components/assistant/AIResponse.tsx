"use client";

import { useState, type ReactNode } from "react";

function renderMarkdown(body: string) {
  // Minimal safe markdown: headings, bold, lists, numbered lists, quotes, paragraphs.
  // No dangerouslySetInnerHTML — plain text rendering with structure.
  const lines = body.split("\n");
  const blocks: ReactNode[] = [];
  let listBuf: string[] = [];
  let orderedBuf: string[] = [];

  const flushLists = (key: string) => {
    if (listBuf.length) {
      blocks.push(
        <ul key={`${key}-ul`} className="mt-3 space-y-1.5" style={{ paddingLeft: 20, listStyle: "disc", color: "var(--color-iron)" }}>
          {listBuf.map((t, i) => (
            <li key={i} className="text-[17px]" style={{ lineHeight: 1.6 }}>{inline(t)}</li>
          ))}
        </ul>
      );
      listBuf = [];
    }
    if (orderedBuf.length) {
      blocks.push(
        <ol key={`${key}-ol`} className="mt-3 space-y-1.5" style={{ paddingLeft: 20, listStyle: "decimal", color: "var(--color-iron)" }}>
          {orderedBuf.map((t, i) => (
            <li key={i} className="text-[17px]" style={{ lineHeight: 1.6 }}>{inline(t)}</li>
          ))}
        </ol>
      );
      orderedBuf = [];
    }
  };

  const inline = (t: string): ReactNode => {
    // **bold**
    const parts = t.split(/\*\*(.+?)\*\*/g);
    return parts.map((p, i) => (i % 2 === 1 ? <strong key={i} style={{ color: "var(--color-apple-ink)" }}>{p}</strong> : <span key={i}>{p}</span>));
  };

  lines.forEach((line, idx) => {
    const l = line.trim();
    if (!l) {
      flushLists(`e${idx}`);
      return;
    }
    if (/^#{1,3}\s/.test(l)) {
      flushLists(`h${idx}`);
      blocks.push(
        <h4 key={idx} className="mt-4" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--color-apple-ink)" }}>
          {inline(l.replace(/^#{1,3}\s/, ""))}
        </h4>
      );
      return;
    }
    if (/^>\s?/.test(l)) {
      flushLists(`q${idx}`);
      blocks.push(
        <blockquote key={idx} className="mt-3 pl-4 text-[17px]" style={{ borderLeft: "3px solid var(--color-electric-blue)", color: "var(--color-iron)", lineHeight: 1.6 }}>
          {inline(l.replace(/^>\s?/, ""))}
        </blockquote>
      );
      return;
    }
    if (/^[-•]\s/.test(l)) {
      if (orderedBuf.length) flushLists(`m${idx}`);
      listBuf.push(l.replace(/^[-•]\s/, ""));
      return;
    }
    if (/^\d+\.\s/.test(l)) {
      if (listBuf.length) flushLists(`m${idx}`);
      orderedBuf.push(l.replace(/^\d+\.\s/, ""));
      return;
    }
    flushLists(`p${idx}`);
    blocks.push(
      <p key={idx} className="mt-3 text-[17px]" style={{ color: "var(--color-iron)", lineHeight: 1.65 }}>
        {inline(line)}
      </p>
    );
  });
  flushLists("end");
  return blocks;
}

export function AIResponse({
  query,
  answer,
  scope,
  onRetry,
}: {
  query: string;
  answer: string;
  scope?: string;
  onRetry?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <article aria-live="polite" className="gallery-card page-enter mt-5">
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>
        Answer to {query.slice(0, 90)}{query.length > 90 ? "…" : ""}
      </p>
      {scope && (
        <p className="mt-0.5" style={{ fontSize: 12, color: "var(--color-slate)" }}>
          {scope}
        </p>
      )}
      <div className="max-w-[72ch]">{renderMarkdown(answer)}</div>
      <div className="mt-4 flex items-center gap-5" style={{ borderTop: "1px solid var(--color-line)", paddingTop: 12 }}>
        <button
          type="button"
          onClick={() => {
            try {
              const clipboard = navigator?.clipboard;
              if (!clipboard?.writeText) {
                setCopied(false);
                return;
              }
              void clipboard.writeText(answer).then(
                () => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                },
                () => setCopied(false)
              );
            } catch {
              setCopied(false);
            }
          }}
          style={{ fontSize: 15, color: "var(--color-link-blue)" }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
        {onRetry && (
          <button type="button" onClick={onRetry} style={{ fontSize: 15, color: "var(--color-link-blue)" }}>
            Try again
          </button>
        )}
      </div>
    </article>
  );
}

export function UserPrompt({ query }: { query: string }) {
  return (
    <div className="mt-6 flex justify-end">
      <p className="max-w-[80%] px-5 py-3 text-[17px]" style={{ background: "var(--color-electric-blue)", color: "var(--color-fog-canvas)", fontWeight: 500, borderRadius: 12, borderBottomRightRadius: 4, lineHeight: 1.45 }}>
        {query}
      </p>
    </div>
  );
}
