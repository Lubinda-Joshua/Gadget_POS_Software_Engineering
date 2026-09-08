"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface AlertDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}

export function AlertDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => confirmRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const dialog = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      aria-describedby={description ? "alert-dialog-desc" : undefined}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm rounded-lg border bg-background p-6 shadow-xl mx-4 animate-in fade-in zoom-in-95 duration-150">
        <h2 id="alert-dialog-title" className="text-base font-semibold">
          {title}
        </h2>
        {description && (
          <p id="alert-dialog-desc" className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
