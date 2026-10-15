"use client";

import Link from "next/link";
import type { ResearchDocument } from "@/types/document";
import { formatBytes, formatDate } from "@/lib/utils";
import { FileTypeBadge, StatusBadge } from "@/components/ui/Badge";

export function RecentDocuments({ documents }: { documents: ResearchDocument[] }) {
  return (
    <section
      aria-labelledby="recent-docs-heading"
      className="gallery-card p-0"
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--liquid-border-soft)" }}>
        <h2 id="recent-docs-heading" className="text-[15px] font-semibold" style={{ color: "var(--color-apple-ink)" }}>
          Recent Documents
        </h2>
        <Link href="/documents" className="secondary-button" style={{ fontSize: 13 }}>
          View all →
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="tech-label" style={{ borderBottom: "1px solid var(--liquid-border-soft)", color: "var(--color-graphite)" }}>
              <th scope="col" className="px-5 py-3 font-medium">Document</th>
              <th scope="col" className="px-5 py-3 font-medium">Type</th>
              <th scope="col" className="px-5 py-3 font-medium">Pages</th>
              <th scope="col" className="px-5 py-3 font-medium">Uploaded</th>
              <th scope="col" className="px-5 py-3 font-medium">Status</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="doc-row" style={{ borderBottom: "1px solid var(--liquid-border-soft)" }}>
                <td className="max-w-[260px] px-5 py-3.5">
                  <Link href={`/documents/${d.id}`} className="doc-title block truncate font-medium" style={{ color: "var(--color-apple-ink)" }}>
                    {d.title}
                  </Link>
                  <span className="block truncate text-xs" style={{ color: "var(--color-graphite)" }}>{formatBytes(d.file_size)}</span>
                </td>
                <td className="px-5 py-3.5" style={{ color: "var(--color-graphite)" }}>{d.file_type}</td>
                <td className="px-5 py-3.5" style={{ color: "var(--color-graphite)" }}>{d.page_count} pages</td>
                <td className="px-5 py-3.5" style={{ color: "var(--color-graphite)" }}>{formatDate(d.created_at)}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={d.extraction_status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/documents/${d.id}`}
                    className="ghost-pill"
                    style={{ fontSize: 12, padding: "6px 14px" }}
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="md:hidden">
        {documents.map((d) => (
          <li key={d.id} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--liquid-border-soft)" }}>
            <FileTypeBadge type={d.file_type} />
            <div className="min-w-0 flex-1">
              <Link href={`/documents/${d.id}`} className="block truncate text-sm font-medium" style={{ color: "var(--color-apple-ink)" }}>
                {d.title}
              </Link>
              <p className="mt-0.5 text-xs" style={{ color: "var(--color-graphite)" }}>
                {d.page_count} pages · {formatDate(d.created_at)}
              </p>
            </div>
            <StatusBadge status={d.extraction_status} />
          </li>
        ))}
      </ul>
    </section>
  );
}
