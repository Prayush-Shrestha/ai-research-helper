import type { LoginPayload, RegisterPayload, User } from "@/types/user";
import type { DashboardData, DocumentPage, ResearchDocument } from "@/types/document";
import type { NotePage, ResearchNote } from "@/types/note";

/**
 * Centralized REST client for the ResearchOS FastAPI backend.
 *
 * Auth uses an HttpOnly session cookie, so every request sends
 * `credentials: "include"` and no Authorization header is managed here.
 * The cookie is invisible to JavaScript by design — session state comes
 * from GET /auth/me (see AuthContext).
 *
 * Only this file knows endpoint paths and the base URL
 * (NEXT_PUBLIC_API_BASE_URL, e.g. http://localhost:8000/api/v1).
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8000/api/v1";

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

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
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
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload: LoginPayload): Promise<User> {
  return request<User>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutUser(): Promise<{ detail: string }> {
  return request<{ detail: string }>("/auth/logout", { method: "POST" });
}

export function getCurrentUser(): Promise<User> {
  return request<User>("/auth/me");
}

export function updateProfile(name: string): Promise<User> {
  return request<User>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

// ------------------------------------------------------------ Documents ---

export interface DocumentQuery {
  search?: string;
  file_type?: "PDF" | "DOCX";
  sort?: "newest" | "oldest" | "name";
  page?: number;
  page_size?: number;
}

export function getDocuments(query: DocumentQuery = {}): Promise<DocumentPage> {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.file_type) params.set("file_type", query.file_type);
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  const qs = params.toString();
  return request<DocumentPage>(`/documents${qs ? `?${qs}` : ""}`);
}

export function getDocument(id: string): Promise<ResearchDocument> {
  return request<ResearchDocument>(`/documents/${encodeURIComponent(id)}`);
}

export function getDocumentText(id: string): Promise<ResearchDocument> {
  return request<ResearchDocument>(`/documents/${encodeURIComponent(id)}/text`);
}

export function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void
): Promise<ResearchDocument> {
  // XMLHttpRequest is used so we can report upload progress.
  // The session cookie authenticates the request (withCredentials).
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/documents/upload`);
    xhr.withCredentials = true;

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

export function deleteDocument(id: string): Promise<{ detail: string }> {
  return request<{ detail: string }>(`/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function retryExtraction(id: string): Promise<ResearchDocument> {
  return request<ResearchDocument>(`/documents/${encodeURIComponent(id)}/retry-extraction`, {
    method: "POST",
  });
}

/** Direct link to the authorized download endpoint (cookie authenticates it). */
export function downloadUrl(id: string): string {
  return `${BASE_URL}/documents/${encodeURIComponent(id)}/download`;
}

// --------------------------------------------------------------- Notes ---

export function getNotes(page = 1, page_size = 50): Promise<NotePage> {
  return request<NotePage>(`/notes?page=${page}&page_size=${page_size}`);
}

export function getDocumentNotes(documentId: string): Promise<ResearchNote[]> {
  return request<ResearchNote[]>(`/notes/documents/${encodeURIComponent(documentId)}/notes`);
}

export function createNote(input: {
  title?: string;
  content: string;
  document_id?: string | null;
}): Promise<ResearchNote> {
  return request<ResearchNote>("/notes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateNote(
  id: string,
  patch: { title?: string; content?: string }
): Promise<ResearchNote> {
  return request<ResearchNote>(`/notes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteNote(id: string): Promise<{ detail: string }> {
  return request<{ detail: string }>(`/notes/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ----------------------------------------------------------- Dashboard ---

export function getDashboard(): Promise<DashboardData> {
  return request<DashboardData>("/dashboard");
}

// --------------------------------------------------------------- Admin ---

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
  last_login_at: string | null;
  document_count: number;
  note_count: number;
  storage_bytes: number;
}

export interface AdminDocument {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  page_count: number | null;
  extraction_status: string;
  created_at: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
}

export interface AdminNote {
  id: string;
  title: string;
  content: string;
  document_id: string | null;
  document_title: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
}

export interface AdminUserDetail extends AdminUser {
  recent_documents: AdminDocument[];
}

export interface AdminStats {
  total_users: number;
  admin_count: number;
  total_documents: number;
  total_notes: number;
  total_storage_bytes: number;
}

export function getAdminStats(): Promise<AdminStats> {
  return request<AdminStats>("/adminlogin/stats");
}

export function getAdminUsers(search?: string): Promise<AdminUser[]> {
  const qs = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  return request<AdminUser[]>(`/adminlogin/users${qs}`);
}

export function getAdminDocuments(): Promise<AdminDocument[]> {
  return request<AdminDocument[]>("/adminlogin/documents");
}

export function getAdminNotes(): Promise<AdminNote[]> {
  return request<AdminNote[]>("/adminlogin/notes");
}

export function getAdminUser(id: string): Promise<AdminUserDetail> {
  return request<AdminUserDetail>(`/adminlogin/users/${encodeURIComponent(id)}`);
}

export function setAdminRole(id: string, role: "user" | "admin"): Promise<AdminUser> {
  return request<AdminUser>(`/adminlogin/users/${encodeURIComponent(id)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function deleteAdminUser(id: string): Promise<{ detail: string }> {
  return request<{ detail: string }>(`/adminlogin/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ----------------------------------------------------------- Research ---

export interface TopicSuggestion {
  title: string;
  description: string;
  why_it_fits: string;
  suggested_approach: string;
  is_best: boolean;
}

export interface SuggestTopicsOut {
  topics: TopicSuggestion[];
  best_topic_index: number | null;
  note: string | null;
}

export interface SuggestTopicsIn {
  description: string;
}

export function suggestTopics(description: string): Promise<SuggestTopicsOut> {
  return request<SuggestTopicsOut>("/research/suggest-topics", {
    method: "POST",
    body: JSON.stringify({ description }),
  });
}

export { BASE_URL };
