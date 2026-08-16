"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Icons } from "./shared/icons";
import { HeaderGlobalSearch } from "./shared/header-global-search";
import { ViewDashboard } from "./views/view-dashboard";
import { ViewMRV } from "./views/view-mrv";
import { ViewVerification } from "./views/view-verification";
import { ViewRegistry } from "./views/view-registry";
import { ViewMarketplace } from "./views/view-marketplace";
import { ViewIssuance } from "./views/view-issuance";
import { ViewAudit } from "./views/view-audit";
import { ViewRetirement } from "./views/view-retirement";
import { useAuth, UserRole } from "@/lib/auth-context";
import { dataApi, Anomaly } from "@/lib/data-api";
import { ViewId } from "@/lib/types";
import { SignOutConfirm } from "./shared/signout-confirm";
import { ThemeToggle } from "./shared/theme-toggle";
import { LegalLinks, LegalModal, LegalDoc } from "./shared/legal-modal";

type NavItem = { id: ViewId; label: string; icon: () => React.JSX.Element; badge?: number; roles?: UserRole[] };

export function CarbonChainApp() {
  const { profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewId>("dashboard");
  const [selectedCccId, setSelectedCccId] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [showSignOut, setShowSignOut] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);

  const refreshAnomalies = useCallback(async () => {
    try {
      const { anomalies: list } = await dataApi.mrv.anomalies();
      setAnomalies(list);
    } catch {
      // Sidebar badge is non-critical; a failed refresh just leaves the
      // count stale until the next successful poll.
    }
  }, []);

  useEffect(() => {
    refreshAnomalies();
  }, [refreshAnomalies]);

  const handleSelectSearchResult = (result: { targetView: string; item?: { id?: string; ccc_id?: string } }) => {
    if (result.targetView === "registryDetail" && result.item) {
      setSelectedCccId(result.item.ccc_id ?? result.item.id ?? null);
      setCurrentView("registry");
    } else if (result.targetView) {
      setCurrentView(result.targetView as ViewId);
    }
  };

  if (!profile) return null;

  const role = profile.role;

  const navSections: { title: string; items: NavItem[] }[] = [
    { title: "OVERVIEW", items: [{ id: "dashboard", label: "Dashboard", icon: Icons.Dashboard }] },
    {
      title: "MRV",
      items: [
        { id: "mrv", label: "Emissions & Telemetry", icon: Icons.Activity, roles: ["OBLIGATED_ENTITY", "VERIFIER", "REGISTRY_ADMIN", "AUDITOR", "SYSTEM_ADMIN"] },
        {
          id: "anomalies",
          label: "Anomalies",
          icon: Icons.Alert,
          badge: anomalies.filter((a) => a.status === "DETECTED" || a.status === "UNDER_REVIEW").length,
          roles: ["OBLIGATED_ENTITY", "VERIFIER", "REGISTRY_ADMIN", "AUDITOR", "SYSTEM_ADMIN"],
        },
      ],
    },
    {
      title: "VERIFICATION",
      items: [{ id: "verification", label: "Verifier Desk", icon: Icons.CheckShield, roles: ["VERIFIER", "REGISTRY_ADMIN", "SYSTEM_ADMIN", "OBLIGATED_ENTITY", "AUDITOR"] }],
    },
    {
      title: "REGISTRY",
      items: [
        { id: "registry", label: "Carbon Credits", icon: Icons.Registry },
        { id: "issuance", label: "Issuance Workflow", icon: Icons.Sparkles, roles: ["OBLIGATED_ENTITY", "REGISTRY_ADMIN", "SYSTEM_ADMIN"] },
        { id: "retirement", label: "Retirement / Surrender", icon: Icons.Flame, roles: ["OBLIGATED_ENTITY", "TRADER"] },
      ],
    },
    {
      title: "MARKETPLACE",
      items: [{ id: "marketplace", label: "Market Exchange", icon: Icons.Market, roles: ["TRADER", "OBLIGATED_ENTITY"] }],
    },
    { title: "AUDIT", items: [{ id: "audit", label: "Audit Trail", icon: Icons.Audit }] },
  ];

  const visibleSections = navSections
    .map((sec) => ({ ...sec, items: sec.items.filter((item) => !item.roles || item.roles.includes(role)) }))
    .filter((sec) => sec.items.length > 0);

  return (
    <div className="flex h-screen text-slate-100 overflow-hidden">
      <aside className="w-64 bg-carbon-900/90 backdrop-blur-md border-r border-carbon-800/80 flex flex-col justify-between shrink-0 select-none hidden md:flex">
        <div>
          <div className="p-6 border-b border-carbon-800/60">
            <div className="flex items-center space-x-2.5">
              <Image src="/logo-icon.png" alt="CarbonChain" width={32} height={32} className="w-8 h-8 shrink-0" priority />
              <div>
                <h1 className="font-extrabold tracking-tight text-white text-base leading-none">CARBONCHAIN</h1>
                <span className="text-[13px] text-carbon-300 font-medium block mt-1 leading-tight">
                  Trusted infrastructure for India&apos;s carbon market
                </span>
              </div>
            </div>
          </div>

          <div className="px-3 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
            {visibleSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-3 text-xs font-mono tracking-wider text-carbon-300 uppercase font-semibold">{sec.title}</div>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        if (item.id === "registry") setSelectedCccId(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        active
                          ? "bg-carbon-800 text-white font-semibold border border-carbon-700"
                          : "text-carbon-300 hover:text-slate-100 hover:bg-carbon-850"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className={active ? "text-brand-400" : "text-carbon-400"}>
                          <Icon />
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {!!item.badge && item.badge > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-carbon-800/80 bg-carbon-900/60 space-y-1.5">
          <button onClick={() => setShowSignOut(true)} className="w-full flex items-center space-x-3 text-left hover:bg-carbon-850 rounded-xl p-1.5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-carbon-750 border border-carbon-600 flex items-center justify-center font-mono font-bold text-xs text-brand-400">
              {profile.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-sm font-semibold text-slate-200 truncate">{profile.fullName}</div>
              <div className="text-xs font-mono text-carbon-300 truncate">
                {profile.role.replace(/_/g, " ")} · {profile.organization.name}
              </div>
            </div>
          </button>
          <button
            onClick={() => setShowSignOut(true)}
            className="w-full flex items-center justify-center space-x-2 py-1.5 rounded-xl text-xs font-semibold text-carbon-300 hover:text-rose-400 hover:bg-carbon-850 border border-carbon-750 transition-colors"
          >
            <Icons.LogOut />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-carbon-900/80 border-b border-carbon-800/80 px-6 flex items-center justify-between shrink-0 backdrop-blur-md z-30">
          <div className="flex items-center space-x-3">
            <div className="md:hidden font-extrabold text-sm text-brand-400">CARBONCHAIN</div>
            <span className="text-sm font-mono text-carbon-300 hidden sm:inline-block">
              Scheme: <span className="text-slate-200 font-medium">India CCTS FY2026 (Prototype)</span>
            </span>
          </div>

          <HeaderGlobalSearch onSelectResult={handleSelectSearchResult} />

          <div className="flex items-center space-x-3">
            <span className="text-sm font-mono text-carbon-300 hidden lg:inline-block">{profile.organization.name}</span>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
          {currentView === "dashboard" && <ViewDashboard onNavigateTab={(tab) => setCurrentView(tab)} />}

          {(currentView === "mrv" || currentView === "anomalies") && (
            <ViewMRV onAnomaliesChanged={refreshAnomalies} />
          )}

          {currentView === "verification" && <ViewVerification />}

          {currentView === "registry" && (
            <ViewRegistry
              selectedCccId={selectedCccId}
              onSelectCcc={setSelectedCccId}
              onNavigateTab={(tab) => setCurrentView(tab)}
            />
          )}

          {currentView === "marketplace" && <ViewMarketplace />}

          {currentView === "issuance" && <ViewIssuance />}

          {currentView === "audit" && <ViewAudit />}

          {currentView === "retirement" && <ViewRetirement />}

          <footer className="mt-10 pt-4 border-t border-carbon-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 pb-2">
            <p className="text-sm text-carbon-400">
              CarbonChain prototype registry — demonstration data only, not an official CCTS/BEE system.
            </p>
            <LegalLinks onOpen={setLegalDoc} className="text-sm" />
          </footer>
        </div>
      </main>

      <SignOutConfirm
        open={showSignOut}
        onCancel={() => setShowSignOut(false)}
        onConfirm={() => {
          setShowSignOut(false);
          signOut();
        }}
      />
      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}
