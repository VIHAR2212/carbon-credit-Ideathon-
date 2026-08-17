"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { LegalLinks, LegalModal, LegalDoc } from "./legal-modal";
import { DemoLoginPanel } from "./demo-login-panel";
import { dataApi } from "@/lib/data-api";
import { ApiError } from "@/lib/api-client";
import { Icons } from "./icons";

type Mode = "signin" | "signup";
type SignupStep = "account" | "company";

const FACILITY_TYPES = ["Cement", "Steel", "Aluminium", "Thermal Power", "Chemicals", "Verifier Agency", "Trading Firm", "Other"];
const REQUESTED_ROLES = [
  { value: "OBLIGATED_ENTITY", label: "Obligated Entity (Industrial Facility)" },
  { value: "VERIFIER", label: "Verifier Agency" },
  { value: "TRADER", label: "Trader" },
];

export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [signupStep, setSignupStep] = useState<SignupStep>("account");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [signupNotice, setSignupNotice] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);

  const [companyName, setCompanyName] = useState("");
  const [facilityType, setFacilityType] = useState(FACILITY_TYPES[0]);
  const [requestedRole, setRequestedRole] = useState(REQUESTED_ROLES[0].value);
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const resetSignupState = () => {
    setSignupStep("account");
    setPassword("");
    setConfirmPassword("");
    setAcceptedTerms(false);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setLocalError(null);
    setSignupNotice(null);
    resetSignupState();
  };

  const validateAccountStep = () => {
    if (!email.trim()) return "Email is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const goToCompanyStep = () => {
    const err = validateAccountStep();
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    setSignupStep("company");
  };

  const handleSignIn = async (e: React.FormEvent) => {
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

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!companyName.trim() || !addressLine.trim() || !city.trim() || !state.trim()) {
      setLocalError("Company name and full address are required so a registry administrator can verify your organization.");
      return;
    }
    if (!acceptedTerms) {
      setLocalError("You must accept the Terms & Conditions and Privacy Policy to register.");
      return;
    }

    setSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signUp(email, password);

      if (!needsEmailConfirmation) {
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
          console.error("Failed to submit registration details:", submitErr);
        }
      }

      setSignupNotice(
        needsEmailConfirmation
          ? "Account created. Check your email to confirm before signing in."
          : "Account created and your company details were submitted for review. A registry administrator will verify your organization and assign access — sign in below once approved."
      );
      setMode("signin");
      resetSignupState();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Registration failed";
      setLocalError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
        {/* Left panel — brand + demo access. Hidden on small screens to
            keep the actual form the priority on mobile. */}
        <div className="lg:col-span-2 space-y-6 hidden lg:block">
          <div className="flex items-center space-x-3">
            <Image src="/logo-icon.png" alt="CarbonChain" width={44} height={44} className="w-11 h-11 shrink-0" priority />
            <div>
              <h1 className="font-extrabold tracking-tight text-white text-xl leading-none">CARBONCHAIN</h1>
              <span className="text-sm text-carbon-300 font-medium block mt-1.5 leading-tight">
                Trusted infrastructure for India&apos;s carbon market
              </span>
            </div>
          </div>

          <p className="text-sm text-carbon-300 leading-relaxed max-w-sm">
            A prototype MRV, carbon-credit registry, provenance, and marketplace platform — modeled on India&apos;s
            emerging Carbon Credit Trading Scheme (CCTS).
          </p>

          <DemoLoginPanel />
        </div>

        {/* Right panel — the actual auth form. This is what mobile sees full-width. */}
        <div className="lg:col-span-3 w-full max-w-md mx-auto">
          <div className="flex items-center space-x-2.5 justify-center mb-6 lg:hidden">
            <Image src="/logo-icon.png" alt="CarbonChain" width={36} height={36} className="w-9 h-9 shrink-0" priority />
            <h1 className="font-extrabold tracking-tight text-white text-base">CARBONCHAIN</h1>
          </div>

          <div className="lg:hidden mb-4">
            <DemoLoginPanel />
          </div>

          <div className="bg-carbon-850/90 backdrop-blur-md border border-carbon-750 rounded-3xl p-7 shadow-2xl">
            <div className="flex items-center bg-carbon-900 p-1 rounded-xl border border-carbon-750 mb-6">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  mode === "signin" ? "bg-carbon-750 text-white" : "text-carbon-300 hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  mode === "signup" ? "bg-carbon-750 text-white" : "text-carbon-300 hover:text-slate-200"
                }`}
              >
                Register
              </button>
            </div>

            {signupNotice && mode === "signin" && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl mb-4">
                {signupNotice}
              </div>
            )}

            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Welcome back</h2>
                  <p className="text-sm text-carbon-300 mt-1">Registry access is provisioned by your administrator.</p>
                </div>

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
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-90 disabled:cursor-not-allowed text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center min-h-[42px]"
                >
                  {submitting ? "Signing in..." : "SIGN IN"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Register your organization</h2>
                  <p className="text-sm text-carbon-300 mt-1">A registry administrator verifies your details before granting access.</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2">
                  <StepDot active={signupStep === "account"} done={signupStep === "company"} label="1" />
                  <div className={`h-px flex-1 ${signupStep === "company" ? "bg-brand-500" : "bg-carbon-750"}`} />
                  <StepDot active={signupStep === "company"} done={false} label="2" />
                  <div className="flex-1 flex justify-end">
                    <span className="text-[11px] text-carbon-400">{signupStep === "account" ? "Account" : "Company details"}</span>
                  </div>
                </div>

                {localError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{localError}</div>
                )}

                {signupStep === "account" ? (
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
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        minLength={8}
                      />
                    </div>
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

                    <button
                      type="button"
                      onClick={goToCompanyStep}
                      className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[42px]"
                    >
                      CONTINUE
                      <Icons.ArrowUpRight />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSignupSubmit} className="space-y-3 text-sm">
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

                    <label className="flex items-start space-x-2.5 cursor-pointer select-none pt-1">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        disabled={submitting}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded accent-[#0d9668] shrink-0"
                      />
                      <span className="text-xs text-carbon-300 leading-snug">
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

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSignupStep("account")}
                        disabled={submitting}
                        className="px-4 py-2.5 bg-carbon-800 hover:bg-carbon-750 disabled:opacity-60 text-xs font-medium text-slate-200 rounded-xl transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-90 disabled:cursor-not-allowed text-black font-bold text-xs rounded-xl transition-colors min-h-[42px]"
                      >
                        {submitting ? "Submitting..." : "SUBMIT FOR REVIEW"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="text-center space-y-2 mt-4">
            <p className="text-xs text-carbon-400">
              Prototype registry — demonstration data only, not an official CCTS/BEE system.
            </p>
            <LegalLinks onOpen={setLegalDoc} className="text-xs justify-center" />
          </div>
        </div>
      </div>

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border ${
        active
          ? "bg-brand-500 text-black border-brand-500"
          : done
          ? "bg-brand-500/20 text-brand-400 border-brand-500/40"
          : "bg-carbon-900 text-carbon-400 border-carbon-750"
      }`}
    >
      {label}
    </div>
  );
}
