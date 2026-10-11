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
      <div
        className="hidden overflow-x-auto md:block"
        style={{ borderRadius: "var(--radius-panel)", border: "1px solid var(--color-hairline)", background: "var(--color-deep-black)" }}
      >
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="font-tech" style={{ borderBottom: "1px solid var(--color-hairline)", color: "var(--color-tertiary-text)", fontSize: 9 }}>
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
              <tr key={d.id} className="doc-row" style={{ borderBottom: "1px solid var(--color-hairline)" }}>
                <td className="max-w-[280px] px-5 py-3.5">
                  <Link href={`/documents/${d.id}`} className="block truncate font-medium" style={{ color: "var(--color-primary-text)" }}>
                    {d.title}
                  </Link>
                  <span className="block truncate text-xs" style={{ color: "var(--color-tertiary-text)" }}>{d.original_filename}</span>
                </td>
                <td className="px-5 py-3.5" style={{ color: "var(--color-secondary-text)" }}>{d.file_type}</td>
                <td className="px-5 py-3.5" style={{ color: "var(--color-secondary-text)" }}>{formatBytes(d.file_size)}</td>
                <td className="px-5 py-3.5" style={{ color: "var(--color-secondary-text)" }}>{formatDate(d.created_at)}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="relative flex justify-end gap-2">
                    <Link
                      href={`/documents/${d.id}`}
                      className="font-tech rounded-full px-3 py-1.5"
                      style={{ border: "1px solid var(--color-hairline)", background: "var(--color-control)", color: "var(--color-secondary-text)", fontSize: 10 }}
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={openMenu === d.id}
                      aria-label={`More actions for ${d.title}`}
                      onClick={() => setOpenMenu(openMenu === d.id ? null : d.id)}
                      className="rounded-full px-2.5 py-1.5"
                      style={{ border: "1px solid var(--color-hairline)", color: "var(--color-secondary-text)" }}
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
                        <div
                          role="menu"
                          className="absolute right-0 top-full z-20 mt-1 w-36 py-1 animate-slide-up"
                          style={{ borderRadius: 12, border: "1px solid var(--color-hairline)", background: "#111214", boxShadow: "0 16px 48px rgba(0,0,0,0.5)" }}
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenu(null);
                              onRename(d);
                            }}
                            className="block w-full px-3 py-2 text-left text-[13px]"
                            style={{ color: "var(--color-primary-text)" }}
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
                            className="block w-full px-3 py-2 text-left text-[13px]"
                            style={{ color: "#ff9d9d" }}
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
