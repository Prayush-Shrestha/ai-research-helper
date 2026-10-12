"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LoginPayload, RegisterPayload, User } from "@/types/user";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth";
import { mockGetDocuments, mockLogin, mockRegister, shouldUseMock } from "@/lib/mock";

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

const MOCK_TOKEN = "mock-token-dev-only";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  const refresh = useCallback(async () => {
    // Yield first: this is called from a mount effect, and state updates
    // must only happen in async continuations, never synchronously.
    await Promise.resolve();
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    // Clearly-separated dev fallback: mock token never hits the network.
    if (token === MOCK_TOKEN && shouldUseMock()) {
      const { getMockUser } = await import("@/lib/mock");
      setUser(getMockUser());
      setLoading(false);
      return;
    }
    try {
      const me = await api.getCurrentUser();
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        setUser(null);
      }
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
      const { token, user: apiUser } = await api.loginUser(payload);
      setToken(token);
      if (apiUser) {
        setUser(apiUser);
      } else {
        const me = await api.getCurrentUser();
        setUser(me);
      }
    } catch (err) {
      // Dev fallback only: if backend is unreachable, use isolated mock.
      if (shouldUseMock() && err instanceof ApiError && err.status === 0) {
        const { token, user: mockUser } = await mockLogin(payload.email);
        // Warm the mock library so dashboard has data in dev.
        await mockGetDocuments().catch(() => []);
        setToken(token);
        setUser(mockUser);
        return;
      }
      const message = err instanceof ApiError ? err.message : "Sign in failed. Please try again.";
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setAuthError(null);
    try {
      await api.registerUser(payload);
      // Many FastAPI starters require a separate login after register.
      const { token } = await api.loginUser({ email: payload.email, password: payload.password });
      setToken(token);
      const me = await api.getCurrentUser();
      setUser(me);
    } catch (err) {
      if (shouldUseMock() && err instanceof ApiError && err.status === 0) {
        const mockUser = await mockRegister(payload.name, payload.email);
        setToken(MOCK_TOKEN);
        setUser(mockUser);
        return;
      }
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
