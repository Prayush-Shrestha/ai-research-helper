"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { LoginPayload, RegisterPayload, User } from "@/types/user";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Browser-only data that belongs to the previous signed-in user. */
const USER_SCOPED_KEYS = [
  "rl_collections_v1",
  "rl_notes_v1",
  "rl_history_v1",
  "rl_conversations_v1",
];

function clearUserScopedStorage() {
  try {
    for (const key of USER_SCOPED_KEYS) window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  const logout = useCallback(() => {
    // Best effort: end the server session, then always clear client state
    // so the next account never sees the previous user's data.
    void api.logoutUser().catch(() => undefined);
    setUser(null);
    setAuthError(null);
    clearUserScopedStorage();
    router.push("/login");
  }, [router]);

  const refresh = useCallback(async () => {
    // Yield first: this is called from a mount effect, and state updates
    // must only happen in async continuations, never synchronously.
    await Promise.resolve();
    try {
      const me = await api.getCurrentUser();
      setUser(me);
    } catch (err) {
      // 401 simply means "signed out" — any other failure surfaces as-is
      // but never fabricates a user.
      if (!(err instanceof ApiError && err.status === 401)) {
        setAuthError(err instanceof Error ? err.message : "Could not restore your session.");
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Bootstrap fetch on mount (session restore). Intentional: the session
    // must load once when the provider mounts; updates land in async
    // continuations, guarded by the yields inside refresh().
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const login = useCallback(async (payload: LoginPayload) => {
    setAuthError(null);
    try {
      const me = await api.loginUser(payload);
      setUser(me);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Sign in failed. Please try again.";
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setAuthError(null);
    try {
      // The backend signs the new account in immediately (session cookie).
      const me = await api.registerUser(payload);
      setUser(me);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Registration failed. Please try again.";
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, authError }),
    [user, loading, login, register, logout, refresh, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
