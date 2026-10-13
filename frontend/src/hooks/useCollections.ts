"use client";

import { useCallback, useEffect, useState } from "react";

export interface ResearchCollection {
  id: string;
  name: string;
  description: string;
  documentIds: string[];
  created_at: string;
  updated_at: string;
}

const KEY = "rl_collections_v1";

function load(): ResearchCollection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as ResearchCollection[]).filter(
      (c) => c && typeof c.id === "string" && typeof c.name === "string" && Array.isArray(c.documentIds)
    );
  } catch {
    return [];
  }
}

export function useCollections() {
  const [collections, setCollections] = useState<ResearchCollection[]>([]);

  useEffect(() => {
     
    void (async () => {
      await Promise.resolve();
      setCollections(load());
    })();
  }, []);

  const persist = useCallback((next: ResearchCollection[]) => {
    setCollections(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage full — keep in memory */
    }
  }, []);

  const create = useCallback(
    (name: string, description = "") => {
      const col: ResearchCollection = {
        id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim() || "Untitled collection",
        description: description.trim(),
        documentIds: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      persist([...load(), col]);
      return col;
    },
    [persist]
  );

  const rename = useCallback(
    (id: string, name: string, description?: string) => {
      const next = load().map((c) =>
        c.id === id
          ? { ...c, name: name.trim() || c.name, description: description ?? c.description, updated_at: new Date().toISOString() }
          : c
      );
      persist(next);
    },
    [persist]
  );

  const remove = useCallback(
    (id: string) => {
      persist(load().filter((c) => c.id !== id));
    },
    [persist]
  );

  const toggleDoc = useCallback(
    (collectionId: string, docId: string) => {
      const next = load().map((c) =>
        c.id === collectionId
          ? {
              ...c,
              documentIds: c.documentIds.includes(docId)
                ? c.documentIds.filter((d) => d !== docId)
                : [...c.documentIds, docId],
              updated_at: new Date().toISOString(),
            }
          : c
      );
      persist(next);
    },
    [persist]
  );

  return { collections, create, rename, remove, toggleDoc, refresh: () => setCollections(load()) };
}
