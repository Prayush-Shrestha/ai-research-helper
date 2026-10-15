"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar, useSidebarState } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { PageLoading } from "@/components/ui/Loading";

/** Protects all /(app) routes + pours the liquid ambience behind every page. */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { collapsed, toggle } = useSidebarState();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="mx-auto w-full px-4 py-10 sm:px-6" style={{ maxWidth: "var(--page-max-width)" }}>
        <PageLoading label="Pouring your workspace" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="relative flex" style={{ minHeight: "calc(100vh - var(--nav-h) - var(--nav-float) * 2)" }}>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* ambient page orbs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb" style={{ width: 480, height: 320, left: "-8%", top: "2%", background: "radial-gradient(circle, rgba(157,231,193,0.12), transparent 65%)" }} />
          <div className="orb" style={{ width: 560, height: 380, right: "-10%", top: "22%", background: "radial-gradient(circle, rgba(138,180,248,0.1), transparent 65%)" }} />
        </div>
        <MobileNav />
        <main className="page-enter relative mx-auto w-full flex-1 px-4 py-6 sm:px-8 sm:py-8" style={{ maxWidth: "var(--page-max-width)", zIndex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
