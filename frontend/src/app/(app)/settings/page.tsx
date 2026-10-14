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
    <div style={{ maxWidth: 720 }} className="mx-auto">
      <section className="pt-6 text-center sm:pt-10">
        <h1 className="type-heading-sm mx-auto" style={{ color: "var(--color-apple-ink)" }}>The boring but necessary page.</h1>
        <p className="mx-auto mt-3 max-w-md" style={{ fontSize: 19, color: "var(--color-graphite)" }}>Just the basics so your account feels like yours.</p>
      </section>

      <section aria-label="Settings" className="gallery-card mt-8 !p-5 sm:!p-6">
        <Row title={user?.name ?? "Researcher"} value={user?.email ?? "—"} />
        <div className="py-5" style={{ borderBottom: "1px solid var(--color-line)" }}>
          <p style={{ fontSize: 17, fontWeight: 500, color: "var(--color-apple-ink)" }}>Appearance</p>
          <p className="mt-0.5" style={{ fontSize: 15, color: "var(--color-graphite)" }}>Light, dark, or follow this device.</p>
          <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Appearance">
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
                    borderRadius: 18,
                    border: active ? "2px solid var(--color-electric-blue)" : "1px solid var(--color-line)",
                    background: active ? "color-mix(in srgb, var(--color-electric-blue) 10%, transparent)" : "transparent",
                  }}
                >
                  <span className="block" style={{ fontSize: 17, fontWeight: active ? 600 : 400, color: "var(--color-apple-ink)" }}>{m.label}</span>
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
      <p className="mt-5 text-center" style={{ fontSize: 13, color: "var(--color-slate)" }}>Server: {process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"}</p>
    </div>
  );
}
