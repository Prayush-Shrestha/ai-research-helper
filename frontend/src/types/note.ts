/** Backend note shape (GET /notes, POST /notes, ...). */

export interface ResearchNote {
  id: string;
  title: string;
  content: string;
  document_id: string | null;
  document_title: string | null;
  created_at: string; // ISO
  updated_at: string; // ISO
}

export interface NotePage {
  items: ResearchNote[];
  total: number;
  page: number;
  page_size: number;
}
