"use client";

import { useEffect, useState } from "react";
import { Icons } from "../shared/icons";
import { StatusBadge } from "../shared/status-badge";
import { dataApi, MrvReport, OrderBook } from "@/lib/data-api";
import { ViewId } from "@/lib/types";

export function ViewDashboard({ onNavigateTab }: { onNavigateTab: (tab: ViewId) => void }) {
  const [mrvFilter, setMrvFilter] = useState("All");
  const [mrvList, setMrvList] = useState<MrvReport[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [registryCounts, setRegistryCounts] = useState<{ available: number; inTransfer: number; retired: number; total: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [mrvRes, orderBookRes, availableRes, lockedRes, retiredRes] = await Promise.all([
          dataApi.mrv.list(),
          dataApi.market.orderBook(),
          dataApi.registry.list({ status: "AVAILABLE" }),
          dataApi.registry.list({ status: "LOCKED" }),
          dataApi.registry.list({ status: "RETIRED" }),
        ]);

        if (cancelled) return;
        setMrvList(mrvRes.mrvReports);
        setOrderBook(orderBookRes);
        setRegistryCounts({
          available: availableRes.pagination.total,
          inTransfer: lockedRes.pagination.total,
          retired: retiredRes.pagination.total,
          total: availableRes.pagination.total + lockedRes.pagination.total + retiredRes.pagination.total,
        });
      } catch {
        // Dashboard tolerates partial data — individual cards below handle nulls.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredMRV = mrvFilter === "All" ? mrvList : mrvList.filter((m) => m.status === mrvFilter);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 rounded-3xl p-6 border border-carbon-750 glow-card-green relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Icons.Sparkles />
              </div>
              <span className="text-sm font-semibold tracking-wide text-slate-200">Compliance Insight</span>
            </div>
          </div>

          <div className="my-6 z-10">
            <div className="flex items-baseline space-x-3">
              <span className="text-6xl font-extrabold tracking-tight text-white">
                {mrvList.length > 0 ? Math.round((mrvList.filter((m) => m.status === "VERIFIED").length / mrvList.length) * 100) : 0}%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mt-2">Compliance readiness</h3>
            <p className="text-xs text-carbon-300 leading-relaxed mt-1 max-w-xs">
              Share of submitted MRV reports that have completed independent verification.
            </p>
          </div>

          <div className="pt-4 border-t border-carbon-750/50 flex items-center justify-between z-10">
            <span className="text-xs text-carbon-400">{mrvList.length} reporting period(s) tracked</span>
            <span
              className="text-xs font-medium text-emerald-400 flex items-center gap-1 cursor-pointer hover:underline"
              onClick={() => onNavigateTab("mrv")}
            >
              View MRV breakdown →
            </span>
          </div>
        </div>

        <div className="lg:col-span-8 rounded-3xl p-6 bg-carbon-850 border border-carbon-750 flex flex-col justify-between">
          <div className="flex items-center space-x-2 pb-4">
            <div className="p-1.5 rounded-lg bg-carbon-750 text-carbon-300">
              <Icons.Activity />
            </div>
            <span className="text-sm font-semibold tracking-wide text-slate-200">Registry Snapshot</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-carbon-900/60 border border-carbon-750/70 rounded-2xl p-5">
              <span className="text-xs text-carbon-400 block uppercase tracking-wider">Available</span>
              <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-2">{registryCounts?.available ?? "—"}</div>
            </div>
            <div className="bg-carbon-900/60 border border-carbon-750/70 rounded-2xl p-5">
              <span className="text-xs text-carbon-400 block uppercase tracking-wider">Locked / In Transfer</span>
              <div className="text-2xl font-mono font-extrabold text-carbon-200 mt-2">{registryCounts?.inTransfer ?? "—"}</div>
            </div>
            <div className="bg-carbon-900/60 border border-carbon-750/70 rounded-2xl p-5">
              <span className="text-xs text-carbon-400 block uppercase tracking-wider">Retired</span>
              <div className="text-2xl font-mono font-extrabold text-amber-400 mt-2">{registryCounts?.retired ?? "—"}</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-carbon-800 text-[11px] text-carbon-400 leading-tight">
            Live counts pulled from the registry — reflects real CCC status across the network.
          </div>
        </div>
      </div>

      <div className="rounded-3xl p-6 bg-carbon-850 border border-carbon-750 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-carbon-750">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold tracking-wide text-slate-200">MRV Activity</span>
          </div>

          <div className="flex items-center space-x-1 bg-carbon-900/90 p-1 rounded-xl border border-carbon-750">
            {["All", "PROCESSING", "VERIFIED", "NEEDS_REVIEW"].map((filter) => (
              <button
                key={filter}
                onClick={() => setMrvFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  mrvFilter === filter ? "bg-carbon-750 text-white" : "text-carbon-400 hover:text-slate-200"
                }`}
              >
                {filter.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          {loading ? (
            <div className="py-8 text-center text-xs text-carbon-400">Loading MRV activity...</div>
          ) : filteredMRV.length === 0 ? (
            <div className="py-8 text-center text-xs text-carbon-400">No MRV reports yet. Upload emissions data to get started.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-carbon-400 uppercase font-mono text-[11px] border-b border-carbon-800/80">
                  <th className="py-3 px-4 font-normal">Plant & MRV ID</th>
                  <th className="py-3 px-4 font-normal">Reporting Period</th>
                  <th className="py-3 px-4 font-normal">Emissions</th>
                  <th className="py-3 px-4 font-normal">Data Quality</th>
                  <th className="py-3 px-4 font-normal text-right">MRV Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800/50">
                {filteredMRV.map((row) => (
                  <tr key={row.id} onClick={() => onNavigateTab("mrv")} className="hover:bg-carbon-800/60 cursor-pointer transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200 group-hover:text-brand-400 transition-colors">
                        {row.plants?.name ?? "—"}
                      </div>
                      <div className="font-mono text-[10px] text-carbon-400 mt-0.5">
                        {row.mrv_number} · {row.plants?.location ?? ""}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-carbon-300">{row.reporting_period_label}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-100">
                      {row.mrv_calculations?.total_emissions_tco2e?.toLocaleString() ?? "—"} tCO₂e
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400">{row.data_quality_pct ?? "—"}%</td>
                    <td className="py-3.5 px-4 text-right">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-3xl p-6 bg-carbon-850 border border-carbon-750 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-carbon-750 text-carbon-300">
                <Icons.Market />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">CCC Market</h3>
                <p className="text-[11px] text-carbon-400">Live Order Book Summary</p>
              </div>
            </div>
            <button onClick={() => onNavigateTab("marketplace")} className="text-xs font-medium text-brand-400 hover:text-brand-300">
              Exchange →
            </button>
          </div>

          <div className="my-4">
            <div className="text-3xl font-extrabold text-white font-mono">
              {orderBook?.currentPrice ? `₹${orderBook.currentPrice}` : "No trades yet"}
              {orderBook?.currentPrice && <span className="text-sm font-sans font-normal text-carbon-400"> / CCC</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-carbon-750/60 font-mono">
            <div>
              <span className="text-[11px] text-carbon-400 block font-sans">Active Orders</span>
              <span className="text-base font-bold text-slate-200">{orderBook?.activeOrders ?? "—"}</span>
            </div>
            <div>
              <span className="text-[11px] text-carbon-400 block font-sans">Open Depth</span>
              <span className="text-base font-bold text-slate-200">
                {orderBook ? orderBook.sells.length + orderBook.buys.length : "—"} levels
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 rounded-3xl p-6 glow-card-accent border border-carbon-750 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-carbon-750 text-carbon-200">
                <Icons.CheckShield />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Registry Integrity</h3>
                <p className="text-[11px] text-carbon-400">Reconciliation & fraud interlocks</p>
              </div>
            </div>
          </div>

          <div className="my-3">
            <div className="text-xs text-carbon-300">
              Full reconciliation and integrity alert detail is available to Registry Admins and Auditors under the Audit
              section.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
