"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  getActivityLogs,
  getDashboard,
  type ActivityLogEntry,
} from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { PageLoading } from "@/components/ui/Loading";
import { CountUp } from "@/components/motion/CountUp";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [dashboard, activity] = await Promise.all([
          getDashboard(),
          getActivityLogs(undefined, 1, 20),
        ]);
        if (live) {
          setStats(dashboard);
          setActivities(activity.items);
          setActivityTotal(activity.total);
          setError(null);
        }
      } catch (err) {
        if (live) setError(err instanceof Error ? err.message : "Could not load analytics.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const docCount = stats?.counts.total_documents ?? 0;

  // Activity by action type.
  const activityByType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of activities) {
      counts[a.action] = (counts[a.action] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [activities]);

  // Recent activity (last 10).
  const recentActivity = activities.slice(0, 10);

  if (loading) {
    return (
      <div className="page-shell pt-20 text-center">
        <PageLoading label="Loading your analytics" />
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
      {error && (
        <p role="alert" className="mt-6 rounded-2xl px-5 py-3" style={{ fontSize: 14.5, color: "var(--color-alert)", background: "rgba(255,155,138,0.08)", border: "1px solid rgba(255,155,138,0.25)" }}>
          {error}
        </p>
      )}

      <section className="rise rise-1 relative pt-6 sm:pt-10">
        <span className="eyebrow"><span className="dot" />Research analytics</span>
        <h1 className="mt-4" style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
          Your research analytics
        </h1>
        <p className="hero-sub mt-3 max-w-xl">
          Hey {firstName}, here’s a look at your research activity. Every
          number comes from your own database records — nothing fabricated.
        </p>
      </section>

      {/* Key metrics */}
      <section className="rise rise-2 mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div className="glass-stat rise rise-1">
          <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
            <CountUp end={docCount} />
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: "var(--color-slate)" }}>Papers uploaded</p>
        </div>
        <div className="glass-stat rise rise-2">
          <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
            <CountUp end={stats?.counts.pdf_count ?? 0} />
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: "var(--color-slate)" }}>PDFs</p>
        </div>
        <div className="glass-stat rise rise-3">
          <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
            <CountUp end={stats?.counts.docx_count ?? 0} />
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: "var(--color-slate)" }}>Word docs</p>
        </div>
        <div className="glass-stat rise rise-4">
          <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
            <CountUp end={stats?.counts.total_notes ?? 0} />
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: "var(--color-slate)" }}>Notes saved</p>
        </div>
      </section>

      {/* Activity by type */}
      <section className="rise rise-3 mt-8 gallery-card !p-6">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <div>
            <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)" }}>
              Activity by type
            </p>
            <p style={{ fontSize: 17, fontWeight: 650, color: "var(--color-apple-ink)" }}>
              {activityTotal} total recorded actions
            </p>
          </div>
        </div>
        {activityByType.length === 0 ? (
          <p className="py-4 text-center" style={{ fontSize: 14.5, color: "var(--color-graphite)" }}>
            No activity recorded yet. Upload a paper, write a note, or ask a
            question to start building your activity history.
          </p>
        ) : (
          <div className="space-y-2">
            {activityByType.map(([action, count]) => (
              <div key={action} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid var(--liquid-border-soft)" }}>
                <span className="shrink-0" style={{ fontSize: 13.5, color: "var(--color-apple-ink)", fontWeight: 550 }}>
                  {action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                <span className="ml-auto shrink-0" style={{ fontSize: 15, fontWeight: 700, color: "var(--color-apple-ink)" }}>
                  <CountUp end={count} />
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section className="rise rise-4 mt-8 gallery-card !p-6">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <div>
            <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)" }}>
              Recent activity
            </p>
            <p style={{ fontSize: 17, fontWeight: 650, color: "var(--color-apple-ink)" }}>
              Last {recentActivity.length} recorded actions
            </p>
          </div>
        </div>
        {recentActivity.length === 0 ? (
          <p className="py-4 text-center" style={{ fontSize: 14.5, color: "var(--color-graphite)" }}>
            No recent activity.
          </p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid var(--liquid-border-soft)" }}>
                <span className="shrink-0" style={{ fontSize: 12, color: "var(--color-slate)" }}>
                  {formatDate(a.created_at)}
                </span>
                <span className="min-w-0 flex-1">
                  <p className="truncate" style={{ fontSize: 14, color: "var(--color-apple-ink)" }}>
                    {a.action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                  {a.entity_type && a.entity_id && (
                    <p className="truncate" style={{ fontSize: 12, color: "var(--color-slate)" }}>
                      {a.entity_type}: {a.entity_id}
                    </p>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rise rise-5 mt-8 gallery-card !p-6">
        <p style={{ fontSize: 13, color: "var(--color-slate)", lineHeight: 1.6 }}>
          Activity is recorded automatically when you upload, process, or
          delete documents, create or update notes, manage collections, ask
          AI questions, or generate summaries. Full document contents are
          never stored in activity logs.
        </p>
      </section>
    </div>
  );
}
