import { useEffect, useCallback } from "react";

interface PosShortcutOptions {
  onFocusSearch: () => void;
  onOpenPayment: () => void;
  onHoldOrders: () => void;
  onShowHelp: () => void;
  onEscape: () => void;
}

/**
 * POS keyboard shortcuts:
 * / or F2  → focus product search
 * F8       → open payment panel
 * F4       → open held orders
 * ?        → show shortcut cheat sheet
 * Escape   → close/dismiss
 */
export function usePosKeyboardShortcuts({
  onFocusSearch,
  onOpenPayment,
  onHoldOrders,
  onShowHelp,
  onEscape,
}: PosShortcutOptions) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";

      switch (e.key) {
        case "F2":
          e.preventDefault();
          onFocusSearch();
          break;
        case "/":
          if (!isInput) {
            e.preventDefault();
            onFocusSearch();
          }
          break;
        case "F4":
          e.preventDefault();
          onHoldOrders();
          break;
        case "F8":
          e.preventDefault();
          onOpenPayment();
          break;
        case "?":
          if (!isInput) {
            onShowHelp();
          }
          break;
        case "Escape":
          onEscape();
          break;
      }
    },
    [onFocusSearch, onOpenPayment, onHoldOrders, onShowHelp, onEscape]
  );

  useEffect(() => {
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handler]);
}
