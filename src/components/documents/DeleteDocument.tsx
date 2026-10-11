"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ResearchDocument } from "@/types/document";

interface DeleteDocumentProps {
  document: ResearchDocument | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteDocument({ document, onClose, onConfirm }: DeleteDocumentProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!document) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm(document.id);
      onClose();
    } catch {
      setError("Could not delete this document. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={document !== null}
      onClose={onClose}
      title="Delete document?"
      description="This document and its extracted content will be permanently removed."
    >
      {document && (
        <p className="rounded-lg bg-[#F8FAFC] px-3 py-2.5 text-sm font-medium text-[#334155]">
          {document.title}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-[13px] text-[#DC2626]">
          {error}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleDelete} loading={deleting}>
          Delete document
        </Button>
      </div>
    </Modal>
  );
}
