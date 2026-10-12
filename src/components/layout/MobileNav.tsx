"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
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
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 backdrop-blur lg:hidden" style={{ borderBottom: "1px solid var(--color-hairline)", background: "rgba(5,5,5,0.9)" }}>
        <span className="flex items-center gap-2">
          <LogoMark className="h-7 w-7 text-[13px]" />
          <span className="text-sm font-semibold" style={{ color: "var(--color-primary-text)" }}>Research Assistant</span>
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-xl p-2"
          style={{ border: "1px solid var(--color-hairline)", color: "var(--color-secondary-text)", background: "var(--color-control)" }}
        >
          {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-fade-in" style={{ background: "rgba(5,5,5,0.7)", backdropFilter: "blur(4px)" }} onClick={() => setOpen(false)} />
          <nav
            aria-label="Mobile"
            className="absolute inset-x-0 top-14 px-4 pb-5 pt-2 animate-slide-up"
            style={{ borderBottom: "1px solid var(--color-hairline)", background: "#0A0A0A" }}
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === l.href || (l.href === "/documents" && pathname.startsWith("/documents")) ? "page" : undefined}
                className={cx(
                  "block rounded-xl px-3 py-2.5 text-[15px] font-medium",
                  pathname === l.href ? "text-[#E7E7E2]" : "text-[#92989A]"
                )}
                style={pathname === l.href ? { background: "var(--color-control)", border: "1px solid var(--color-hairline)" } : undefined}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex items-center justify-between px-3 pt-3" style={{ borderTop: "1px solid var(--color-hairline)" }}>
              <div className="leading-tight">
                <p className="text-[13px] font-medium" style={{ color: "var(--color-primary-text)" }}>{user?.name}</p>
                <p className="text-xs" style={{ color: "var(--color-tertiary-text)" }}>{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full px-3 py-1.5 text-[13px] font-medium"
                style={{ border: "1px solid var(--color-hairline)", color: "var(--color-secondary-text)", background: "var(--color-control)" }}
              >
                <span className="flex items-center gap-1.5">
                  <LogOut size={14} aria-hidden />
                  Log out
                </span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
