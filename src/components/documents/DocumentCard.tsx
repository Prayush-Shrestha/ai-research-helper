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
    <li className="rounded-xl border border-[#E2E8F0] bg-white p-4">
      <div className="flex items-start gap-3">
        <FileTypeBadge type={d.file_type} />
        <div className="min-w-0 flex-1">
          <Link href={`/documents/${d.id}`} className="block truncate text-sm font-medium hover:text-[#4F46E5]">
            {d.title}
          </Link>
          <p className="mt-0.5 text-xs text-[#64748B]">
            {formatBytes(d.file_size)} · {formatDate(d.created_at)}
          </p>
          <div className="mt-2">
            <StatusBadge status={d.status} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 border-t border-[#F1F5F9] pt-3">
        <Link
          href={`/documents/${d.id}`}
          className="flex-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-center text-[13px] font-medium hover:bg-[#F8FAFC]"
        >
          Open
        </Link>
        <button
          type="button"
          onClick={() => onRename(d)}
          className="flex-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={() => onDelete(d)}
          className="flex-1 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[13px] font-medium text-[#DC2626] hover:bg-[#FEE2E2]"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
