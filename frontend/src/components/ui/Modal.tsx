"use client";

import { useEffect, type ReactNode } from "react";
import { cx } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  labelledBy?: string;
}

export function Modal({ open, onClose, title, description, children, labelledBy }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 animate-fade-in sm:items-center"
      role="presentation"
      style={{ background: "rgba(29,29,31,0.4)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        className="w-full max-w-md p-7 animate-slide-up"
        style={{ borderRadius: 28, background: "var(--color-pure-white)" }}
      >
        <h2 className="tracking-tight" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 24, fontWeight: 600, letterSpacing: "-0.009em", color: "var(--color-apple-ink)" }}>{title}</h2>
        {description && <p className="mt-1.5 text-[17px] leading-7" style={{ color: "var(--color-graphite)" }}>{description}</p>}
        <div className={cx("mt-5")}>{children}</div>
      </div>
    </div>
  );
}
