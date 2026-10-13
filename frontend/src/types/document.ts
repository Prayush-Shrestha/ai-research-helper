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
