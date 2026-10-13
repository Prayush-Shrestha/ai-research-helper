"use client";

import Link from "next/link";
import type { ResearchDocument } from "@/types/document";
import { formatBytes, formatDate } from "@/lib/utils";
import { FileTypeBadge, StatusBadge } from "@/components/ui/Badge";

export function RecentDocuments({ documents }: { documents: ResearchDocument[] }) {
  return (
    <section
      aria-labelledby="recent-docs-heading"
      style={{ borderRadius: "var(--radius-panel)", border: "1px solid var(--color-hairline)", background: "var(--color-deep-black)" }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-hairline)" }}>
        <h2 id="recent-docs-heading" className="text-[15px] font-semibold" style={{ color: "var(--color-frost)" }}>
          Recent Documents
        </h2>
        <Link href="/documents" className="font-tech" style={{ color: "var(--color-frost)", fontSize: 10 }}>
          VIEW ALL →
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="font-tech" style={{ borderBottom: "1px solid var(--color-hairline)", color: "var(--color-graphite)", fontSize: 9 }}>
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
              <tr key={d.id} className="doc-row" style={{ borderBottom: "1px solid var(--color-hairline)" }}>
                <td className="max-w-[260px] px-5 py-3.5">
                  <Link href={`/documents/${d.id}`} className="block truncate font-medium" style={{ color: "var(--color-frost)" }}>
                    {d.title}
                  </Link>
                  <span className="block truncate text-xs" style={{ color: "var(--color-graphite)" }}>{formatBytes(d.file_size)}</span>
                </td>
                <td className="px-5 py-3.5" style={{ color: "var(--color-ash)" }}>{d.file_type}</td>
                <td className="px-5 py-3.5" style={{ color: "var(--color-ash)" }}>{d.page_count} pages</td>
                <td className="px-5 py-3.5" style={{ color: "var(--color-ash)" }}>{formatDate(d.created_at)}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/documents/${d.id}`}
                    className="font-tech rounded-full px-3 py-1.5"
                    style={{ border: "1px solid var(--color-hairline)", background: "var(--color-control)", color: "var(--color-ash)", fontSize: 10 }}
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
          <li key={d.id} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--color-hairline)" }}>
            <FileTypeBadge type={d.file_type} />
            <div className="min-w-0 flex-1">
              <Link href={`/documents/${d.id}`} className="block truncate text-sm font-medium" style={{ color: "var(--color-frost)" }}>
                {d.title}
              </Link>
              <p className="mt-0.5 text-xs" style={{ color: "var(--color-graphite)" }}>
                {d.page_count} pages · {formatDate(d.created_at)}
              </p>
            </div>
            <StatusBadge status={d.status} />
          </li>
        ))}
      </ul>
    </section>
  );
}
