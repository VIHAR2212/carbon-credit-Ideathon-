"use client";

import { Icons } from "../shared/icons";
import { StatusBadge } from "../shared/status-badge";
import { CCC, ViewId } from "@/lib/types";

export function ViewRegistry({
  cccList,
  selectedCCC,
  onSelectCCC,
  onNavigateTab,
}: {
  cccList: CCC[];
  selectedCCC: CCC | null;
  onSelectCCC: (ccc: CCC | null) => void;
  onNavigateTab: (tab: ViewId) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-carbon-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Carbon Credit Registry</h2>
          <p className="text-xs text-carbon-400 mt-1">Official CCTS Provenance Ledger & Certificate Ownership Tracking</p>
        </div>
        <button
          onClick={() => onNavigateTab("issuance")}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
        >
          + Issuance Workflow
        </button>
      </div>

      {selectedCCC ? (
        <div className="space-y-6">
          <button
            onClick={() => onSelectCCC(null)}
            className="text-xs font-medium text-carbon-400 hover:text-white flex items-center gap-1.5"
          >
            ← Back to Registry Ledger
          </button>

          <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6 glow-card-green">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-carbon-750 pb-5">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-mono font-extrabold text-white">{selectedCCC.id}</h3>
                  <StatusBadge status={selectedCCC.status} />
                </div>
                <p className="text-xs text-carbon-300 mt-1">
                  Origin Entity: <span className="text-white font-medium">{selectedCCC.origin}</span>
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs text-carbon-400 block font-sans">Certificate Quantity</span>
                <span className="text-3xl font-extrabold text-emerald-400">
                  {selectedCCC.quantity} <span className="text-sm font-sans font-normal text-carbon-300">tCO₂e</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-carbon-400 block font-sans">Plant Location</span>
                <span className="text-slate-200">{selectedCCC.plant}</span>
              </div>
              <div>
                <span className="text-[10px] text-carbon-400 block font-sans">Reporting Period</span>
                <span className="text-slate-200">{selectedCCC.reportingPeriod}</span>
              </div>
              <div>
                <span className="text-[10px] text-carbon-400 block font-sans">Verification Record</span>
                <span className="text-emerald-400">{selectedCCC.verificationId}</span>
              </div>
              <div>
                <span className="text-[10px] text-carbon-400 block font-sans">Current Custodian</span>
                <span className="text-slate-200">{selectedCCC.currentOwner}</span>
              </div>
            </div>
          </div>

          <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Icons.Sparkles /> Cryptographic Provenance Chain
                </h4>
                <p className="text-xs text-carbon-400">Complete immutable lifecycle audit from sensor reading to retirement</p>
              </div>
              <span className="text-xs font-mono text-carbon-400 bg-carbon-900 px-3 py-1 rounded-xl border border-carbon-750">
                Block #{selectedCCC.blockNumber}
              </span>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-carbon-750">
              {selectedCCC.provenance.map((ev, idx) => (
                <div key={idx} className="relative pl-12 group">
                  <div className="absolute left-2.5 top-0 -translate-x-1/2 w-6 h-6 rounded-full bg-carbon-900 border-2 border-brand-500 flex items-center justify-center text-[10px] font-bold text-brand-400 z-10 shadow-md shadow-brand-500/20">
                    {idx + 1}
                  </div>

                  <div className="bg-carbon-900 border border-carbon-750 rounded-2xl p-4 hover:border-carbon-600 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{ev.step}</span>
                      <span className="text-[11px] font-mono text-carbon-400">{ev.timestamp}</span>
                    </div>
                    <p className="text-xs text-carbon-200">{ev.detail}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-carbon-800 text-[11px] font-mono text-carbon-400">
                      <span>
                        Actor: <span className="text-slate-300">{ev.actor}</span>
                      </span>
                      <span className="bg-carbon-800 px-2 py-0.5 rounded text-[10px]">{ev.hash}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-carbon-400 font-mono text-[11px] uppercase border-b border-carbon-800">
                  <th className="py-3 px-4">CCC Serial ID</th>
                  <th className="py-3 px-4">Origin Entity</th>
                  <th className="py-3 px-4">Reporting Year</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Current Owner</th>
                  <th className="py-3 px-4">Last Transaction</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800/50">
                {cccList.map((ccc) => (
                  <tr
                    key={ccc.id}
                    onClick={() => onSelectCCC(ccc)}
                    className="hover:bg-carbon-800/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200 group-hover:text-brand-400">
                      {ccc.id}
                    </td>
                    <td className="py-3.5 px-4 text-carbon-200">{ccc.origin}</td>
                    <td className="py-3.5 px-4 font-mono text-carbon-400">{ccc.reportingPeriod}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{ccc.quantity} tCO₂e</td>
                    <td className="py-3.5 px-4 text-carbon-300">{ccc.currentOwner}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-carbon-400">{ccc.lastTx}</td>
                    <td className="py-3.5 px-4 text-right">
                      <StatusBadge status={ccc.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
