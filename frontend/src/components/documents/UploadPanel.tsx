"use client";

import { useEffect, useRef, useState } from "react";
import { validateResearchFile } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";

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
  const [selected, setSelected] = useState<File | null>(null);

  // Reset stale state whenever the panel is reopened (async continuation avoids sync set-state-in-effect).
  useEffect(() => {
    if (!open) return;
    void (async () => {
      await Promise.resolve();
      setError(null);
      setSelected(null);
      setDrag(false);
    })();
  }, [open]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const err = validateResearchFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSelected(file);
    try {
      await onUpload(file);
    } catch {
      // Parent surfaces the failure via phase/error UI; keep the file name for context.
      return;
    } finally {
      // Allow re-selecting the same file.
      if (inputRef.current) inputRef.current.value = "";
    }
    setSelected(null);
  }

  if (!open) return null;

  return (
    <section aria-label="Add a paper" className="gallery-card hover-lift page-enter !p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="eyebrow" style={{ fontSize: 11 }}><span className="dot" />Upload</span>
          <h3 className="mt-2" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--color-apple-ink)" }}>
            Drop a paper in.
          </h3>
          <p className="mt-1.5" style={{ fontSize: 17, color: "var(--color-graphite)" }}>
            PDF or Word, up to 15 MB. I check the file before it lands.
          </p>
        </div>
        <button onClick={onClose} aria-label="Close upload panel" className="ghost-pill shrink-0" style={{ fontSize: 14, padding: "8px 18px" }}>
          Close
        </button>
      </div>

      <div className="mt-5">
        {!uploading ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop a file here or choose one from your device"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
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
            className="liquid-dropzone flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-2 px-6 py-8 text-center"
            style={{
              border: `1.5px dashed ${drag ? "var(--color-electric-blue)" : "color-mix(in srgb, var(--color-electric-blue) 30%, transparent)"}`,
              background: drag ? "rgba(157,231,193,0.08)" : undefined,
              transition: "border-color .2s ease, background .2s ease",
            }}
          >
            <p style={{ fontSize: 19, fontWeight: 600, color: "var(--color-apple-ink)", letterSpacing: "-0.02em" }}>
              {drag ? "Let go, I've got it." : "Drag it here"}
            </p>
            <p style={{ fontSize: 17, color: "var(--color-graphite)" }}>or</p>
            <span className="primary-button mt-1" style={{ pointerEvents: "none", fontSize: 15 }}>Pick from your files</span>
            <p className="footnote mt-2">PDF or Word, max 15 MB</p>
            <input ref={inputRef} type="file" accept=".pdf,.docx" className="sr-only" aria-label="Select document file" onChange={(e) => { void handleFile(e.target.files?.[0]); }} />
          </div>
        ) : (
          <div className="liquid-search rise rise-1" role="status" aria-live="polite" style={{ padding: 24 }}>
            <div className="flex items-center justify-between gap-3">
              <p className="truncate" style={{ fontSize: 17, fontWeight: 500, color: "var(--color-apple-ink)" }}>
                {selected ? selected.name : "Working on your file…"}
              </p>
              <p className="shrink-0" style={{ fontSize: 17, color: "var(--color-apple-ink)" }}>{progress}%</p>
            </div>
            {selected && (
              <p className="mt-0.5" style={{ fontSize: 12, color: "var(--color-slate)" }}>
                {formatBytes(selected.size)} · {selected.name.toLowerCase().endsWith(".docx") ? "DOCX" : "PDF"}
              </p>
            )}
            <div className="progress-sheen mt-4 h-[8px] w-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99 }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "rgba(157,231,193,0.9)", borderRadius: 99, transition: "width .3s ease", boxShadow: "0 0 16px rgba(157,231,193,0.5)" }} />
            </div>
            <p className="mt-3" style={{ fontSize: 15, color: "var(--color-graphite)" }}>
              <span className="pulse-dot mr-2 inline-block" style={{ width: 7, height: 7, borderRadius: 99, background: "rgba(157,231,193,0.9)", verticalAlign: "1px", boxShadow: "0 0 10px rgba(157,231,193,0.7)" }} />
              {phase}…
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4" style={{ fontSize: 15, color: "var(--color-alert)" }}>
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
