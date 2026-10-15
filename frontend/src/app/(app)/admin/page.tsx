"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { CountUp } from "@/components/motion/CountUp";
import { PageLoading } from "@/components/ui/Loading";
import {
  deleteAdminUser,
  getAdminStats,
  getAdminUser,
  getAdminUsers,
  setAdminRole,
  type AdminStats,
  type AdminUser,
  type AdminUserDetail,
} from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils";
import { ApiError } from "@/lib/api";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-stat text-center">
      <p style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
        <CountUp end={value} />
      </p>
      <p className="mt-1" style={{ fontSize: 13, color: "var(--color-slate)" }}>{label}</p>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (q: string) => {
    try {
      const [s, u] = await Promise.all([getAdminStats(), getAdminUsers(q)]);
      setStats(s);
      setUsers(u);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the console.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    void load("");
  }, [isAdmin, load]);

  useEffect(() => {
    if (!isAdmin) return;
    const t = window.setTimeout(() => void load(search), 350);
    return () => window.clearTimeout(t);
  }, [search, isAdmin, load]);

  async function openDetail(id: string) {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      setDetail(await getAdminUser(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load that user.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshRow(id: string) {
    try {
      const [s, u] = await Promise.all([getAdminStats(), getAdminUsers(search)]);
      setStats(s);
      setUsers(u);
      setDetail(await getAdminUser(id));
    } catch {
      /* best effort */
    }
  }

  async function handleRole(id: string, role: "user" | "admin") {
    setBusy(true);
    setNotice(null);
    try {
      const updated = await setAdminRole(id, role);
      setNotice(`${updated.email} is now ${role === "admin" ? "an admin" : "a regular user"}.`);
      await refreshRow(id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Role change failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!window.confirm(`Delete ${email}? Their papers, notes, and files go too. No undo.`)) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await deleteAdminUser(id);
      setNotice(res.detail);
      setDetail(null);
      setSelectedId(null);
      await load(search);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin && !loading) {
    return (
      <div className="mx-auto" style={{ maxWidth: 620 }}>
        <section className="rise rise-1 pt-6 text-center sm:pt-10">
          <span className="eyebrow"><span className="dot" /> Restricted</span>
          <h1 className="mt-4" style={{ fontSize: "clamp(32px,5vw,44px)", fontWeight: 650, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
            Admins only past this point.
          </h1>
          <p className="hero-sub mx-auto mt-3 max-w-md">
            Your account is a regular one. If you run this instance, set
            ADMIN_EMAILS in the backend .env and sign in again.
          </p>
          <div className="gallery-card mt-8 !p-6">
            <p style={{ fontSize: 14.5, color: "var(--color-graphite)", lineHeight: 1.65 }}>
              Signed in as <strong style={{ color: "var(--color-apple-ink)" }}>{user?.email ?? "nobody"}</strong>
            </p>
            <Link href="/dashboard" className="primary-button mt-4">Back to workspace</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <section className="rise rise-1 relative pt-6 sm:pt-10">
        <div aria-hidden className="orb" style={{ width: 340, height: 340, top: -120, left: -120, background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 65%)" }} />
        <span className="eyebrow"><span className="dot" /> Admin console</span>
        <h1 className="mt-4" style={{ fontSize: "clamp(32px,5vw,46px)", fontWeight: 650, letterSpacing: "-0.03em", lineHeight: 1.05, color: "var(--color-apple-ink)" }}>
          Who&apos;s here, and what they&apos;re holding.
        </h1>
        <p className="hero-sub mt-3 max-w-xl">
          Every number below is live. Deleting an account removes their papers,
          notes, and files — it asks first, and there&apos;s no undo.
        </p>
      </section>

      {notice && (
        <p role="status" className="rise rise-2 mt-5 rounded-2xl px-5 py-3" style={{ fontSize: 14.5, background: "rgba(127,127,133,0.12)", border: "1px solid var(--liquid-border)", color: "var(--color-apple-ink)" }}>
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-5 rounded-2xl px-5 py-3" style={{ fontSize: 14.5, color: "var(--color-alert)", background: "rgba(255,155,138,0.08)", border: "1px solid rgba(255,155,138,0.25)" }}>
          {error}{" "}
          <button onClick={() => void load(search)} className="ml-1 underline underline-offset-4">Try again</button>
        </p>
      )}

      {loading ? (
        <div className="mt-8"><PageLoading label="Opening the console" /></div>
      ) : (
        <>
          <section aria-label="Site totals" className="rise rise-2 mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Accounts" value={stats?.total_users ?? 0} />
            <Stat label="Admins" value={stats?.admin_count ?? 0} />
            <Stat label="Papers" value={stats?.total_documents ?? 0} />
            <Stat label="Notes" value={stats?.total_notes ?? 0} />
            <div className="glass-stat text-center">
              <p style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--color-apple-ink)" }}>
                {formatBytes(stats?.total_storage_bytes ?? 0)}
              </p>
              <p className="mt-1" style={{ fontSize: 13, color: "var(--color-slate)" }}>Stored files</p>
            </div>
          </section>

          <section aria-label="Find an account" className="rise rise-3 mx-auto mt-6" style={{ maxWidth: 680 }}>
            <div className="liquid-search flex items-center gap-3 px-5 py-3" style={{ borderRadius: 999 }}>
              <span aria-hidden style={{ color: "var(--color-slate)", fontSize: 16 }}>✦</span>
              <label htmlFor="admin-search" className="sr-only">Search accounts</label>
              <input
                id="admin-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email…"
                autoComplete="off"
                className="w-full bg-transparent text-[16px] outline-none"
                style={{ color: "var(--color-apple-ink)" }}
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search" style={{ fontSize: 14, color: "var(--color-link-blue)" }}>Clear</button>
              )}
            </div>
            <p className="mt-2.5 text-center" style={{ fontSize: 12.5, color: "var(--color-slate)" }}>
              {users.length} {users.length === 1 ? "account" : "accounts"}
            </p>
          </section>

          <div className="rise rise-3 mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
            <section aria-label="Accounts" className="gallery-card !p-4 sm:!p-5">
              {users.length === 0 ? (
                <p className="py-8 text-center" style={{ fontSize: 16, color: "var(--color-graphite)" }}>
                  {search ? `Nobody matches “${search}”.` : "No accounts yet — surprising, since you're one."}
                </p>
              ) : (
                users.map((u) => {
                  const active = selectedId === u.id;
                  const isSelf = user?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => void openDetail(u.id)}
                      aria-pressed={active}
                      className="doc-row flex w-full items-center gap-3.5 px-3 py-3.5 text-left sm:px-4"
                      style={{
                        borderBottom: "1px solid var(--liquid-border-soft)",
                        background: active ? "rgba(127,127,133,0.1)" : undefined,
                        borderRadius: 16,
                      }}
                    >
                      <span
                        aria-hidden
                        className="flex h-10 w-10 shrink-0 items-center justify-center text-[15px] font-semibold"
                        style={{ borderRadius: 14, background: "rgba(127,127,133,0.14)", border: "1px solid var(--liquid-border)", color: "var(--color-apple-ink)" }}
                      >
                        {(u.name.trim().charAt(0).toUpperCase() || "?")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate" style={{ fontSize: 15.5, fontWeight: 600, color: "var(--color-apple-ink)" }}>
                          {u.name}{isSelf ? " (you)" : ""}
                        </span>
                        <span className="mono-meta block truncate" style={{ fontSize: 12, color: "var(--color-slate)" }}>
                          {u.email} · joined {formatDate(u.created_at)}
                        </span>
                        <span className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className={u.role === "admin" ? "tag-pill crimson" : "tag-pill"}>{u.role}</span>
                          <span className="tag-pill">{u.document_count} papers</span>
                          <span className="tag-pill">{u.note_count} notes</span>
                        </span>
                      </span>
                      <span aria-hidden style={{ color: "var(--color-slate)" }}>→</span>
                    </button>
                  );
                })
              )}
            </section>

            <aside aria-label="Account detail" className="gallery-card !p-6 lg:sticky lg:top-24 lg:self-start">
              {!selectedId ? (
                <div className="py-6 text-center">
                  <p style={{ fontSize: 18, fontWeight: 650, color: "var(--color-apple-ink)" }}>Pick an account.</p>
                  <p className="mt-1.5" style={{ fontSize: 14.5, color: "var(--color-graphite)", lineHeight: 1.6 }}>
                    Tap a row to see their papers, change their role, or remove them.
                  </p>
                </div>
              ) : detailLoading ? (
                <PageLoading label="Reading account" />
              ) : detail ? (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p style={{ fontSize: 19, fontWeight: 650, color: "var(--color-apple-ink)" }}>{detail.name}</p>
                      <p className="mono-meta mt-0.5 truncate" style={{ fontSize: 12, color: "var(--color-slate)" }}>{detail.email}</p>
                    </div>
                    <span className={detail.role === "admin" ? "tag-pill crimson" : "tag-pill"}>{detail.role}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      [String(detail.document_count), "papers"],
                      [String(detail.note_count), "notes"],
                      [formatBytes(detail.storage_bytes), "stored"],
                    ].map(([v, l]) => (
                      <div key={l} className="rounded-2xl px-2 py-2.5" style={{ background: "rgba(127,127,133,0.08)", border: "1px solid var(--liquid-border-soft)" }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-apple-ink)" }}>{v}</p>
                        <p style={{ fontSize: 11.5, color: "var(--color-slate)" }}>{l}</p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-5" style={{ fontSize: 11.5, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)" }}>Recent papers</p>
                  <div className="mt-1.5">
                    {detail.recent_documents.length === 0 ? (
                      <p style={{ fontSize: 14.5, color: "var(--color-graphite)" }}>Nothing uploaded yet.</p>
                    ) : (
                      detail.recent_documents.map((d) => (
                        <div key={d.id} className="py-2" style={{ borderBottom: "1px solid var(--liquid-border-soft)" }}>
                          <p className="truncate" style={{ fontSize: 14.5, fontWeight: 550, color: "var(--color-apple-ink)" }}>{d.title}</p>
                          <p className="mono-meta mt-0.5" style={{ fontSize: 11.5, color: "var(--color-slate)" }}>
                            {d.file_type} · {formatBytes(d.file_size)} · {d.extraction_status}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <p className="mt-5" style={{ fontSize: 11.5, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)" }}>Role</p>
                  <div className="theme-segment mt-2">
                    {(["user", "admin"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        disabled={busy || detail.role === r}
                        aria-pressed={detail.role === r}
                        onClick={() => void handleRole(detail.id, r)}
                        style={{ opacity: busy ? 0.6 : 1 }}
                      >
                        {r === "admin" ? "Admin" : "User"}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5" style={{ borderTop: "1px solid var(--liquid-border-soft)", paddingTop: 16 }}>
                    <button
                      type="button"
                      disabled={busy || user?.id === detail.id}
                      onClick={() => void handleDelete(detail.id, detail.email)}
                      title={user?.id === detail.id ? "You cannot delete yourself" : "Delete this account"}
                      style={{ fontSize: 14.5, fontWeight: 600, color: "var(--color-alert)", opacity: busy || user?.id === detail.id ? 0.5 : 1 }}
                    >
                      Delete this account…
                    </button>
                    <p className="mt-1" style={{ fontSize: 12.5, color: "var(--color-slate)" }}>
                      Papers, notes, and files go with it. No undo.
                    </p>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
