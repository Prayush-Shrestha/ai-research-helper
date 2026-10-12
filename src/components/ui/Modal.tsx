"use client";

import { useEffect } from "react";
import { cx } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  labelledBy?: string;
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
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
      style={{ background: "rgba(5,5,5,0.7)", backdropFilter: "blur(8px)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md p-6 animate-slide-up"
        style={{ border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-panel)", background: "var(--color-deep-black)" }}
      >
        <h2 className="text-[17px] font-semibold tracking-tight" style={{ color: "var(--color-primary-text)" }}>{title}</h2>
        {description && <p className="mt-1 text-sm leading-6" style={{ color: "var(--color-secondary-text)" }}>{description}</p>}
        <div className={cx("mt-4")}>{children}</div>
      </div>
    </div>
  );
}
