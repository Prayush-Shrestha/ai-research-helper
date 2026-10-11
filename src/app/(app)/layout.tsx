"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
        <Navbar />
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
      <Navbar />
      <div className="page-enter">{children}</div>
      <Footer />
    </div>
  );
}
