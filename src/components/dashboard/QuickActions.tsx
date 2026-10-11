"use client";

import Link from "next/link";

interface QuickAction {
  label: string;
  description: string;
  href?: string;
  onClick?: () => void;
  icon: string; // svg path
}

export function QuickActions({ onUpload }: { onUpload: () => void }) {
  const actions: QuickAction[] = [
    { label: "Upload document", description: "Add a PDF or DOCX", onClick: onUpload, icon: "M12 5v14M5 12h14" },
    { label: "Browse documents", description: "Open your library", href: "/documents", icon: "M4 6h16M4 12h16M4 18h10" },
    { label: "Search research", description: "Filter by name or type", href: "/documents", icon: "M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm6.5 11.5L21 20" },
    { label: "View settings", description: "Workspace preferences", href: "/settings", icon: "M4 8h16M4 16h16" },
  ];

  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>
        QUICK ACTIONS
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((a) => {
          const inner = (
            <>
              <span
                className="flex h-9 w-9 items-center justify-center"
                style={{ borderRadius: 10, background: "rgba(183,255,223,0.07)", color: "var(--color-research-accent)", border: "1px solid var(--color-hairline)" }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d={a.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="block text-sm font-medium" style={{ color: "var(--color-primary-text)" }}>{a.label}</span>
              <span className="block text-[13px]" style={{ color: "var(--color-secondary-text)" }}>{a.description}</span>
            </>
          );
          const cls = "lift p-4 text-left";
          const style = { borderRadius: "var(--radius-panel)", border: "1px solid var(--color-hairline)", background: "var(--color-deep-black)" } as const;
          if (a.href) {
            return (
              <Link key={a.label} href={a.href} className={cls} style={style}>
                {inner}
              </Link>
            );
          }
          return (
            <button key={a.label} type="button" onClick={a.onClick} className={cls} style={style}>
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}
