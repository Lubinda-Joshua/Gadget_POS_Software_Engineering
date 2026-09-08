"use client";

import { useEffect, useRef, useState } from "react";
import { X, Printer } from "lucide-react";
import { Receipt } from "@/components/receipt/receipt";

interface RefundItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface RefundReceiptModalProps {
  open: boolean;
  onClose: () => void;
  saleId?: string;
  items: RefundItem[];
  refundTotal: number;
  reason?: string;
}

interface ReceiptSettings {
  name: string;
  logoUrl: string | null;
  currency: string;
  currencyDecimals: number;
  taxName: string;
  receiptFooter: string;
}

const FALLBACK_SETTINGS: ReceiptSettings = {
  name: "My Store",
  logoUrl: null,
  currency: "K",
  currencyDecimals: 2,
  taxName: "Tax",
  receiptFooter: "",
};

export function RefundReceiptModal({
  open,
  onClose,
  saleId,
  items,
  refundTotal,
  reason,
}: RefundReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<ReceiptSettings>(FALLBACK_SETTINGS);

  useEffect(() => {
    if (!open) return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings({ ...FALLBACK_SETTINGS, ...d }))
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const receiptData = {
    saleId,
    items,
    subtotal: refundTotal,
    discountAmount: 0,
    taxAmount: 0,
    total: refundTotal,
    paymentMethod: "REFUND",
    customerName: reason ? `Reason: ${reason}` : undefined,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <style>{`
        @media print {
          body > *:not(#refund-receipt-overlay) { display: none !important; }
          #refund-receipt-overlay { position: fixed; inset: 0; background: white; }
          #refund-receipt-overlay .no-print { display: none !important; }
        }
      `}</style>

      <div
        id="refund-receipt-overlay"
        className="w-full max-w-sm overflow-hidden rounded-xl border bg-white shadow-2xl"
      >
        {/* Toolbar */}
        <div className="no-print bg-card flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-destructive text-sm font-semibold">Refund Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <button onClick={onClose} className="hover:bg-accent rounded p-1 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Receipt preview with REFUND stamp */}
        <div ref={printRef} className="relative max-h-[70vh] overflow-y-auto bg-white p-4">
          {/* REFUND diagonal stamp */}
          <div
            className="no-print pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-20 select-none"
            aria-hidden
          >
            <span className="text-destructive rotate-[-35deg] text-5xl font-black tracking-widest">
              REFUND
            </span>
          </div>
          <Receipt data={receiptData} settings={settings} />
        </div>
      </div>
    </div>
  );
}
