"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeChoice } from "@/context/ThemeContext";

/**
 * BIG visible theme toggle — Moon-nav edition.
 * 52px pill, icon + label, high-contrast border. Impossible to miss.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean; tone?: string }) {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode — big toggle" : "Dark mode — big toggle"}
      className="theme-big"
      style={compact ? { height: 44, padding: "0 16px", fontSize: 14 } : undefined}
    >
      <span key={resolved} className="theme-icon-spin">
        {isDark ? <Sun size={compact ? 18 : 21} aria-hidden strokeWidth={2.2} /> : <Moon size={compact ? 18 : 21} aria-hidden strokeWidth={2.2} />}
      </span>
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}

/** BIG segmented Light / Dark / Auto — for drawers and settings. */
export function ThemeRow({ onNavigate }: { onNavigate?: () => void; dark?: boolean }) {
  const { theme, setTheme } = useTheme();
  const options: Array<{ value: ThemeChoice; label: string; icon: React.ReactNode }> = [
    { value: "light", label: "Light", icon: <Sun size={18} aria-hidden strokeWidth={2.2} /> },
    { value: "dark", label: "Dark", icon: <Moon size={18} aria-hidden strokeWidth={2.2} /> },
    { value: "system", label: "Auto", icon: <span aria-hidden style={{ fontSize: 16, fontWeight: 700 }}>A</span> },
  ];
  return (
    <div
      className="mt-5 flex flex-col gap-3 rounded-[24px] p-4"
      style={{ border: "1.5px solid var(--liquid-border)", background: "rgba(127,127,133,0.08)", backdropFilter: "blur(16px)" }}
      role="group"
      aria-label="Appearance — pick Light, Dark, or Auto"
    >
      <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-slate)" }}>
        Appearance
      </span>
      <div className="theme-segment" style={{ alignSelf: "flex-start" }}>
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
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 13.5, color: "var(--color-slate)" }}>
        Auto follows your device. Light is paper, Dark is midnight.
      </p>
    </div>
  );
}
