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
}: {
  onAsk?: (q: string) => void;
  compact?: boolean;
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
        className="ask-box flex items-center gap-2 p-2 pl-5"
        style={{ background: "var(--color-pure-white)", border: "1px solid var(--color-line)", borderRadius: 980 }}
      >
        <label htmlFor="assistant-query" className="sr-only">Ask about your papers</label>
        <input
          id="assistant-query"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What do you want to know…"
          autoComplete="off"
          className="w-full bg-transparent py-2.5 text-[17px] outline-none"
          style={{ color: "var(--color-apple-ink)" }}
        />
        <button type="submit" className="primary-button shrink-0" style={{ padding: "8px 22px", fontSize: 15 }}>
          Send
        </button>
      </form>
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Try asking">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              className="tag-pill"
              style={{ cursor: "pointer", padding: "8px 16px", fontSize: 15 }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
