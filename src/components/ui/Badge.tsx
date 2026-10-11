import { cx } from "@/lib/utils";
import type { DocumentFileType, DocumentStatus } from "@/types/document";

export function FileTypeBadge({ type }: { type: DocumentFileType }) {
  const isPdf = type === "PDF";
  return (
    <span
      className={cx(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tracking-wide",
        isPdf ? "bg-[#EEF2FF] text-[#4F46E5]" : "bg-[#F5F3FF] text-[#7C3AED]"
      )}
      aria-label={`${type} file`}
    >
      {type}
    </span>
  );
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const styles: Record<DocumentStatus, string> = {
    Ready: "bg-[#F0FDF4] text-[#15803D] ring-[#BBF7D0]",
    Processing: "bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]",
    Failed: "bg-[#FEF2F2] text-[#B91C1C] ring-[#FECACA]",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        styles[status]
      )}
    >
      <span
        aria-hidden
        className={cx(
          "h-1.5 w-1.5 rounded-full",
          status === "Ready" ? "bg-[#16A34A]" : status === "Processing" ? "bg-[#D97706]" : "bg-[#DC2626]"
        )}
      />
      {status}
    </span>
  );
}

export function ComingSoonBadge() {
  return (
    <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#64748B]">
      Soon
    </span>
  );
}
