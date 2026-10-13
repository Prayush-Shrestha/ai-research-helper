"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "@/lib/api";
import type { ResearchNote as BackendNote } from "@/types/note";
import { friendlyApiError } from "@/lib/utils";

export interface ResearchNote {
  id: string;
  title: string;
  body: string;
  documentId: string | null;
  documentTitle: string | null;
  created_at: string;
  updated_at: string;
}

function fromBackend(note: BackendNote): ResearchNote {
  return {
    id: note.id,
    title: note.title,
    body: note.content,
    documentId: note.document_id,
    documentTitle: note.document_title,
    created_at: note.created_at,
    updated_at: note.updated_at,
  };
}

/**
 * Personal research notes, persisted in PostgreSQL through /notes.
 *
 * The hook keeps the previous call-site shape ({ title, body, documentId })
 * so pages don't change; only the storage moved from localStorage to the
 * backend. Saves are explicit with clear error feedback — no silent loss.
 */
export function useNotes() {
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    await Promise.resolve();
    if (mounted.current) setLoading(true);
    if (mounted.current) setError(null);
    try {
      const result = await api.getNotes(1, 100);
      if (!mounted.current) return;
      setNotes(result.items.map(fromBackend));
    } catch (err) {
      if (!mounted.current) return;
      setNotes([]);
      setError(friendlyApiError(err instanceof Error ? err.message : ""));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Bootstrap fetch on mount; updates land in async continuations.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: {
      title: string;
      body: string;
      documentId?: string | null;
      documentTitle?: string | null;
    }) => {
      const note = await api.createNote({
        title: input.title.trim() || "Untitled note",
        content: input.body,
        document_id: input.documentId ?? null,
      });
      const mapped = fromBackend(note);
      // The list endpoint joins the document title; the create response may
      // not include it, so fall back to the caller's title when provided.
      if (!mapped.documentTitle && input.documentTitle) {
        mapped.documentTitle = input.documentTitle;
      }
      setNotes((prev) => [mapped, ...prev]);
      return mapped;
    },
    []
  );

  const update = useCallback(
    async (
      id: string,
      patch: { title?: string; body?: string }
    ) => {
      const note = await api.updateNote(id, {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.body !== undefined ? { content: patch.body } : {}),
      });
      const mapped = fromBackend(note);
      setNotes((prev) => prev.map((n) => (n.id === id ? mapped : n)));
      return mapped;
    },
    []
  );

  const remove = useCallback(async (id: string) => {
    await api.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notes, loading, error, create, update, remove, refresh };
}
