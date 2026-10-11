export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={className ?? "inline-flex items-center justify-center"}
      style={{
        width: size,
        height: size,
        border: "1px solid var(--color-hairline)",
        borderRadius: 8,
        background: "var(--color-machine-surface)",
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1.5" y="1.5" width="13" height="13" stroke="#E7E7E2" strokeWidth="1.2" />
        <circle cx="8" cy="8" r="2.4" fill="#B7FFDF" />
        <path d="M1.5 8H5M11 8h3.5M8 1.5V5M8 11v3.5" stroke="#62686A" strokeWidth="1" />
      </svg>
    </span>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-3">
      <LogoMark />
      <span
        className="font-tech"
        style={{ color: "var(--color-primary-text)", fontSize: 12, letterSpacing: "1.6px" }}
      >
        [AI] RESEARCH
      </span>
    </span>
  );
}
