"use client";

import { useState, type ReactNode } from "react";

function renderMarkdown(body: string) {
  const lines = body.split("\n");
  const blocks: ReactNode[] = [];
  let listBuf: string[] = [];
  let orderedBuf: string[] = [];

  const flushLists = (key: string) => {
    if (listBuf.length) {
      blocks.push(
        <ul key={`${key}-ul`} className="mt-3 space-y-1.5" style={{ paddingLeft: 20, listStyle: "disc", color: "var(--color-iron)" }}>
          {listBuf.map((t, i) => (
            <li key={i} className="text-[15.5px]" style={{ lineHeight: 1.65 }}>{inline(t)}</li>
          ))}
        </ul>
      );
      listBuf = [];
    }
    if (orderedBuf.length) {
      blocks.push(
        <ol key={`${key}-ol`} className="mt-3 space-y-1.5" style={{ paddingLeft: 20, listStyle: "decimal", color: "var(--color-iron)" }}>
          {orderedBuf.map((t, i) => (
            <li key={i} className="text-[15.5px]" style={{ lineHeight: 1.65 }}>{inline(t)}</li>
          ))}
        </ol>
      );
      orderedBuf = [];
    }
  };

  const inline = (t: string): ReactNode => {
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
        <h4 key={idx} className="mt-4" style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-0.01em", color: "var(--color-apple-ink)" }}>
          {inline(l.replace(/^#{1,3}\s/, ""))}
        </h4>
      );
      return;
    }
    if (/^>\s?/.test(l)) {
      flushLists(`q${idx}`);
      blocks.push(
        <blockquote key={idx} className="mt-3 rounded-r-2xl py-2 pl-4 pr-3 text-[15.5px]" style={{ borderLeft: "2px solid var(--color-electric-blue)", background: "rgba(157,231,193,0.07)", color: "var(--color-iron)", lineHeight: 1.65 }}>
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
      <p key={idx} className="mt-3 text-[15.5px]" style={{ color: "var(--color-iron)", lineHeight: 1.7 }}>
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
    <article aria-live="polite" className="gallery-card page-enter mt-4 !p-6">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="flex h-7 w-7 items-center justify-center" style={{ borderRadius: 99, background: "linear-gradient(180deg, var(--color-electric-blue), #6FCF9A)", color: "#06110C", fontSize: 13, fontWeight: 700 }}>✦</span>
        <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-slate)" }}>
          Answer · {query.slice(0, 80)}{query.length > 80 ? "…" : ""}
        </p>
      </div>
      {scope && (
        <p className="mt-1.5" style={{ fontSize: 12.5, color: "var(--color-slate)" }}>
          {scope}
        </p>
      )}
      <div className="max-w-[72ch]">{renderMarkdown(answer)}</div>
      <div className="mt-5 flex items-center gap-2" style={{ borderTop: "1px solid var(--liquid-border-soft)", paddingTop: 14 }}>
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
          className="ghost-pill"
          style={{ fontSize: 13, padding: "7px 16px" }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
        {onRetry && (
          <button type="button" onClick={onRetry} className="secondary-button !px-3" style={{ fontSize: 13.5 }}>
            Try again
          </button>
        )}
      </div>
    </article>
  );
}

export function UserPrompt({ query }: { query: string }) {
  return (
    <div className="mt-5 flex justify-end">
      <p className="max-w-[82%] px-5 py-3 text-[15.5px]" style={{ background: "linear-gradient(180deg, #C9F5DC, var(--color-electric-blue))", color: "#06110C", fontWeight: 550, borderRadius: 20, borderBottomRightRadius: 6, lineHeight: 1.55, boxShadow: "0 8px 24px rgba(157,231,193,0.22)" }}>
        {query}
      </p>
    </div>
  );
}
