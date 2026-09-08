"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface VoidItemModalProps {
  itemName: string;
  open: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function VoidItemModal({ itemName, open, onConfirm, onCancel }: VoidItemModalProps) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-card border shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h2 className="font-semibold">Void Item</h2>
          </div>
          <button onClick={onCancel} className="rounded p-1 hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Remove <span className="font-medium text-foreground">{itemName}</span> from the cart?
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reason (optional)</label>
            <input
              autoFocus
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer changed mind"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              onKeyDown={(e) => e.key === "Enter" && onConfirm(reason)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancel}
              className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(reason); setReason(""); }}
              className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Void Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
