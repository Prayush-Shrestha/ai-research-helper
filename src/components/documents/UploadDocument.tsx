"use client";

import { useRef, useState } from "react";
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
        className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragging ? "border-[#4F46E5] bg-[#EEF2FF]" : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1]"
        }`}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#64748B]">
          <path d="M12 16V4m0 0 4 4m-4-4L8 8M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-2 text-sm font-medium text-[#0F172A]">Drag and drop your file here</p>
        <p className="mt-0.5 text-[13px] text-[#64748B]">
          or <span className="font-medium text-[#4F46E5]">browse files</span>
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
        <div className="mt-3 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-3">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="mt-0.5 text-xs text-[#64748B]">{formatBytes(file.size)}</p>
          {progress !== null && (
            <div className="mt-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
              <div className="h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]">
                <div className="h-full rounded-full bg-[#4F46E5] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-[#64748B]">{progress}% uploaded</p>
            </div>
          )}
        </div>
      )}

      {validationError && (
        <p role="alert" className="mt-3 rounded-lg bg-[#FEF2F2] px-3 py-2.5 text-[13px] text-[#B91C1C]">
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
