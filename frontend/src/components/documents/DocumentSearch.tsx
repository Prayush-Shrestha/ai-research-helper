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
      <label className="liquid-search relative flex flex-1 items-center" style={{ borderRadius: 999 }}>
        <span className="sr-only">Search documents</span>
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute left-4"
          style={{ color: "var(--color-slate)" }}
        />
        <input
          type="search"
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search documents..."
          className="h-11 w-full bg-transparent pl-10 pr-3 text-sm outline-none"
          style={{ color: "var(--color-apple-ink)" }}
        />
      </label>

      <div className="flex items-center gap-2">
        <div role="group" aria-label="Filter by type" className="liquid-search flex p-1" style={{ borderRadius: 999 }}>
          {(["ALL", "PDF", "DOCX"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => onChange({ ...filters, type: t })}
              className={cx(
                "rounded-full px-3 py-1.5 text-[13px] font-medium transition-all",
                type === t && "tag-pill crimson"
              )}
              style={type === t ? { border: undefined } : { color: "var(--color-graphite)", border: "1px solid transparent", background: "transparent" }}
            >
              {t === "ALL" ? "All" : t}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--color-graphite)" }}>
          <span className="sr-only">Sort documents</span>
          <select
            value={sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })}
            className="field-input h-11 text-[13px] font-medium outline-none"
            style={{ borderRadius: 999, width: "auto" }}
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
