"use client";

import { useState, useRef, useEffect } from "react";
import { User, UserPlus, X, Search, ChevronDown } from "lucide-react";

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface CustomerCaptureProps {
  value: CustomerSummary | null;
  onChange: (customer: CustomerSummary | null) => void;
}

export function CustomerCapture({ value, onChange }: CustomerCaptureProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"search" | "create">("search");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && mode === "search") {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open, mode]);

  useEffect(() => {
    if (mode !== "search") return;
    const timer = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      setLoading(true);
      try {
        const res = await fetch(`/api/customers?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.customers ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, mode]);

  function handleSelect(c: CustomerSummary) {
    onChange(c);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(typeof data.error === "string" ? data.error : "Failed to create");
        return;
      }
      onChange(data.customer);
      setOpen(false);
      setNewName("");
      setNewPhone("");
    } finally {
      setCreating(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setQuery("");
    setResults([]);
    setNewName("");
    setNewPhone("");
    setCreateError("");
  }

  /* --- Attached customer chip --- */
  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground leading-tight truncate">{value.name}</p>
          {value.phone && (
            <p className="text-[10px] text-muted-foreground leading-tight">{value.phone}</p>
          )}
        </div>
        <button
          onClick={() => onChange(null)}
          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Remove customer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label="Attach customer"
        className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
          open
            ? "border-primary/40 bg-primary/5 text-primary"
            : "border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
        }`}
      >
        <User className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Attach customer (optional)</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Inline expand panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-background bg-zinc-50 dark:bg-zinc-950 text-popover-foreground shadow-xl ring-1 ring-border/10">
          {/* Mode tabs */}
          <div className="flex border-b border-border bg-muted">
            <button
              onClick={() => setMode("search")}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                mode === "search"
                  ? "border-b-2 border-primary bg-background text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="h-3 w-3" />
              Search
            </button>
            <button
              onClick={() => setMode("create")}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                mode === "create"
                  ? "border-b-2 border-primary bg-background text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="h-3 w-3" />
              New
            </button>
          </div>

          <div className="p-3 space-y-2">
            {mode === "search" ? (
              <>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, phone or email..."
                  className="h-8 w-full rounded-md border bg-background px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="max-h-36 overflow-y-auto space-y-0.5">
                  {loading && (
                    <p className="py-2 text-center text-[10px] text-muted-foreground">Searching...</p>
                  )}
                  {!loading && query.trim() && results.length === 0 && (
                    <p className="py-2 text-center text-[10px] text-muted-foreground">No customers found</p>
                  )}
                  {results.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-tight">{c.name}</p>
                        {c.phone && (
                          <p className="text-[10px] text-muted-foreground leading-tight">{c.phone}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name *"
                  className="h-8 w-full rounded-md border bg-background px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="h-8 w-full rounded-md border bg-background px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                {createError && (
                  <p className="text-[10px] text-destructive">{createError}</p>
                )}
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="h-8 w-full rounded-md bg-primary text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create & attach"}
                </button>
              </>
            )}
          </div>

          <div className="border-t border-border bg-muted px-3 py-1.5">
            <button
              onClick={handleClose}
              className="w-full text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
