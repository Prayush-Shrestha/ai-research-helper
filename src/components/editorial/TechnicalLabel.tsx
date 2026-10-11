export function TechnicalLabel({
  children,
  tone = "muted",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "muted" | "bright" | "accent" | "ai";
  className?: string;
}) {
  const color =
    tone === "bright"
      ? "var(--color-primary-text)"
      : tone === "accent"
        ? "var(--color-research-accent)"
        : tone === "ai"
          ? "var(--color-ai-accent)"
          : "var(--color-secondary-text)";
  return (
    <p className={`font-tech ${className}`} style={{ color }}>
      {children}
    </p>
  );
}

export function SectionDivider({ label }: { label?: string }) {
  return (
    <div aria-hidden className="flex items-center gap-4 py-2">
      <div className="h-px flex-1" style={{ background: "var(--color-hairline)" }} />
      {label && (
        <span className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>
          {label}
        </span>
      )}
      {label && <div className="h-px flex-1" style={{ background: "var(--color-hairline)" }} />}
    </div>
  );
}

export function SectionHeading({
  index,
  title,
  meta,
}: {
  index: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>
          {index}
        </p>
        <h2
          className="mt-1 font-medium tracking-tight"
          style={{ fontSize: 32, lineHeight: 1.1, color: "var(--color-primary-text)" }}
        >
          {title}
        </h2>
      </div>
      {meta && (
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>
          {meta}
        </p>
      )}
    </div>
  );
}
