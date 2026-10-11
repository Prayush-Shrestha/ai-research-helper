"use client";

import { useState } from "react";

const SUGGESTIONS = [
  "SUMMARIZE THE MAIN FINDINGS",
  "COMPARE THESE TWO PAPERS",
  "WHAT RESEARCH GAP IS IDENTIFIED?",
  "EXPLAIN THIS METHODOLOGY",
];

export function CommandInput({ onAsk }: { onAsk?: (q: string) => void }) {
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
        aria-label="Ask your research"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="ask-box flex items-center gap-3 px-2 py-2 sm:px-3"
        style={{
          border: "1px solid var(--color-hairline)",
          borderRadius: "var(--radius-panel)",
          background: "var(--color-graphite)",
        }}
      >
        <span aria-hidden className="pulse-dot ml-2 hidden sm:inline-block" style={{ width: 8, height: 8, borderRadius: 99, background: "var(--color-ai-accent)" }} />
        <label htmlFor="assistant-query" className="sr-only">
          Ask about your research
        </label>
        <input
          id="assistant-query"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ASK ABOUT YOUR RESEARCH —"
          autoComplete="off"
          className="font-tech w-full bg-transparent px-2 py-4 outline-none placeholder:text-[#62686A]"
          style={{ color: "var(--color-primary-text)", fontSize: 12 }}
        />
        <button
          type="submit"
          className="font-tech shrink-0 rounded-full px-6 py-3"
          style={{ background: "var(--color-primary-text)", color: "#050505", fontSize: 11 }}
        >
          ASK →
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Suggested queries">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => submit(s)}
            className="font-tech rounded-full px-4 py-2 transition-colors hover:text-white"
            style={{ border: "1px solid var(--color-hairline)", background: "var(--color-control)", color: "var(--color-secondary-text)", fontSize: 10 }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
