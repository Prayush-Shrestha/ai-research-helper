"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cx } from "@/lib/utils";
import { LogoMark } from "./Logo";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/documents", label: "Documents" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur lg:hidden">
        <span className="flex items-center gap-2">
          <LogoMark className="h-7 w-7 text-[13px]" />
          <span className="text-sm font-semibold">Research Assistant</span>
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-lg border border-[#E2E8F0] p-2 text-[#475569]"
        >
          {open ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-[#0F172A]/40 animate-fade-in" onClick={() => setOpen(false)} />
          <nav
            aria-label="Mobile"
            className="absolute inset-x-0 top-14 border-b border-[#E2E8F0] bg-white px-4 pb-5 pt-2 shadow-lg animate-slide-up"
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === l.href || (l.href === "/documents" && pathname.startsWith("/documents")) ? "page" : undefined}
                className={cx(
                  "block rounded-lg px-3 py-2.5 text-[15px] font-medium",
                  pathname === l.href ? "bg-[#EEF2FF] text-[#4338CA]" : "text-[#334155]"
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex items-center justify-between border-t border-[#F1F5F9] px-3 pt-3">
              <div className="leading-tight">
                <p className="text-[13px] font-medium">{user?.name}</p>
                <p className="text-xs text-[#64748B]">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-[13px] font-medium text-[#475569]"
              >
                Log out
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
