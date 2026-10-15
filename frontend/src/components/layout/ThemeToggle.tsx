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
  void tone;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={resolved === "dark" ? "Light mode" : "Dark mode"}
      className="liquid-link flex h-9 w-9 items-center justify-center"
      style={{ color: "var(--color-apple-ink)" }}
    >
      {resolved === "dark" ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
    </button>
  );
}

/** Labelled Light / Dark / System row for menus and drawers — glass segmented, mint active. */
export function ThemeRow({ onNavigate, dark = false }: { onNavigate?: () => void; dark?: boolean }) {
  const { theme, setTheme } = useTheme();
  const options: Array<{ value: ThemeChoice; label: string }> = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "Auto" },
  ];
  void dark;
  return (
    <div
      className="liquid-search mt-4 flex items-center justify-between px-4 py-2"
      style={{ borderRadius: 999 }}
      role="group"
      aria-label="Appearance"
    >
      <span className="tech-label" style={{ color: "var(--color-slate)" }}>Appearance</span>
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
              className={active ? "tag-pill crimson" : "tag-pill"}
              style={{ cursor: "pointer", border: active ? undefined : "1px solid transparent", background: active ? undefined : "transparent" }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
