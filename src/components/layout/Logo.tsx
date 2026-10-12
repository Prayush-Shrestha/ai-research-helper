/**
 * Brand mark for ResearchOS.
 *
 * Concept — "the connected R":
 *   - The letter R drawn as stem, bowl and leg.
 *   - A mint node hub sits on the bowl's edge — every piece of
 *     research connects to something larger, the operating idea
 *     of the whole platform.
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
        {/* R — stem */}
        <path
          d="M12 8.5V23.5"
          stroke="#E7E7E2"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* R — bowl */}
        <path
          d="M12 9.5h4.5a3.75 3.75 0 0 1 0 7.5H12"
          stroke="#E7E7E2"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* R — leg */}
        <path
          d="M14.5 17 20.5 23.5"
          stroke="#E7E7E2"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* hub node on the bowl's edge */}
        <circle cx="20.25" cy="13.25" r="2.2" fill="#B7FFDF" />
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
        <span style={{ color: "var(--color-primary-text)" }}>Research</span>
        <span style={{ color: "var(--color-research-accent)" }}>OS</span>
      </span>
    </span>
  );
}
