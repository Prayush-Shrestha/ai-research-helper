"use client";

/**
 * Vitrine visual — Lumina's liquid-glass aurora field.
 * Glass document sheets floating over a cosmic canvas with an
 * aurora light-ring (imagery only, never UI chrome) and
 * hairline orbital threads.
 * Fully legible with animations disabled.
 */
export function ResearchNucleus({
  size = 560,
  label = "Documents floating on a light canvas with connecting threads",
  overlap = false,
}: {
  size?: number;
  label?: string;
  overlap?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      style={{
        width: "100%",
        maxWidth: size,
        marginInline: "auto",
        pointerEvents: "none",
        opacity: overlap ? 0.96 : 1,
      }}
    >
      <svg viewBox="0 0 640 520" className="h-auto w-full float-slow" aria-hidden style={{ filter: "drop-shadow(0 18px 50px rgba(0,0,0,0.4))" }}>
        <defs>
          <linearGradient id="vitrine-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5F5F7" stopOpacity="0.5" />
            <stop offset="45%" stopColor="#F5F5F7" stopOpacity="0.22" />
            <stop offset="75%" stopColor="#E8E8ED" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F5F5F7" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {/* iridescent light-ring — atmospheric imagery only */}
        <ellipse cx="320" cy="250" rx="252" ry="172" fill="none" stroke="url(#vitrine-ring)" strokeWidth="10" opacity="0.5" />
        <ellipse cx="320" cy="250" rx="252" ry="172" fill="none" stroke="var(--color-pure-white)" strokeWidth="2" opacity="0.9" />
        {/* orbital threads */}
        <ellipse cx="320" cy="250" rx="212" ry="120" fill="none" stroke="var(--color-line)" strokeWidth="1" />
        <g className="nucleus-drift">
          <ellipse cx="320" cy="250" rx="212" ry="72" fill="none" stroke="var(--color-slate)" strokeWidth="1" strokeDasharray="1 9" opacity="0.7" transform="rotate(-12 320 250)" />
        </g>
        {/* connecting threads */}
        <g stroke="var(--color-line)" strokeWidth="1">
          <line x1="170" y1="170" x2="320" y2="250" />
          <line x1="320" y1="250" x2="470" y2="180" />
          <line x1="320" y1="250" x2="430" y2="370" strokeDasharray="3 6" />
        </g>
        {/* floating white sheets — the product */}
        <g>
          <rect x="248" y="176" width="144" height="168" rx="18" fill="var(--color-pure-white)" stroke="var(--color-line)" strokeWidth="1" />
          <text x="268" y="212" fill="var(--color-slate)" fontSize="12" letterSpacing="0.5">DOC. 033 · P.14</text>
          <line x1="268" y1="228" x2="372" y2="228" stroke="var(--color-apple-ink)" strokeWidth="3" strokeLinecap="round" />
          <line x1="268" y1="244" x2="356" y2="244" stroke="var(--color-slate)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="268" y1="258" x2="344" y2="258" stroke="var(--color-slate)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          <rect x="268" y="276" width="72" height="26" rx="13" fill="var(--color-electric-blue)" style={{ filter: "drop-shadow(0 4px 14px rgba(255,255,255,0.4))" }} />
          <text x="280" y="293" fill="#ffffff" fontSize="12" fontWeight="600">Ask ✓</text>
          <text x="268" y="324" fill="var(--color-slate)" fontSize="11">Cf. Doc. 014 →</text>
        </g>
        <g>
          <rect x="128" y="252" width="120" height="140" rx="18" fill="var(--color-pure-white)" stroke="var(--color-line)" strokeWidth="1" opacity="0.95" />
          <text x="146" y="282" fill="var(--color-slate)" fontSize="11">014</text>
          <line x1="146" y1="296" x2="230" y2="296" stroke="var(--color-apple-ink)" strokeWidth="3" strokeLinecap="round" />
          <line x1="146" y1="310" x2="218" y2="310" stroke="var(--color-slate)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="146" y1="322" x2="206" y2="322" stroke="var(--color-ash)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <g>
          <rect x="396" y="262" width="120" height="140" rx="18" fill="var(--color-pure-white)" stroke="var(--color-line)" strokeWidth="1" opacity="0.95" />
          <text x="414" y="292" fill="var(--color-slate)" fontSize="11">041</text>
          <line x1="414" y1="306" x2="498" y2="306" stroke="var(--color-apple-ink)" strokeWidth="3" strokeLinecap="round" />
          <line x1="414" y1="320" x2="486" y2="320" stroke="var(--color-slate)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="414" y1="332" x2="474" y2="332" stroke="var(--color-ash)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        {/* nodes */}
        <circle cx="170" cy="170" r="5" fill="var(--color-apple-ink)" />
        <circle cx="470" cy="180" r="4" fill="var(--color-graphite)" />
        <circle cx="430" cy="370" r="4" fill="var(--color-pure-white)" stroke="var(--color-slate)" strokeWidth="1.5" />
        <circle cx="320" cy="250" r="6" fill="var(--color-electric-blue)" />
      </svg>
    </div>
  );
}

/** Quiet loading mark for empty states. */
export function NucleusLoader({ label = "Loading your library" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex items-center gap-3">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden className="nucleus-drift">
        <circle cx="20" cy="20" r="9" fill="none" stroke="var(--color-slate)" strokeWidth="1.5" />
        <ellipse cx="20" cy="20" rx="17" ry="7" stroke="var(--color-line)" strokeWidth="1.5" transform="rotate(-20 20 20)" strokeDasharray="1 5" />
        <circle cx="33" cy="10" r="2.5" fill="var(--color-electric-blue)" />
      </svg>
      <span className="tech-label pulse-dot" style={{ color: "var(--color-graphite)" }}>
        {label}…
      </span>
    </div>
  );
}
