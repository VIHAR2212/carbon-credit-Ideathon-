"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-carbon-950 p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center space-x-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-black font-extrabold text-lg">
            C
          </div>
          <div>
            <h1 className="font-extrabold tracking-tight text-white text-base leading-none">CARBONCHAIN</h1>
            <span className="text-[10px] text-carbon-400 font-medium block mt-1 leading-tight">
              Trusted infrastructure for India&apos;s carbon market
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Sign in</h2>
            <p className="text-xs text-carbon-400 mt-1">Registry access is provisioned by your administrator.</p>
          </div>

          {localError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{localError}</div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-carbon-400 block mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                placeholder="you@organization.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-carbon-400 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold text-xs rounded-xl transition-colors"
          >
            {submitting ? "Signing in..." : "SIGN IN"}
          </button>
        </form>

        <p className="text-center text-[11px] text-carbon-500 mt-4">
          Prototype registry — demonstration data only, not an official CCTS/BEE system.
        </p>
      </div>
    </div>
  );
}
