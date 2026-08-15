"use client";

import { useCallback, useEffect, useState } from "react";
import { Icons } from "../shared/icons";
import { StatusBadge } from "../shared/status-badge";
import { dataApi, CarbonCredit, CccEvent } from "@/lib/data-api";
import { useAuth } from "@/lib/auth-context";
import { ViewId } from "@/lib/types";

export function ViewRegistry({
  selectedCccId,
  onSelectCcc,
  onNavigateTab,
}: {
  selectedCccId: string | null;
  onSelectCcc: (id: string | null) => void;
  onNavigateTab: (tab: ViewId) => void;
}) {
  const { profile } = useAuth();
  const [credits, setCredits] = useState<CarbonCredit[]>([]);
  const [detail, setDetail] = useState<{ credit: CarbonCredit; provenance: CccEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const canIssue = profile?.role === "OBLIGATED_ENTITY" || profile?.role === "REGISTRY_ADMIN" || profile?.role === "SYSTEM_ADMIN";

  const refreshList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dataApi.registry.list(statusFilter ? { status: statusFilter } : undefined);
      setCredits(res.credits);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!selectedCccId) refreshList();
  }, [selectedCccId, refreshList]);

  useEffect(() => {
    if (selectedCccId) {
      dataApi.registry.detail(selectedCccId).then(setDetail);
    } else {
      setDetail(null);
    }
  }, [selectedCccId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-carbon-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Carbon Credit Registry</h2>
          <p className="text-xs text-carbon-400 mt-1">Provenance Ledger & Certificate Ownership Tracking</p>
        </div>
        {canIssue && !selectedCccId && (
          <button
            onClick={() => onNavigateTab("issuance")}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs rounded-xl transition-colors"
          >
            + Issuance Workflow
          </button>
        )}
      </div>

      {selectedCccId && detail ? (
        <div className="space-y-6">
          <button onClick={() => onSelectCcc(null)} className="text-xs font-medium text-carbon-400 hover:text-white flex items-center gap-1.5">
            ← Back to Registry Ledger
          </button>

          <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6 glow-card-green">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-carbon-750 pb-5">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-mono font-extrabold text-white">{detail.credit.ccc_id}</h3>
                  <StatusBadge status={detail.credit.status} />
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs text-carbon-400 block font-sans">Quantity</span>
                <span className="text-3xl font-extrabold text-emerald-400">
                  {detail.credit.quantity_tco2e} <span className="text-sm font-sans font-normal text-carbon-300">tCO₂e</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-carbon-400 block font-sans">Plant Location</span>
                <span className="text-slate-200">{detail.credit.plants?.name ?? "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-carbon-400 block font-sans">Reporting Period</span>
                <span className="text-slate-200">{detail.credit.reporting_period_label}</span>
              </div>
              <div>
                <span className="text-[10px] text-carbon-400 block font-sans">Issued At</span>
                <span className="text-slate-200">{new Date(detail.credit.issued_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Icons.Sparkles /> Provenance Chain
                </h4>
                <p className="text-xs text-carbon-400">Complete immutable lifecycle audit from issuance onward</p>
              </div>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-carbon-750">
              {detail.provenance.map((ev, idx) => (
                <div key={ev.id} className="relative pl-12 group">
                  <div className="absolute left-2.5 top-0 -translate-x-1/2 w-6 h-6 rounded-full bg-carbon-900 border-2 border-brand-500 flex items-center justify-center text-[10px] font-bold text-brand-400 z-10">
                    {idx + 1}
                  </div>
                  <div className="bg-carbon-900 border border-carbon-750 rounded-2xl p-4 hover:border-carbon-600 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{ev.event_type}</span>
                      <span className="text-[11px] font-mono text-carbon-400">{new Date(ev.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-carbon-800 text-[11px] font-mono text-carbon-400">
                      <span>
                        {ev.previous_status ?? "GENESIS"} → {ev.new_status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            {["", "AVAILABLE", "LOCKED", "FROZEN", "RETIRED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s ? "bg-carbon-750 text-white" : "text-carbon-400 hover:text-slate-200"
                }`}
              >
                {s || "All"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-carbon-400">Loading registry...</div>
          ) : credits.length === 0 ? (
            <div className="py-8 text-center text-xs text-carbon-400">No carbon credits found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-carbon-400 font-mono text-[11px] uppercase border-b border-carbon-800">
                    <th className="py-3 px-4">CCC Serial ID</th>
                    <th className="py-3 px-4">Plant</th>
                    <th className="py-3 px-4">Reporting Period</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-800/50">
                  {credits.map((ccc) => (
                    <tr key={ccc.ccc_id} onClick={() => onSelectCcc(ccc.ccc_id)} className="hover:bg-carbon-800/60 cursor-pointer transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200 group-hover:text-brand-400">{ccc.ccc_id}</td>
                      <td className="py-3.5 px-4 text-carbon-200">{ccc.plants?.name ?? "—"}</td>
                      <td className="py-3.5 px-4 font-mono text-carbon-400">{ccc.reporting_period_label}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{ccc.quantity_tco2e} tCO₂e</td>
                      <td className="py-3.5 px-4 text-right">
                        <StatusBadge status={ccc.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
