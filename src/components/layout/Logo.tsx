/**
 * Brand mark for [LM] LEMMA.
 *
 * Concept — "the lemma path":
 *   - The letter L drawn as a single confident stem.
 *   - Its foot extends as a mint-green connection line ending in a
 *     node hub — lemmas are stepping stones, each one leading
 *     somewhere: papers → lemmas → theorem.
 *   - A faint orbit arc (observatory / research instrument) sweeps the
 *     top-right, ending in a small satellite dot.
 *
 * Single accent (research mint) so it stays crisp from 16px favicon
 * up to hero sizes. Everything else is theme neutrals.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={className ?? "inline-flex items-center justify-center"}
      style={{
        width: size,
        height: size,
        border: "1px solid var(--color-hairline)",
        borderRadius: Math.max(8, Math.round(size * 0.28)),
        background: "var(--color-machine-surface)",
      }}
    >
      <svg
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
      >
        {/* L — stem */}
        <path
          d="M13 8.5V23.5"
          stroke="#E7E7E2"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* foot — connection line toward the hub */}
        <path
          d="M13 23.5H21.5"
          stroke="#B7FFDF"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* hub node — where the lemma leads */}
        <circle cx="21.5" cy="23.5" r="2.6" fill="#B7FFDF" />
        {/* orbit arc + satellite */}
        <path
          d="M24.5 9.5A10.5 10.5 0 0 1 26 17"
          stroke="#62686A"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <circle cx="26" cy="17" r="1.3" fill="#B7FFDF" opacity="0.55" />
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
        style={{ fontSize: 12, letterSpacing: "1.6px" }}
      >
        <span style={{ color: "var(--color-research-accent)" }}>[LM]</span>
        <span style={{ color: "var(--color-primary-text)" }}> LEMMA</span>
      </span>
    </span>
  );
}
