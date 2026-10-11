export function AIResponse({
  query,
  answer,
}: {
  query: string;
  answer: string;
}) {
  return (
    <article
      aria-live="polite"
      className="page-enter mt-10 overflow-hidden"
      style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-panel)", background: "var(--color-deep-black)" }}
    >
      <div className="px-6 pt-6 sm:px-10">
        <p className="font-tech" style={{ color: "var(--color-ai-accent)", fontSize: 10 }}>
          <span className="pulse-dot mr-2 inline-block" style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor", verticalAlign: "1px" }} />
          AI RESPONSE — DRAFT ARCHITECTURE
        </p>
        <p className="font-tech mt-2" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
          Q / {query.toUpperCase().slice(0, 120)}
        </p>
        <p className="mt-4 max-w-[68ch] text-[17px]" style={{ lineHeight: 1.8, color: "#D8D8D2" }}>
          {answer}
        </p>
      </div>
      <div className="mx-6 my-6 h-px sm:mx-10" style={{ background: "var(--color-hairline)" }} />
      <div className="px-6 pb-6 sm:px-10 sm:pb-8">
        <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>
          SOURCES
        </p>
        <ol className="mt-3 space-y-2">
          {[
            ["01", "Research Methods.pdf", "p. 14"],
            ["02", "Machine Learning Survey.pdf", "p. 28"],
          ].map(([n, title, page]) => (
            <li key={n} className="flex items-baseline gap-4">
              <span className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>{n}</span>
              <span className="text-[14px]" style={{ color: "var(--color-primary-text)" }}>{title}</span>
              <span className="font-tech" style={{ color: "var(--color-secondary-text)", fontSize: 10 }}>{page}</span>
              <span className="font-tech" style={{ color: "var(--color-research-accent)", fontSize: 9 }}>SOURCE VERIFIED</span>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}
