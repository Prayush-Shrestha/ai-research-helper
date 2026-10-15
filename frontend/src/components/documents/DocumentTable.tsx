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
      <div className="gallery-card hidden overflow-x-auto p-0 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="tech-label" style={{ borderBottom: "1px solid var(--liquid-border-soft)", color: "var(--color-graphite)" }}>
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
              <tr key={d.id} className="doc-row" style={{ borderBottom: "1px solid var(--liquid-border-soft)" }}>
                <td className="max-w-[280px] px-5 py-3.5">
                  <Link href={`/documents/${d.id}`} className="doc-title block truncate font-medium" style={{ color: "var(--color-apple-ink)" }}>
                    {d.title}
                  </Link>
                  <span className="block truncate text-xs" style={{ color: "var(--color-graphite)" }}>{d.original_filename}</span>
                </td>
                <td className="px-5 py-3.5" style={{ color: "var(--color-graphite)" }}>{d.file_type}</td>
                <td className="px-5 py-3.5" style={{ color: "var(--color-graphite)" }}>{formatBytes(d.file_size)}</td>
                <td className="px-5 py-3.5" style={{ color: "var(--color-graphite)" }}>{formatDate(d.created_at)}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={d.extraction_status} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="relative flex justify-end gap-2">
                    <Link
                      href={`/documents/${d.id}`}
                      className="ghost-pill"
                      style={{ fontSize: 12, padding: "6px 14px" }}
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={openMenu === d.id}
                      aria-label={`More actions for ${d.title}`}
                      onClick={() => setOpenMenu(openMenu === d.id ? null : d.id)}
                      className="ghost-pill"
                      style={{ padding: "6px 12px" }}
                    >
                      •••
                    </button>
                    {openMenu === d.id && (
                      <>
                        <button
                          type="button"
                          aria-label="Close menu"
                          className="fixed inset-0 z-10 cursor-default"
                          onClick={() => setOpenMenu(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setOpenMenu(null);
                          }}
                          style={{ background: "transparent", border: "none", padding: 0 }}
                        />
                        <div
                          role="menu"
                          className="liquid-dialog absolute right-0 top-full z-20 mt-1 w-36 py-1 animate-slide-up"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenu(null);
                              onRename(d);
                            }}
                            className="block w-full px-3 py-2 text-left text-[13px]"
                            style={{ color: "var(--color-apple-ink)" }}
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
                            style={{ color: "var(--color-alert)" }}
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
