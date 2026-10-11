"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cx } from "@/lib/utils";
import { ComingSoonBadge } from "@/components/ui/Badge";
import { LogoMark } from "./Logo";

interface NavItem {
  href: string;
  label: string;
  soon?: boolean;
  icon: React.ReactNode;
}

function icon(path: string) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path d={path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: icon("M4 5h16M4 12h16M4 19h10") },
  { href: "/documents", label: "Documents", icon: icon("M7 3h8l4 4v14H7V3ZM15 3v4h4") },
  { href: "/search", label: "Search", soon: true, icon: icon("M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm6.5 11.5L21 20") },
  { href: "/settings", label: "Settings", icon: icon("M4 8h16M4 16h16M8 4v4M16 12v4") },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#E2E8F0] bg-white lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-[#F1F5F9] px-5">
        <LogoMark />
        <div className="leading-tight">
          <p className="text-[14px] font-semibold tracking-tight">AI Research Assistant</p>
          <p className="text-[11px] text-[#64748B]">Knowledge workspace</p>
        </div>
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => {
          const active =
            item.soon === true
              ? false
              : item.href === "/documents"
                ? pathname.startsWith("/documents")
                : pathname === item.href;
          const cls = cx(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "bg-[#EEF2FF] text-[#4338CA]"
              : item.soon
                ? "cursor-not-allowed text-[#94A3B8]"
                : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          );
          if (item.soon) {
            return (
              <span key={item.href} className={cls} aria-disabled="true" title="Coming soon">
                {item.icon}
                {item.label}
                <span className="ml-auto">
                  <ComingSoonBadge />
                </span>
              </span>
            );
          }
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cls}>
              {item.icon}
              {item.label}
            </Link>
          );
        })}

        <div className="px-3 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Coming soon</p>
          <ul className="mt-2 space-y-1 text-[13px] text-[#94A3B8]">
            <li className="flex items-center justify-between rounded-lg px-1 py-1.5">
              AI Assistant <ComingSoonBadge />
            </li>
            <li className="flex items-center justify-between rounded-lg px-1 py-1.5">
              Collections <ComingSoonBadge />
            </li>
          </ul>
        </div>
      </nav>

      <div className="border-t border-[#F1F5F9] p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4F46E5] text-[13px] font-semibold text-white"
          >
            {(user?.name ?? "U").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium text-[#0F172A]">{user?.name ?? "Researcher"}</p>
            <p className="truncate text-xs text-[#64748B]">{user?.email ?? ""}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            className="rounded-md p-1.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 5h4v14h-4M10 8l-4 4 4 4M6 12h9"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="sr-only">Log out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
