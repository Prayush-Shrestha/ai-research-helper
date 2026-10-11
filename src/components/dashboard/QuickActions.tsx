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
      <h2 id="quick-actions-heading" className="text-[15px] font-semibold text-[#0F172A]">
        Quick actions
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((a) => {
          const inner = (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d={a.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="block text-sm font-medium text-[#0F172A]">{a.label}</span>
              <span className="block text-[13px] text-[#64748B]">{a.description}</span>
            </>
          );
          const cls =
            "rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition-colors hover:border-[#C7D2FE] hover:bg-[#EEF2FF]/30";
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
