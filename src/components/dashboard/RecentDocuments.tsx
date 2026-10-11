"use client";

import Link from "next/link";
import type { ResearchDocument } from "@/types/document";
import { formatBytes, formatDate } from "@/lib/utils";
import { FileTypeBadge, StatusBadge } from "@/components/ui/Badge";

export function RecentDocuments({ documents }: { documents: ResearchDocument[] }) {
  return (
    <section aria-labelledby="recent-docs-heading" className="rounded-xl border border-[#E2E8F0] bg-white">
      <div className="flex items-center justify-between border-b border-[#F1F5F9] px-5 py-4">
        <h2 id="recent-docs-heading" className="text-[15px] font-semibold text-[#0F172A]">
          Recent Documents
        </h2>
        <Link href="/documents" className="text-[13px] font-medium text-[#4F46E5] hover:text-[#4338CA]">
          View all
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#F1F5F9] text-[12px] uppercase tracking-wide text-[#64748B]">
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
              <tr key={d.id} className="border-b border-[#F8FAFC] last:border-0 hover:bg-[#F8FAFC]/70">
                <td className="max-w-[260px] px-5 py-3.5">
                  <Link href={`/documents/${d.id}`} className="block truncate font-medium text-[#0F172A] hover:text-[#4F46E5]">
                    {d.title}
                  </Link>
                  <span className="block truncate text-xs text-[#64748B]">{formatBytes(d.file_size)}</span>
                </td>
                <td className="px-5 py-3.5 text-[#475569]">{d.file_type}</td>
                <td className="px-5 py-3.5 text-[#475569]">{d.page_count} pages</td>
                <td className="px-5 py-3.5 text-[#475569]">{formatDate(d.created_at)}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/documents/${d.id}`}
                    className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-[13px] font-medium text-[#334155] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
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
      <ul className="divide-y divide-[#F1F5F9] md:hidden">
        {documents.map((d) => (
          <li key={d.id} className="flex items-center gap-3 px-4 py-3.5">
            <FileTypeBadge type={d.file_type} />
            <div className="min-w-0 flex-1">
              <Link href={`/documents/${d.id}`} className="block truncate text-sm font-medium">
                {d.title}
              </Link>
              <p className="mt-0.5 text-xs text-[#64748B]">
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
