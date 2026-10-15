"use client";

import Link from "next/link";
import type { ResearchDocument } from "@/types/document";
import { formatBytes, formatDate } from "@/lib/utils";
import { FileTypeBadge, StatusBadge } from "@/components/ui/Badge";

interface DocumentCardProps {
  document: ResearchDocument;
  onRename: (doc: ResearchDocument) => void;
  onDelete: (doc: ResearchDocument) => void;
}

/** Mobile-first card used by DocumentTable on small screens. */
export function DocumentCard({ document: d, onRename, onDelete }: DocumentCardProps) {
  return (
    <li className="gallery-card hover-lift p-4">
      <div className="flex items-start gap-3">
        <FileTypeBadge type={d.file_type} />
        <div className="min-w-0 flex-1">
          <Link href={`/documents/${d.id}`} className="block truncate text-sm font-medium" style={{ color: "var(--color-apple-ink)" }}>
            {d.title}
          </Link>
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-graphite)" }}>
            {formatBytes(d.file_size)} · {formatDate(d.created_at)}
          </p>
          <div className="mt-2">
            <StatusBadge status={d.extraction_status} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 pt-3" style={{ borderTop: "1px solid var(--liquid-border-soft)" }}>
        <Link
          href={`/documents/${d.id}`}
          className="ghost-pill flex-1 px-3 py-2 text-center text-[13px]"
        >
          Open
        </Link>
        <button
          type="button"
          onClick={() => onRename(d)}
          className="ghost-pill flex-1 px-3 py-2 text-[13px]"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={() => onDelete(d)}
          className="ghost-pill flex-1 px-3 py-2 text-[13px]"
          style={{ borderColor: "rgba(255,155,138,0.4)", background: "rgba(255,155,138,0.1)", color: "var(--color-alert)" }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
