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
 * Liquid glass nav — full-width translucent bar with blur, shine, and depth.
 * Inner content stays capped; the glass itself runs edge to edge.
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
    <div className="liquid-bar">
      <div className="liquid-pill">
        <Link
          href={user ? "/dashboard" : "/"}
          aria-label="Lumina home"
          className="group flex items-center gap-2"
          style={{ fontFamily: "var(--font-sf-pro-text)", fontSize: 17, fontWeight: 600, letterSpacing: "-0.019em", color: "var(--color-apple-ink)" }}
        >
          <span style={{ filter: "drop-shadow(0 0 10px rgba(157,231,193,0.45))", display: "inline-flex" }}>
            <LogoMark size={22} />
          </span>
          Lumina
        </Link>

        {isLanding ? (
          <nav aria-label="Primary" className="hidden items-center gap-1.5 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="liquid-link"
                style={{ fontSize: 13, fontWeight: 500, color: "var(--color-graphite)" }}
              >
                {l.label}
              </Link>
            ))}
            <ThemeToggle tone="dark" />
            {user ? (
              <Link href="/dashboard" className="primary-button liquid-cta ml-1" style={{ fontSize: 13, padding: "7px 16px" }}>
                Open
              </Link>
            ) : (
              <>
                <Link href="/login" className="liquid-link" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-apple-ink)" }}>
                  Sign in
                </Link>
                <Link href="/register" className="primary-button liquid-cta" style={{ fontSize: 13, padding: "7px 16px" }}>
                  Get started
                </Link>
              </>
            )}
          </nav>
        ) : (
          <nav aria-label="Primary" className="hidden items-center gap-1.5 md:flex">
            {[
              ["/dashboard", "Workspace"],
              ["/documents", "Library"],
              ["/assistant", "Assistant"],
              ["/guide", "Guide"],
            ].map(([href, label]) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "liquid-link liquid-link-active" : "liquid-link"}
                  style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "var(--color-apple-ink)" : "var(--color-graphite)" }}
                >
                  {label}
                </Link>
              );
            })}
            <ThemeToggle tone="dark" />
          </nav>
        )}

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle tone="dark" />
          {!isLanding && user && (
            <Link href="/documents" className="primary-button liquid-cta" style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px" }}>
              New
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="liquid-link flex h-9 w-9 flex-col items-center justify-center gap-1.5"
            style={{ color: "var(--color-apple-ink)" }}
          >
            <span aria-hidden style={{ display: "block", width: 18, height: 1.5, background: "currentColor", borderRadius: 2 }} />
            <span aria-hidden style={{ display: "block", width: 18, height: 1.5, background: "currentColor", borderRadius: 2 }} />
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Primary mobile" className="liquid-dialog animate-slide-up mx-auto mt-2 max-w-[1120px] px-5 pb-6 shadow-2xl md:hidden">
          <p className="tech-label px-0 pb-1 pt-4" style={{ color: "var(--color-electric-blue)" }}>Menu</p>
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
                className="py-3.5 transition-colors"
                style={{ fontSize: 17, color: "var(--color-apple-ink)", borderBottom: "1px solid var(--liquid-border-soft)" }}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <Link href="/documents" onClick={() => setOpen(false)} className="primary-button liquid-cta mt-4 py-2.5 text-center" style={{ fontSize: 17 }}>
                New research
              </Link>
            ) : (
              <Link href="/register" onClick={() => setOpen(false)} className="primary-button liquid-cta mt-4 py-2.5 text-center" style={{ fontSize: 17 }}>
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
