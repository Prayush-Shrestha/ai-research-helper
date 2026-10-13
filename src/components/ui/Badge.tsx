import { cx } from "@/lib/utils";
import type { DocumentFileType, DocumentStatus } from "@/types/document";

export function FileTypeBadge({ type }: { type: DocumentFileType }) {
  return (
    <span className="tag-pill" aria-label={`${type} file`}>
      {type}
    </span>
  );
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const isFailed = status === "Failed";
  const isProcessing = status === "Processing";
  return (
    <span className={cx("tag-pill", isFailed && "crimson")} style={isProcessing ? { background: "rgba(0,113,227,0.12)", color: "var(--color-electric-blue)" } : undefined}>
      {isProcessing && (
        <span aria-hidden className="pulse-dot inline-block" style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor" }} />
      )}
      {status}
    </span>
  );
}

export function ComingSoonBadge() {
  return <span className="tag-pill">Soon</span>;
}
