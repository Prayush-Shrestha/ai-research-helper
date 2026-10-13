"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FolderOpen, Search, Settings, Upload } from "lucide-react";

interface QuickAction {
  label: string;
  description: string;
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
}

export function QuickActions({ onUpload }: { onUpload: () => void }) {
  const actions: QuickAction[] = [
    { label: "Upload document", description: "Add a PDF or DOCX", onClick: onUpload, icon: <Upload size={17} aria-hidden /> },
    { label: "Browse documents", description: "Open your library", href: "/documents", icon: <FolderOpen size={17} aria-hidden /> },
    { label: "Search research", description: "Filter by name or type", href: "/documents", icon: <Search size={17} aria-hidden /> },
    { label: "View settings", description: "Workspace preferences", href: "/settings", icon: <Settings size={17} aria-hidden /> },
  ];

  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="font-tech" style={{ color: "var(--color-graphite)" }}>
        QUICK ACTIONS
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((a) => {
          const inner = (
            <>
              <span
                className="flex h-9 w-9 items-center justify-center"
                style={{ borderRadius: 10, background: "rgba(183,255,223,0.07)", color: "var(--color-frost)", border: "1px solid var(--color-hairline)" }}
              >
                {a.icon}
              </span>
              <span className="block text-sm font-medium" style={{ color: "var(--color-frost)" }}>{a.label}</span>
              <span className="block text-[13px]" style={{ color: "var(--color-ash)" }}>{a.description}</span>
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
