"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Icons } from "./icons";

const DEMO_ACCOUNTS = [
  {
    key: "entity",
    label: "Obligated Entity",
    description: "Upload emissions, request issuance",
    email: "entity@demo.carbonchain",
    icon: Icons.Activity,
  },
  {
    key: "verifier",
    label: "Verifier",
    description: "Review evidence, approve verification",
    email: "entity@demo1.carbonchain",
    icon: Icons.CheckShield,
  },
  {
    key: "admin",
    label: "Registry Admin",
    description: "Approve issuance, manage registry",
    email: "entity@demo2.carbonchain",
    icon: Icons.Registry,
  },
] as const;

const DEMO_PASSWORD = "entity@demo";

export function DemoLoginPanel() {
  const { signIn } = useAuth();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async (email: string, key: string) => {
    setError(null);
    setLoadingKey(key);
    try {
      await signIn(email, DEMO_PASSWORD);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo sign-in failed");
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="bg-carbon-850/90 backdrop-blur-md border border-carbon-750 rounded-3xl p-5 space-y-3">
      <div>
        <h3 className="text-sm font-bold text-white">Judge / Demo Access</h3>
        <p className="text-xs text-carbon-300 mt-0.5">Skip account setup — sign in instantly as any role.</p>
      </div>

      {error && <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{error}</div>}

      <div className="grid grid-cols-1 gap-2">
        {DEMO_ACCOUNTS.map((acc) => {
          const Icon = acc.icon;
          const isLoading = loadingKey === acc.key;
          return (
            <button
              key={acc.key}
              type="button"
              disabled={loadingKey !== null}
              onClick={() => handleDemoLogin(acc.email, acc.key)}
              className="w-full flex items-center gap-3 p-3 bg-carbon-900 hover:bg-carbon-800 disabled:opacity-60 disabled:cursor-not-allowed border border-carbon-750 hover:border-carbon-600 rounded-xl transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-brand-500/15 text-brand-400 shrink-0">
                <Icon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200">{isLoading ? "Signing in..." : acc.label}</div>
                <div className="text-[11px] text-carbon-400 truncate">{acc.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
