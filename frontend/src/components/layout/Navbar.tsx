"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle, ThemeRow } from "@/components/layout/ThemeToggle";

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
 * Moon-reference nav: white logo box · center pill · solid CTA + BIG theme toggle.
 * No green anywhere — ink and paper only.
 */
export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isLanding = pathname === "/";
  const links = isLanding ? LANDING_LINKS : APP_LINKS;
  const ctaHref = user ? "/dashboard" : "/register";
  const ctaLabel = user ? "Open Workspace" : "Start a Project";

  return (
    <div className="mt-bar">
      <div className="mt-inner">
        {/* left — logo box like reference */}
        <Link href={user ? "/dashboard" : "/"} aria-label="Lumina home" className="mt-brand">
          <span className="mt-logo-box">
            <SparkMark size={30} />
          </span>
          <span className="mt-brand-name">Lumina</span>
        </Link>

        {/* center — floating pill */}
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

        {/* right — BIG toggle + solid CTA */}
        <div className="mt-right">
          <span className="hidden sm:inline-flex">
            <ThemeToggle />
          </span>
          {isLanding && !user && (
            <Link href="/login" className="hidden px-2 text-[16px] font-medium lg:inline" style={{ color: "var(--color-graphite)" }}>
              Sign in
            </Link>
          )}
          <Link href={ctaHref} className="mt-cta hidden sm:inline-flex">
            {ctaLabel}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="theme-big !px-4 sm:hidden"
            style={{ height: 46 }}
          >
            <span aria-hidden style={{ display: "block", width: 20, height: 2, background: "currentColor", borderRadius: 2, boxShadow: "0 -6px 0 currentColor, 0 6px 0 currentColor" }} />
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      {open && (
        <nav aria-label="Primary mobile" className="liquid-dialog animate-slide-up mx-auto mt-3 max-w-[1320px] px-5 pb-6 shadow-2xl">
          <div className="flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3.5"
                style={{ fontSize: 19, fontWeight: 550, color: "var(--color-apple-ink)", borderBottom: "1px solid var(--liquid-border-soft)" }}
              >
                {l.label}
              </Link>
            ))}
            <Link href={ctaHref} onClick={() => setOpen(false)} className="mt-cta mt-4 justify-center" style={{ width: "100%" }}>
              {ctaLabel}
            </Link>
            {!user && (
              <Link href="/login" onClick={() => setOpen(false)} className="mt-3 text-center" style={{ fontSize: 16, color: "var(--color-graphite)" }}>
                Sign in
              </Link>
            )}
            <div className="mt-2 flex justify-center">
              <ThemeToggle />
            </div>
            <ThemeRow onNavigate={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </div>
  );
}
