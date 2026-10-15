/**
 * Lumina brand — liquid edition.
 * Frosted ink disc, mint spark glow, soft inner light.
 */
export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.02)), var(--color-apple-ink)",
        position: "relative",
        flexShrink: 0,
        boxShadow: "0 6px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35), 0 0 18px rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.22)",
      }}
    >
      <svg width={Math.round(size * 0.68)} height={Math.round(size * 0.68)} viewBox="0 0 32 32" fill="none" aria-hidden>
        <path
          d="M16 5.5 C17.2 11.8 19.2 13.8 25.5 15 C19.2 16.2 17.2 18.2 16 24.5 C14.8 18.2 12.8 16.2 6.5 15 C12.8 13.8 14.8 11.8 16 5.5 Z"
          fill="var(--color-fog-canvas)"
        />
        <circle cx="23" cy="8.5" r="2.6" fill="var(--color-electric-blue)" />
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
        style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 19, fontWeight: 650, letterSpacing: "-0.02em", color: dark ? "#f5f5f7" : "var(--color-apple-ink)" }}
      >
        Lumina
      </span>
    </span>
  );
}
