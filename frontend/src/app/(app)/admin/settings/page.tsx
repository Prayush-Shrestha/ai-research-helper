"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getSystemHealth, type SystemHealth } from "@/lib/api";
import { PageLoading } from "@/components/ui/Loading";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    let live = true;
    (async () => {
      try {
        const data = await getSystemHealth();
        if (live) {
          setHealth(data);
          setError(null);
        }
      } catch (err) {
        if (live) setError(err instanceof Error ? err.message : "Could not load system health.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [isAdmin]);

  if (!isAdmin && !loading) {
    return (
      <div className="mx-auto" style={{ maxWidth: 620, paddingTop: 40 }}>
        <section className="rise rise-1 pt-6 text-center sm:pt-10">
          <span className="eyebrow"><span className="dot" />Restricted</span>
          <h1 className="mt-4" style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
            Admin only
          </h1>
          <p className="hero-sub mx-auto mt-3 max-w-md">
            Your account is a regular one. Only administrators can view system settings.
          </p>
          <div className="gallery-card mt-8 !p-6">
            <Link href="/dashboard" className="primary-button mt-4">Back to workspace</Link>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-shell pt-20 text-center">
        <PageLoading label="Loading system health" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell pt-20 text-center">
        <p className="hand" style={{ color: "var(--color-alert)" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="rise rise-1 relative pt-6 sm:pt-10">
        <span className="eyebrow"><span className="dot" />System settings</span>
        <h1 className="mt-4" style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
          System health
        </h1>
        <p className="hero-sub mt-3 max-w-xl">
          Current status of backend services and configuration. All values
          are read live from the running server.
        </p>
      </section>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl px-5 py-3" style={{ fontSize: 14.5, color: "var(--color-alert)", background: "rgba(255,155,138,0.08)", border: "1px solid rgba(255,155,138,0.25)" }}>
          {error}
        </p>
      )}

      <section className="rise rise-2 mt-8 grid gap-5 lg:grid-cols-3">
        <div className="gallery-card rise rise-1 !p-6">
          <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)", marginBottom: 16 }}>
            Overall status
          </p>
          <div className="flex items-center gap-3">
            <span
              className={`tag-pill ${health?.status === "ok" ? "" : "crimson"}`}
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              {health?.status?.toUpperCase() || "Unknown"}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 14, color: "var(--color-apple-ink)" }}>Database</span>
              <span style={{ fontSize: 14, color: "var(--color-iron)" }}>{health?.database || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 14, color: "var(--color-apple-ink)" }}>Vector store</span>
              <span style={{ fontSize: 14, color: "var(--color-iron)" }}>{health?.vector_store || "—"}</span>
            </div>
          </div>
        </div>

        <div className="gallery-card rise rise-2 !p-6">
          <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)", marginBottom: 16 }}>
            AI providers
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 14, color: "var(--color-apple-ink)" }}>Embedding</span>
              <span style={{ fontSize: 14, color: "var(--color-iron)" }}>{health?.embedding_provider || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 14, color: "var(--color-apple-ink)" }}>LLM</span>
              <span style={{ fontSize: 14, color: "var(--color-iron)" }}>{health?.llm_provider || "—"}</span>
            </div>
          </div>
        </div>

        <div className="gallery-card rise rise-3 !p-6">
          <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)", marginBottom: 16 }}>
            Runtime
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 14, color: "var(--color-apple-ink)" }}>Uptime</span>
              <span style={{ fontSize: 14, color: "var(--color-iron)" }}>
                {health && health.uptime_seconds !== null ? `${Math.floor(health.uptime_seconds / 3600)}h ${Math.floor((health.uptime_seconds % 3600) / 60)}m` : "—"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rise rise-3 mt-8 gallery-card !p-6">
        <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)", marginBottom: 12 }}>
          Environment configuration
        </p>
        <div className="rounded-2xl p-4" style={{ background: "rgba(127,127,133,0.05)", border: "1px solid var(--liquid-border-soft)" }}>
          <div className="space-y-2" style={{ fontSize: 13, fontFamily: "var(--font-technical)" }}>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-slate)" }}>Backend port</span>
              <span style={{ color: "var(--color-apple-ink)" }}>8000</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-slate)" }}>Frontend port</span>
              <span style={{ color: "var(--color-apple-ink)" }}>3002</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--color-slate)" }}>Auth cookie</span>
              <span style={{ color: "var(--color-apple-ink)" }}>ros_session (HttpOnly)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
