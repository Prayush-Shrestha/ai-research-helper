"use client";

import type { DocumentFilters } from "@/types/document";
import { cx } from "@/lib/utils";

type TypeFilter = "ALL" | "PDF" | "DOCX";
type SortKey = "newest" | "oldest" | "name";

interface DocumentSearchProps {
  filters: DocumentFilters;
  onChange: (filters: DocumentFilters) => void;
}

/**
 * Search + filter + sort controls for /documents.
 * Filtering is client-side for Month-1; the `search` value maps 1:1 to a
 * future GET /documents?search= query (see hooks/useDocuments).
 */
export function DocumentSearch({ filters, onChange }: DocumentSearchProps) {
  const type = (filters.type ?? "ALL") as TypeFilter;
  const sort = (filters.sort ?? "newest") as SortKey;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="relative flex-1">
        <span className="sr-only">Search documents</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
        >
          <path
            d="M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm6.5 11.5L21 20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search documents..."
          className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4F46E5]"
        />
      </label>

      <div className="flex items-center gap-2">
        <div role="group" aria-label="Filter by type" className="flex rounded-lg border border-[#E2E8F0] bg-white p-1">
          {(["ALL", "PDF", "DOCX"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => onChange({ ...filters, type: t })}
              className={cx(
                "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                type === t ? "bg-[#EEF2FF] text-[#4338CA]" : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              {t === "ALL" ? "All" : t}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
          <span className="sr-only">Sort documents</span>
          <select
            value={sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })}
            className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-[13px] font-medium text-[#334155]"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
    </div>
  );
}
