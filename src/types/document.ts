export type DocumentFileType = "PDF" | "DOCX";
export type DocumentStatus = "Ready" | "Processing" | "Failed";

export interface ResearchDocument {
  id: string;
  user_id: string;
  title: string;
  original_filename: string;
  file_type: DocumentFileType;
  file_size: number; // bytes
  page_count: number;
  extracted_text: string;
  file_path: string;
  status: DocumentStatus;
  created_at: string; // ISO
  updated_at: string; // ISO
}

export interface DocumentFilters {
  search?: string;
  type?: "ALL" | DocumentFileType;
  sort?: "newest" | "oldest" | "name";
}

export interface DashboardStats {
  documents: number;
  researchPages: number;
  storageUsedBytes: number;
  recentActivity: number;
}

/** POST /documents/upload response — the created document. */
export type UploadResponse = ResearchDocument;
