import { cx } from "@/lib/utils";
import { statusLabel, type DocumentFileType, type DocumentStatus } from "@/types/document";

export function FileTypeBadge({ type }: { type: DocumentFileType }) {
  return (
    <span className="tag-pill" aria-label={`${type} file`}>
      {type}
    </span>
  );
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const isFailed = status === "failed";
  const isProcessing = status === "processing" || status === "pending";
  const isOcr = status === "requires_ocr";
  return (
    <span className={cx("tag-pill", isFailed && "crimson")} style={isProcessing || isOcr ? { background: "rgba(157,231,193,0.1)", color: "var(--color-electric-blue)" } : undefined}>
      {isProcessing && (
        <span aria-hidden className="pulse-dot inline-block" style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor" }} />
      )}
      {statusLabel(status)}
    </span>
  );
}

export function ComingSoonBadge() {
  return <span className="tag-pill">Soon</span>;
}
