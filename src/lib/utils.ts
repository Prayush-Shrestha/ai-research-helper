export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value >= 100 ? Math.round(value) : value.toFixed(value >= 10 ? 1 : 1)} ${units[i]}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (sameDay) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function timeGreeting(name?: string): string {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}` : part;
}

export const ACCEPTED_EXTENSIONS = [".pdf", ".docx"] as const;
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function validateResearchFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  const okExt = lower.endsWith(".pdf") || lower.endsWith(".docx");
  if (!okExt) return "Only PDF or DOCX files are supported.";
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE_BYTES)}.`;
  }
  if (file.size === 0) return "This file appears to be empty.";
  return null;
}

export function inferFileType(filename: string): "PDF" | "DOCX" {
  return filename.toLowerCase().endsWith(".docx") ? "DOCX" : "PDF";
}

export function friendlyApiError(message: string): string {
  // Never expose raw stack traces; map common cases to friendly copy.
  const lower = message.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("network"))
    return "Unable to reach the server. Check your connection and try again.";
  if (lower.includes("401") || lower.includes("unauthorized"))
    return "Your session has expired. Please sign in again.";
  return message || "Something went wrong. Please try again.";
}
