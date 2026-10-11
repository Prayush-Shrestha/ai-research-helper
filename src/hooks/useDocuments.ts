"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DocumentFilters, ResearchDocument } from "@/types/document";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  getMockDocuments,
  mockUploadDocument,
  saveMockDocuments,
  shouldUseMock,
} from "@/lib/mock";
import { friendlyApiError } from "@/lib/utils";

/**
 * Document state hook.
 * - Filtering/sorting is done client-side for Month-1, but structured so the
 *   `search` term can later be sent as GET /documents?search= without UI changes
 *   (see `serverSearchHint` + lib/api.getDocuments(search)).
 */
export function useDocuments(initialFilters?: DocumentFilters) {
  const [documents, setDocuments] = useState<ResearchDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>(
    initialFilters ?? { type: "ALL", sort: "newest", search: "" }
  );

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err) {
      if (shouldUseMock() && (!getToken() || (err instanceof ApiError && err.status === 0))) {
        // Dev fallback: isolated mock data.
        setDocuments(getMockDocuments());
      } else {
        setError(friendlyApiError(err instanceof Error ? err.message : ""));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const filtered = useMemo(() => {
    const q = (filters.search ?? "").trim().toLowerCase();
    let list = [...documents];
    if (filters.type && filters.type !== "ALL") {
      list = list.filter((d) => d.file_type === filters.type);
    }
    if (q) {
      // Later: replace with server search GET /documents?search=. UI stays the same.
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.original_filename.toLowerCase().includes(q) ||
          d.file_type.toLowerCase().includes(q)
      );
    }
    switch (filters.sort) {
      case "oldest":
        list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
        break;
      case "name":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
      default:
        list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return list;
  }, [documents, filters]);

  const rename = useCallback(
    async (id: string, title: string) => {
      try {
        const updated = await api.renameDocument(id, title);
        setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
        return updated;
      } catch (err) {
        if (shouldUseMock() && err instanceof ApiError && err.status === 0) {
          let updated: ResearchDocument | undefined;
          const next = getMockDocuments().map((d) => {
            if (d.id !== id) return d;
            updated = { ...d, title, updated_at: new Date().toISOString() };
            return updated;
          });
          saveMockDocuments(next);
          setDocuments(next);
          if (!updated) throw err;
          return updated;
        }
        throw err;
      }
    },
    []
  );

  const remove = useCallback(async (id: string) => {
    try {
      await api.deleteDocument(id);
    } catch (err) {
      if (shouldUseMock() && err instanceof ApiError && err.status === 0) {
        const next = getMockDocuments().filter((d) => d.id !== id);
        saveMockDocuments(next);
        setDocuments(next);
        return;
      }
      throw err;
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const upload = useCallback(async (file: File, onProgress?: (p: number) => void) => {
    try {
      const created = await api.uploadDocument(file, onProgress);
      setDocuments((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      if (shouldUseMock() && err instanceof ApiError && err.status === 0) {
        const created = await mockUploadDocument(file, onProgress);
        setDocuments((prev) => [created, ...prev]);
        return created;
      }
      throw err;
    }
  }, []);

  return {
    documents: filtered,
    allDocuments: documents,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchDocuments,
    rename,
    remove,
    upload,
  };
}
