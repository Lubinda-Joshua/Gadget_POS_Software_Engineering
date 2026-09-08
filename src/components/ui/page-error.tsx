"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface PageErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  label?: string;
}

export function PageError({ error, reset, label }: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center p-8">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        {label && <p className="text-sm text-muted-foreground">Error loading {label}</p>}
        {error.message && (
          <p className="text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1 max-w-md break-all">
            {error.message}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
