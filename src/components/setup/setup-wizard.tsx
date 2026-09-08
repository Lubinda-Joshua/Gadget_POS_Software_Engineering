"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetupStatus {
  envOk: boolean;
  dbConnected: boolean;
  dbInitialized: boolean;
  hasAdmin: boolean;
  setupComplete: boolean;
  missingEnv: string[];
  dbError?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = [
  "Welcome",
  "System Check",
  "Database",
  "Admin Account",
  "Business Info",
  "Done!",
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          ok ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"
        }`}
      >
        {ok ? "✓" : "✗"}
      </span>
      <span className={`text-sm ${ok ? "text-gray-700" : "text-red-500"}`}>{label}</span>
    </div>
  );
}

function CopyBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative mt-2 rounded-lg border border-gray-700 bg-gray-900">
      <pre className="overflow-x-auto p-3 pr-16 text-xs break-all whitespace-pre-wrap text-emerald-400">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 transition-colors hover:bg-gray-600"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-lg border border-gray-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm text-gray-600 transition-colors hover:bg-gray-50"
      >
        <span>{title}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 text-sm text-gray-600">{children}</div>
      )}
    </div>
  );
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-200/80">
      {children}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / (total - 1)) * 100);
  return (
    <div className="mb-4 w-full max-w-lg">
      <div className="mb-1 flex justify-between text-xs text-gray-400">
        <span>
          Step {step + 1} of {total}
        </span>
        <span>{STEP_LABELS[step]}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200">
        <div
          className="h-1.5 rounded-full bg-[#f5c518] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Step 0 — Welcome ─────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  const features = [
    { icon: "📡", text: "Works offline — never lose a sale" },
    { icon: "🖨️", text: "Thermal & browser receipt printing" },
    { icon: "👥", text: "Admin + cashier role management" },
    { icon: "📊", text: "Daily reports & CSV export" },
    { icon: "🎨", text: "Custom brand colors and logo" },
  ];

  return (
    <StepCard>
      <div className="px-8 py-10 text-center">
        <div className="mb-4 text-5xl">🏪</div>
        <h1 className="mb-2 text-2xl font-bold text-[#0f2044]">Welcome to Gadget POS</h1>
        <p className="mb-8 text-gray-500">
          Let&apos;s set up your store in just a few steps. No technical knowledge required.
        </p>
        <ul className="mb-10 space-y-3 text-left">
          {features.map((f) => (
            <li key={f.text} className="flex items-center gap-3 text-sm text-gray-600">
              <span className="text-lg">{f.icon}</span>
              {f.text}
            </li>
          ))}
        </ul>
        <button
          onClick={onNext}
          className="w-full rounded-xl bg-[#f5c518] py-3 text-sm font-bold text-[#0f2044] shadow-md shadow-[#f5c518]/30 transition-colors hover:bg-yellow-400"
        >
          Get Started →
        </button>
      </div>
    </StepCard>
  );
}

// ─── Step 1 — System Check ────────────────────────────────────────────────────

function StepSystemCheck({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/setup/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({
        envOk: false,
        dbConnected: false,
        dbInitialized: false,
        hasAdmin: false,
        setupComplete: false,
        missingEnv: ["DATABASE_URL", "BETTER_AUTH_SECRET"],
        dbError: "Could not connect to the server.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const missingDbUrl = status?.missingEnv.includes("DATABASE_URL");
  const missingSecret = status?.missingEnv.includes("BETTER_AUTH_SECRET");

  return (
    <StepCard>
      <div className="px-6 pt-8 pb-2">
        <h2 className="mb-1 text-xl font-bold text-[#0f2044]">System Check</h2>
        <p className="mb-6 text-sm text-gray-500">
          We&apos;ll verify your environment variables are configured correctly.
        </p>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
            <Spinner /> Checking your configuration…
          </div>
        )}

        {!loading && status && (
          <div className="space-y-1">
            <Check
              ok={!missingDbUrl}
              label={
                missingDbUrl ? "DATABASE_URL — not set (required)" : "DATABASE_URL — configured ✓"
              }
            />
            <Check
              ok={!missingSecret}
              label={
                missingSecret
                  ? "BETTER_AUTH_SECRET — not set (required)"
                  : "BETTER_AUTH_SECRET — configured ✓"
              }
            />
          </div>
        )}

        {!loading && status && !status.envOk && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              How to fix
            </p>
            <Collapsible title="📄 Create a .env.local file">
              <p className="mt-3 mb-2 text-gray-600">
                Create a file named <code className="font-semibold text-[#0f2044]">.env.local</code>{" "}
                in the root of your project with the following content:
              </p>
              <CopyBlock
                code={`DATABASE_URL="postgresql://postgres:password@localhost:5432/gadget_pos"
BETTER_AUTH_SECRET="${Array.from(crypto.getRandomValues(new Uint8Array(32)))
                  .map((b) => b.toString(16).padStart(2, "0"))
                  .join("")}"`}
              />
              <p className="mt-3 text-xs text-gray-400">
                After saving, restart the dev server with{" "}
                <code className="font-semibold text-[#0f2044]">pnpm dev</code> and click{" "}
                <strong>Check Again</strong>.
              </p>
            </Collapsible>

            <Collapsible title="🐋 Start PostgreSQL with Docker">
              <p className="mt-3 mb-2 text-gray-600">
                If you don&apos;t have PostgreSQL running, start it with Docker:
              </p>
              <CopyBlock code="docker compose up -d postgres" />
              <p className="mt-2 text-gray-600">
                Don&apos;t have Docker? Download it at{" "}
                <a
                  href="https://docker.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#0f2044] underline"
                >
                  docker.com
                </a>
              </p>
            </Collapsible>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 px-6 py-5">
        <button
          onClick={onBack}
          className="text-sm text-gray-400 transition-colors hover:text-gray-700"
        >
          ← Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={check}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? <Spinner /> : "Check Again"}
          </button>
          <button
            onClick={onNext}
            disabled={!status?.envOk || loading}
            className="rounded-lg bg-[#f5c518] px-5 py-2 text-sm font-bold text-[#0f2044] shadow-sm transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Continue →
          </button>
        </div>
      </div>
    </StepCard>
  );
}

// ─── Step 2 — Database ────────────────────────────────────────────────────────

function StepDatabase({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrateOutput, setMigrateOutput] = useState("");
  const [migrateError, setMigrateError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/setup/status");
      setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const runMigrations = async () => {
    setMigrating(true);
    setMigrateOutput("");
    setMigrateError("");
    try {
      const res = await fetch("/api/setup/migrate", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setMigrateOutput(data.output || "Database initialized successfully.");
        await checkStatus();
      } else {
        setMigrateError(data.error || "Migration failed.");
      }
    } catch {
      setMigrateError("Failed to connect to server.");
    } finally {
      setMigrating(false);
    }
  };

  const canContinue = status?.dbConnected && status?.dbInitialized;

  return (
    <StepCard>
      <div className="px-6 pt-8 pb-2">
        <h2 className="mb-1 text-xl font-bold text-[#0f2044]">Database Setup</h2>
        <p className="mb-6 text-sm text-gray-500">
          Connect to your PostgreSQL database and initialize the tables.
        </p>

        {(loading || migrating) && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
            <Spinner /> {migrating ? "Running database setup…" : "Testing connection…"}
          </div>
        )}

        {!loading && status && (
          <div className="space-y-1">
            {status.dbConnected ? (
              <div className="flex items-center gap-3 py-2">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">
                  ✓
                </span>
                <span className="text-sm font-medium text-gray-700">
                  Database connection — Connected successfully
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-2">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-500">
                  ✗
                </span>
                <span className="text-sm font-medium text-red-500">
                  Database connection — Failed to connect
                </span>
              </div>
            )}

            {status.dbConnected &&
              (status.dbInitialized ? (
                <div className="flex items-center gap-3 py-2">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">
                    ✓
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    Database tables — Schema is up to date
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">
                    !
                  </span>
                  <span className="text-sm font-medium text-amber-600">
                    Database tables — Ready to be initialized
                  </span>
                </div>
              ))}
          </div>
        )}

        {!loading && status?.dbError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="mb-1 text-xs font-semibold text-red-600">Connection error</p>
            <p className="font-mono text-xs text-red-500">{status.dbError}</p>
          </div>
        )}

        {migrateOutput && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="font-mono text-xs whitespace-pre-wrap text-emerald-700">
              {migrateOutput}
            </p>
          </div>
        )}

        {migrateError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="mb-1 text-xs font-semibold text-red-600">Error</p>
            <p className="font-mono text-xs whitespace-pre-wrap text-red-500">{migrateError}</p>
          </div>
        )}

        {!loading && status && !status.dbConnected && (
          <Collapsible title="🐋 How to start PostgreSQL">
            <p className="mt-3 mb-2 text-gray-600">Run this command to start the database:</p>
            <CopyBlock code="docker compose up -d postgres" />
            <p className="mt-2 text-xs text-gray-400">
              Then click <strong>Test Connection</strong> again.
            </p>
          </Collapsible>
        )}

        {!loading && status?.dbConnected && !status.dbInitialized && !migrateOutput && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              <strong>Ready to initialize!</strong> Click the button below to create all required
              database tables. This takes about 5–10 seconds.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 px-6 py-5">
        <button
          onClick={onBack}
          className="text-sm text-gray-400 transition-colors hover:text-gray-700"
        >
          ← Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={checkStatus}
            disabled={loading || migrating}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Test Connection
          </button>
          {status?.dbConnected && !status.dbInitialized && (
            <button
              onClick={runMigrations}
              disabled={migrating}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-400 disabled:opacity-40"
            >
              {migrating ? <Spinner /> : "Initialize DB"}
            </button>
          )}
          <button
            onClick={onNext}
            disabled={!canContinue}
            className="rounded-lg bg-[#f5c518] px-5 py-2 text-sm font-bold text-[#0f2044] shadow-sm transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Continue →
          </button>
        </div>
      </div>
    </StepCard>
  );
}

// ─── Step 3 — Admin Account ───────────────────────────────────────────────────

function StepAdminAccount({
  onNext,
  onBack,
  setAdminEmail,
}: {
  onNext: () => void;
  onBack: () => void;
  setAdminEmail: (e: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (name.trim().length < 2) return "Name must be at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/setup/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (data.ok) {
        setAdminEmail(data.email);
        onNext();
      } else {
        setError(typeof data.error === "string" ? data.error : "Failed to create account.");
      }
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-[#0f2044] focus:bg-white focus:ring-2 focus:ring-[#0f2044]/10";

  return (
    <StepCard>
      <form onSubmit={submit}>
        <div className="px-6 pt-8 pb-2">
          <h2 className="mb-1 text-xl font-bold text-[#0f2044]">Create Admin Account</h2>
          <p className="mb-6 text-sm text-gray-500">
            This account will have full access to all settings and reports.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                autoComplete="name"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@mystore.com"
                autoComplete="email"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-gray-400 transition-colors hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-gray-400 transition-colors hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 px-6 py-5">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-400 transition-colors hover:text-gray-700"
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[#f5c518] px-6 py-2.5 text-sm font-bold text-[#0f2044] shadow-sm transition-colors hover:bg-yellow-400 disabled:opacity-40"
          >
            {loading && <Spinner />} Create Account →
          </button>
        </div>
      </form>
    </StepCard>
  );
}

// ─── Step 4 — Business Settings ───────────────────────────────────────────────

function StepBusinessSettings({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [businessName, setBusinessName] = useState("");
  const [currency] = useState("K");
  const [currencyDecimals, setCurrencyDecimals] = useState("2");
  const [taxRate, setTaxRate] = useState("0");
  const [taxName, setTaxName] = useState("Tax");
  const [receiptFooter, setReceiptFooter] = useState("Thank you for your purchase!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setError("Business name is required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          currency,
          currencyDecimals: Number(currencyDecimals),
          taxRate: Number(taxRate),
          taxName,
          receiptFooter,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onNext();
      } else {
        setError(typeof data.error === "string" ? data.error : "Failed to save settings.");
      }
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-[#0f2044] focus:bg-white focus:ring-2 focus:ring-[#0f2044]/10";

  return (
    <StepCard>
      <form onSubmit={submit}>
        <div className="px-6 pt-8 pb-2">
          <h2 className="mb-1 text-xl font-bold text-[#0f2044]">Business Information</h2>
          <p className="mb-6 text-sm text-gray-500">
            This appears on your receipts and throughout the POS. You can change it later in
            Settings.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Business Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="My Awesome Store"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={currency}
                  readOnly
                  maxLength={5}
                  placeholder="K"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Decimal Places
                </label>
                <select
                  value={currencyDecimals}
                  onChange={(e) => setCurrencyDecimals(e.target.value)}
                  className={inputClass}
                >
                  <option value="0">0 (e.g. ¥100)</option>
                  <option value="2">2 (e.g. K9.99)</option>
                  <option value="3">3 (e.g. 1.250 KD)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Tax Name
                </label>
                <input
                  type="text"
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  placeholder="VAT"
                  maxLength={30}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Receipt Footer{" "}
                <span className="font-normal text-gray-400 normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                maxLength={200}
                placeholder="Thank you for your purchase!"
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 px-6 py-5">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-400 transition-colors hover:text-gray-700"
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[#f5c518] px-6 py-2.5 text-sm font-bold text-[#0f2044] shadow-sm transition-colors hover:bg-yellow-400 disabled:opacity-40"
          >
            {loading && <Spinner />} Save & Launch →
          </button>
        </div>
      </form>
    </StepCard>
  );
}

// ─── Step 5 — Done! ───────────────────────────────────────────────────────────

function StepDone({ adminEmail }: { adminEmail: string }) {
  const router = useRouter();

  return (
    <StepCard>
      <div className="px-8 py-12 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600">
          ✓
        </div>
        <h2 className="mb-2 text-2xl font-bold text-[#0f2044]">You&apos;re all set!</h2>
        <p className="mb-2 text-gray-500">Your Gadget POS is ready to use.</p>
        {adminEmail && (
          <p className="mb-8 text-sm text-gray-400">
            Admin account: <span className="font-semibold text-[#0f2044]">{adminEmail}</span>
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.push("/pos")}
            className="w-full rounded-xl bg-[#f5c518] py-3 text-sm font-bold text-[#0f2044] shadow-md shadow-[#f5c518]/30 transition-colors hover:bg-yellow-400"
          >
            Open POS →
          </button>
          <button
            onClick={() => router.push("/products")}
            className="w-full rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            Add Products First
          </button>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          You can change your business settings anytime in the{" "}
          <button
            onClick={() => router.push("/settings")}
            className="font-medium text-[#0f2044] underline"
          >
            Settings
          </button>{" "}
          page.
        </p>
      </div>
    </StepCard>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [adminEmail, setAdminEmail] = useState("");

  // On mount: if already set up, redirect to login
  useEffect(() => {
    fetch("/api/setup/status")
      .then((r) => r.json())
      .then((data: SetupStatus) => {
        if (data.setupComplete) {
          router.replace("/login");
        }
      })
      .catch(() => {});
  }, [router]);

  const next = () => setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="flex w-full flex-col items-center">
      {step < STEP_LABELS.length - 1 && <ProgressBar step={step} total={STEP_LABELS.length} />}

      {step === 0 && <StepWelcome onNext={next} />}
      {step === 1 && <StepSystemCheck onNext={next} onBack={back} />}
      {step === 2 && <StepDatabase onNext={next} onBack={back} />}
      {step === 3 && <StepAdminAccount onNext={next} onBack={back} setAdminEmail={setAdminEmail} />}
      {step === 4 && <StepBusinessSettings onNext={next} onBack={back} />}
      {step === 5 && <StepDone adminEmail={adminEmail} />}
    </div>
  );
}
