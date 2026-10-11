"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResearchHeader } from "@/components/layout/ResearchHeader";
import { useAuth } from "@/hooks/useAuth";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col" style={{ background: "var(--color-void)" }}>
        <div style={{ height: 72, borderBottom: "1px solid #292B2D" }} />
        <div className="mx-auto w-full px-5 py-20 sm:px-8" style={{ maxWidth: "var(--page-width)" }}>
          <p className="font-tech pulse-dot" style={{ color: "var(--color-secondary-text)" }}>
            RESTORING WORKSPACE…
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-void)" }}>
      <ResearchHeader />
      <div className="page-enter">{children}</div>
      <footer style={{ borderTop: "1px solid #292B2D", marginTop: 80 }}>
        <div
          className="mx-auto flex flex-col gap-2 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8"
          style={{ maxWidth: "var(--page-width)" }}
        >
          <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
            [AI] RESEARCH — {user.name?.toUpperCase() ?? "WORKSPACE"} / SESSION ACTIVE
          </p>
          <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
            SYSTEM READY ● AI READY
          </p>
        </div>
      </footer>
    </div>
  );
}
