"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  getAdminAnalytics,
  type AdminAnalytics,
} from "@/lib/api";
import { PageLoading } from "@/components/ui/Loading";
import { CountUp } from "@/components/motion/CountUp";

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
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
        const data = await getAdminAnalytics();
        if (live) {
          setAnalytics(data);
          setError(null);
        }
      } catch (err) {
        if (live) setError(err instanceof Error ? err.message : "Could not load admin analytics.");
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
            Your account is a regular one. Only administrators can view system analytics.
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
        <PageLoading label="Loading system analytics" />
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
        <span className="eyebrow"><span className="dot" />System analytics</span>
        <h1 className="mt-4" style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
          System analytics
        </h1>
        <p className="hero-sub mt-3 max-w-xl">
          All metrics are live database queries. Values marked “estimated”
          are derived, not directly measured.
        </p>
      </section>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl px-5 py-3" style={{ fontSize: 14.5, color: "var(--color-alert)", background: "rgba(255,155,138,0.08)", border: "1px solid rgba(255,155,138,0.25)" }}>
          {error}
        </p>
      )}

      <section className="rise rise-2 mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="glass-stat rise rise-1">
          <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
            <CountUp end={analytics?.total_users ?? 0} />
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: "var(--color-slate)" }}>Total users</p>
        </div>
        <div className="glass-stat rise rise-2">
          <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
            <CountUp end={analytics?.active_users ?? 0} />
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: "var(--color-slate)" }}>Active users</p>
        </div>
        <div className="glass-stat rise rise-3">
          <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
            <CountUp end={analytics?.new_users_30d ?? 0} />
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: "var(--color-slate)" }}>New (30 days)</p>
        </div>
        <div className="glass-stat rise rise-4">
          <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
            <CountUp end={analytics?.total_documents ?? 0} />
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: "var(--color-slate)" }}>Total documents</p>
        </div>
        <div className="glass-stat rise rise-5">
          <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
            <CountUp end={analytics?.documents_uploaded_30d ?? 0} />
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: "var(--color-slate)" }}>Uploads (30d)</p>
        </div>
        <div className="glass-stat rise rise-6">
          <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
            <CountUp end={analytics?.ai_requests_30d ?? 0} />
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: "var(--color-slate)" }}>AI requests (30d)</p>
        </div>
      </section>

      <section className="rise rise-3 mt-8 grid gap-5 lg:grid-cols-3">
        <div className="gallery-card rise rise-1 !p-6">
          <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)", marginBottom: 12 }}>
            Processing
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 14, color: "var(--color-apple-ink)" }}>Successful</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-apple-ink)" }}><CountUp end={analytics?.processing_success_count ?? 0} /></span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 14, color: "var(--color-apple-ink)" }}>Failed</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-alert)" }}><CountUp end={analytics?.processing_failure_count ?? 0} /></span>
            </div>
            <div className="flex items-center justify-between" style={{ borderTop: "1px solid var(--liquid-border-soft)", paddingTop: 10 }}>
              <span style={{ fontSize: 14, color: "var(--color-apple-ink)" }}>Error rate</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-apple-ink)" }}>
                {analytics?.error_rate_percent?.toFixed(1)}%
              </span>
              <span className="tag-pill" style={{ fontSize: 11 }}>Estimated</span>
            </div>
          </div>
        </div>
        <div className="gallery-card rise rise-2 !p-6">
          <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)", marginBottom: 12 }}>
            Latency
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 14, color: "var(--color-apple-ink)" }}>Avg processing time</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-apple-ink)" }}>
                {analytics?.avg_processing_latency_ms ? `${analytics.avg_processing_latency_ms.toFixed(0)} ms` : "—"}
              </span>
              <span className="tag-pill" style={{ fontSize: 11 }}>Estimated</span>
            </div>
          </div>
        </div>
        <div className="gallery-card rise rise-3 !p-6">
          <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)", marginBottom: 12 }}>
            Growth
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 14, color: "var(--color-apple-ink)" }}>New users (30d)</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-apple-ink)" }}><CountUp end={analytics?.new_users_30d ?? 0} /></span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 14, color: "var(--color-apple-ink)" }}>New uploads (30d)</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-apple-ink)" }}><CountUp end={analytics?.documents_uploaded_30d ?? 0} /></span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
