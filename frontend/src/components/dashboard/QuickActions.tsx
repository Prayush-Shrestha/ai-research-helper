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
      <h2 id="quick-actions-heading" className="tech-label" style={{ color: "var(--color-graphite)" }}>
        Quick actions
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((a) => {
          const inner = (
            <>
              <span
                className="flex h-9 w-9 items-center justify-center"
                style={{ borderRadius: 12, background: "rgba(157,231,193,0.12)", color: "var(--color-electric-blue)", border: "1px solid rgba(157,231,193,0.35)", boxShadow: "var(--liquid-glow-mint)" }}
              >
                {a.icon}
              </span>
              <span className="mt-2 block text-sm font-medium" style={{ color: "var(--color-apple-ink)" }}>{a.label}</span>
              <span className="block text-[13px]" style={{ color: "var(--color-graphite)" }}>{a.description}</span>
            </>
          );
          const cls = "gallery-card hover-lift p-4 text-left";
          if (a.href) {
            return (
              <Link key={a.label} href={a.href} className={cls}>
                {inner}
              </Link>
            );
          }
          return (
            <button key={a.label} type="button" onClick={a.onClick} className={cls}>
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}
