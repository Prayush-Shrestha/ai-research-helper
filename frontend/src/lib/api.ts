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
  return request<AdminStats>("/admin/stats");
}

export function getAdminUsers(search?: string): Promise<AdminUser[]> {
  const qs = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  return request<AdminUser[]>(`/admin/users${qs}`);
}

export function adminRegisterUser(payload: {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
}): Promise<AdminUser> {
  return request<AdminUser>("/admin/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAdminDocuments(): Promise<AdminDocument[]> {
  return request<AdminDocument[]>("/admin/documents");
}

export function getAdminNotes(): Promise<AdminNote[]> {
  return request<AdminNote[]>("/admin/notes");
}

export function getAdminUser(id: string): Promise<AdminUserDetail> {
  return request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`);
}

export function setAdminRole(id: string, role: "user" | "admin"): Promise<AdminUser> {
  return request<AdminUser>(`/admin/users/${encodeURIComponent(id)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function deleteAdminUser(id: string): Promise<{ detail: string }> {
  return request<{ detail: string }>(`/admin/users/${encodeURIComponent(id)}`, {
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

// ------------------------------------------------------------------
// RAG / Conversations
// ------------------------------------------------------------------

export interface Conversation {
  id: string;
  title: string;
  document_ids: string[];
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  created_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: ConversationMessage[];
}

export interface ConversationCreate {
  title?: string;
  document_ids: string[];
}

export interface RenameConversation {
  title: string;
}

export interface Citation {
  chunk_id: string;
  document_id: string;
  document_title: string;
  page_number: number | null;
  text_snippet: string;
  similarity: number;
}

export interface AskRequest {
  question: string;
  conversation_id?: string;
  document_ids?: string[];
}

export interface AskResponse {
  conversation_id: string;
  answer: string;
  citations: Citation[];
  model: string;
  provider: string;
  insufficient_evidence: boolean;
  tokens_estimate: number | null;
}

export interface IndexingStatus {
  document_id: string;
  indexing_status: string;
  indexing_error: string | null;
  embedding_model: string | null;
}

export function getConversations(): Promise<Conversation[]> {
  return request<Conversation[]>("/research/conversations");
}

export function getConversation(
  id: string
): Promise<ConversationDetail> {
  return request<ConversationDetail>(
    `/research/conversations/${encodeURIComponent(id)}`
  );
}

export function createConversation(
  payload: ConversationCreate
): Promise<Conversation> {
  return request<Conversation>("/research/conversations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function renameConversation(
  id: string,
  payload: RenameConversation
): Promise<Conversation> {
  return request<Conversation>(
    `/research/conversations/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export function deleteConversation(id: string): Promise<{ detail: string }> {
  return request<{ detail: string }>(
    `/research/conversations/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

export function askQuestion(
  payload: AskRequest
): Promise<AskResponse> {
  return request<AskResponse>("/research/ask", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getIndexingStatus(
  documentId: string
): Promise<IndexingStatus> {
  return request<IndexingStatus>(
    `/research/documents/${encodeURIComponent(documentId)}/indexing-status`
  );
}

export function reindexDocument(
  documentId: string
): Promise<{ detail: string }> {
  return request<{ detail: string }>(
    `/research/documents/${encodeURIComponent(documentId)}/reindex`,
    { method: "POST" }
  );
}

export interface KeyPoint {
  point: string;
  page_number: number | null;
}

export interface SummarizeIn {
  document_ids?: string[];
}

export interface SummarizeOut {
  summary: string;
  key_points: KeyPoint[];
  study_questions: string[];
  model: string;
  provider: string;
  citations: Citation[];
}

export function summarizeDocuments(
  payload: SummarizeIn
): Promise<SummarizeOut> {
  return request<SummarizeOut>("/research/summarize", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface KnowledgeNode {
  id: string;
  label: string;
  size: number;
  document_ids: string[];
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  weight: number;
}

export interface KnowledgeOut {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export function getKnowledgeGraph(): Promise<KnowledgeOut> {
  return request<KnowledgeOut>("/research/knowledge");
}

// ------------------------------------------------------------------
// Phase 3: Collections (server-side)
// ------------------------------------------------------------------

export interface ResearchCollection {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface ResearchCollectionDetail extends ResearchCollection {
  documents: CollectionDocumentWithDoc[];
}

export interface CollectionDocumentWithDoc {
  id: string;
  collection_id: string;
  document_id: string;
  document_title: string;
  document_file_type: string;
  document_page_count: number | null;
  added_at: string;
}

export interface CollectionCreateIn {
  name: string;
  description?: string;
}

export interface CollectionUpdateIn {
  name?: string;
  description?: string;
}

export interface CollectionDocumentAddIn {
  document_id: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

export function getCollections(
  search?: string,
  page = 1,
  page_size = 50
): Promise<PaginatedResponse<ResearchCollection>> {
  const qs = new URLSearchParams();
  if (search?.trim()) qs.set("search", search.trim());
  qs.set("page", String(page));
  qs.set("page_size", String(page_size));
  return request<PaginatedResponse<ResearchCollection>>(
    `/collections?${qs.toString()}`
  );
}

export function createCollection(
  payload: CollectionCreateIn
): Promise<ResearchCollection> {
  return request<ResearchCollection>("/collections", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCollection(
  id: string
): Promise<ResearchCollectionDetail> {
  return request<ResearchCollectionDetail>(
    `/collections/${encodeURIComponent(id)}`
  );
}

export function updateCollection(
  id: string,
  payload: CollectionUpdateIn
): Promise<ResearchCollection> {
  return request<ResearchCollection>(
    `/collections/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
}

export function deleteCollection(id: string): Promise<void> {
  return request<void>(
    `/collections/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

export function addDocumentToCollection(
  collectionId: string,
  payload: CollectionDocumentAddIn
): Promise<CollectionDocumentWithDoc> {
  return request<CollectionDocumentWithDoc>(
    `/collections/${encodeURIComponent(collectionId)}/documents`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function removeDocumentFromCollection(
  collectionId: string,
  documentId: string
): Promise<void> {
  return request<void>(
    `/collections/${encodeURIComponent(collectionId)}/documents/${encodeURIComponent(documentId)}`,
    { method: "DELETE" }
  );
}

// ------------------------------------------------------------------
// Phase 3: Knowledge Graph (entities & relationships)
// ------------------------------------------------------------------

export interface KnowledgeEntity {
  id: string;
  name: string;
  entity_type: string;
  description: string | null;
  source_document_id: string | null;
  source_chunk_id: string | null;
  source_page_number: number | null;
  source_text_snippet: string | null;
  source_document_title: string | null;
  confidence: number;
  is_inferred: boolean;
  created_at: string;
  updated_at: string;
  relationship_count: number;
}

export interface KnowledgeRelationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  source_entity_name: string;
  target_entity_name: string;
  relationship_type: string;
  description: string | null;
  source_document_id: string | null;
  source_document_title: string | null;
  confidence: number;
  is_inferred: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeEntity[];
  edges: KnowledgeRelationship[];
}

export function getKnowledgeGraphData(
  entity_type?: string,
  source_document_id?: string,
  search?: string,
  min_confidence = 0,
  include_inferred = true,
  max_nodes = 200,
  max_edges = 400
): Promise<KnowledgeGraphData> {
  const qs = new URLSearchParams();
  if (entity_type) qs.set("entity_type", entity_type);
  if (source_document_id) qs.set("source_document_id", source_document_id);
  if (search?.trim()) qs.set("search", search.trim());
  qs.set("min_confidence", String(min_confidence));
  qs.set("include_inferred", String(include_inferred));
  qs.set("max_nodes", String(max_nodes));
  qs.set("max_edges", String(max_edges));
  return request<KnowledgeGraphData>(`/knowledge/graph?${qs.toString()}`);
}

export function getKnowledgeEntities(
  entity_type?: string,
  source_document_id?: string,
  search?: string,
  inferred_only?: boolean,
  page = 1,
  page_size = 50
): Promise<PaginatedResponse<KnowledgeEntity>> {
  const qs = new URLSearchParams();
  if (entity_type) qs.set("entity_type", entity_type);
  if (source_document_id) qs.set("source_document_id", source_document_id);
  if (search?.trim()) qs.set("search", search.trim());
  if (inferred_only !== undefined) qs.set("inferred_only", String(inferred_only));
  qs.set("page", String(page));
  qs.set("page_size", String(page_size));
  return request<PaginatedResponse<KnowledgeEntity>>(
    `/knowledge/entities?${qs.toString()}`
  );
}

export function getKnowledgeRelationships(
  source_entity_id?: string,
  target_entity_id?: string,
  relationship_type?: string,
  page = 1,
  page_size = 50
): Promise<PaginatedResponse<KnowledgeRelationship>> {
  const qs = new URLSearchParams();
  if (source_entity_id) qs.set("source_entity_id", source_entity_id);
  if (target_entity_id) qs.set("target_entity_id", target_entity_id);
  if (relationship_type) qs.set("relationship_type", relationship_type);
  qs.set("page", String(page));
  qs.set("page_size", String(page_size));
  return request<PaginatedResponse<KnowledgeRelationship>>(
    `/knowledge/relationships?${qs.toString()}`
  );
}

export function reprocessDocumentKnowledgeGraph(
  documentId: string
): Promise<{ detail: string; entities_deleted: number; entities_created: number; relationships_created: number }> {
  return request<{
    detail: string;
    entities_deleted: number;
    entities_created: number;
    relationships_created: number;
  }>(
    `/knowledge/documents/${encodeURIComponent(documentId)}/reprocess`,
    { method: "POST" }
  );
}

// ------------------------------------------------------------------
// Phase 3: Activity logs
// ------------------------------------------------------------------

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: string | null;
  ip_address: string | null;
  created_at: string;
}

export function getActivityLogs(
  action?: string,
  page = 1,
  page_size = 50
): Promise<PaginatedResponse<ActivityLogEntry>> {
  const qs = new URLSearchParams();
  if (action) qs.set("action", action);
  qs.set("page", String(page));
  qs.set("page_size", String(page_size));
  return request<PaginatedResponse<ActivityLogEntry>>(
    `/activity?${qs.toString()}`
  );
}

// ------------------------------------------------------------------
// Phase 3: Research comparison
// ------------------------------------------------------------------

export interface ComparisonSection {
  title: string;
  content: string;
  citations: string[];
}

export interface DocumentComparison {
  document_ids: string[];
  document_titles: string[];
  sections: ComparisonSection[];
  similarities: string[];
  differences: string[];
  research_gaps: string[];
  model: string;
  provider: string;
  tokens_estimate: number | null;
  created_at: string;
}

export interface CompareDocumentsIn {
  document_ids: string[];
}

export function compareDocuments(
  payload: CompareDocumentsIn
): Promise<DocumentComparison> {
  return request<DocumentComparison>("/research/compare", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ------------------------------------------------------------------
// Phase 3: Admin extensions
// ------------------------------------------------------------------

export interface AdminAnalytics {
  total_users: number;
  active_users: number;
  new_users_30d: number;
  total_documents: number;
  documents_uploaded_30d: number;
  processing_success_count: number;
  processing_failure_count: number;
  ai_requests_30d: number;
  avg_processing_latency_ms: number | null;
  error_rate_percent: number | null;
}

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  admin_email: string;
  target_user_id: string | null;
  target_user_email: string | null;
  action: string;
  description: string | null;
  metadata: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface SystemHealth {
  status: string;
  database: string;
  vector_store: string;
  embedding_provider: string;
  llm_provider: string;
  uptime_seconds: number | null;
}

export interface UserStatusUpdate {
  is_active: boolean;
}

export function getAdminAnalytics(): Promise<AdminAnalytics> {
  return request<AdminAnalytics>("/admin/analytics");
}

export function getAdminAuditLogs(
  admin_user_id?: string,
  target_user_id?: string,
  action?: string,
  page = 1,
  page_size = 50
): Promise<PaginatedResponse<AuditLogEntry>> {
  const qs = new URLSearchParams();
  if (admin_user_id) qs.set("admin_user_id", admin_user_id);
  if (target_user_id) qs.set("target_user_id", target_user_id);
  if (action) qs.set("action", action);
  qs.set("page", String(page));
  qs.set("page_size", String(page_size));
  return request<PaginatedResponse<AuditLogEntry>>(
    `/admin/audit?${qs.toString()}`
  );
}

export function getSystemHealth(): Promise<SystemHealth> {
  return request<SystemHealth>("/admin/health");
}

export function updateUserStatus(
  id: string,
  payload: UserStatusUpdate
): Promise<{
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  detail: string;
}> {
  return request<{
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    detail: string;
  }>(
    `/admin/users/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
}

export { BASE_URL };

