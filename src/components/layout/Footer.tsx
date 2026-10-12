"use client";

import Link from "next/link";
import { Wordmark } from "@/components/layout/Logo";
import { useAuth } from "@/hooks/useAuth";

const LINKS = [
  { href: "/dashboard", label: "Library" },
  { href: "/documents", label: "Research" },
  { href: "/publish", label: "Publish" },
  { href: "/toolkit", label: "Toolkit" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/assistant", label: "Assistant" },
  { href: "/guide", label: "Guide" },
  { href: "/settings", label: "Settings" },
];

/**
 * Site footer — one component shared by the landing page
 * and the protected workspace. Keeps brand, links and
 * session status in a single place.
 */
export function Footer() {
  const { user } = useAuth();

  return (
    <footer style={{ borderTop: "1px solid #292B2D", marginTop: 80 }}>
      <div
        className="mx-auto flex flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between"
        style={{ maxWidth: "var(--page-width)" }}
      >
        <div className="flex items-center gap-4">
          <Wordmark />
          <p className="font-tech hidden sm:block" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
            KNOWLEDGE LABORATORY
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-tech"
              style={{ color: "var(--color-secondary-text)", fontSize: 10 }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
          {user ? (
            <>RESEARCHOS — {user.name?.toUpperCase() ?? "WORKSPACE"} / SESSION ACTIVE</>
          ) : (
            <>VOID / 050505 — EDITION 01</>
          )}
        </p>
      </div>
    </footer>
  );
}
