import { cx } from "@/lib/utils";
import type { DocumentFileType, DocumentStatus } from "@/types/document";

export function FileTypeBadge({ type }: { type: DocumentFileType }) {
  const isPdf = type === "PDF";
  return (
    <span
      className={cx(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-bold tracking-wide",
        isPdf ? "bg-[rgba(183,255,223,0.08)] text-[#B7FFDF]" : "bg-[rgba(140,200,255,0.08)] text-[#8CC8FF]"
      )}
      style={{ border: "1px solid var(--color-hairline)", borderRadius: 8 }}
      aria-label={`${type} file`}
    >
      {type}
    </span>
  );
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const styles: Record<DocumentStatus, string> = {
    Ready: "bg-[rgba(183,255,223,0.06)] text-[#B7FFDF] ring-[#2E4A3E]",
    Processing: "bg-[rgba(140,200,255,0.06)] text-[#8CC8FF] ring-[#2E3D4A]",
    Failed: "bg-[rgba(255,157,157,0.06)] text-[#ff9d9d] ring-[#4A2E2E]",
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
          status === "Ready" ? "bg-[#B7FFDF]" : status === "Processing" ? "bg-[#8CC8FF] pulse-dot" : "bg-[#ff9d9d]"
        )}
      />
      {status}
    </span>
  );
}

export function ComingSoonBadge() {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-medium text-[#62686A]"
      style={{ background: "var(--color-control)", border: "1px solid var(--color-hairline)" }}
    >
      Soon
    </span>
  );
}
