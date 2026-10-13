/**
 * Local research helpers — deterministic derivations from REAL extracted text.
 * No fabricated citations, page numbers, or AI claims. Everything returned
 * here is computed from the actual document text and labelled as a local preview.
 */

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\n(?=\d\.\s)/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function extractHeadings(text: string): string[] {
  const paras = splitParagraphs(text);
  return paras.filter((p) => /^\d\.\s[A-Z]/.test(p.slice(0, 24)) && p.length < 140).slice(0, 8);
}

export function localSummary(text: string, sentences = 3): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  // Split on sentence boundaries, keep it extractive — first N substantive sentences.
  const parts = clean.split(/(?<=[.!?])\s+/).filter((s) => s.length > 40);
  return parts.slice(0, sentences).join(" ");
}

export function extractTerminology(text: string, limit = 8): string[] {
  const words = text
    .replace(/[^A-Za-z\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 6);
  const stop = new Set([
    "because", "between", "through", "within", "without", "across", "against",
    "research", "papers", "paper", "study", "studies", "method", "methods",
    "result", "results", "however", "therefore", "though", "while",
  ]);
  const freq = new Map<string, number>();
  for (const w of words) {
    const k = w.toLowerCase();
    if (stop.has(k)) continue;
    freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

export function extractQuestions(text: string): string[] {
  const lower = text.toLowerCase();
  const out: string[] = [];
  if (lower.includes("limitation") || lower.includes("future work"))
    out.push("What limitations do the authors acknowledge, and what future work do they propose?");
  if (lower.includes("method") || lower.includes("pipeline") || lower.includes("approach"))
    out.push("How does the described method differ from the baselines it is compared against?");
  if (lower.includes("evaluation") || lower.includes("metric") || lower.includes("benchmark"))
    out.push("Which evaluation setup would best test whether these claims generalize?");
  out.push("What is the single most transferable finding for your own research question?");
  return out.slice(0, 4);
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  body: string;
  scope: string;
  created_at: string;
}

const CONV_KEY = "rl_conversations_v1";
const MAX_CONV = 30;

export function loadConversations(): ConversationMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONV_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as ConversationMessage[]).filter(
      (m) => m && typeof m.id === "string" && (m.role === "user" || m.role === "assistant") && typeof m.body === "string"
    );
  } catch {
    return [];
  }
}

export function saveConversationPair(question: string, answer: string, scope: string) {
  if (typeof window === "undefined") return;
  try {
    const now = new Date().toISOString();
    const rand = Math.random().toString(36).slice(2, 8);
    const pair: ConversationMessage[] = [
      { id: `m-${Date.now()}-${rand}-q`, role: "user", body: question, scope, created_at: now },
      { id: `m-${Date.now()}-${rand}-a`, role: "assistant", body: answer, scope, created_at: now },
    ];
    const next = [...pair, ...loadConversations()].slice(0, MAX_CONV);
    window.localStorage.setItem(CONV_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Build a grounded, extractive answer from real text — never invents pages or quotes. */
export function answerFromText(question: string, docs: Array<{ title: string; text: string }>): string {
  const q = question.toLowerCase();
  if (docs.length === 0) return "No documents are in scope yet. Upload a paper to the library, then ask again — answers are derived from your actual files.";

  const pickAction = (t: string) => {
    if (/summar/.test(q)) return `Summary — derived from the opening passages. ${localSummary(t, 3)}`;
    if (/finding|result|conclusion/.test(q)) {
      const paras = splitParagraphs(t).filter((p) => /result|finding|conclus|across|preserv|reduc/i.test(p));
      const top = paras.slice(0, 2).join(" ");
      return top ? `Key passages — quoted from extracted text. ${top.slice(0, 600)}` : localSummary(t, 3);
    }
    if (/method/.test(q)) {
      const paras = splitParagraphs(t).filter((p) => /method|pipeline|stage|pars|index/i.test(p));
      const top = paras.slice(0, 2).join(" ");
      return top ? `Methodology — as described in the document. ${top.slice(0, 600)}` : localSummary(t, 2);
    }
    if (/limitation/.test(q)) {
      const paras = splitParagraphs(t).filter((p) => /limitation|challeng|future|out of scope/i.test(p));
      const top = paras.slice(0, 2).join(" ");
      return top ? `Limitations — as stated by the authors. ${top.slice(0, 600)}` : "The extracted text does not state explicit limitations in a dedicated passage.";
    }
    if (/terminolog|concept|defin/.test(q)) {
      const terms = extractTerminology(t, 6);
      return terms.length ? `Recurring terminology in this document: ${terms.join(", ")}.` : localSummary(t, 2);
    }
    if (/question|gap/.test(q)) return extractQuestions(t).map((x, i) => `${i + 1}. ${x}`).join("\n");
    if (/compar/.test(q) && docs.length > 1) {
      return `Comparison scope: ${docs.length} documents selected. Each contributes its own extracted passages — open each reader to verify side by side. First document opens with: ${localSummary(docs[0].text, 2)}`;
    }
    return localSummary(t, 3);
  };

  const primary = docs[0];
  const answer = pickAction(primary.text);
  const scopeNote = docs.length > 1 ? `\n\nScoped to ${docs.length} documents — showing the top match (${primary.title}).` : `\n\nSource: ${primary.title} — extracted text only.`;
  return `${answer}${scopeNote}\n\nLocal preview — computed from your files, not generated AI. Full cited Q&A arrives with the backend.`;
}
