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
      ? "var(--color-frost)"
      : tone === "accent"
        ? "var(--color-crimson-signal)"
        : "var(--color-ash)";
  return (
    <p className={`tech-label ${className}`} style={{ color }}>
      {children}
    </p>
  );
}

export function SectionDivider({ label }: { label?: string }) {
  return (
    <div aria-hidden className="flex items-center gap-4 py-2">
      <div className="h-px flex-1" style={{ background: "rgba(204,204,204,0.16)" }} />
      {label && (
        <span className="micro-label" style={{ color: "var(--color-graphite)" }}>
          {label}
        </span>
      )}
      {label && <div className="h-px flex-1" style={{ background: "rgba(204,204,204,0.16)" }} />}
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
        <p className="tech-label" style={{ color: "var(--color-graphite)" }}>
          {index}
        </p>
        <h2
          className="mt-1 font-bold uppercase"
          style={{ fontSize: 27, lineHeight: 1.05, letterSpacing: "-0.015em", color: "var(--color-frost)" }}
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
