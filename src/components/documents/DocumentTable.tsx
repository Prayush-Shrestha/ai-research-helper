"use client";

import { useState } from "react";
import Link from "next/link";
import type { ResearchDocument } from "@/types/document";
import { formatBytes, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { DocumentCard } from "./DocumentCard";

interface DocumentTableProps {
  documents: ResearchDocument[];
  onRename: (doc: ResearchDocument) => void;
  onDelete: (doc: ResearchDocument) => void;
}

export function DocumentTable({ documents, onRename, onDelete }: DocumentTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#F1F5F9] text-[12px] uppercase tracking-wide text-[#64748B]">
              <th scope="col" className="px-5 py-3 font-medium">Name</th>
              <th scope="col" className="px-5 py-3 font-medium">Type</th>
              <th scope="col" className="px-5 py-3 font-medium">Size</th>
              <th scope="col" className="px-5 py-3 font-medium">Uploaded</th>
              <th scope="col" className="px-5 py-3 font-medium">Status</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-b border-[#F8FAFC] last:border-0 hover:bg-[#F8FAFC]/70">
                <td className="max-w-[280px] px-5 py-3.5">
                  <Link href={`/documents/${d.id}`} className="block truncate font-medium hover:text-[#4F46E5]">
                    {d.title}
                  </Link>
                  <span className="block truncate text-xs text-[#64748B]">{d.original_filename}</span>
                </td>
                <td className="px-5 py-3.5 text-[#475569]">{d.file_type}</td>
                <td className="px-5 py-3.5 text-[#475569]">{formatBytes(d.file_size)}</td>
                <td className="px-5 py-3.5 text-[#475569]">{formatDate(d.created_at)}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="relative flex justify-end gap-2">
                    <Link
                      href={`/documents/${d.id}`}
                      className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-[13px] font-medium text-[#334155] hover:bg-[#F8FAFC]"
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={openMenu === d.id}
                      aria-label={`More actions for ${d.title}`}
                      onClick={() => setOpenMenu(openMenu === d.id ? null : d.id)}
                      className="rounded-lg border border-[#E2E8F0] px-2.5 py-1.5 text-[#475569] hover:bg-[#F8FAFC]"
                    >
                      •••
                    </button>
                    {openMenu === d.id && (
                      <>
                        <span
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenu(null)}
                          aria-hidden
                        />
                        <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenu(null);
                              onRename(d);
                            }}
                            className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[#F8FAFC]"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenu(null);
                              onDelete(d);
                            }}
                            className="block w-full px-3 py-2 text-left text-[13px] text-[#DC2626] hover:bg-[#FEF2F2]"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet cards */}
      <ul className="space-y-3 md:hidden">
        {documents.map((d) => (
          <DocumentCard key={d.id} document={d} onRename={onRename} onDelete={onDelete} />
        ))}
      </ul>
    </>
  );
}
