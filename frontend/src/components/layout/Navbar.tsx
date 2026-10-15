"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle, ThemeRow } from "@/components/layout/ThemeToggle";
import { ScrollProgress } from "@/components/motion/ScrollProgress";

const LANDING_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "/guide", label: "Guide" },
  { href: "/documents", label: "Library" },
];

const APP_LINKS = [
  { href: "/dashboard", label: "Workspace" },
  { href: "/documents", label: "Library" },
  { href: "/assistant", label: "Assistant" },
  { href: "/guide", label: "Guide" },
];

/** Full workspace index for the mobile drawer (one nav only — no second bar). */
const DRAWER_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/documents", label: "My Research" },
  { href: "/collections", label: "Collections" },
  { href: "/notes", label: "Saved Notes" },
  { href: "/assistant", label: "Assistant" },
  { href: "/insights", label: "Summaries" },
  { href: "/toolkit", label: "Citations" },
  { href: "/knowledge", label: "Knowledge Map" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

function SparkMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 5.5 C17.2 11.8 19.2 13.8 25.5 15 C19.2 16.2 17.2 18.2 16 24.5 C14.8 18.2 12.8 16.2 6.5 15 C12.8 13.8 14.8 11.8 16 5.5 Z"
        fill="var(--btn-ink)"
      />
      <circle cx="23" cy="8.5" r="2.6" fill="var(--btn-ink)" opacity="0.55" />
    </svg>
  );
}

/**
 * Moon-reference nav: white logo box · liquid center pill · solid CTA + BIG theme toggle.
 * The ONLY navbar — AppShell renders no second bar. No green anywhere.
 */
export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isLanding = pathname === "/";
  const links = isLanding ? LANDING_LINKS : APP_LINKS;
  const ctaHref = user ? "/dashboard" : "/register";
  const ctaLabel = user ? "Open workspace" : "Get started";

  return (
    <div className="mt-bar">
      <ScrollProgress />
      <div className="mt-inner">
        {/* left — logo box like reference */}
        <Link href={user ? "/dashboard" : "/"} aria-label="Lumina home" className="mt-brand">
          <span className="mt-logo-box">
            <SparkMark size={30} />
          </span>
          <span className="mt-brand-name">Lumina</span>
        </Link>

        {/* center — floating liquid pill (desktop) */}
        <nav aria-label="Primary" className="mt-center">
          {links.map((l) => {
            const active = !isLanding && (pathname === l.href || (l.href === "/documents" && pathname.startsWith("/documents")));
            return (
              <Link
                key={l.href + l.label}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={active ? "mt-link mt-link-active" : "mt-link"}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* right — BIG toggle + solid CTA (desktop) */}
        <div className="mt-right">
          <span className="hidden min-[900px]:inline-flex">
            <ThemeToggle />
          </span>
          {isLanding && !user && (
            <Link href="/login" className="mt-signin hidden text-[16px] font-medium min-[1100px]:inline" style={{ color: "var(--color-graphite)" }}>
              Sign in
            </Link>
          )}
          <Link href={ctaHref} className="mt-cta hidden min-[900px]:inline-flex">
            {ctaLabel}
          </Link>
          {/* mobile — one liquid menu button */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="mt-burger min-[900px]:hidden"
          >
            {open ? <X size={22} aria-hidden strokeWidth={2.2} /> : <Menu size={22} aria-hidden strokeWidth={2.2} />}
          </button>
        </div>
      </div>

      {/* mobile drawer — the single menu */}
      {open && (
        <nav aria-label="Primary mobile" className="liquid-dialog animate-slide-up mx-auto mt-3 max-w-[1320px] px-5 pb-6 shadow-2xl">
          <div className="flex flex-col">
            {(isLanding || !user ? links : DRAWER_LINKS).map((l) => {
              const active = pathname === l.href || (l.href === "/documents" && pathname.startsWith("/documents"));
              return (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className="py-3"
                  style={{
                    fontSize: 18,
                    fontWeight: active ? 650 : 500,
                    color: active ? "var(--color-apple-ink)" : "var(--color-graphite)",
                    borderBottom: "1px solid var(--liquid-border-soft)",
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
            {user && !isLanding && (
              <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--liquid-border-soft)" }}>
                <div className="leading-tight">
                  <p className="text-[15px] font-semibold" style={{ color: "var(--color-apple-ink)" }}>{user.name}</p>
                  <p style={{ fontSize: 12.5, color: "var(--color-slate)" }}>{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void logout();
                  }}
                  className="ghost-pill"
                  style={{ fontSize: 14, padding: "8px 18px" }}
                >
                  Sign out
                </button>
              </div>
            )}
            <Link href={ctaHref} onClick={() => setOpen(false)} className="mt-cta mt-4 justify-center" style={{ width: "100%" }}>
              {ctaLabel}
            </Link>
            {isLanding && !user && (
              <Link href="/login" onClick={() => setOpen(false)} className="mt-3 text-center" style={{ fontSize: 16, fontWeight: 550, color: "var(--color-graphite)" }}>
                Sign in
              </Link>
            )}
            <div className="mt-4 flex justify-center">
              <ThemeToggle />
            </div>
            <ThemeRow onNavigate={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </div>
  );
}
