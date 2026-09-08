"use client";

import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { key: "/ or F2", description: "Focus product search" },
  { key: "F4", description: "Open held orders" },
  { key: "F8", description: "Open payment panel" },
  { key: "Enter", description: "Add first search result to cart" },
  { key: "Escape", description: "Close modal / clear search" },
  { key: "?", description: "Show this cheat sheet" },
];

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {SHORTCUTS.map(({ key, description }) => (
                <tr key={key} className="py-2">
                  <td className="py-2.5 pr-4">
                    <kbd className="inline-flex items-center rounded border bg-muted px-2 py-0.5 text-xs font-mono font-medium">
                      {key}
                    </kbd>
                  </td>
                  <td className="py-2.5 text-muted-foreground">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-[11px] text-muted-foreground text-center">
            Press <kbd className="rounded border bg-muted px-1 text-xs font-mono">?</kbd> anytime to toggle this panel
          </p>
        </div>
      </div>
    </div>
  );
}
