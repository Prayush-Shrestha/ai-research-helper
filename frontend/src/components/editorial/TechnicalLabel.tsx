import type { ReactNode } from "react";

export function TechnicalLabel({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: "muted" | "bright" | "accent";
  className?: string;
}) {
  const color =
    tone === "bright"
      ? "var(--color-apple-ink)"
      : tone === "accent"
        ? "var(--color-electric-blue)"
        : "var(--color-graphite)";
  return (
    <p className={`tech-label ${className}`} style={{ color }}>
      {children}
    </p>
  );
}

export function SectionDivider({ label }: { label?: string }) {
  return (
    <div aria-hidden className="flex items-center gap-4 py-2">
      <div className="divider-hairline flex-1" />
      {label && (
        <span className="tech-label" style={{ color: "var(--color-graphite)" }}>
          {label}
        </span>
      )}
      {label && <div className="divider-hairline flex-1" />}
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
        <p className="tech-label" style={{ color: "var(--color-electric-blue)" }}>
          {index}
        </p>
        <h2
          className="mt-1"
          style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 27, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}
        >
          {title}
        </h2>
      </div>
      {meta && (
        <p className="tech-label" style={{ color: "var(--color-graphite)" }}>
          {meta}
        </p>
      )}
    </div>
  );
}
