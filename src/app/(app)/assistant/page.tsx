"use client";

import { useState } from "react";
import { CommandInput } from "@/components/assistant/CommandInput";
import { AIResponse } from "@/components/assistant/AIResponse";
import { SectionDivider } from "@/components/editorial/TechnicalLabel";

const DEMO_ANSWER =
  "The papers indicate that reliable ingestion — clean extraction, page anchors, and structured metadata — is the precondition for trustworthy answers. Across the pilot corpus, section headings were preserved in 97% of cases, which makes citation-anchored synthesis possible without speculative generation.";

export default function AssistantPage() {
  const [history, setHistory] = useState<Array<{ q: string }>>([]);

  return (
    <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: 880 }}>
      <section className="pt-14 text-center sm:pt-20">
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>INSTRUMENT / 03 — PREVIEW</p>
        <h1 className="font-display mt-3" style={{ fontSize: "clamp(44px,6.5vw,76px)", lineHeight: 0.95, letterSpacing: "-2px" }}>
          Ask Your Research.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>
          Ask questions across your indexed documents and trace every answer back to its source.
        </p>
        <p className="font-tech mt-4" style={{ color: "var(--color-ai-accent)", fontSize: 10 }}>
          <span className="pulse-dot mr-2 inline-block" style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor", verticalAlign: "1px" }} />
          ARCHITECTURE READY — INTELLIGENCE ARRIVES MONTH 02
        </p>
      </section>

      <section aria-label="Query" className="mt-10">
        <CommandInput onAsk={(q) => setHistory((h) => [{ q }, ...h].slice(0, 3))} />
      </section>

      {history.length === 0 ? (
        <AIResponse query="Summarize the main findings" answer={DEMO_ANSWER} />
      ) : (
        history.map((h, i) => <AIResponse key={`${h.q}-${i}`} query={h.q} answer={DEMO_ANSWER} />)
      )}

      <div className="mt-12"><SectionDivider label="HOW ANSWERS WILL WORK" /></div>
      <section className="grid gap-8 py-8 sm:grid-cols-3" aria-label="Principles">
        {[
          ["GROUNDED", "Every claim links to the passage and page it came from."],
          ["SCOPED", "Ask across the library, a folder, or a single document."],
          ["QUIET", "No chat bubbles. Editorial answers built for citation."],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>{k}</p>
            <p className="mt-2 text-[14px]" style={{ color: "var(--color-secondary-text)", lineHeight: 1.7 }}>{v}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
