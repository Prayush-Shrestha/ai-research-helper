import Link from "next/link";
import { statusLabel, type ResearchDocument } from "@/types/document";
import { formatBytes } from "@/lib/utils";

function friendlyDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function FileGlyph({ type }: { type: string }) {
  const isPdf = type === "PDF";
  return (
    <span
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center"
      style={{
        borderRadius: 14,
        fontSize: 11,
        fontWeight: 750,
        letterSpacing: "0.04em",
        color: isPdf ? "#FFB4A2" : "#9DE7C1",
        background: isPdf ? "rgba(255,155,138,0.1)" : "rgba(157,231,193,0.1)",
        border: `1px solid ${isPdf ? "rgba(255,155,138,0.25)" : "rgba(157,231,193,0.25)"}`,
      }}
    >
      {isPdf ? "PDF" : "DOC"}
    </span>
  );
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
      className="doc-row group flex items-center gap-3.5 px-3 py-3.5 sm:px-4"
      style={{ borderBottom: "1px solid var(--liquid-border-soft)" }}
    >
      <FileGlyph type={doc.file_type} />
      <span className="min-w-0 flex-1">
        <span className="doc-title block truncate" style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--color-apple-ink)" }}>
          {doc.title}
        </span>
        <span className="mono-meta mt-0.5 block truncate" style={{ fontSize: 12, color: "var(--color-slate)" }}>
          {doc.original_filename} · {formatBytes(doc.file_size)} · {friendlyDate(doc.updated_at)}
          {doc.page_count ? ` · ${doc.page_count}p` : ""}
        </span>
        <span className="mt-1.5 flex gap-1.5 sm:hidden">
          <span className="tag-pill">{doc.file_type}</span>
          <span className="tag-pill" style={failed || processing || needsOcr ? { background: "rgba(157,231,193,0.12)", color: "var(--color-electric-blue)", borderColor: "rgba(157,231,193,0.3)" } : undefined}>{label}</span>
        </span>
      </span>
      <span className="hidden shrink-0 items-center gap-1.5 sm:flex" style={{ fontSize: 12.5, fontWeight: 550, color: failed || processing || needsOcr ? "var(--color-electric-blue)" : "var(--color-slate)" }}>
        {processing && <span className="pulse-dot inline-block" style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor", boxShadow: "0 0 8px currentColor" }} />}
        {label}
      </span>
      <span aria-hidden className="doc-arrow flex h-8 w-8 shrink-0 items-center justify-center text-[15px]" style={{ borderRadius: 99, border: "1px solid var(--liquid-border)", background: "rgba(255,255,255,0.04)" }}>
        →
      </span>
    </Link>
  );
}

export function DocumentMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--liquid-border-soft)" }}>
      <p style={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-slate)" }}>{label}</p>
      <p className="mt-1" style={{ fontSize: 14.5, fontWeight: 550, color: "var(--color-apple-ink)" }}>{value}</p>
    </div>
  );
}
