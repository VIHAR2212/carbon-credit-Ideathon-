"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { LegalLinks, LegalModal, LegalDoc } from "./legal-modal";

type Mode = "signin" | "signup";

export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [signupNotice, setSignupNotice] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setLocalError(null);
    setSignupNotice(null);
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSignupNotice(null);

    if (mode === "signup" && password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }
    if (mode === "signup" && !acceptedTerms) {
      setLocalError("You must accept the Terms & Conditions and Privacy Policy to register.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        const { needsEmailConfirmation } = await signUp(email, password);
        setSignupNotice(
          needsEmailConfirmation
            ? "Account created. Check your email to confirm before signing in."
            : "Account created. A registry administrator needs to assign your role and organization before you can access the registry — contact them, then sign in below."
        );
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : mode === "signin" ? "Sign-in failed" : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex items-center space-x-2.5 justify-center mb-8">
          <Image src="/logo-icon.png" alt="CarbonChain" width={36} height={36} className="w-9 h-9 shrink-0" priority />
          <div>
            <h1 className="font-extrabold tracking-tight text-white text-base leading-none">CARBONCHAIN</h1>
            <span className="text-[13px] text-carbon-200 font-medium block mt-1 leading-tight">
              Trusted infrastructure for India&apos;s carbon market
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-carbon-850/90 backdrop-blur-md border border-carbon-750 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center bg-carbon-900 p-1 rounded-xl border border-carbon-750">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                mode === "signin" ? "bg-carbon-750 text-white" : "text-carbon-300 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                mode === "signup" ? "bg-carbon-750 text-white" : "text-carbon-300 hover:text-slate-200"
              }`}
            >
              Register
            </button>
          </div>

          <div>
            <h2 className="text-base font-bold text-white">{mode === "signin" ? "Sign in" : "Create an account"}</h2>
            <p className="text-sm text-carbon-300 mt-1">
              {mode === "signin"
                ? "Registry access is provisioned by your administrator."
                : "New accounts still need a role assigned by a registry administrator before use."}
            </p>
          </div>

          {signupNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">{signupNotice}</div>
          )}
          {localError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{localError}</div>
          )}

          <div className="space-y-3 text-sm">
            <div>
              <label className="text-carbon-300 block mb-1">Email</label>
              <input
                type="email"
                required
                disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono disabled:opacity-60"
                placeholder="you@organization.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-carbon-300 block mb-1">Password</label>
              <input
                type="password"
                required
                disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono disabled:opacity-60"
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={mode === "signup" ? 8 : undefined}
              />
            </div>
            {mode === "signup" && (
              <div>
                <label className="text-carbon-300 block mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  disabled={submitting}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono disabled:opacity-60"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
            )}
          </div>

          {mode === "signup" && (
            <label className="flex items-start space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                disabled={submitting}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[#0d9668] shrink-0"
              />
              <span className="text-sm text-carbon-300 leading-snug">
                I have read and accept the{" "}
                <button type="button" onClick={() => setLegalDoc("terms")} className="text-brand-400 underline hover:text-brand-500">
                  Terms &amp; Conditions
                </button>{" "}
                and{" "}
                <button type="button" onClick={() => setLegalDoc("privacy")} className="text-brand-400 underline hover:text-brand-500">
                  Privacy Policy
                </button>
                .
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-90 disabled:cursor-not-allowed text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center min-h-[38px]"
          >
            {submitting ? (mode === "signin" ? "Signing in..." : "Creating account...") : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>
        </form>

        <div className="text-center mt-4 space-y-2">
          <p className="text-sm text-carbon-300">
            Prototype registry — demonstration data only, not an official CCTS/BEE system.
          </p>
          <LegalLinks onOpen={setLegalDoc} className="text-sm" />
        </div>
      </div>

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}
