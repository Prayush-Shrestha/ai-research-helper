"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/layout/Logo";
import { useAuth } from "@/hooks/useAuth";
import { cx } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "LIBRARY" },
  { href: "/documents", label: "RESEARCH" },
  { href: "/assistant", label: "ASSISTANT" },
  { href: "/insights", label: "INSIGHTS" },
  { href: "/guide", label: "GUIDE" },
];

export function ResearchHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header
      className="sticky top-0 z-40"
      style={{ background: "#050505", borderBottom: "1px solid #292B2D", height: 72 }}
    >
      <div
        className="mx-auto flex h-full items-center justify-between gap-4 px-5 sm:px-8"
        style={{ maxWidth: "var(--page-width)" }}
      >
        <Link href={user ? "/dashboard" : "/"} aria-label="Research home">
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-2 md:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx("font-tech rounded-full px-4 py-2 transition-colors")}
                style={{
                  fontSize: 10,
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

        <div className="flex items-center gap-2">
          <Link
            href="/documents"
            className="font-tech hidden rounded-full px-4 py-2 sm:inline-block"
            style={{
              fontSize: 10,
              background: "var(--color-control)",
              border: "1px solid var(--color-hairline)",
              color: "var(--color-secondary-text)",
              borderRadius: 100,
            }}
          >
            SEARCH
          </Link>
          {user ? (
            <button
              onClick={logout}
              title={user.email}
              className="font-tech rounded-full px-4 py-2"
              style={{
                fontSize: 10,
                background: "var(--color-control)",
                border: "1px solid var(--color-hairline)",
                color: "var(--color-primary-text)",
                borderRadius: 100,
              }}
            >
              {user.name ? user.name.split(" ")[0].toUpperCase().slice(0, 10) : "USER"}
            </button>
          ) : (
            <Link
              href="/login"
              className="font-tech rounded-full px-4 py-2"
              style={{
                fontSize: 10,
                background: "var(--color-primary-text)",
                color: "#050505",
                borderRadius: 100,
              }}
            >
              ENTER
            </Link>
          )}
        </div>
      </div>

      {/* mobile nav strip */}
      <nav
        aria-label="Primary mobile"
        className="flex items-center gap-2 overflow-x-auto px-5 py-2 md:hidden"
        style={{ background: "#050505", borderBottom: "1px solid #292B2D" }}
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="font-tech shrink-0 rounded-full px-3 py-1.5"
            style={{
              fontSize: 10,
              background: "var(--color-control)",
              border: "1px solid var(--color-hairline)",
              color: "var(--color-secondary-text)",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
