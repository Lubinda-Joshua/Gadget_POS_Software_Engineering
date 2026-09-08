"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn.email({ email: email.trim(), password: password.trim() });

    if (result.error) {
      console.error("[login error]", result.error);
      const msg = result.error.message ?? result.error.code ?? "Sign-in failed";
      setError(`${msg} (status: ${result.error.status ?? "?"})`);
      setLoading(false);
      return;
    }

    window.location.href = "/pos";
  }

  const inputClass =
    "flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-[#0f2044] focus:bg-white focus:ring-2 focus:ring-[#0f2044]/10 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-50 px-4">
      {/* Soft decorative blob */}
      <div
        className="pointer-events-none fixed top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #0f2044 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #f5c518 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-3xl border border-gray-100 bg-white px-8 py-10 shadow-xl shadow-gray-200/80 space-y-7">
          {/* Logo / Brand */}
          <div className="flex flex-col items-center space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/android-chrome-192x192.png"
              alt="Gadget POS"
              className="h-16 w-16 rounded-2xl shadow-md shadow-gray-200"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[#0f2044]">Gadget POS</h1>
              <p className="text-sm text-gray-500 mt-0.5">Sign in to your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#f5c518] px-4 py-2 text-sm font-bold text-[#0f2044] shadow-md shadow-[#f5c518]/30 transition-all hover:bg-yellow-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c518] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Gadget POS — Open Source Point of Sale
        </p>
      </div>
    </div>
  );
}
