"use client";

import { useMemo, useState } from "react";
import { Icons } from "../shared/icons";
import { StatusBadge } from "../shared/status-badge";
import { CCC, MRVRecord, ViewId } from "@/lib/types";

const activityBars = [
  { month: "Feb", v1: 60, v2: 40, v3: 20 },
  { month: "Mar", v1: 75, v2: 55, v3: 30 },
  { month: "Apr", v1: 62, v2: 45, v3: 25 },
  { month: "May", v1: 80, v2: 60, v3: 35 },
  { month: "Jun", v1: 70, v2: 50, v3: 28 },
  { month: "Jul", v1: 65, v2: 48, v3: 32 },
  { month: "Aug", v1: 85, v2: 62, v3: 40 },
  { month: "Sep", v1: 78, v2: 58, v3: 30 },
];

export function ViewDashboard({
  cccList,
  mrvList,
  onNavigateToCCC,
  onNavigateTab,
}: {
  cccList: CCC[];
  mrvList: MRVRecord[];
  onNavigateToCCC: (ccc: CCC) => void;
  onNavigateTab: (tab: ViewId) => void;
}) {
  const [mrvFilter, setMrvFilter] = useState("All");
  const [activityTab, setActivityTab] = useState("Emissions");

  const filteredMRV = useMemo(() => {
    if (mrvFilter === "All") return mrvList;
    return mrvList.filter((m) => m.status === mrvFilter);
  }, [mrvList, mrvFilter]);

  return (
    <div className="space-y-6">
      {/* TOP EDITORIAL CARDS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CARD 1: Compliance Insight */}
        <div className="lg:col-span-4 rounded-3xl p-6 border border-carbon-750 glow-card-green relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Icons.Sparkles />
              </div>
              <span className="text-sm font-semibold tracking-wide text-slate-200">Compliance Insight</span>
            </div>
            <div className="glass-pill px-3 py-1 rounded-full text-xs font-medium text-slate-300 flex items-center gap-1">
              <span>Compliance Period</span>
              <svg className="w-3 h-3 text-carbon-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="my-6 z-10">
            <div className="flex items-baseline space-x-3">
              <span className="text-6xl font-extrabold tracking-tight text-white">92%</span>
              <span className="inline-flex items-center text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ↑ 6.4%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mt-2">Compliance readiness</h3>
            <p className="text-xs text-carbon-300 leading-relaxed mt-1 max-w-xs">
              Monitored facilities are currently on track against their applicable emission-intensity targets under CCTS framework.
            </p>
          </div>

          <div className="pt-4 border-t border-carbon-750/50 flex items-center justify-between z-10">
            <span className="text-xs text-carbon-400">Target Year 2026 Target: 85%</span>
            <span
              className="text-xs font-medium text-emerald-400 flex items-center gap-1 cursor-pointer hover:underline"
              onClick={() => onNavigateTab("mrv")}
            >
              View MRV breakdown →
            </span>
          </div>
        </div>

        {/* CARD 2: Carbon Activity Chart */}
        <div className="lg:col-span-8 rounded-3xl p-6 bg-carbon-850 border border-carbon-750 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-carbon-750 text-carbon-300">
                <Icons.Activity />
              </div>
              <span className="text-sm font-semibold tracking-wide text-slate-200">CarbonChain</span>
            </div>

            <div className="flex items-center bg-carbon-900/90 p-1 rounded-xl border border-carbon-750 self-start sm:self-auto">
              {["Emissions", "Production", "CCCs", "Market"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActivityTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activityTab === tab
                      ? "bg-carbon-750 text-white shadow-sm border border-carbon-600"
                      : "text-carbon-400 hover:text-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end my-4">
            <div className="md:col-span-8 h-48 flex items-end justify-between gap-2 pt-6 px-2">
              {activityBars.map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    <div
                      style={{ height: `${bar.v1}%` }}
                      className="w-2.5 bg-emerald-500 rounded-t-sm group-hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                    ></div>
                    <div
                      style={{ height: `${bar.v2}%` }}
                      className="w-2.5 bg-amber-500/80 rounded-t-sm group-hover:bg-amber-400 transition-all"
                    ></div>
                    <div
                      style={{ height: `${bar.v3}%` }}
                      className="w-2.5 bg-purple-500/70 rounded-t-sm group-hover:bg-purple-400 transition-all"
                    ></div>
                  </div>
                  <span className="text-[10px] font-mono text-carbon-400">{bar.month}</span>
                </div>
              ))}
            </div>

            <div className="md:col-span-4 bg-carbon-900/60 border border-carbon-750/70 rounded-2xl p-5 flex flex-col justify-center">
              <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-mono">
                82,431 <span className="text-lg font-sans font-medium text-carbon-300">tCO₂e</span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  +4.8%
                </span>
                <span className="text-xs text-carbon-400">vs previous period</span>
              </div>
              <div className="mt-4 pt-3 border-t border-carbon-800 text-[11px] text-carbon-400 leading-tight">
                Verified through 12 SCADA smart meters and audited by Bureau Veritas.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-carbon-400 pt-2 border-t border-carbon-750/50">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span> tCO₂e Emissions
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block"></span> Production Index
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-purple-500 inline-block"></span> Emission Intensity
            </span>
          </div>
        </div>
      </div>

      {/* CARD 3: MRV Activity Table */}
      <div className="rounded-3xl p-6 bg-carbon-850 border border-carbon-750 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-carbon-750">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold tracking-wide text-slate-200">MRV Activity</span>
            <span className="text-xs font-mono text-carbon-400 bg-carbon-800 px-2 py-0.5 rounded-md border border-carbon-700">
              Live Telemetry
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-carbon-900/90 p-1 rounded-xl border border-carbon-750">
            {["All", "Processing", "Verified", "Needs Review"].map((filter) => (
              <button
                key={filter}
                onClick={() => setMrvFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  mrvFilter === filter ? "bg-carbon-750 text-white shadow-sm" : "text-carbon-400 hover:text-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-carbon-400 uppercase font-mono text-[11px] border-b border-carbon-800/80">
                <th className="py-3 px-4 font-normal">Plant & MRV ID</th>
                <th className="py-3 px-4 font-normal">Reporting Period</th>
                <th className="py-3 px-4 font-normal">Emissions</th>
                <th className="py-3 px-4 font-normal">Intensity</th>
                <th className="py-3 px-4 font-normal">Data Quality</th>
                <th className="py-3 px-4 font-normal text-right">MRV Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-800/50">
              {filteredMRV.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onNavigateTab("mrv")}
                  className="hover:bg-carbon-800/60 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200 group-hover:text-brand-400 transition-colors">
                      {row.plant}
                    </div>
                    <div className="font-mono text-[10px] text-carbon-400 mt-0.5">
                      {row.id} · {row.location}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-carbon-300">{row.period}</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-100">{row.emissions}</td>
                  <td className="py-3.5 px-4 font-mono text-carbon-300">{row.intensity}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-emerald-400">{row.quality}</span>
                      <div className="w-12 bg-carbon-750 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: row.quality }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRY SUMMARY BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-carbon-850 border border-carbon-750 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-carbon-400 font-medium uppercase tracking-wider">CCCs Issued</span>
          <div className="text-2xl font-mono font-extrabold text-white mt-2">124,820</div>
          <span className="text-[11px] text-emerald-400 mt-1">Verified tCO₂e equivalent</span>
        </div>
        <div className="bg-carbon-850 border border-carbon-750 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-carbon-400 font-medium uppercase tracking-wider">Available</span>
          <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-2">83,421</div>
          <span className="text-[11px] text-carbon-400 mt-1">Ready for transfer or trade</span>
        </div>
        <div className="bg-carbon-850 border border-carbon-750 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-carbon-400 font-medium uppercase tracking-wider">In Transfer</span>
          <div className="text-2xl font-mono font-extrabold text-sky-400 mt-2">4,120</div>
          <span className="text-[11px] text-carbon-400 mt-1">Market settlement active</span>
        </div>
        <div className="bg-carbon-850 border border-carbon-750 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-carbon-400 font-medium uppercase tracking-wider">Retired</span>
          <div className="text-2xl font-mono font-extrabold text-purple-400 mt-2">37,279</div>
          <span className="text-[11px] text-carbon-400 mt-1">Surrendered for CCTS compliance</span>
        </div>
      </div>

      {/* BOTTOM ROW: MARKETPLACE SUMMARY & REGISTRY INTEGRITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CARD 4: CCC Market Summary */}
        <div className="lg:col-span-6 rounded-3xl p-6 bg-carbon-850 border border-carbon-750 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-carbon-750 text-carbon-300">
                <Icons.Market />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">CCC Market</h3>
                <p className="text-[11px] text-carbon-400">Market Summary & Execution</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("marketplace")}
              className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              Exchange →
            </button>
          </div>

          <div className="my-4 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-white font-mono">
                ₹1,284 <span className="text-sm font-sans font-normal text-carbon-400">/ CCC</span>
              </div>
              <div className="text-xs font-semibold text-emerald-400 mt-1">
                +3.7% <span className="text-carbon-400 font-normal">24h spot price</span>
              </div>
            </div>

            <div className="h-12 w-32">
              <svg className="w-full h-full text-emerald-400" viewBox="0 0 100 30" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" d="M0 25 Q20 22 30 18 T60 12 T80 8 T100 3" />
                <path
                  fill="url(#sparkline-grad)"
                  d="M0 25 Q20 22 30 18 T60 12 T80 8 T100 3 L100 30 L0 30 Z"
                  opacity="0.2"
                />
                <defs>
                  <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-carbon-750/60 font-mono">
            <div>
              <span className="text-[11px] text-carbon-400 block font-sans">24h Volume</span>
              <span className="text-base font-bold text-slate-200">18,421 CCC</span>
            </div>
            <div>
              <span className="text-[11px] text-carbon-400 block font-sans">Active Orders</span>
              <span className="text-base font-bold text-slate-200">2,481</span>
            </div>
          </div>
        </div>

        {/* CARD 5: Registry Integrity */}
        <div className="lg:col-span-6 rounded-3xl p-6 glow-card-purple border border-carbon-750 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                <Icons.CheckShield />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Registry Integrity</h3>
                <p className="text-[11px] text-carbon-400">Cryptographic Proof & Double-Counting Interlock</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 beacon"></span>
              SYNCED
            </span>
          </div>

          <div className="my-3">
            <div className="text-4xl font-extrabold text-white font-mono">99.99%</div>
            <div className="text-xs text-carbon-300 mt-1">All registry records synchronized across BEE node network</div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-carbon-750/60">
            <div className="flex items-center space-x-2 bg-carbon-900/60 p-2.5 rounded-xl border border-carbon-750">
              <div className="text-emerald-400">
                <Icons.CheckCircle />
              </div>
              <div className="text-xs">
                <span className="text-carbon-400 block text-[10px]">Duplicate Credits</span>
                <span className="font-mono font-bold text-slate-200">0</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-carbon-900/60 p-2.5 rounded-xl border border-carbon-750">
              <div className="text-emerald-400">
                <Icons.CheckCircle />
              </div>
              <div className="text-xs">
                <span className="text-carbon-400 block text-[10px]">Hash Mismatches</span>
                <span className="font-mono font-bold text-slate-200">0</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-carbon-900/60 p-2.5 rounded-xl border border-carbon-750">
              <div className="text-amber-400">
                <Icons.Lock />
              </div>
              <div className="text-xs">
                <span className="text-carbon-400 block text-[10px]">Frozen Credits</span>
                <span className="font-mono font-bold text-amber-400">14</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-carbon-900/60 p-2.5 rounded-xl border border-carbon-750">
              <div className="text-rose-400">
                <Icons.Alert />
              </div>
              <div className="text-xs">
                <span className="text-carbon-400 block text-[10px]">Unauthorized Attempts</span>
                <span className="font-mono font-bold text-rose-400">2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
