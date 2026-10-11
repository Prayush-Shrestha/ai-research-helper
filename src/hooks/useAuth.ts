"use client";

import { useAuthContext } from "@/context/AuthContext";

/** Thin re-export so components import from "@/hooks/useAuth". */
export function useAuth() {
  return useAuthContext();
}
