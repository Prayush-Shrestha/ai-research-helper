"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { resetMockData } from "@/lib/mock";

function Row({
  section,
  label,
  value,
  action,
}: {
  section: string;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-6" style={{ borderBottom: "1px solid var(--color-hairline)" }}>
      <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>{section}</p>
      <div className="mt-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-medium" style={{ color: "var(--color-primary-text)" }}>{label}</p>
          <p className="mt-0.5 text-[13px]" style={{ color: "var(--color-secondary-text)" }}>{value}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);

  return (
    <main className="mx-auto px-5 sm:px-8" style={{ maxWidth: 760 }}>
      <section className="pt-12 sm:pt-16">
        <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>CONTROL / 06</p>
        <h1 className="font-display mt-2" style={{ fontSize: "clamp(44px,6vw,68px)", lineHeight: 0.95 }}>Settings</h1>
        <p className="mt-3 text-[15px]" style={{ color: "var(--color-secondary-text)" }}>Minimal controls. Nothing more.</p>
      </section>

      <section aria-label="Settings" className="mt-8" style={{ borderTop: "1px solid var(--color-hairline)" }}>
        <Row section="PROFILE" label={user?.name ?? "Researcher"} value={user?.email ?? "—"} action={
          <span className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>EDIT →</span>
        } />
        <div className="py-6" style={{ borderBottom: "1px solid var(--color-hairline)" }}>
          <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>ACCOUNT — DISPLAY NAME</p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSaved(true);
              window.setTimeout(() => setSaved(false), 1800);
            }}
          >
            <label htmlFor="display-name" className="sr-only">Display name</label>
            <input
              id="display-name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent py-2 text-[15px] outline-none"
              style={{ borderBottom: "1px solid #292B2D", color: "var(--color-primary-text)", borderRadius: 0 }}
            />
            <button type="submit" className="font-tech shrink-0 rounded-full px-5 py-2" style={{ background: "var(--color-control)", border: "1px solid var(--color-hairline)", color: "var(--color-primary-text)", fontSize: 10 }}>
              {saved ? "SAVED ✓" : "SAVE"}
            </button>
          </form>
        </div>
        <Row section="SECURITY" label="Session" value="Token stored locally — moving to httpOnly cookies." action={
          <button onClick={logout} className="font-tech rounded-full px-5 py-2" style={{ border: "1px solid var(--color-hairline)", background: "var(--color-control)", color: "var(--color-secondary-text)", fontSize: 10 }}>SIGN OUT</button>
        } />
        <Row section="PREFERENCES" label="Density" value="Comfortable — editorial spacing." />
        <Row section="DATA" label="Local development archive" value="Clear the isolated mock library on this device." action={
          <button
            onClick={() => { resetMockData(); window.location.reload(); }}
            className="font-tech rounded-full px-5 py-2"
            style={{ border: "1px solid var(--color-hairline)", color: "#ff9d9d", fontSize: 10 }}
          >
            RESET →
          </button>
        } />
      </section>
      <p className="font-tech mt-6" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>API / {process.env.NEXT_PUBLIC_API_URL ?? "HTTP://LOCALHOST:8000"}</p>
    </main>
  );
}
