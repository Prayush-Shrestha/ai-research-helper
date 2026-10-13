"use client";

import { useCallback, useEffect, useState } from "react";

export interface ResearchNote {
  id: string;
  title: string;
  body: string;
  documentId: string | null;
  documentTitle: string | null;
  created_at: string;
  updated_at: string;
}

const KEY = "rl_notes_v1";

function load(): ResearchNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as ResearchNote[]).filter(
      (n) => n && typeof n.id === "string" && typeof n.title === "string" && typeof n.body === "string"
    );
  } catch {
    return [];
  }
}

export function useNotes() {
  const [notes, setNotes] = useState<ResearchNote[]>([]);

  useEffect(() => {
     
    void (async () => {
      await Promise.resolve();
      setNotes(load());
    })();
  }, []);

  const persist = useCallback((next: ResearchNote[]) => {
    setNotes(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const create = useCallback(
    (input: { title: string; body: string; documentId?: string | null; documentTitle?: string | null }) => {
      const note: ResearchNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: input.title.trim() || "Untitled note",
        body: input.body,
        documentId: input.documentId ?? null,
        documentTitle: input.documentTitle ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const next = [note, ...load()];
      persist(next);
      return note;
    },
    [persist]
  );

  const update = useCallback(
    (id: string, patch: { title?: string; body?: string; documentId?: string | null; documentTitle?: string | null }) => {
      const next = load().map((n) =>
        n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n
      );
      persist(next);
    },
    [persist]
  );

  const remove = useCallback(
    (id: string) => {
      persist(load().filter((n) => n.id !== id));
    },
    [persist]
  );

  return { notes, create, update, remove, refresh: () => setNotes(load()) };
}
