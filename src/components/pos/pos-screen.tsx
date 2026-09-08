"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "@/lib/translations";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "@/store/cart";
import { formatCurrency, cn } from "@/lib/utils";
import { Minus, Plus, Trash2, ClipboardList, MessageSquarePlus } from "lucide-react";
import { ProductSearch } from "./product-search";
import { PaymentPanel } from "./payment-panel";
import { CustomerCapture, type CustomerSummary } from "./customer-capture";
import { HeldOrdersModal } from "./held-orders-modal";
import { VoidItemModal } from "./void-item-modal";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { NumericKeypad } from "@/components/ui/numeric-keypad";
import { ReceiptModal } from "@/components/receipt/receipt-modal";
import { KeyboardShortcutsModal } from "./keyboard-shortcuts-modal";
import { usePosKeyboardShortcuts } from "@/hooks/use-pos-keyboard-shortcuts";
import type { ReceiptData, ReceiptSettings } from "@/components/receipt/receipt";

const DEFAULT_TAX_RATE = 0; // overridden via business settings

const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  name: "Gadget POS Store",
  logoUrl: null,
  currency: "K",
  currencyDecimals: 2,
  taxName: "Tax",
  receiptFooter: "Thank you for your business!",
};

export function POSScreen() {
  const t = useTranslations("pos");
  const [taxRate] = useState(DEFAULT_TAX_RATE);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [voidTargetId, setVoidTargetId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"search" | "cart">("search");
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [keypad, setKeypad] = useState<{ open: boolean; itemId: string; value: string }>({
    open: false,
    itemId: "",
    value: "1",
  });
  const prevItemsLenRef = useRef(0);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const focusSearch = useCallback(() => {
    const el = document.getElementById("pos-search-input") as HTMLInputElement | null;
    el?.focus();
    el?.select();
  }, []);

  usePosKeyboardShortcuts({
    onFocusSearch: focusSearch,
    onOpenPayment: () => {
      const btn = document.querySelector<HTMLButtonElement>("[data-charge-btn]");
      btn?.focus();
    },
    onHoldOrders: () => setShowHeldOrders(true),
    onShowHelp: () => setShowShortcuts((v) => !v),
    onEscape: () => {
      setShowShortcuts(false);
      setShowHeldOrders(false);
    },
  });

  const {
    items,
    removeItem,
    updateQuantity,
    updateItemNotes,
    subtotal,
    discountValue,
    taxAmount,
    total,
    clearCart,
    amountTendered,
    paymentMethod,
    paymentLines,
    tipAmount,
  } = useCartStore();

  const sub = subtotal();
  const disc = discountValue();
  const tax = taxAmount(taxRate);
  const tot = total(taxRate);
  const change = Math.max(0, (amountTendered ?? 0) - tot);

  // Auto-switch to cart tab on mobile whenever a new item is added
  useEffect(() => {
    if (items.length > prevItemsLenRef.current && items.length > 0) {
      setMobileTab("cart");
    }
    prevItemsLenRef.current = items.length;
  }, [items.length]);

  const [noteOpenFor, setNoteOpenFor] = useState<string | null>(null);

  if (!isClient) {
    return (
      <div className="bg-background flex h-full flex-col items-center justify-center space-y-4 rounded-lg border shadow-sm">
        <div className="bg-muted flex h-12 w-12 animate-pulse items-center justify-center rounded-full"></div>
        <div className="text-muted-foreground animate-pulse text-sm font-medium">
          Initializing POS...
        </div>
      </div>
    );
  }

  function handleSaleComplete(saleId: string) {
    const data: ReceiptData = {
      saleId,
      customerName: customer?.name || undefined,
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        total: i.price * i.quantity,
        notes: i.notes || undefined,
        serialNumber: i.serialNumber,
        imei: i.imei,
        warrantyMonths: i.warrantyMonths,
      })),
      subtotal: sub,
      discountAmount: disc,
      taxAmount: tax,
      tipAmount: tipAmount > 0 ? tipAmount : undefined,
      total: tot,
      paymentMethod,
      paymentLines: paymentLines.length > 0 ? paymentLines : undefined,
      amountTendered: amountTendered ?? 0,
      changeDue: change,
      createdAt: new Date(),
    };
    setReceiptData(data);
    window.dispatchEvent(new Event("gadget-pos-sale-complete"));
    clearCart();
    setCustomer(null);
  }

  function handleVoidItem(lineId: string) {
    setVoidTargetId(lineId);
  }

  function handleVoidConfirm(_reason?: string) {
    if (voidTargetId) removeItem(voidTargetId);
    setVoidTargetId(null);
  }

  const voidTargetItem = items.find((i) => (i.lineId ?? i.productId) === voidTargetId);

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Mobile tab bar */}
      <div className="flex shrink-0 border-b lg:hidden">
        <button
          onClick={() => setMobileTab("search")}
          className={cn(
            "-mb-px flex-1 border-b-2 py-3 text-sm font-medium transition-colors",
            mobileTab === "search"
              ? "text-primary border-primary"
              : "text-muted-foreground border-transparent"
          )}
        >
          Products
        </button>
        <button
          onClick={() => setMobileTab("cart")}
          className={cn(
            "-mb-px flex-1 border-b-2 py-3 text-sm font-medium transition-colors",
            mobileTab === "cart"
              ? "text-primary border-primary"
              : "text-muted-foreground border-transparent"
          )}
        >
          Cart
          {items.length > 0 && (
            <span className="bg-primary text-primary-foreground ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold">
              {items.length}
            </span>
          )}
        </button>
      </div>

      {/* Left: product search */}
      <div
        className={cn(
          "overflow-y-auto p-4 lg:flex-1 lg:border-r",
          mobileTab === "cart" ? "hidden lg:block" : "flex-1"
        )}
      >
        <ProductSearch />
      </div>

      {/* Right: cart + payment */}
      <div
        className={cn(
          "flex flex-col lg:w-[26rem] lg:flex-none lg:shrink-0",
          mobileTab === "search" ? "hidden lg:flex" : "flex flex-1"
        )}
      >
        {/* Cart toolbar */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="text-muted-foreground text-sm font-semibold">
            Cart {items.length > 0 ? `(${items.length})` : ""}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowHeldOrders(true)}
              className="hover:bg-accent flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Held Orders
            </button>
            <button
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (?)"
              className="hover:bg-accent text-muted-foreground flex h-6 w-6 items-center justify-center rounded border text-xs transition-colors"
            >
              ?
            </button>
          </div>
        </div>

        {/* Customer capture */}
        <div className="border-border bg-background relative z-10 border-b px-4 py-2.5">
          <CustomerCapture value={customer} onChange={setCustomer} />
        </div>

        {/* Cart items */}
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
              {t("cart_empty")}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.lineId ?? item.productId}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="overflow-hidden rounded-lg border"
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatCurrency(item.price)} each
                      </p>
                      {(item.serialNumber || item.imei) && (
                        <p className="mt-1 font-mono text-[10px] text-blue-600 dark:text-blue-400">
                          {item.serialNumber && `S/N ${item.serialNumber}`}
                          {item.serialNumber && item.imei && " · "}
                          {item.imei && `IMEI ${item.imei}`}
                        </p>
                      )}
                    </div>

                    {/* Qty controls */}
                    {item.unitId ? (
                      <span className="bg-muted rounded border px-3 py-1.5 text-xs font-medium">
                        1 unit
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.lineId ?? item.productId, item.quantity - 1)
                          }
                          className="hover:bg-accent flex h-8 w-8 items-center justify-center rounded border transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        {isTouchDevice ? (
                          <button
                            onClick={() =>
                              setKeypad({
                                open: true,
                                itemId: item.lineId ?? item.productId,
                                value: String(item.quantity),
                              })
                            }
                            className="bg-background hover:bg-accent h-8 w-14 rounded border px-1 text-center text-sm font-medium transition-all active:scale-95"
                            aria-label="Quantity — tap to edit"
                          >
                            {item.quantity}
                          </button>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val > 0)
                                updateQuantity(item.lineId ?? item.productId, val);
                            }}
                            onFocus={(e) => e.target.select()}
                            className="bg-background focus:ring-ring w-14 [appearance:textfield] rounded border px-1 py-0.5 text-center text-sm font-medium focus:ring-1 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            aria-label="Quantity"
                          />
                        )}
                        <button
                          onClick={() =>
                            updateQuantity(item.lineId ?? item.productId, item.quantity + 1)
                          }
                          className="hover:bg-accent flex h-8 w-8 items-center justify-center rounded border transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Line total */}
                    <span className="w-16 text-right text-sm font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </span>

                    {/* Note toggle */}
                    <button
                      onClick={() =>
                        setNoteOpenFor(
                          noteOpenFor === (item.lineId ?? item.productId)
                            ? null
                            : (item.lineId ?? item.productId)
                        )
                      }
                      className={`transition-colors ${
                        item.notes ? "text-primary" : "text-muted-foreground hover:text-primary"
                      }`}
                      aria-label="Add note"
                      title="Item note"
                    >
                      <MessageSquarePlus className="h-4 w-4" />
                    </button>

                    {/* Void item */}
                    <button
                      onClick={() => handleVoidItem(item.lineId ?? item.productId)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Inline notes */}
                  {noteOpenFor === (item.lineId ?? item.productId) && (
                    <div className="px-3 pb-2">
                      <input
                        autoFocus
                        type="text"
                        value={item.notes}
                        onChange={(e) =>
                          updateItemNotes(item.lineId ?? item.productId, e.target.value)
                        }
                        placeholder="Add modifier or note…"
                        className="bg-background focus:ring-ring w-full rounded border px-2 py-1 text-xs focus:ring-2 focus:outline-none"
                        onKeyDown={(e) => e.key === "Enter" && setNoteOpenFor(null)}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Order summary */}
        <div className="space-y-1 border-t p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <span>{formatCurrency(sub)}</span>
          </div>
          {disc > 0 && (
            <div className="flex justify-between text-green-600">
              <span>{t("discount")}</span>
              <span>−{formatCurrency(disc)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="text-muted-foreground flex justify-between">
              <span>{t("tax")}</span>
              <span>{formatCurrency(tax)}</span>
            </div>
          )}
          {tipAmount > 0 && (
            <div className="text-muted-foreground flex justify-between">
              <span>{t("tip")}</span>
              <span>{formatCurrency(tipAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>{t("total")}</span>
            <span>{formatCurrency(tot)}</span>
          </div>
        </div>

        {/* Payment */}
        <PaymentPanel
          taxRate={taxRate}
          onClear={() => {
            if (items.length > 0) setConfirmClear(true);
          }}
          onSaleComplete={handleSaleComplete}
          onHoldOrders={() => setShowHeldOrders(true)}
          customerId={customer?.id}
        />
      </div>

      {/* Held orders modal */}
      <HeldOrdersModal open={showHeldOrders} onClose={() => setShowHeldOrders(false)} />

      {/* Void item modal */}
      <VoidItemModal
        open={!!voidTargetId}
        itemName={voidTargetItem?.name ?? ""}
        onConfirm={handleVoidConfirm}
        onCancel={() => setVoidTargetId(null)}
      />

      {/* Receipt modal */}
      {receiptData && (
        <ReceiptModal
          open={true}
          onClose={() => setReceiptData(null)}
          data={receiptData}
          settings={DEFAULT_RECEIPT_SETTINGS}
        />
      )}

      {/* Clear cart confirmation */}
      <AlertDialog
        open={confirmClear}
        title="Clear cart?"
        description="This will remove all items from the current order."
        confirmLabel="Clear"
        cancelLabel="Keep"
        variant="destructive"
        onConfirm={() => {
          clearCart();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />

      {/* Numeric keypad for touch devices */}
      <NumericKeypad
        open={keypad.open}
        value={keypad.value}
        label={items.find((i) => (i.lineId ?? i.productId) === keypad.itemId)?.name}
        onValueChange={(v) => setKeypad((k) => ({ ...k, value: v }))}
        onConfirm={() => {
          const val = parseFloat(keypad.value);
          if (!isNaN(val) && val > 0) updateQuantity(keypad.itemId, val);
          setKeypad({ open: false, itemId: "", value: "1" });
        }}
        onCancel={() => setKeypad({ open: false, itemId: "", value: "1" })}
      />

      {/* Keyboard shortcuts modal */}
      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
