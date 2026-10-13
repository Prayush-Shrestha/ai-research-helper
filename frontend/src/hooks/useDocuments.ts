"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DocumentFilters, ResearchDocument } from "@/types/document";
import * as api from "@/lib/api";
import { friendlyApiError } from "@/lib/utils";

export interface DocumentQuery extends DocumentFilters {
  page?: number;
  pageSize?: number;
}

/**
 * Document state hook, fully server-driven.
 *
 * Search, type filter, sort, and pagination run in PostgreSQL through
 * GET /documents — the hook only holds the current page. Pass query
 * options per call site (library, dashboard, pickers each use their own).
 */
export function useDocuments(query: DocumentQuery = {}) {
  const { search = "", type = "ALL", sort = "newest", page = 1, pageSize = 12 } = query;
  const [documents, setDocuments] = useState<ResearchDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchDocuments = useCallback(async () => {
    // Yield first: this is called from mount/query effects, and state
    // updates must only happen in async continuations, never synchronously.
    await Promise.resolve();
    if (mounted.current) setLoading(true);
    if (mounted.current) setError(null);
    try {
      const result = await api.getDocuments({
        search,
        file_type: type === "ALL" ? undefined : type,
        sort,
        page,
        page_size: pageSize,
      });
      if (!mounted.current) return;
      setDocuments(Array.isArray(result.items) ? result.items : []);
      setTotal(typeof result.total === "number" ? result.total : 0);
    } catch (err) {
      if (!mounted.current) return;
      setDocuments([]);
      setTotal(0);
      setError(friendlyApiError(err instanceof Error ? err.message : ""));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [search, type, sort, page, pageSize]);

  // Search is debounced so every keystroke isn't a request; other query
  // changes (filter/sort/page) refetch immediately.
  const firstRun = useRef(true);
  useEffect(() => {
    // Intentional: updates land in async continuations inside fetchDocuments.
    if (firstRun.current) {
      firstRun.current = false;
      void fetchDocuments();
      return undefined;
    }
    const timer = window.setTimeout(
      () => {
        void fetchDocuments();
      },
      search ? 300 : 0
    );
    return () => window.clearTimeout(timer);
  }, [fetchDocuments, search]);

  const filtered = useMemo(() => documents, [documents]);

  const rename = useCallback(
    async (id: string, title: string) => {
      const updated = await api.renameDocument(id, title);
      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return updated;
    },
    []
  );

  const remove = useCallback(async (id: string) => {
    await api.deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  const upload = useCallback(async (file: File, onProgress?: (p: number) => void) => {
    const created = await api.uploadDocument(file, onProgress);
    await fetchDocuments();
    return created;
  }, [fetchDocuments]);

  return {
    documents: filtered,
    allDocuments: filtered,
    total,
    loading,
    error,
    refetch: fetchDocuments,
    rename,
    remove,
    upload,
  };
}
