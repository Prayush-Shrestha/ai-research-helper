"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, LogOut, Search, Settings } from "lucide-react";
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

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} aria-hidden className="shrink-0" /> },
  { href: "/documents", label: "Documents", icon: <FileText size={18} aria-hidden className="shrink-0" /> },
  { href: "/search", label: "Search", soon: true, icon: <Search size={18} aria-hidden className="shrink-0" /> },
  { href: "/settings", label: "Settings", icon: <Settings size={18} aria-hidden className="shrink-0" /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col lg:flex" style={{ borderRight: "1px solid var(--color-hairline)", background: "#050505" }}>
      <div className="flex h-16 items-center gap-2.5 px-5" style={{ borderBottom: "1px solid var(--color-hairline)" }}>
        <LogoMark />
        <div className="leading-tight">
          <p className="text-[14px] font-semibold tracking-tight" style={{ color: "var(--color-primary-text)" }}>ResearchOS</p>
          <p className="text-[11px]" style={{ color: "var(--color-tertiary-text)" }}>Knowledge workspace</p>
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
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
            active
              ? "text-[#E7E7E2]"
              : item.soon
                ? "cursor-not-allowed text-[#62686A]"
                : "text-[#92989A] hover:bg-[#17191B] hover:text-[#E7E7E2]"
          );
          const style = active ? { background: "var(--color-control)", border: "1px solid var(--color-hairline)" } : { border: "1px solid transparent" };
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
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cls} style={style}>
              {item.icon}
              {item.label}
            </Link>
          );
        })}

        <div className="px-3 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-tertiary-text)" }}>Coming soon</p>
          <ul className="mt-2 space-y-1 text-[13px]" style={{ color: "var(--color-tertiary-text)" }}>
            <li className="flex items-center justify-between rounded-lg px-1 py-1.5">
              AI Assistant <ComingSoonBadge />
            </li>
            <li className="flex items-center justify-between rounded-lg px-1 py-1.5">
              Collections <ComingSoonBadge />
            </li>
          </ul>
        </div>
      </nav>

      <div className="p-3" style={{ borderTop: "1px solid var(--color-hairline)" }}>
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
            style={{ background: "var(--color-research-accent)", color: "#050505" }}
          >
            {(user?.name ?? "U").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium" style={{ color: "var(--color-primary-text)" }}>{user?.name ?? "Researcher"}</p>
            <p className="truncate text-xs" style={{ color: "var(--color-tertiary-text)" }}>{user?.email ?? ""}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            className="rounded-lg p-1.5"
            style={{ color: "var(--color-secondary-text)" }}
          >
            <LogOut size={16} aria-hidden />
            <span className="sr-only">Log out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
