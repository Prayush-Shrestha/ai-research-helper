const CONTENTS = [
  "01 ABSTRACT",
  "02 INTRODUCTION",
  "03 RELATED WORK",
  "04 METHODOLOGY",
  "05 RESULTS",
  "06 CONCLUSION",
];

export function DocumentReader({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}|\n(?=\d\.\s)/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className="grid gap-0 overflow-hidden lg:grid-cols-[280px_1fr]"
      style={{
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--radius-media)",
        background: "var(--color-deep-black)",
      }}
    >
      {/* index */}
      <aside
        aria-label="Document contents"
        className="px-6 py-6 lg:py-10 lg:pl-8"
        style={{ borderBottom: "1px solid var(--color-hairline)" }}
      >
        <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>
          CONTENTS
        </p>
        <ol className="mt-4 space-y-1 lg:sticky lg:top-24">
          {CONTENTS.map((c, i) => (
            <li key={c}>
              <a
                href={`#reader-section-${i}`}
                className="font-tech block rounded px-2 py-2"
                style={{
                  color: i === 0 ? "var(--color-primary-text)" : "var(--color-secondary-text)",
                  background: i === 0 ? "var(--color-machine-surface)" : "transparent",
                  fontSize: 10,
                }}
              >
                {c}
              </a>
            </li>
          ))}
        </ol>
        <div className="mt-6 hidden lg:block">
          <div className="h-px" style={{ background: "var(--color-hairline)" }} />
          <p className="micro-label mt-4" style={{ color: "var(--color-tertiary-text)" }}>
            SOURCE VERIFIED
            <br />
            TEXT EXTRACTED
          </p>
        </div>
      </aside>

      {/* reading surface */}
      <article
        className="reader-scroll max-h-[80vh] overflow-y-auto px-6 py-8 sm:px-10 lg:px-16 lg:py-12"
        style={{ background: "#0C0D0E" }}
      >
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
          EXTRACTED TEXT — READING VIEW
        </p>
        <div className="mt-6 max-w-[68ch] space-y-6">
          {paragraphs.length === 0 && (
            <p style={{ color: "var(--color-secondary-text)" }}>
              No extracted text is available for this document yet.
            </p>
          )}
          {paragraphs.map((p, i) => {
            const isHeading = /^\d\.\s[A-Z]/.test(p.slice(0, 24));
            if (isHeading && p.length < 120) {
              return (
                <h3
                  key={i}
                  id={`reader-section-${Math.min(i, 5)}`}
                  className="font-medium tracking-tight"
                  style={{ fontSize: 22, color: "var(--color-primary-text)", paddingTop: 8 }}
                >
                  {p}
                </h3>
              );
            }
            return (
              <p
                key={i}
                id={i < 6 ? `reader-section-${i}` : undefined}
                style={{ fontSize: 18, lineHeight: 1.85, color: "#CFCFC9" }}
              >
                {p}
              </p>
            );
          })}
        </div>
        <div className="mt-10 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--color-hairline)" }}>
          <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>
            END OF EXTRACT
          </p>
          <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>
            AI READY
          </p>
        </div>
      </article>

      <style>{`@media(min-width:1024px){aside{border-bottom:none!important;border-right:1px solid var(--color-hairline)}}`}</style>
    </div>
  );
}
