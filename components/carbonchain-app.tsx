"use client";

import { useState } from "react";
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
import {
  INITIAL_CCC_DATABASE,
  INITIAL_MRV_RECORDS,
  INITIAL_ORDER_BOOK,
  MOCK_ANOMALIES,
  MOCK_AUDIT_TRAIL,
} from "@/lib/mock-data";
import { CCC, SearchResult, ViewId } from "@/lib/types";

export function CarbonChainApp() {
  const [currentView, setCurrentView] = useState<ViewId>("dashboard");
  const [selectedCCC, setSelectedCCC] = useState<CCC | null>(null);

  const [cccList, setCccList] = useState(INITIAL_CCC_DATABASE);
  const [mrvList, setMrvList] = useState(INITIAL_MRV_RECORDS);
  const [orderBook, setOrderBook] = useState(INITIAL_ORDER_BOOK);
  const [anomalies, setAnomalies] = useState(MOCK_ANOMALIES);
  const [auditLogs, setAuditLogs] = useState(MOCK_AUDIT_TRAIL);

  // NOTE: mrvList / orderBook setters are currently unused beyond initial state —
  // reserved for future backend wiring, matching original prototype's scope.
  void setMrvList;
  void setOrderBook;

  const handleSelectSearchResult = (result: SearchResult) => {
    if (result.targetView === "registryDetail" && result.item) {
      setSelectedCCC(result.item as CCC);
      setCurrentView("registry");
    } else if (result.targetView) {
      setCurrentView(result.targetView as ViewId);
    }
  };

  const handleApproveVerification = () => {
    const newLog = {
      timestamp: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      actor: "Bureau Veritas (Verifier)",
      action: "APPROVE_VERIFICATION",
      resource: "VER-ACVA002-2026-00918",
      tx: "TX-" + Math.floor(Math.random() * 899999 + 100000),
      status: "Verified",
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const handleResolveAnomaly = (anomalyId: string) => {
    setAnomalies((prev) => prev.map((a) => (a.id === anomalyId ? { ...a, status: "RESOLVED" } : a)));
  };

  const handleExecuteTrade = (trade: { type: string; qty: number; price: number }) => {
    const newLog = {
      timestamp: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      actor: "Market Participant",
      action: `EXECUTE_${trade.type}`,
      resource: `ORD-${Math.floor(Math.random() * 8999 + 1000)}`,
      tx: "TX-" + Math.floor(Math.random() * 899999 + 100000),
      status: "Settled",
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const handleMintNewBatch = () => {
    const newCCC: CCC = {
      id: `CCC-IN-2026-000${Math.floor(Math.random() * 89999 + 10000)}`,
      origin: "ABC Cement Infrastructure Ltd.",
      plant: "Maharashtra Plant 04",
      reportingPeriod: "Q2 2026",
      quantity: 10427,
      verificationId: "VER-ACVA002-2026-00918",
      verifierBody: "Bureau Veritas India",
      currentOwner: "ABC Cement Infrastructure Ltd.",
      status: "AVAILABLE",
      issuedDate: new Date().toISOString(),
      lastTx: "TX-9901-NEW-ISSUE",
      blockHash: "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
      blockNumber: 18496000,
      provenance: [
        {
          step: "CCC Issuance",
          actor: "BEE Registry Admin",
          timestamp: "Just now",
          hash: "0x8f2a...1041",
          detail: "Minted batch serial.",
          status: "ISSUED",
        },
      ],
    };
    setCccList([newCCC, ...cccList]);
  };

  const handleRetireCCC = (cccId: string) => {
    setCccList((prev) => prev.map((c) => (c.id === cccId ? { ...c, status: "RETIRED" } : c)));
    const newLog = {
      timestamp: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      actor: "Compliance Officer",
      action: "RETIRE_CCC",
      resource: cccId,
      tx: "TX-" + Math.floor(Math.random() * 899999 + 100000),
      status: "Permanently Retired",
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const navSections: {
    title: string;
    items: { id: ViewId; label: string; icon: () => React.JSX.Element; badge?: number }[];
  }[] = [
    {
      title: "OVERVIEW",
      items: [{ id: "dashboard", label: "Dashboard", icon: Icons.Dashboard }],
    },
    {
      title: "MRV",
      items: [
        { id: "mrv", label: "Emissions & Telemetry", icon: Icons.Activity },
        {
          id: "anomalies",
          label: "Anomalies",
          icon: Icons.Alert,
          badge: anomalies.filter((a) => a.status === "UNDER REVIEW").length,
        },
      ],
    },
    {
      title: "VERIFICATION",
      items: [{ id: "verification", label: "Verifier Desk", icon: Icons.CheckShield }],
    },
    {
      title: "REGISTRY",
      items: [
        { id: "registry", label: "Carbon Credits", icon: Icons.Registry },
        { id: "issuance", label: "Issuance Workflow", icon: Icons.Sparkles },
        { id: "retirement", label: "Retirement / Surrender", icon: Icons.Flame },
      ],
    },
    {
      title: "MARKETPLACE",
      items: [{ id: "marketplace", label: "Market Exchange", icon: Icons.Market }],
    },
    {
      title: "AUDIT",
      items: [{ id: "audit", label: "Audit Trail", icon: Icons.Audit }],
    },
  ];

  return (
    <div className="flex h-screen bg-carbon-950 text-slate-100 overflow-hidden">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-carbon-900 border-r border-carbon-800/80 flex flex-col justify-between shrink-0 select-none hidden md:flex">
        <div>
          <div className="p-6 border-b border-carbon-800/60">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-black font-extrabold text-lg shadow-lg shadow-brand-500/20">
                C
              </div>
              <div>
                <h1 className="font-extrabold tracking-tight text-white text-base leading-none">CARBONCHAIN</h1>
                <span className="text-[10px] text-carbon-400 font-medium block mt-1 leading-tight">
                  Trusted infrastructure for India&apos;s carbon market
                </span>
              </div>
            </div>
          </div>

          <div className="px-3 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-3 text-[10px] font-mono tracking-wider text-carbon-400 uppercase font-semibold">
                  {sec.title}
                </div>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        if (item.id === "registry") setSelectedCCC(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        active
                          ? "bg-carbon-800 text-white font-semibold shadow-sm border border-carbon-700"
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

        <div className="p-4 border-t border-carbon-800/80 bg-carbon-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-carbon-750 border border-carbon-600 flex items-center justify-center font-mono font-bold text-xs text-brand-400">
              IN
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-200 truncate">CCTS Node Admin</div>
              <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                Connected to BEE Mainnet
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-carbon-900/80 border-b border-carbon-800/80 px-6 flex items-center justify-between shrink-0 backdrop-blur-md z-30">
          <div className="flex items-center space-x-3">
            <div className="md:hidden font-extrabold text-sm text-brand-400">CARBONCHAIN</div>
            <span className="text-xs font-mono text-carbon-400 hidden sm:inline-block">
              Scheme: <span className="text-slate-200 font-medium">India CCTS FY2026</span>
            </span>
          </div>

          <HeaderGlobalSearch onSelectResult={handleSelectSearchResult} cccList={cccList} mrvList={mrvList} />

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-carbon-400 hidden lg:inline-block">
              Server Time: <span className="text-slate-300">13 Aug 2026, 00:24 IST</span>
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
          {currentView === "dashboard" && (
            <ViewDashboard
              cccList={cccList}
              mrvList={mrvList}
              onNavigateToCCC={(ccc) => {
                setSelectedCCC(ccc);
                setCurrentView("registry");
              }}
              onNavigateTab={(tab) => setCurrentView(tab)}
            />
          )}

          {(currentView === "mrv" || currentView === "anomalies") && (
            <ViewMRV mrvList={mrvList} anomalies={anomalies} onResolveAnomaly={handleResolveAnomaly} />
          )}

          {currentView === "verification" && <ViewVerification onApproveVerification={handleApproveVerification} />}

          {currentView === "registry" && (
            <ViewRegistry
              cccList={cccList}
              selectedCCC={selectedCCC}
              onSelectCCC={setSelectedCCC}
              onNavigateTab={(tab) => setCurrentView(tab)}
            />
          )}

          {currentView === "marketplace" && <ViewMarketplace orderBook={orderBook} onExecuteTrade={handleExecuteTrade} />}

          {currentView === "issuance" && <ViewIssuance onMintNewBatch={handleMintNewBatch} />}

          {currentView === "audit" && <ViewAudit auditLogs={auditLogs} />}

          {currentView === "retirement" && <ViewRetirement cccList={cccList} onRetireCCC={handleRetireCCC} />}
        </div>
      </main>
    </div>
  );
}
