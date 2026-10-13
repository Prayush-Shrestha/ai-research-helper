import type { LoginPayload, RegisterPayload, User } from "@/types/user";
import type { ResearchDocument } from "@/types/document";
import { getToken } from "@/lib/auth";

/**
 * Centralized REST client for the future FastAPI backend.
 *
 * Base URL comes from NEXT_PUBLIC_API_URL (see .env.local).
 * Only this file knows endpoint paths, so endpoint changes are minimal.
 *
 * Future endpoints:
 *   POST   /auth/register
 *   POST   /auth/login
 *   GET    /auth/me
 *   POST   /documents/upload      (multipart/form-data)
 *   GET    /documents?search=
 *   GET    /documents/{id}
 *   PATCH  /documents/{id}
 *   DELETE /documents/{id}
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  // Don't set JSON content-type for FormData; browser sets boundary.
  const isForm = init.body instanceof FormData;
  if (!isForm && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection and try again.", 0);
  }

  if (res.status === 401) {
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") message = data.detail;
      else if (typeof data?.message === "string") message = data.message;
    } catch {
      /* keep generic message */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("The server returned an unexpected response. Please try again.", res.status);
  }
}

// ---------------------------------------------------------------- Auth ---

export function registerUser(payload: RegisterPayload): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      password: payload.password,
    }),
  });
}

interface LoginResponse {
  access_token: string;
  token_type?: string;
  user?: User;
}

export async function loginUser(payload: LoginPayload): Promise<{ token: string; user?: User }> {
  const data = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!data || typeof data.access_token !== "string" || !data.access_token) {
    throw new ApiError("Sign in failed. Please try again.", 0);
  }
  return { token: data.access_token, user: data.user };
}

export function getCurrentUser(): Promise<User> {
  return request<User>("/auth/me");
}

// ------------------------------------------------------------ Documents ---

export function getDocuments(search?: string): Promise<ResearchDocument[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return request<ResearchDocument[]>(`/documents${qs}`);
}

export function getDocument(id: string): Promise<ResearchDocument> {
  return request<ResearchDocument>(`/documents/${encodeURIComponent(id)}`);
}

export function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void
): Promise<ResearchDocument> {
  // XMLHttpRequest is used so we can report upload progress.
  // Response shape matches FastAPI: the created ResearchDocument.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/documents/upload`);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status === 401) {
        reject(new ApiError("Your session has expired. Please sign in again.", 401));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as ResearchDocument);
        } catch {
          reject(new ApiError("Upload succeeded but the response was invalid.", xhr.status));
        }
        return;
      }
      let message = "Upload failed. Please try again.";
      try {
        const data = JSON.parse(xhr.responseText);
        if (typeof data?.detail === "string") message = data.detail;
      } catch {
        /* keep generic */
      }
      reject(new ApiError(message, xhr.status));
    };
    xhr.onerror = () => reject(new ApiError("Unable to reach the server. Check your connection and try again.", 0));

    const form = new FormData();
    form.append("file", file, file.name);
    xhr.send(form);
  });
}

export function renameDocument(id: string, title: string): Promise<ResearchDocument> {
  return request<ResearchDocument>(`/documents/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export function deleteDocument(id: string): Promise<void> {
  return request<void>(`/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export { BASE_URL };
