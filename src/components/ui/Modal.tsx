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
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F172A]/40 p-4 animate-fade-in sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl animate-slide-up"
      >
        <h2 className="text-[17px] font-semibold tracking-tight text-[#0F172A]">{title}</h2>
        {description && <p className="mt-1 text-sm leading-6 text-[#64748B]">{description}</p>}
        <div className={cx("mt-4")}>{children}</div>
      </div>
    </div>
  );
}
