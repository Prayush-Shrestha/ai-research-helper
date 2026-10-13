/**
 * ResearchOS brand mark — gallery edition.
 * Ink disc with a quiet orbital ring and one blue accession dot.
 * Flat, monochrome + one blue. No shadows.
 */
export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size, borderRadius: 9999, background: "var(--color-apple-ink)", position: "relative", flexShrink: 0 }}
    >
      <svg width={Math.round(size * 0.68)} height={Math.round(size * 0.68)} viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="16" cy="16" r="10.5" stroke="var(--color-fog-canvas)" strokeWidth="1.4" opacity="0.9" />
        <ellipse cx="16" cy="16" rx="10.5" ry="4.6" stroke="var(--color-fog-canvas)" strokeWidth="1.1" opacity="0.45" transform="rotate(-24 16 16)" />
        <line x1="10" y1="14.5" x2="20" y2="14.5" stroke="var(--color-fog-canvas)" strokeWidth="1.5" />
        <line x1="10" y1="18" x2="17" y2="18" stroke="var(--color-fog-canvas)" strokeWidth="1.2" opacity="0.65" />
        <circle cx="23" cy="9" r="2.6" fill="var(--color-electric-blue)" />
      </svg>
    </span>
  );
}

export function Wordmark({ compact = false, tone = "auto" }: { compact?: boolean; tone?: "auto" | "light" }) {
  const dark = tone === "light";
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={compact ? 26 : 30} />
      <span
        style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em", color: dark ? "#f5f5f7" : "var(--color-apple-ink)" }}
      >
        ResearchOS
      </span>
    </span>
  );
}
