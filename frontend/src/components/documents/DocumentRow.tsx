import Link from "next/link";
import { statusLabel, type ResearchDocument } from "@/types/document";
import { formatBytes } from "@/lib/utils";

function friendlyDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DocumentRow({ doc }: { doc: ResearchDocument; index?: number }) {
  const status = doc.extraction_status;
  const processing = status === "processing" || status === "pending";
  const failed = status === "failed";
  const needsOcr = status === "requires_ocr";
  const label = statusLabel(status);
  return (
    <Link
      href={`/documents/${doc.id}`}
      className="doc-row group grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-5"
      style={{ borderBottom: "1px solid var(--color-line)" }}
    >
      <span className="min-w-0">
        <span className="doc-title block truncate tracking-tight" style={{ fontSize: 17, fontWeight: 500, color: "var(--color-apple-ink)" }}>
          {doc.title}
        </span>
        <span className="mono-meta mt-0.5 block truncate" style={{ fontSize: 12, color: "var(--color-slate)" }}>
          {doc.original_filename} · {formatBytes(doc.file_size)} · {friendlyDate(doc.updated_at)}
        </span>
        <span className="mt-1.5 flex gap-1.5 sm:hidden">
          <span className="tag-pill">{doc.file_type}</span>
          <span className="tag-pill" style={failed || processing || needsOcr ? { background: "rgba(157,231,193,0.1)", color: "var(--color-electric-blue)" } : undefined}>{label}</span>
        </span>
      </span>
      <span className="tag-pill hidden sm:inline-flex">{doc.file_type}</span>
      <span className="hidden sm:block" style={{ fontSize: 15, color: "var(--color-graphite)" }}>
        {doc.page_count ?? "—"} pages
      </span>
      <span className="hidden items-center gap-1.5 sm:flex" style={{ fontSize: 12, color: failed || processing || needsOcr ? "var(--color-electric-blue)" : "var(--color-slate)" }}>
        {processing && <span className="pulse-dot inline-block" style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor" }} />}
        {label}
      </span>
      <span aria-hidden className="doc-arrow hidden justify-self-end text-[17px] sm:block">
        →
      </span>
    </Link>
  );
}

export function DocumentMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-slate)" }}>{label}</p>
      <p className="mt-0.5" style={{ fontSize: 15, color: "var(--color-apple-ink)" }}>{value}</p>
    </div>
  );
}
