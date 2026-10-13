"use client";

import { useCallback, useEffect, useState } from "react";

export interface HistoryEntry {
  id: string;
  kind: "document_opened" | "document_uploaded" | "question_asked" | "note_created" | "collection_updated";
  label: string;
  detail: string;
  href: string | null;
  created_at: string;
}

const KEY = "rl_history_v1";
const MAX = 60;

function load(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as HistoryEntry[]).filter(
      (e) => e && typeof e.id === "string" && typeof e.label === "string"
    );
  } catch {
    return [];
  }
}

export function recordHistory(entry: Omit<HistoryEntry, "id" | "created_at">) {
  if (typeof window === "undefined") return;
  try {
    const full: HistoryEntry = {
      ...entry,
      id: `h-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      created_at: new Date().toISOString(),
    };
    const next = [full, ...load()].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("rl-history", { detail: full }));
  } catch {
    /* ignore */
  }
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    let live = true;
     
    void (async () => {
      await Promise.resolve();
      if (live) setEntries(load());
    })();
    const onUpdate = () => {
      if (live) setEntries(load());
    };
    window.addEventListener("rl-history", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      live = false;
      window.removeEventListener("rl-history", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setEntries([]);
  }, []);

  return { entries, clear, refresh: () => setEntries(load()) };
}
