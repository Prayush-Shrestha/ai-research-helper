"use client";

import type { DocumentFilters } from "@/types/document";
import { Search } from "lucide-react";
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
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--color-graphite)" }}
        />
        <input
          type="search"
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search documents..."
          className="h-10 w-full rounded-full pl-9 pr-3 text-sm outline-none transition-all placeholder:text-[#4c4c4c]"
          style={{ border: "1px solid var(--color-hairline)", background: "var(--color-graphite)", color: "var(--color-frost)" }}
        />
      </label>

      <div className="flex items-center gap-2">
        <div role="group" aria-label="Filter by type" className="flex rounded-full p-1" style={{ border: "1px solid var(--color-hairline)", background: "var(--color-deep-black)" }}>
          {(["ALL", "PDF", "DOCX"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => onChange({ ...filters, type: t })}
              className={cx(
                "rounded-full px-3 py-1.5 text-[13px] font-medium transition-all",
                type === t ? "text-[#050505]" : ""
              )}
              style={type === t
                ? { background: "var(--color-frost)" }
                : { color: "var(--color-ash)" }}
            >
              {t === "ALL" ? "All" : t}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--color-ash)" }}>
          <span className="sr-only">Sort documents</span>
          <select
            value={sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })}
            className="h-10 rounded-full px-2.5 text-[13px] font-medium outline-none"
            style={{ border: "1px solid var(--color-hairline)", background: "var(--color-deep-black)", color: "var(--color-frost)" }}
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
