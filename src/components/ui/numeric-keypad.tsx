"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Delete, Check } from "lucide-react";

interface NumericKeypadProps {
  open: boolean;
  value: string;
  label?: string;
  onValueChange: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "⌫"] as const;

export function NumericKeypad({
  open,
  value,
  label,
  onValueChange,
  onConfirm,
  onCancel,
}: NumericKeypadProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Enter") { e.preventDefault(); onConfirm(); }
      if (e.key === "Escape") { e.preventDefault(); onCancel(); }
      if (e.key === "Backspace") {
        onValueChange(value.length > 1 ? value.slice(0, -1) : "0");
      }
      if (/^[0-9.]$/.test(e.key)) {
        handleTap(e.key);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value]);

  function handleTap(key: string) {
    if (key === "⌫") {
      onValueChange(value.length > 1 ? value.slice(0, -1) : "0");
      return;
    }
    if (key === ".") {
      if (value.includes(".")) return;
      onValueChange(value + ".");
      return;
    }
    const next = value === "0" ? key : value + key;
    // Prevent ridiculously long numbers
    if (next.length > 8) return;
    onValueChange(next);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="keypad-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/40"
            onClick={onCancel}
          />

          {/* Keypad sheet */}
          <motion.div
            key="keypad-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-[9999] bg-background border-t rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
          >
            {/* Display */}
            <div className="px-4 pt-4 pb-3 border-b">
              {label && <p className="text-xs text-muted-foreground mb-1">{label}</p>}
              <div className="flex items-center justify-between">
                <span className="text-3xl font-mono font-semibold tracking-tight">
                  {value || "0"}
                </span>
                <button
                  onClick={onCancel}
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Key grid */}
            <div className="grid grid-cols-3 gap-2 p-3">
              {KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => handleTap(key)}
                  className={`flex h-14 items-center justify-center rounded-xl text-lg font-medium transition-colors active:scale-95
                    ${key === "⌫"
                      ? "bg-muted text-muted-foreground hover:bg-muted/80"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-accent"
                    }`}
                >
                  {key === "⌫" ? <Delete className="h-5 w-5" /> : key}
                </button>
              ))}
            </div>

            {/* Confirm button */}
            <div className="px-3 pb-3">
              <button
                ref={confirmRef}
                onClick={onConfirm}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-base font-semibold transition-colors hover:bg-primary/90 active:scale-[0.98]"
              >
                <Check className="h-5 w-5" />
                Confirm
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
