import Link from "next/link";
import type { ResearchDocument } from "@/types/document";

function techDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

export function DocumentRow({
  doc,
  index,
}: {
  doc: ResearchDocument;
  index: number;
}) {
  const num = String(index + 1).padStart(2, "0");
  const ready = doc.status === "Ready";
  return (
    <Link
      href={`/documents/${doc.id}`}
      className="doc-row group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 px-2 py-5 sm:grid-cols-[56px_1fr_90px_80px_130px_90px_32px] sm:gap-6 sm:px-4"
      style={{ borderBottom: "1px solid var(--color-hairline)" }}
    >
      <span
        aria-hidden
        className="doc-accent-line absolute left-0 top-0 h-full w-px"
        style={{ background: "var(--color-research-accent)" }}
      />
      <span className="font-tech hidden sm:block" style={{ color: "var(--color-tertiary-text)" }}>
        {num}
      </span>
      <span className="min-w-0">
        <span className="font-tech sm:hidden" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
          {num} — {doc.file_type} / {doc.page_count} PAGES
        </span>
        <span
          className="block truncate text-[16px] font-medium tracking-tight"
          style={{ color: "var(--color-primary-text)" }}
        >
          {doc.title}
        </span>
        <span className="font-tech mt-1 block sm:hidden" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
          {techDate(doc.updated_at)} — {doc.status.toUpperCase()}
        </span>
      </span>
      <span className="font-tech hidden sm:block" style={{ color: "var(--color-secondary-text)" }}>
        {doc.file_type}
      </span>
      <span className="font-tech hidden sm:block" style={{ color: "var(--color-secondary-text)" }}>
        {doc.page_count} PAGES
      </span>
      <span className="font-tech hidden sm:block" style={{ color: "var(--color-tertiary-text)" }}>
        {techDate(doc.updated_at)}
      </span>
      <span
        className="font-tech hidden items-center gap-2 sm:flex"
        style={{ color: ready ? "var(--color-research-accent)" : "var(--color-ai-accent)", fontSize: 10 }}
      >
        {ready ? null : (
          <span className="pulse-dot inline-block" style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor" }} />
        )}
        {doc.status.toUpperCase()}
      </span>
      <span
        aria-hidden
        className="doc-arrow justify-self-end text-[18px]"
        style={{ color: "var(--color-tertiary-text)" }}
      >
        →
      </span>
      <span className="font-tech pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 group-hover:block" style={{ color: "var(--color-tertiary-text)", fontSize: 9 }}>
      </span>
    </Link>
  );
}

export function DocumentMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>
        {label}
      </p>
      <p className="font-tech mt-1" style={{ color: "var(--color-primary-text)" }}>
        {value}
      </p>
    </div>
  );
}
