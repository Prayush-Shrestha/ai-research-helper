"use client";

import { useRef, useState } from "react";
import { validateResearchFile } from "@/lib/utils";

export function UploadPanel({
  open,
  onClose,
  onUpload,
  uploading,
  progress,
  phase,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  progress: number;
  phase: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const err = validateResearchFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    await onUpload(file);
  }

  return (
    <section
      aria-modal
      aria-label="Upload document"
      className="page-enter"
      style={{
        border: "1px solid var(--color-hairline)",
        borderRadius: "var(--radius-panel)",
        background: "var(--color-deep-black)",
      }}
    >
      <div className="flex items-start justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <div>
          <p className="font-tech" style={{ color: "var(--color-tertiary-text)" }}>
            ARCHIVE / INGEST
          </p>
          <h3
            className="font-display mt-2"
            style={{ fontSize: 32, lineHeight: 1.05, color: "var(--color-primary-text)" }}
          >
            Introduce a new document.
          </h3>
          <p className="mt-2 max-w-md text-[14px]" style={{ color: "var(--color-secondary-text)" }}>
            PDF and DOCX documents will be processed and prepared for knowledge indexing.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close upload panel"
          className="font-tech rounded-full px-4 py-2"
          style={{ border: "1px solid var(--color-hairline)", color: "var(--color-secondary-text)", fontSize: 10 }}
        >
          CLOSE ✕
        </button>
      </div>

      <div className="px-6 pb-6 sm:px-10 sm:pb-8">
        {!uploading ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop document here or activate to select a file"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              void handleFile(e.dataTransfer.files?.[0]);
            }}
            className="mt-6 flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 px-6 py-10 text-center"
            style={{
              border: `1px dashed ${drag ? "var(--color-research-accent)" : "var(--color-hairline)"}`,
              borderRadius: 12,
              background: drag ? "rgba(183,255,223,0.04)" : "var(--color-graphite)",
              transition: "background .25s ease, border-color .25s ease",
            }}
          >
            <p className="font-tech" style={{ color: "var(--color-primary-text)" }}>
              DROP DOCUMENT HERE
            </p>
            <p className="font-tech" style={{ color: "var(--color-tertiary-text)", fontSize: 10 }}>
              OR
            </p>
            <span
              className="font-tech rounded-full px-6 py-2.5"
              style={{ background: "var(--color-control)", border: "1px solid var(--color-hairline)", color: "var(--color-primary-text)" }}
            >
              SELECT FILE
            </span>
            <p className="micro-label mt-1" style={{ color: "var(--color-tertiary-text)" }}>
              PDF / DOCX — MAX 25 MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="sr-only"
              aria-label="Select document file"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
          </div>
        ) : (
          <div
            className="mt-6 px-6 py-8"
            style={{ border: "1px solid var(--color-hairline)", borderRadius: 12, background: "var(--color-graphite)" }}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-between">
              <p className="font-tech" style={{ color: "var(--color-primary-text)" }}>
                PROCESSING DOCUMENT
              </p>
              <p className="font-tech" style={{ color: "var(--color-research-accent)" }}>
                {progress}%
              </p>
            </div>
            <div
              className="progress-sheen mt-4 h-[6px] w-full overflow-hidden rounded-full"
              style={{ background: "var(--color-control)" }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "var(--color-research-accent)",
                  borderRadius: 99,
                  transition: "width .3s ease",
                }}
              />
            </div>
            <p className="font-tech mt-3" style={{ color: "var(--color-ai-accent)", fontSize: 10 }}>
              <span className="pulse-dot mr-2 inline-block" style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor", verticalAlign: "1px" }} />
              {phase.toUpperCase()}
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="font-tech mt-4" style={{ color: "#ff9d9d", fontSize: 11 }}>
            {error.toUpperCase()}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="micro-label" style={{ color: "var(--color-tertiary-text)" }}>
            SYSTEM READY — AWAITING ARTIFACT
          </p>
          <p className="micro-label hidden sm:block" style={{ color: "var(--color-tertiary-text)" }}>
            EXTRACT → INDEX → LINK
          </p>
        </div>
      </div>
    </section>
  );
}
