/**
 * Student-focused content layer — frontend only.
 * Static venue data, paper-structure guidance and roadmap stages.
 * Progress (checklists) is persisted per-browser in localStorage
 * by the pages that use it. No backend calls here.
 */

export type VenueType = "Conference" | "Journal";

export interface Venue {
  id: string;
  name: string;
  short: string;
  type: VenueType;
  field: string;
  /** ISO date, or null for rolling submissions. */
  deadline: string | null;
  location: string;
  acceptance: string;
  acceptancePct: number;
  fee: string;
  whyStudents: string;
}

export const VENUES: Venue[] = [
  {
    id: "aaai-sas",
    name: "AAAI Student Abstract & Poster Program",
    short: "AAAI-SAS",
    type: "Conference",
    field: "AI / ML",
    deadline: "2026-11-24",
    location: "Singapore · Hybrid",
    acceptance: "~35%",
    acceptancePct: 35,
    fee: "Free for students",
    whyStudents: "2-page abstracts welcome. Built exactly for first-time authors.",
  },
  {
    id: "acl-srw",
    name: "ACL Student Research Workshop",
    short: "ACL-SRW",
    type: "Conference",
    field: "NLP",
    deadline: "2027-01-09",
    location: "Vienna · Hybrid",
    acceptance: "~40%",
    acceptancePct: 40,
    fee: "Free for students",
    whyStudents: "Thesis proposals and class projects accepted. Mentors assigned to authors.",
  },
  {
    id: "iclr-tiny",
    name: "ICLR Tiny Papers Track",
    short: "ICLR-TINY",
    type: "Conference",
    field: "AI / ML",
    deadline: "2027-01-22",
    location: "Rio de Janeiro · Hybrid",
    acceptance: "~30%",
    acceptancePct: 30,
    fee: "$25",
    whyStudents: "Short, sharp ideas beat long papers here. Great first venue.",
  },
  {
    id: "sigir-short",
    name: "SIGIR Short Papers",
    short: "SIGIR",
    type: "Conference",
    field: "Retrieval / IR",
    deadline: "2027-02-02",
    location: "Melbourne",
    acceptance: "~28%",
    acceptancePct: 28,
    fee: "$60",
    whyStudents: "4-page format. Retrieval work like RAG surveys fits perfectly.",
  },
  {
    id: "cvpr-ws",
    name: "CVPR Workshops",
    short: "CVPR-W",
    type: "Conference",
    field: "Vision",
    acceptance: "~45%",
    acceptancePct: 45,
    deadline: "2027-02-14",
    location: "Denver",
    fee: "$40",
    whyStudents: "Dozens of workshops, each with its own deadline. Workshop papers count.",
  },
  {
    id: "kdd-ads",
    name: "KDD Applied Data Science Track",
    short: "KDD-ADS",
    type: "Conference",
    field: "Data Science",
    deadline: "2027-02-20",
    location: "Vancouver",
    acceptance: "~25%",
    acceptancePct: 25,
    fee: "$75",
    whyStudents: "Applied projects with real datasets shine here — class work qualifies.",
  },
  {
    id: "icml-ws",
    name: "ICML Workshops",
    short: "ICML-W",
    type: "Conference",
    field: "AI / ML",
    deadline: "2027-03-12",
    location: "Seoul · Hybrid",
    acceptance: "~45%",
    acceptancePct: 45,
    fee: "$30",
    whyStudents: "Position papers and negative results welcome. Low pressure, real proceedings.",
  },
  {
    id: "ieee-access",
    name: "IEEE Access",
    short: "IEEE-ACCESS",
    type: "Journal",
    field: "General CS",
    deadline: null,
    location: "Online · Rolling",
    acceptance: "~30%",
    acceptancePct: 30,
    fee: "$1,950 APC",
    whyStudents: "No deadline, fast review (~6 weeks). Ask your department about APC waivers.",
  },
  {
    id: "sncs",
    name: "SN Computer Science (Springer)",
    short: "SN-CS",
    type: "Journal",
    field: "General CS",
    deadline: null,
    location: "Online · Rolling",
    acceptance: "~40%",
    acceptancePct: 40,
    fee: "Discounted APC",
    whyStudents: "Student-friendly scope, rolling review. Good home for survey papers.",
  },
  {
    id: "jmlr",
    name: "Journal of Machine Learning Research",
    short: "JMLR",
    type: "Journal",
    field: "AI / ML",
    deadline: null,
    location: "Online · Rolling",
    acceptance: "~20%",
    acceptancePct: 20,
    fee: "Free",
    whyStudents: "Prestigious and free. Aim here only after a workshop paper or two.",
  },
];

const DAY = 86_400_000;

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(`${iso}T23:59:59`).getTime() - Date.now()) / DAY);
}

export function formatDeadline(iso: string): string {
  return new Date(`${iso}T12:00:00`)
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

// ------------------------------------------------- paper structure ---

export interface StructureSection {
  id: string;
  title: string;
  what: string;
  tips: string[];
}

export const STRUCTURE: StructureSection[] = [
  {
    id: "title",
    title: "Title",
    what: "One specific line a professor would click on.",
    tips: [
      "Put keywords up front: method + problem, not clever wordplay.",
      "Under 15 words. If it needs a colon, keep both halves short.",
    ],
  },
  {
    id: "abstract",
    title: "Abstract",
    what: "150–250 words: problem → method → result → impact.",
    tips: [
      "Write it LAST, after everything else is frozen.",
      "One sentence per move. Numbers beat adjectives ('+6.2 F1', not 'much better').",
    ],
  },
  {
    id: "intro",
    title: "Introduction",
    what: "Why this matters, what is missing, what you add.",
    tips: [
      "End with an explicit contributions list (bullets are fine).",
      "Admissions readers often read only this + conclusion. Make both self-contained.",
    ],
  },
  {
    id: "related",
    title: "Related Work",
    what: "Group papers by approach and compare — never just list.",
    tips: [
      "A comparison table (method × data × result) impresses reviewers fast.",
      "Cite generously. Missing a key citation is the #1 student rejection reason.",
    ],
  },
  {
    id: "method",
    title: "Methodology",
    what: "Enough detail that a classmate could reproduce it.",
    tips: [
      "Datasets, splits, hyperparameters, hardware — all of it, in one place.",
      "One clean diagram beats three paragraphs of architecture prose.",
    ],
  },
  {
    id: "results",
    title: "Results",
    what: "Tables and figures first, interpretation after.",
    tips: [
      "Include ablations: what happens when you remove each piece?",
      "Report one honest limitation. Reviewers trust papers that do.",
    ],
  },
  {
    id: "conclusion",
    title: "Conclusion",
    what: "Restate the contribution and name the next step.",
    tips: [
      "Future work here becomes your SOP's 'what I want to research' paragraph.",
      "Keep it under half a page.",
    ],
  },
  {
    id: "refs",
    title: "References",
    what: "Every claim cited, one consistent style throughout.",
    tips: [
      "Build citations with the generator below — never hand-format.",
      "Check every DOI/link opens before submitting. Broken links look careless.",
    ],
  },
];

// --------------------------------------------------------- roadmap ---

export interface RoadmapStage {
  id: string;
  duration: string;
  title: string;
  body: string;
  tasks: string[];
  links: Array<{ label: string; href: string }>;
}

export const ROADMAP: RoadmapStage[] = [
  {
    id: "topic",
    duration: "WEEKS 1–3",
    title: "Pick a lane",
    body: "One field, one problem. Narrow beats ambitious for a first paper.",
    tasks: [
      "Choose 1 field (NLP, vision, systems…) and stick to it",
      "Read 5 recent survey papers and note what is unsolved",
      "Write a 1-page interest note you could explain aloud",
    ],
    links: [{ label: "Browse venues by field →", href: "/publish" }],
  },
  {
    id: "survey",
    duration: "WEEKS 4–8",
    title: "Survey the literature",
    body: "Upload everything you read. Your library becomes your evidence.",
    tasks: [
      "Upload 8–12 papers to your library",
      "Summarize each in 3 lines: method, result, gap",
      "Build a comparison table of approaches",
    ],
    links: [{ label: "Open my library →", href: "/documents" }],
  },
  {
    id: "draft",
    duration: "WEEKS 9–14",
    title: "Draft the paper",
    body: "Ugly first draft, then revise. Write the abstract last.",
    tasks: [
      "Complete every section in the structure checklist",
      "Generate all citations with the toolkit (no hand-formatting)",
      "Cut 20% of the words in the second pass",
    ],
    links: [{ label: "Open writing toolkit →", href: "/toolkit" }],
  },
  {
    id: "feedback",
    duration: "WEEKS 15–17",
    title: "Get feedback",
    body: "A professor's red ink is worth a month of solo polishing.",
    tasks: [
      "Share the draft with a professor or senior for review",
      "Revise at least twice from their comments",
      "Run a plagiarism self-check before anything leaves your laptop",
    ],
    links: [{ label: "Re-read your draft →", href: "/documents" }],
  },
  {
    id: "publish",
    duration: "WEEKS 18–22",
    title: "Submit it",
    body: "Pick a venue by deadline, format camera-ready, send it off.",
    tasks: [
      "Shortlist 2 venues: one workshop + one rolling journal",
      "Format exactly to the venue template (fonts, margins, pages)",
      "Submit — and start the next idea while you wait",
    ],
    links: [{ label: "Find your venue →", href: "/publish" }],
  },
  {
    id: "abroad",
    duration: "WITH APPLICATIONS",
    title: "Use it for abroad",
    body: "One published line on your SOP changes how committees read you.",
    tasks: [
      "Add the paper to your SOP, resume and LinkedIn",
      "Create a Google Scholar profile and link the paper",
      "Email 2–3 professors whose work connects to yours",
    ],
    links: [{ label: "Back to dashboard →", href: "/dashboard" }],
  },
];

export const ABROAD_PHASES: Array<[string, string, string]> = [
  ["MONTHS 1–2", "FOUNDATION", "Topic locked, 10 papers surveyed, interest note written."],
  ["MONTHS 3–5", "DRAFT", "Full draft done, mentor feedback folded in, citations clean."],
  ["MONTHS 6–7", "PUBLISH", "Submitted to a workshop or rolling journal before deadlines."],
  ["MONTHS 8–12", "APPLY", "SOP + LORs + shortlist done, paper link attached everywhere."],
];

// ------------------------------------------------------- citations ---

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return parts.length > 1 ? (parts[parts.length - 1] as string) : (parts[0] as string);
}

export interface CiteInput {
  authors: string;
  year: string;
  title: string;
  venue: string;
  kind: "Conference" | "Journal";
}

function splitAuthors(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((a) => a.trim())
    .filter(Boolean);
}

export function citeAPA(c: CiteInput): string {
  const authors = splitAuthors(c.authors);
  if (authors.length === 0) return "";
  const names = authors.map((a) => {
    const parts = a.split(/\s+/).filter(Boolean);
    const last = parts.length > 1 ? (parts[parts.length - 1] as string) : (parts[0] as string) ?? "";
    const firsts = parts.length > 1 ? parts.slice(0, -1) : [];
    return `${cap(last)}, ${firsts.map((w) => `${(w.charAt(0) ?? "").toUpperCase()}.`).join(" ")}`.trim();
  });
  const byline = names.length === 1 ? names[0] : names.length === 2
    ? `${names[0]}, & ${names[1]}`
    : `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
  const year = c.year.trim() || "n.d.";
  return `${byline} (${year}). ${c.title.trim()}. ${c.venue.trim()}.`;
}

export function citeIEEE(c: CiteInput): string {
  const authors = splitAuthors(c.authors);
  if (authors.length === 0) return "";
  const names = authors.map((a) => {
    const parts = a.split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return cap(parts[0] ?? "");
    const last = parts[parts.length - 1] as string;
    const firsts = parts.slice(0, -1).map((w) => `${(w.charAt(0) ?? "").toUpperCase()}.`).join(" ");
    return `${firsts} ${cap(last)}`;
  });
  const byline = names.length === 1 ? names[0] : names.length === 2
    ? `${names[0]} and ${names[1]}`
    : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  return `${byline}, "${c.title.trim()}," ${c.venue.trim()}, ${c.year.trim()}.`;
}

export function citeBibTeX(c: CiteInput): string {
  const authors = splitAuthors(c.authors);
  if (authors.length === 0) return "";
  const firstWord = c.title.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "paper";
  const keyBase = `${lastName(authors[0] as string).toLowerCase()}${(c.year.trim() || "nodate").replace(/\D/g, "")}${firstWord}`;
  const entry = c.kind === "Journal" ? "article" : "inproceedings";
  const venueField = c.kind === "Journal" ? "journal" : "booktitle";
  return `@${entry}{${keyBase},\n  author = {${authors.join(" and ")}},\n  title = {${c.title.trim()}},\n  ${venueField} = {${c.venue.trim()}},\n  year = {${c.year.trim()}},\n}`;
}

function cap(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function bibKeyPreview(c: CiteInput): string {
  const authors = splitAuthors(c.authors);
  if (authors.length === 0 || !c.title.trim()) return "author2026keyword";
  const firstWord = c.title.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "paper";
  return `${lastName(authors[0] as string).toLowerCase()}${(c.year.trim() || "2026").replace(/\D/g, "")}${firstWord}`;
}

// ------------------------------------------------------- storage ---

export function loadChecked(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveChecked(key: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* quota / private mode — ignore */
  }
}
