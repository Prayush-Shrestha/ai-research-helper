"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/layout/Logo";
import { useAuth } from "@/hooks/useAuth";
import { cx } from "@/lib/utils";

const APP_LINKS = [
  { href: "/dashboard", label: "Library" },
  { href: "/documents", label: "Research" },
  { href: "/publish", label: "Publish" },
  { href: "/toolkit", label: "Toolkit" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/assistant", label: "Assistant" },
  { href: "/guide", label: "Guide" },
];

const PUBLIC_LINKS = [
  { href: "/dashboard", label: "Library" },
  { href: "/publish", label: "Publish" },
  { href: "/toolkit", label: "Toolkit" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/guide", label: "Guide" },
];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Floating pill navbar — one component used by the landing page,
 * auth screens and the whole protected workspace.
 *
 * Shape (inspired by modern agency navs, built for this app):
 *   [ logo | wordmark ]   [ link link link link ]   [ CTA / user ]
 * all sitting inside a single rounded bar.
 */
export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = user ? APP_LINKS : PUBLIC_LINKS;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open ]);

  return (
    <div
      className="sticky z-50 mx-auto w-full px-4 pt-3 sm:px-6"
      style={{ maxWidth: 1230, top: 12 }}
    >
      <div
        className="flex items-center justify-between gap-3"
        style={{
          border: "1px solid rgba(231,231,226,0.13)",
          borderRadius: 999,
          background: "rgba(8,8,8,0.82)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 14px 44px rgba(0,0,0,0.5)",
          padding: 8,
          paddingLeft: 18,
        }}
      >
        {/* left — brand */}
        <Link
          href={user ? "/dashboard" : "/"}
          aria-label="Research home"
          className="flex shrink-0 items-center gap-3"
        >
          <LogoMark />
          <span
            className="font-tech hidden sm:block"
            style={{ color: "var(--color-primary-text)", fontSize: 12, letterSpacing: "1.6px" }}
          >
            [LM] LEMMA
          </span>
        </Link>

        {/* center — link pill (desktop) */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 lg:flex"
          style={{
            border: "1px solid #26282B",
            borderRadius: 999,
            background: "#131315",
            padding: 5,
          }}
        >
          {links.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx("font-tech rounded-full")}
                style={{
                  fontSize: 10,
                  padding: "9px 15px",
                  background: active ? "var(--color-control)" : "transparent",
                  border: active ? "1px solid var(--color-hairline)" : "1px solid transparent",
                  color: active ? "var(--color-primary-text)" : "var(--color-secondary-text)",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* right — CTA / session */}
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <Link
                href="/documents"
                className="font-tech hidden rounded-full px-4 py-2.5 sm:inline-block"
                style={{
                  fontSize: 10,
                  background: "transparent",
                  border: "1px solid transparent",
                  color: "var(--color-secondary-text)",
                }}
              >
                SEARCH
              </Link>
              <button
                onClick={logout}
                title={user.email}
                className="font-tech rounded-full px-5 py-2.5"
                style={{
                  fontSize: 10,
                  background: "var(--color-primary-text)",
                  color: "#050505",
                }}
              >
                {user.name ? user.name.split(" ")[0].toUpperCase().slice(0, 10) : "USER"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-tech hidden rounded-full px-4 py-2.5 sm:inline-block"
                style={{ fontSize: 10, color: "var(--color-secondary-text)" }}
              >
                SIGN IN
              </Link>
              <Link
                href="/register"
                className="font-tech rounded-full px-5 py-2.5 sm:px-6"
                style={{
                  fontSize: 10,
                  background: "var(--color-primary-text)",
                  color: "#050505",
                }}
              >
                ENTER →
              </Link>
            </>
          )}

          {/* mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="font-tech rounded-full px-4 py-2.5 lg:hidden"
            style={{
              fontSize: 10,
              border: "1px solid var(--color-hairline)",
              background: "var(--color-control)",
              color: "var(--color-secondary-text)",
            }}
          >
            {open ? "CLOSE ✕" : "MENU ☰"}
          </button>
        </div>
      </div>

      {/* mobile dropdown */}
      {open && (
        <nav
          aria-label="Primary mobile"
          className="mt-2 px-2 py-3 animate-slide-up lg:hidden"
          style={{
            border: "1px solid var(--color-hairline)",
            borderRadius: 22,
            background: "rgba(10,10,10,0.96)",
            backdropFilter: "blur(14px)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
          }}
        >
          {links.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="font-tech block rounded-full px-5 py-3"
                style={{
                  fontSize: 11,
                  background: active ? "var(--color-control)" : "transparent",
                  color: active ? "var(--color-primary-text)" : "var(--color-secondary-text)",
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <div
            className="mx-3 mt-2 flex items-center justify-between gap-3 pt-3"
            style={{ borderTop: "1px solid var(--color-hairline)" }}
          >
            {user ? (
              <>
                <p className="font-tech truncate" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
                  {user.email?.toUpperCase()}
                </p>
                <button
                  onClick={logout}
                  className="font-tech shrink-0 rounded-full px-5 py-2.5"
                  style={{ fontSize: 10, background: "var(--color-primary-text)", color: "#050505" }}
                >
                  SIGN OUT
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="font-tech rounded-full px-5 py-2.5"
                  style={{ fontSize: 10, color: "var(--color-secondary-text)" }}
                >
                  SIGN IN
                </Link>
                <Link
                  href="/register"
                  className="font-tech rounded-full px-5 py-2.5"
                  style={{ fontSize: 10, background: "var(--color-primary-text)", color: "#050505" }}
                >
                  ENTER →
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
