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
    <li
      className="lift p-4"
      style={{ borderRadius: "var(--radius-panel)", border: "1px solid var(--color-hairline)", background: "var(--color-deep-black)" }}
    >
      <div className="flex items-start gap-3">
        <FileTypeBadge type={d.file_type} />
        <div className="min-w-0 flex-1">
          <Link href={`/documents/${d.id}`} className="block truncate text-sm font-medium" style={{ color: "var(--color-primary-text)" }}>
            {d.title}
          </Link>
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-tertiary-text)" }}>
            {formatBytes(d.file_size)} · {formatDate(d.created_at)}
          </p>
          <div className="mt-2">
            <StatusBadge status={d.status} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 pt-3" style={{ borderTop: "1px solid var(--color-hairline)" }}>
        <Link
          href={`/documents/${d.id}`}
          className="flex-1 rounded-full px-3 py-2 text-center text-[13px] font-medium"
          style={{ border: "1px solid var(--color-hairline)", background: "var(--color-control)", color: "var(--color-primary-text)" }}
        >
          Open
        </Link>
        <button
          type="button"
          onClick={() => onRename(d)}
          className="flex-1 rounded-full px-3 py-2 text-[13px] font-medium"
          style={{ border: "1px solid var(--color-hairline)", background: "transparent", color: "var(--color-secondary-text)" }}
        >
          Rename
        </button>
        <button
          type="button"
          onClick={() => onDelete(d)}
          className="flex-1 rounded-full px-3 py-2 text-[13px] font-medium"
          style={{ border: "1px solid #4A2E2E", background: "transparent", color: "#ff9d9d" }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
