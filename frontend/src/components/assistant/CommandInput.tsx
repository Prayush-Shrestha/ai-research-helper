"use client";

import { useState } from "react";

const SUGGESTIONS = [
  "Summarise this paper",
  "What are the key findings?",
  "Explain the method",
  "What are the limitations?",
  "Explain it simply",
  "Questions this leaves open",
];

export function CommandInput({
  onAsk,
  compact = false,
  disabled = false,
}: {
  onAsk?: (q: string) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  function submit(q: string) {
    const query = q.trim();
    if (!query) return;
    onAsk?.(query);
    setValue("");
  }

  return (
    <div>
      <form
        role="search"
        aria-label="Ask about your papers"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="ask-box liquid-search flex items-center gap-2 p-2 pl-5"
        style={{ borderRadius: "999px" }}
      >
        <span aria-hidden style={{ color: "var(--color-electric-blue)", fontSize: 16 }}>✦</span>
        <label htmlFor="assistant-query" className="sr-only">Ask about your papers</label>
        <input
          id="assistant-query"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask across your papers…"
          autoComplete="off"
          className="w-full bg-transparent py-2.5 text-[16px] outline-none"
          style={{ color: "var(--color-apple-ink)" }}
          disabled={disabled}
        />
        <button type="submit" className="primary-button shrink-0" style={{ padding: "9px 24px", fontSize: 14 }} disabled={disabled}>
          Ask
        </button>
      </form>
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Try asking">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              className="tag-pill hover-lift"
              style={{ cursor: "pointer", padding: "8px 15px", fontSize: 13.5 }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
