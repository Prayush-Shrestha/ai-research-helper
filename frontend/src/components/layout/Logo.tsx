export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: "var(--color-apple-ink)",
        color: "var(--color-fog-canvas)",
        fontWeight: 700,
        fontSize: Math.round(size * 0.45),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      L
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
