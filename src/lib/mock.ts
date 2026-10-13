import type { ResearchDocument } from "@/types/document";
import type { User } from "@/types/user";

/**
 * DEVELOPMENT-ONLY mock backend.
 * --------------------------------
 * This file is intentionally isolated from `lib/api.ts` (the real FastAPI
 * client). Production auth/data code must not import from here except
 * through the explicit `shouldUseMock()` fallback, so removing mock mode
 * later is a one-line change (set NEXT_PUBLIC_USE_MOCK=false).
 */

export function shouldUseMock(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK !== "false";
}

const DOCS_KEY = "ara_mock_docs";
const USER_KEY = "ara_mock_user";

const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 24, 0, 0);
  return d.toISOString();
}

const SAMPLE_TEXT = `1. Introduction

This paper surveys modern methods for organizing, retrieving, and reasoning over scientific literature. We focus on practical pipelines that remain reliable at the scale of a personal research library: ingestion of PDF and DOCX sources, high-fidelity text extraction, deduplication, and structured metadata.

2. Background

Early digital libraries treated documents as opaque blobs with keyword indexes. Contemporary research workflows instead model each document as a sequence of semantically coherent passages, each linked to its source location. This shift enables precise citation and verifiable answers, which are essential for academic work.

3. Method

We study a three-stage pipeline. First, documents are parsed and normalized into clean text with page markers preserved. Second, passages are indexed for both lexical and (in future work) semantic retrieval. Third, a reading interface presents extracted text alongside document metadata so claims can always be traced back to their source.

4. Results

Across a pilot corpus of twelve papers, structured extraction preserved section headings in 97% of cases and page anchors in 94% of cases. Researchers reported that a clean reading view with source metadata reduced the time needed to verify a claim by roughly half compared to raw PDF viewers.

5. Limitations and Future Work

Layout-heavy pages with multi-column figures remain challenging. Future work includes AI-assisted summarization, question answering with citations, and collection-level synthesis. Those capabilities are intentionally out of scope for this Month-1 foundation, which prioritizes reliable ingestion and management.

6. Conclusion

A strong document foundation — authentication, upload, extraction, and management — is the prerequisite for trustworthy AI research features. This application establishes that foundation before adding retrieval-augmented generation.`;

function seedDocuments(userId: string): ResearchDocument[] {
  const rows: Array<[string, string, "PDF" | "DOCX", number, number, number]> = [
    ["Research Methods in Artificial Intelligence", "research-methods-ai.pdf", "PDF", 24, 2_412_800, 0],
    ["Attention Is All You Need — Annotated Notes", "attention-notes.pdf", "PDF", 18, 1_843_200, 1],
    ["Retrieval-Augmented Generation Survey 2025", "rag-survey-2025.pdf", "PDF", 42, 5_221_376, 2],
    ["Statistical Methods for Experimental Design", "experimental-design.docx", "DOCX", 31, 1_124_400, 3],
    ["Vector Databases: A Comparative Study", "vector-databases.pdf", "PDF", 27, 3_102_912, 4],
    ["Academic Writing and Citation Guide", "citation-guide.docx", "DOCX", 12, 486_400, 6],
    ["Evaluation Metrics for Language Models", "lm-evaluation.pdf", "PDF", 22, 2_088_960, 8],
    ["Knowledge Management in Research Teams", "knowledge-management.pdf", "PDF", 16, 1_572_864, 11],
  ];
  return rows.map(([title, filename, type, pages, size, ago], i) => ({
    id: `mock-doc-${i + 1}`,
    user_id: userId,
    title,
    original_filename: filename,
    file_type: type,
    file_size: size,
    page_count: pages,
    extracted_text: SAMPLE_TEXT,
    file_path: `/mock/${filename}`,
    status: i === 6 ? "Processing" : "Ready",
    created_at: daysAgo(ago),
    updated_at: daysAgo(ago),
  }));
}

export function getMockUser(): User {
  if (typeof window === "undefined") {
    return { id: "mock-user-1", name: "Alex Morgan", email: "alex@university.edu", created_at: new Date().toISOString() };
  }
  const raw = window.localStorage.getItem(USER_KEY);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && typeof (parsed as User).id === "string") {
        return parsed as User;
      }
    } catch {
      /* reseed */
    }
  }
  const user: User = {
    id: "mock-user-1",
    name: "Alex Morgan",
    email: "alex@university.edu",
    created_at: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* quota / private mode — ignore */
  }
  return user;
}

export function setMockUser(user: User): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}

export function getMockDocuments(): ResearchDocument[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(DOCS_KEY);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as ResearchDocument[];
    } catch {
      /* reseed below */
    }
  }
  const seeded = seedDocuments(getMockUser().id);
  try {
    window.localStorage.setItem(DOCS_KEY, JSON.stringify(seeded));
  } catch {
    /* ignore */
  }
  return seeded;
}

export function saveMockDocuments(docs: ResearchDocument[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  } catch {
    /* ignore */
  }
}

export function resetMockData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DOCS_KEY);
  window.localStorage.removeItem(USER_KEY);
}

// Mock service functions (same signatures as lib/api.ts, for dev fallback)

export async function mockLogin(email: string): Promise<{ token: string; user: User }> {
  await delay();
  const user = getMockUser();
  const next: User = { ...user, email: email || user.email };
  setMockUser(next);
  getMockDocuments(); // ensure seeded
  return { token: "mock-token-dev-only", user: next };
}

export async function mockRegister(name: string, email: string): Promise<User> {
  await delay();
  const user: User = {
    id: "mock-user-1",
    name: name || "Alex Morgan",
    email,
    created_at: new Date().toISOString(),
  };
  setMockUser(user);
  saveMockDocuments(seedDocuments(user.id));
  return user;
}

export async function mockGetDocuments(): Promise<ResearchDocument[]> {
  await delay(500);
  return getMockDocuments();
}

export async function mockUploadDocument(file: File, onProgress?: (p: number) => void): Promise<ResearchDocument> {
  for (let p = 8; p <= 100; p += 12) {
    await delay(140);
    onProgress?.(Math.min(p, 100));
  }
  const docs = getMockDocuments();
  const user = getMockUser();
  const doc: ResearchDocument = {
    id: `mock-doc-${Date.now()}`,
    user_id: user.id,
    title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
    original_filename: file.name,
    file_type: file.name.toLowerCase().endsWith(".docx") ? "DOCX" : "PDF",
    file_size: file.size || 1_240_000,
    page_count: 10 + Math.floor(Math.random() * 24),
    extracted_text: SAMPLE_TEXT,
    file_path: `/mock/${file.name}`,
    status: "Ready",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  saveMockDocuments([doc, ...docs]);
  return doc;
}
