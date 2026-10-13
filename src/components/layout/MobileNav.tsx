"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LogoMark } from "./Logo";
import { ThemeRow, ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/documents", label: "My Research" },
  { href: "/collections", label: "Collections" },
  { href: "/assistant", label: "AI Conversations" },
  { href: "/notes", label: "Saved Notes" },
  { href: "/history", label: "Research History" },
  { href: "/insights", label: "Summaries" },
  { href: "/toolkit", label: "Citations" },
  { href: "/knowledge", label: "Knowledge Map" },
  { href: "/publish", label: "Publish" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/guide", label: "Guide" },
  { href: "/settings", label: "Settings" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Close the drawer on navigation (e.g. browser back/forward).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-[48px] z-30 flex h-14 items-center justify-between px-4 lg:hidden" style={{ borderBottom: "1px solid var(--color-line)", background: "color-mix(in srgb, var(--color-pure-white) 90%, transparent)", backdropFilter: "blur(12px)" }}>
        <span className="flex items-center gap-2">
          <LogoMark size={24} />
          <span style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 17, fontWeight: 600, color: "var(--color-apple-ink)" }}>ResearchOS</span>
        </span>
        <span className="flex items-center">
          <ThemeToggle tone="light" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="p-2"
            style={{ color: "var(--color-apple-ink)" }}
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </span>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Workspace menu">
          <div className="absolute inset-0 animate-fade-in" style={{ background: "rgba(29,29,31,0.4)" }} onClick={() => setOpen(false)} />
          <nav aria-label="Mobile workspace" className="absolute inset-x-3 top-[104px] max-h-[70vh] overflow-y-auto px-4 pb-4 pt-2 animate-slide-up" style={{ background: "var(--color-pure-white)", borderRadius: 28 }}>
            <p className="px-2 pb-1 pt-3" style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>Workspace</p>
            {LINKS.map((l) => {
              const active = pathname === l.href || (l.href === "/documents" && pathname.startsWith("/documents"));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className="block px-2 py-2.5 text-[17px]"
                  style={{ color: active ? "var(--color-electric-blue)" : "var(--color-apple-ink)", fontWeight: active ? 600 : 400 }}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="mt-2 flex items-center justify-between px-2 pt-3" style={{ borderTop: "1px solid var(--color-line)" }}>
              <div className="leading-tight">
                <p className="text-[15px] font-medium" style={{ color: "var(--color-apple-ink)" }}>{user?.name}</p>
                <p style={{ fontSize: 12, color: "var(--color-slate)" }}>{user?.email}</p>
              </div>
              <button type="button" onClick={logout} className="flex items-center gap-1.5 px-3 py-2 text-[15px]" style={{ color: "var(--color-link-blue)" }}>
                <LogOut size={15} aria-hidden /> Sign out
              </button>
            </div>
            <ThemeRow onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      )}
    </>
  );
}
