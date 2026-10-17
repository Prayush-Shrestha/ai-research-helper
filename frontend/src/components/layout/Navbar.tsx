"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
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
  { href: "/research-topics", label: "Topics" },
  { href: "/assistant", label: "Assistant" },
  { href: "/guide", label: "Guide" },
];

/** Full workspace index for the mobile scroll row (no menu button). */
const MOBILE_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/documents", label: "My Research" },
  { href: "/research-topics", label: "Topics" },
  { href: "/collections", label: "Collections" },
  { href: "/notes", label: "Notes" },
  { href: "/assistant", label: "Assistant" },
  { href: "/insights", label: "Summaries" },
  { href: "/toolkit", label: "Citations" },
  { href: "/knowledge", label: "Knowledge" },
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
 * No menu button — on mobile the links become a scrollable row instead.
 */
export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isLanding = pathname === "/";
  const links = isLanding ? LANDING_LINKS : APP_LINKS;
  const mobileLinks =
    isLanding || !user
      ? links
      : [
          ...MOBILE_LINKS,
          ...(user.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
        ];
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
        <nav aria-label="Primary" className="mt-center mt-center-desktop">
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
          <ThemeToggle />
          {isLanding && !user && (
            <Link href="/login" className="mt-signin hidden text-[16px] font-medium min-[1100px]:inline" style={{ color: "var(--color-graphite)" }}>
              Sign in
            </Link>
          )}
          <Link href={ctaHref} className="mt-cta">
            {ctaLabel}
          </Link>
        </div>

        {/* mobile — scrollable link row, no button */}
        <nav aria-label="Primary mobile" className="mt-center-mobile">
          {mobileLinks.map((l) => {
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
          {isLanding && !user && (
            <Link href="/login" className="mt-link">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
