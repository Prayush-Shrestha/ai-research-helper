"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  getAdminAuditLogs,
  type AuditLogEntry,
} from "@/lib/api";
import { PageLoading } from "@/components/ui/Loading";
import { formatDate } from "@/lib/utils";

export default function AdminActivityPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [page, setPage] = useState(1);

  const loadLogs = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getAdminAuditLogs(
        adminFilter || undefined,
        targetFilter || undefined,
        actionFilter || undefined,
        page,
        50
      );
      setLogs(data.items);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, actionFilter, adminFilter, targetFilter, page]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  if (!isAdmin && !loading) {
    return (
      <div className="mx-auto" style={{ maxWidth: 620, paddingTop: 40 }}>
        <section className="rise rise-1 pt-6 text-center sm:pt-10">
          <span className="eyebrow"><span className="dot" />Restricted</span>
          <h1 className="mt-4" style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
            Admin only
          </h1>
          <p className="hero-sub mx-auto mt-3 max-w-md">
            Your account is a regular one. Only administrators can view audit logs.
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
        <PageLoading label="Loading audit logs" />
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
        <span className="eyebrow"><span className="dot" />Audit log</span>
        <h1 className="mt-4" style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
          Security audit log
        </h1>
        <p className="hero-sub mt-3 max-w-xl">
          Every administrator action is recorded: role changes, account
          disabling/reactivation, and other administrative operations.
          Logs are append-only and restricted to administrators.
        </p>
      </section>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl px-5 py-3" style={{ fontSize: 14.5, color: "var(--color-alert)", background: "rgba(255,155,138,0.08)", border: "1px solid rgba(255,155,138,0.25)" }}>
          {error}
        </p>
      )}

      <section className="rise rise-2 mt-8 flex flex-wrap gap-3" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="liquid-search flex items-center gap-3 px-5 py-3" style={{ borderRadius: 999, minWidth: 260 }}>
          <span aria-hidden style={{ color: "var(--color-slate)", fontSize: 16 }}>✦</span>
          <label htmlFor="audit-action" className="sr-only">Filter by action</label>
          <input
            id="audit-action"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            placeholder="Filter by action (role_changed, account_disabled, …)"
            autoComplete="off"
            className="w-full bg-transparent text-[14px] outline-none"
            style={{ color: "var(--color-apple-ink)" }}
          />
        </div>
        <div className="liquid-search flex items-center gap-3 px-5 py-3" style={{ borderRadius: 999, minWidth: 220 }}>
          <span aria-hidden style={{ color: "var(--color-slate)", fontSize: 16 }}>✦</span>
          <label htmlFor="audit-admin" className="sr-only">Filter by admin</label>
          <input
            id="audit-admin"
            value={adminFilter}
            onChange={(e) => { setAdminFilter(e.target.value); setPage(1); }}
            placeholder="Admin email…"
            autoComplete="off"
            className="w-full bg-transparent text-[14px] outline-none"
            style={{ color: "var(--color-apple-ink)" }}
          />
        </div>
        <div className="liquid-search flex items-center gap-3 px-5 py-3" style={{ borderRadius: 999, minWidth: 220 }}>
          <span aria-hidden style={{ color: "var(--color-slate)", fontSize: 16 }}>✦</span>
          <label htmlFor="audit-target" className="sr-only">Filter by target</label>
          <input
            id="audit-target"
            value={targetFilter}
            onChange={(e) => { setTargetFilter(e.target.value); setPage(1); }}
            placeholder="Target user email…"
            autoComplete="off"
            className="w-full bg-transparent text-[14px] outline-none"
            style={{ color: "var(--color-apple-ink)" }}
          />
        </div>
        <div className="ml-auto">
          <p style={{ fontSize: 14.5, color: "var(--color-slate)" }}>
            {total} {total === 1 ? "log entry" : "log entries"}
          </p>
        </div>
      </section>

      <section className="rise rise-3 mt-8 gallery-card !p-6">
        {logs.length === 0 ? (
          <div className="py-10 text-center">
            <p style={{ fontSize: 17, color: "var(--color-graphite)" }}>
              No audit log entries yet.
            </p>
            <p className="mt-2" style={{ fontSize: 14.5, color: "var(--color-slate)" }}>
              Administrative actions will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--liquid-border-soft)" }}>
            <table className="text-left min-w-full">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate" style={{ borderBottom: "1px solid var(--liquid-border-soft)" }}>
                  <th className="pb-3 px-4 font-semibold">When</th>
                  <th className="pb-3 px-4 font-semibold">Action</th>
                  <th className="pb-3 px-4 font-semibold">Administrator</th>
                  <th className="pb-3 px-4 font-semibold">Target</th>
                  <th className="pb-3 px-4 font-semibold">Description</th>
                  <th className="pb-3 px-4 font-semibold">IP address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b" style={{ borderColor: "var(--liquid-border-soft)" }}>
                    <td className="px-4 py-3 mono-meta text-sm">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`tag-pill ${log.action.includes("disabled") || log.action.includes("deleted") ? "crimson" : ""}`} style={{ fontSize: 11 }}>
                        {log.action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm truncate max-w-[180px]">{log.admin_email}</td>
                    <td className="px-4 py-3 text-sm truncate max-w-[180px]">{log.target_user_email || "—"}</td>
                    <td className="px-4 py-3 text-sm truncate max-w-[260px]" style={{ color: "var(--color-iron)" }}>{log.description || "—"}</td>
                    <td className="px-4 py-3 mono-meta text-sm">{log.ip_address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {total > 50 && (
        <div className="mt-6 flex justify-center" style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ fontSize: 13, color: "var(--color-slate)" }}>
            Showing page {page} — {total} total entries. Use filters to narrow results.
          </p>
        </div>
      )}
    </div>
  );
}
