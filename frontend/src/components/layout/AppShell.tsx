"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar, useSidebarState } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { PageLoading } from "@/components/ui/Loading";

/** Protects all /(app) routes: redirects unauthenticated users to /login. */
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
        <PageLoading label="Loading your workspace" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="flex" style={{ background: "transparent", minHeight: "calc(100vh - var(--nav-h) - var(--nav-float) * 2)" }}>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="page-enter mx-auto w-full flex-1 px-4 py-6 sm:px-8 sm:py-10" style={{ maxWidth: "var(--page-max-width)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
