"use client";

import { useAuth } from "@/lib/auth-context";
import { LoginScreen } from "@/components/shared/login-screen";
import { CarbonChainApp } from "@/components/carbonchain-app";
import { RippleLoader } from "@/components/ui/ripple-loader";

export default function Home() {
  const { session, profile, loading, error, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8">
        <RippleLoader cellSize={42} cellSpacing={4} />
        <div className="text-carbon-300 text-xs font-mono tracking-wide">Loading CarbonChain...</div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-carbon-950 p-6">
        <div className="max-w-sm w-full bg-carbon-850 border border-carbon-750 rounded-3xl p-6 text-center space-y-4">
          <div className="text-rose-400 text-sm font-semibold">Account not fully provisioned</div>
          <p className="text-xs text-carbon-300">{error || "No profile found for this account."}</p>
          <button
            onClick={() => signOut()}
            className="w-full py-2.5 bg-carbon-750 hover:bg-carbon-700 text-xs font-medium text-slate-200 rounded-xl transition-colors"
          >
            Sign out and try another account
          </button>
        </div>
      </div>
    );
  }

  return <CarbonChainApp />;
}
