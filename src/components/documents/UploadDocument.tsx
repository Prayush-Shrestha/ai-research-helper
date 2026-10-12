"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatBytes, validateResearchFile } from "@/lib/utils";

interface UploadDocumentProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, onProgress: (pct: number) => void) => Promise<unknown>;
}

export function UploadDocument({ open, onClose, onUpload }: UploadDocumentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | undefined) {
    if (!f) return;
    const err = validateResearchFile(f);
    setValidationError(err);
    setFile(err ? null : f);
    setProgress(null);
  }

  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    setProgress(0);
    try {
      await onUpload(file, (p) => setProgress(p));
      setFile(null);
      setProgress(null);
      onClose();
    } catch (e) {
      setValidationError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    if (uploading) return;
    setFile(null);
    setValidationError(null);
    setProgress(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Upload document" description="PDF or DOCX, up to 25 MB. Uses multipart/form-data → POST /documents/upload.">
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop a PDF or DOCX file here, or press Enter to browse"
        onKeyDown={(e) => {
          if (e.key === "Enter") inputRef.current?.click();
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed px-6 py-8 text-center transition-all"
        style={{
          borderColor: dragging ? "var(--color-research-accent)" : "var(--color-hairline)",
          background: dragging ? "rgba(183,255,223,0.05)" : "var(--color-graphite)",
        }}
      >
        <Upload size={26} aria-hidden style={{ color: "var(--color-secondary-text)" }} />
        <p className="mt-2 text-sm font-medium" style={{ color: "var(--color-primary-text)" }}>Drag and drop your file here</p>
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--color-secondary-text)" }}>
          or <span className="font-medium" style={{ color: "var(--color-research-accent)" }}>browse files</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="sr-only"
          aria-label="Choose a PDF or DOCX file"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      {file && (
        <div className="mt-3 rounded-xl px-3.5 py-3" style={{ border: "1px solid var(--color-hairline)", background: "var(--color-graphite)" }}>
          <p className="truncate text-sm font-medium" style={{ color: "var(--color-primary-text)" }}>{file.name}</p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-tertiary-text)" }}>{formatBytes(file.size)}</p>
          {progress !== null && (
            <div className="mt-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--color-control)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "var(--color-research-accent)" }} />
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--color-secondary-text)" }}>{progress}% uploaded</p>
            </div>
          )}
        </div>
      )}

      {validationError && (
        <p role="alert" className="mt-3 rounded-xl px-3 py-2.5 text-[13px]" style={{ background: "rgba(255,157,157,0.06)", border: "1px solid #4A2E2E", color: "#ff9d9d" }}>
          {validationError}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={!file || uploading} loading={uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </Modal>
  );
}
