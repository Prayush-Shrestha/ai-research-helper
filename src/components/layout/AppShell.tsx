"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { PageLoading } from "@/components/ui/Loading";

/** Protects all /(app) routes: redirects unauthenticated users to /login. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <PageLoading label="Loading your workspace…" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-void)" }}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 page-enter">{children}</main>
      </div>
    </div>
  );
}
