"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogoMark } from "@/components/layout/Logo";
import { ThemeToggle, ThemeRow } from "@/components/layout/ThemeToggle";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "How It Works" },
];

/**
 * Gallery nav bar — dark translucent band, 48px, 12px links.
 * Floats over the fog canvas with backdrop blur, no borders.
 */
export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on navigation (e.g. browser back/forward).
  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      setOpen(false);
    })();
  }, [pathname]);

  const isLanding = pathname === "/";

  return (
    <div
      className="sticky top-0 z-50"
      style={{ background: "rgba(8,8,18,0.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(139,92,246,0.16)" }}
    >
      <header
        className="mx-auto flex h-[48px] items-center justify-between px-4 sm:px-5"
        style={{ maxWidth: 1024 }}
      >
        <Link
          href={user ? "/dashboard" : "/"}
          aria-label="Lumina home"
          className="flex items-center gap-2"
          style={{ fontFamily: "var(--font-sf-pro-text)", fontSize: 17, fontWeight: 600, letterSpacing: "-0.019em", color: "#f5f5f7" }}
        >
          <LogoMark size={22} />
          Lumina
        </Link>

        {isLanding ? (
          <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{ fontSize: 12, fontWeight: 400, letterSpacing: "-0.01em", color: "#f5f5f7", opacity: 0.85 }}
              >
                {l.label}
              </Link>
            ))}
            <ThemeToggle tone="dark" />
            {user ? (
              <Link href="/dashboard" className="rounded-full px-4 py-1.5" style={{ fontSize: 12, background: "var(--color-electric-blue)", color: "#fff" }}>
                Open
              </Link>
            ) : (
              <Link href="/register" className="rounded-full px-4 py-1.5" style={{ fontSize: 12, background: "var(--color-electric-blue)", color: "#fff" }}>
                Get started
              </Link>
            )}
          </nav>
        ) : (
          <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
            {[
              ["/dashboard", "Workspace"],
              ["/documents", "Library"],
              ["/assistant", "Assistant"],
              ["/guide", "Guide"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                style={{ fontSize: 12, fontWeight: 400, letterSpacing: "-0.01em", color: "#f5f5f7", opacity: pathname === href ? 1 : 0.75 }}
              >
                {label}
              </Link>
            ))}
            <ThemeToggle tone="dark" />
          </nav>
        )}

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle tone="dark" />
          {!isLanding && user && (
            <Link href="/documents" className="rounded-full px-3.5 py-1" style={{ fontSize: 12, background: "var(--color-electric-blue)", color: "#fff" }}>
              New
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5"
            style={{ color: "#f5f5f7" }}
          >
            <span aria-hidden style={{ display: "block", width: 18, height: 1.5, background: "currentColor", borderRadius: 2 }} />
            <span aria-hidden style={{ display: "block", width: 18, height: 1.5, background: "currentColor", borderRadius: 2 }} />
          </button>
        </div>
      </header>

      {open && (
        <nav aria-label="Primary mobile" className="animate-slide-up px-5 pb-6 md:hidden" style={{ background: "rgba(8,8,20,0.96)", borderBottom: "1px solid rgba(139,92,246,0.16)" }}>
          <div className="flex flex-col">
            {(isLanding ? LINKS.map((l) => ({ href: l.href, label: l.label })) : [
              { href: "/dashboard", label: "Workspace" },
              { href: "/documents", label: "Library" },
              { href: "/assistant", label: "Assistant" },
              { href: "/collections", label: "Collections" },
              { href: "/notes", label: "Notes" },
              { href: "/guide", label: "Guide" },
            ]).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3.5"
                style={{ fontSize: 17, color: "#f5f5f7", borderBottom: "1px solid rgba(245,245,247,0.15)" }}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <Link href="/documents" onClick={() => setOpen(false)} className="mt-4 rounded-full py-2.5 text-center" style={{ fontSize: 17, background: "var(--color-electric-blue)", color: "#fff" }}>
                New research
              </Link>
            ) : (
              <Link href="/register" onClick={() => setOpen(false)} className="mt-4 rounded-full py-2.5 text-center" style={{ fontSize: 17, background: "var(--color-electric-blue)", color: "#fff" }}>
                Get started
              </Link>
            )}
            <ThemeRow dark onNavigate={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </div>
  );
}
