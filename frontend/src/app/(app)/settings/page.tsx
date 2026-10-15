"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeChoice } from "@/context/ThemeContext";
import { updateProfile } from "@/lib/api";

function Row({
  title,
  value,
  action,
}: {
  title: string;
  value: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-5" style={{ borderBottom: "1px solid var(--color-line)" }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p style={{ fontSize: 17, fontWeight: 500, color: "var(--color-apple-ink)" }}>{title}</p>
          <p className="mt-0.5" style={{ fontSize: 15, color: "var(--color-graphite)" }}>{value}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout, refresh } = useAuth();
  const { theme, resolved, setTheme } = useTheme();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savedTimer = useRef<number | null>(null);

  // Sync when the async auth user resolves (initial mount has user === null).
  useEffect(() => {
    if (!user?.name) return;
    const next = user.name;
    void (async () => {
      await Promise.resolve();
      setName(next);
    })();
  }, [user?.name]);

  useEffect(() => {
    return () => {
      if (savedTimer.current !== null) window.clearTimeout(savedTimer.current);
    };
  }, []);

  const modes: Array<{ value: ThemeChoice; label: string; hint: string }> = [
    { value: "light", label: "Light", hint: "Paper" },
    { value: "dark", label: "Dark", hint: "Research lab" },
    { value: "system", label: "Auto", hint: `Follows device (${resolved})` },
  ];

  return (
    <div style={{ maxWidth: 720 }} className="page-shell mx-auto">
      <section className="relative pt-6 text-center sm:pt-10">
        <span className="orb" aria-hidden style={{ width: 400, height: 400, top: -140, left: "4%", background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent 65%)" }} />
        <span className="orb" aria-hidden style={{ width: 420, height: 420, top: -150, right: "4%", background: "radial-gradient(circle, rgba(255,255,255,0.13), transparent 65%)" }} />
        <div className="relative rise rise-1">
          <span className="eyebrow"><span className="dot" />Settings</span>
          <h1 className="type-heading-sm mx-auto mt-4" style={{ color: "var(--color-apple-ink)", fontWeight: 600, letterSpacing: "-0.03em" }}>The boring but necessary page.</h1>
          <p className="hero-sub mx-auto mt-3 max-w-md">Just the basics so your account feels like yours.</p>
        </div>
      </section>

      <section aria-label="Settings" className="gallery-card mt-8 rise rise-2 !p-5 sm:!p-6">
        <Row title={user?.name ?? "Researcher"} value={user?.email ?? "—"} />
        <div className="py-5" style={{ borderBottom: "1px solid var(--color-line)" }}>
          <p style={{ fontSize: 17, fontWeight: 500, color: "var(--color-apple-ink)" }}>Appearance</p>
          <p className="mt-0.5" style={{ fontSize: 15, color: "var(--color-graphite)" }}>Light, dark, or follow this device.</p>
          <div className="liquid-search mt-3 grid grid-cols-3 gap-2 !p-2" role="group" aria-label="Appearance">
            {modes.map((m) => {
              const active = theme === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setTheme(m.value)}
                  aria-pressed={active}
                  className="px-3 py-2.5 text-center"
                  style={{
                    borderRadius: 16,
                    border: active ? "1px solid rgba(255,255,255,0.55)" : "1px solid transparent",
                    background: active ? "rgba(255,255,255,0.14)" : "transparent",
                    boxShadow: active ? "0 4px 20px rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.12)" : undefined,
                  }}
                >
                  <span className="block" style={{ fontSize: 17, fontWeight: active ? 600 : 400, color: active ? "var(--color-electric-blue)" : "var(--color-apple-ink)" }}>{m.label}</span>
                  <span className="block" style={{ fontSize: 13, color: "var(--color-slate)" }}>{m.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="py-5" style={{ borderBottom: "1px solid var(--color-line)" }}>
          <p style={{ fontSize: 17, fontWeight: 500, color: "var(--color-apple-ink)" }}>Display name</p>
          <form
            className="mt-2.5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim() || saving) return;
              setSaving(true);
              setSaveError(null);
              void (async () => {
                try {
                  await updateProfile(name.trim());
                  await refresh();
                  setSaved(true);
                  if (savedTimer.current !== null) window.clearTimeout(savedTimer.current);
                  savedTimer.current = window.setTimeout(() => setSaved(false), 1800);
                } catch (err) {
                  setSaveError(err instanceof Error ? err.message : "Could not save your name.");
                } finally {
                  setSaving(false);
                }
              })();
            }}
          >
            <label htmlFor="display-name" className="sr-only">Display name</label>
            <input
              id="display-name" value={name} onChange={(e) => setName(e.target.value)}
              className="field-input"
              placeholder="Your name"
            />
            <button type="submit" disabled={saving} className="ghost-pill shrink-0" style={{ fontSize: 15 }}>
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
            </button>
          </form>
          {saveError && (
            <p role="alert" className="mt-2" style={{ fontSize: 15, color: "var(--color-alert)" }}>
              {saveError}
            </p>
          )}
        </div>
        <Row title="Sign out" value="Ends this session on this device." action={
          <button onClick={logout} className="ghost-pill shrink-0" style={{ fontSize: 15 }}>Sign out</button>
        } />
      </section>
      <p className="footnote mt-5 text-center rise rise-3">Server: {process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"}</p>
    </div>
  );
}
