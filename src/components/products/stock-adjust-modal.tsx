"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, X } from "lucide-react";

type StockAdjReason = "RECEIVED" | "DAMAGED" | "THEFT" | "CORRECTION" | "OPENING_COUNT";

const REASONS: { value: StockAdjReason; label: string; sign: 1 | -1 }[] = [
  { value: "RECEIVED", label: "Stock Received", sign: 1 },
  { value: "CORRECTION", label: "Manual Correction", sign: 1 },
  { value: "OPENING_COUNT", label: "Opening Count", sign: 1 },
  { value: "DAMAGED", label: "Damaged / Expired", sign: -1 },
  { value: "THEFT", label: "Theft / Loss", sign: -1 },
];

interface StockAdjustModalProps {
  productId: string;
  productName: string;
  currentStock: number;
  onClose: () => void;
}

export function StockAdjustModal({
  productId,
  productName,
  currentStock,
  onClose,
}: StockAdjustModalProps) {
  const router = useRouter();
  const [reason, setReason] = useState<StockAdjReason>("RECEIVED");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedReason = REASONS.find((r) => r.value === reason)!;
  const delta = selectedReason.sign * (parseInt(qty) || 0);
  const newStock = currentStock + delta;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const quantity = parseInt(qty);
    if (!quantity || quantity <= 0) { setError("Quantity must be a positive number"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/stock-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: delta, reason, note: note || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to save adjustment");
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Adjust Stock</h2>
            <p className="text-xs text-muted-foreground">{productName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          {/* Current stock display */}
          <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
            <p className="text-3xl font-bold">{currentStock}</p>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as StockAdjReason)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Quantity</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 10"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Preview */}
          {qty && parseInt(qty) > 0 && (
            <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${delta > 0 ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"}`}>
              {delta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {currentStock} → {newStock}
              <span className="ml-auto font-normal text-xs opacity-70">
                ({delta > 0 ? "+" : ""}{delta})
              </span>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Note <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. PO #1234"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !qty}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : "Apply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
