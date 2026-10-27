export type DocumentFileType = "PDF" | "DOCX";

/** Mirrors the backend extraction lifecycle (see backend/app/models/document.py). */
export type DocumentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "requires_ocr";

export interface ResearchDocument {
  id: string;
  title: string;
  original_filename: string;
  file_type: DocumentFileType;
  file_size: number; // bytes
  page_count: number | null;
  extraction_status: DocumentStatus;
  extraction_error: string | null;
  /** Present on detail/text responses; omitted from list responses. */
  extracted_text?: string | null;
  created_at: string; // ISO
  updated_at: string; // ISO
  /** Phase 2 RAG: indexing status for chunking + embeddings. */
  indexing_status?: string;
  indexing_error?: string | null;
  embedding_model?: string | null;
}

/** Human-readable label for an extraction status (UI only). */
export function statusLabel(status: DocumentStatus): string {
  switch (status) {
    case "completed":
      return "Ready";
    case "processing":
    case "pending":
      return "Processing";
    case "requires_ocr":
      return "Needs OCR";
    case "failed":
      return "Failed";
  }
}

export interface DocumentFilters {
  search?: string;
  type?: "ALL" | DocumentFileType;
  sort?: "newest" | "oldest" | "name";
}

export interface DocumentPage {
  items: ResearchDocument[];
  total: number;
  page: number;
  page_size: number;
}

/** GET /dashboard response — every number is a live database query. */
export interface DashboardData {
  counts: {
    total_documents: number;
    pdf_count: number;
    docx_count: number;
    total_notes: number;
  };
  recent_documents: ResearchDocument[];
  recently_updated: ResearchDocument[];
  recent_notes: import("./note").ResearchNote[];
}

/** POST /documents/upload response — the created document. */
export type UploadResponse = ResearchDocument;

/** ------------------------------------------------------------------ */
/** Phase 2 RAG types                                                  */
/** ------------------------------------------------------------------ */

export interface Citation {
  chunk_id: string;
  document_id: string;
  document_title: string;
  page_number: number | null;
  text_snippet: string;
  similarity: number;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  created_at: string; // ISO
}

export interface Conversation {
  id: string;
  title: string;
  document_ids: string[];
  created_at: string; // ISO
  updated_at: string; // ISO
  message_count: number;
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
  indexing_status: IndexingStatus;
  indexing_error: string | null;
  embedding_model: string | null;
}

export interface AIUsageEntry {
  id: string;
  operation_type: "embedding" | "llm";
  provider: string;
  model: string;
  tokens_estimate: number | null;
  cost_estimate_usd: number | null;
  created_at: string; // ISO
}
