"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { ResearchDocument } from "@/types/document";

interface RenameDocumentProps {
  document: ResearchDocument | null;
  onClose: () => void;
  onSave: (id: string, title: string) => Promise<void>;
}

export function RenameDocument({ document, onClose, onSave }: RenameDocumentProps) {
  const [name, setName] = useState(document?.title ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [prevDocument, setPrevDocument] = useState(document);

  // Reset the form when a different document is selected. Done during
  // render (React's recommended alternative to syncing props in effects).
  if (prevDocument !== document) {
    setPrevDocument(document);
    setName(document?.title ?? "");
    setError(null);
  }

  async function handleSave() {
    if (!document) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a document name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(document.id, trimmed);
      onClose();
    } catch {
      setError("Could not rename this document. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={document !== null}
      onClose={onClose}
      title="Rename document"
      description={document ? `Current file: ${document.original_filename}` : undefined}
    >
      <Input
        label="New name"
        value={name}
        error={error ?? undefined}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
        placeholder="e.g. Research Methods in AI"
      />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving}>
          Save changes
        </Button>
      </div>
      <p className="mt-3 text-xs" style={{ color: "var(--color-tertiary-text)" }}>Sends PATCH /documents/{document?.id ?? "{id}"}.</p>
    </Modal>
  );
}

export default RenameDocument;
