"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { LegalLinks, LegalModal, LegalDoc } from "./legal-modal";
import { DemoLoginPanel } from "./demo-login-panel";
import { dataApi } from "@/lib/data-api";
import { ApiError } from "@/lib/api-client";

type Mode = "signin" | "signup";

const FACILITY_TYPES = ["Cement", "Steel", "Aluminium", "Thermal Power", "Chemicals", "Verifier Agency", "Trading Firm", "Other"];
const REQUESTED_ROLES = [
  { value: "OBLIGATED_ENTITY", label: "Obligated Entity (Industrial Facility)" },
  { value: "VERIFIER", label: "Verifier Agency" },
  { value: "TRADER", label: "Trader" },
];

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

  // Company / facility details, captured at sign-up for admin review.
  const [companyName, setCompanyName] = useState("");
  const [facilityType, setFacilityType] = useState(FACILITY_TYPES[0]);
  const [requestedRole, setRequestedRole] = useState(REQUESTED_ROLES[0].value);
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

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

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setLocalError("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        setLocalError("Password must be at least 8 characters.");
        return;
      }
      if (!companyName.trim() || !addressLine.trim() || !city.trim() || !state.trim()) {
        setLocalError("Company name and full address are required so a registry administrator can verify your organization.");
        return;
      }
      if (!acceptedTerms) {
        setLocalError("You must accept the Terms & Conditions and Privacy Policy to register.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        const { needsEmailConfirmation } = await signUp(email, password);

        if (!needsEmailConfirmation) {
          // We have an active session now — submit the company/address
          // details for a registry admin to review and approve.
          try {
            await dataApi.registrationRequests.submit({
              companyName: companyName.trim(),
              facilityType,
              addressLine: addressLine.trim(),
              city: city.trim(),
              state: state.trim(),
              requestedRole,
            });
          } catch (submitErr) {
            // Account exists even if this call fails — don't block the
            // person on it, just let them know to contact an admin.
            console.error("Failed to submit registration details:", submitErr);
          }
        }

        setSignupNotice(
          needsEmailConfirmation
            ? "Account created. Check your email to confirm before signing in."
            : "Account created and your company details were submitted for review. A registry administrator will verify your organization and assign access — sign in below once approved."
        );
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : mode === "signin"
          ? "Sign-in failed"
          : "Registration failed";
      setLocalError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md mx-auto space-y-4">
        <div className="flex items-center space-x-2.5 justify-center mb-4">
          <Image src="/logo-icon.png" alt="CarbonChain" width={36} height={36} className="w-9 h-9 shrink-0" priority />
          <div>
            <h1 className="font-extrabold tracking-tight text-white text-base leading-none">CARBONCHAIN</h1>
            <span className="text-[13px] text-carbon-200 font-medium block mt-1 leading-tight">
              Trusted infrastructure for India&apos;s carbon market
            </span>
          </div>
        </div>

        <DemoLoginPanel />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-carbon-750" />
          <span className="text-[10px] text-carbon-500 uppercase tracking-wider">or sign in</span>
          <div className="h-px flex-1 bg-carbon-750" />
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
            <h2 className="text-base font-bold text-white">{mode === "signin" ? "Sign in" : "Register your organization"}</h2>
            <p className="text-sm text-carbon-300 mt-1">
              {mode === "signin"
                ? "Registry access is provisioned by your administrator."
                : "A registry administrator verifies your company details before granting access."}
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
              <>
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

                <div className="pt-2 border-t border-carbon-800 space-y-3">
                  <p className="text-xs font-semibold text-carbon-300 uppercase tracking-wider">Company / Facility Details</p>

                  <div>
                    <label className="text-carbon-300 block mb-1">Company / Organization Name</label>
                    <input
                      required
                      disabled={submitting}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 disabled:opacity-60"
                      placeholder="e.g. ABC Cement Infrastructure Ltd."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-carbon-300 block mb-1">Facility Type</label>
                      <select
                        disabled={submitting}
                        value={facilityType}
                        onChange={(e) => setFacilityType(e.target.value)}
                        className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 disabled:opacity-60"
                      >
                        {FACILITY_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-carbon-300 block mb-1">Requesting Access As</label>
                      <select
                        disabled={submitting}
                        value={requestedRole}
                        onChange={(e) => setRequestedRole(e.target.value)}
                        className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 disabled:opacity-60"
                      >
                        {REQUESTED_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-carbon-300 block mb-1">Address</label>
                    <input
                      required
                      disabled={submitting}
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 disabled:opacity-60"
                      placeholder="Street address / plant location"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-carbon-300 block mb-1">City</label>
                      <input
                        required
                        disabled={submitting}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-carbon-300 block mb-1">State</label>
                      <input
                        required
                        disabled={submitting}
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>
              </>
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
            {submitting ? (mode === "signin" ? "Signing in..." : "Submitting...") : mode === "signin" ? "SIGN IN" : "SUBMIT FOR REVIEW"}
          </button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-carbon-300">
            Prototype registry — demonstration data only, not an official CCTS/BEE system.
          </p>
          <LegalLinks onOpen={setLegalDoc} className="text-sm justify-center" />
        </div>
      </div>

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}
