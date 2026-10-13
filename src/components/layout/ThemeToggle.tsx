"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeChoice } from "@/context/ThemeContext";

/**
 * Sun/moon flip. On the dark nav band it renders in fog-white;
 * on light surfaces it renders in ink. The resolved theme decides the icon.
 */
export function ThemeToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { resolved, toggle } = useTheme();
  const onDarkBar = tone === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={resolved === "dark" ? "Light mode" : "Dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-full"
      style={{ color: onDarkBar ? "#f5f5f7" : "var(--color-apple-ink)" }}
    >
      {resolved === "dark" ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
    </button>
  );
}

/** Labelled Light / Dark / System row for menus and drawers. */
export function ThemeRow({ onNavigate, dark = false }: { onNavigate?: () => void; dark?: boolean }) {
  const { theme, setTheme } = useTheme();
  const options: Array<{ value: ThemeChoice; label: string }> = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "Auto" },
  ];
  const text = dark ? "#f5f5f7" : "var(--color-apple-ink)";
  const muted = dark ? "rgba(245,245,247,0.6)" : "var(--color-slate)";
  return (
    <div
      className="mt-4 flex items-center justify-between rounded-full px-4 py-2"
      style={dark ? { background: "rgba(245,245,247,0.1)" } : { background: "var(--color-fog-canvas)" }}
      role="group"
      aria-label="Appearance"
    >
      <span style={{ fontSize: 15, color: muted }}>Appearance</span>
      <div className="flex gap-1">
        {options.map((o) => {
          const active = theme === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                setTheme(o.value);
                onNavigate?.();
              }}
              aria-pressed={active}
              className="rounded-full px-3 py-1"
              style={{
                fontSize: 15,
                fontWeight: active ? 600 : 400,
                background: active ? (dark ? "#f5f5f7" : "var(--color-apple-ink)") : "transparent",
                color: active ? (dark ? "#1d1d1f" : "var(--color-fog-canvas)") : text,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
