"use client";

import { useState } from "react";
import { Icons } from "../shared/icons";
import { CCC } from "@/lib/types";

export function ViewRetirement({
  cccList,
  onRetireCCC,
}: {
  cccList: CCC[];
  onRetireCCC: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(cccList[0]?.id || "");
  const [reason, setReason] = useState("Mandatory CCTS Compliance Surrender FY 2026");
  const [retiredSuccess, setRetiredSuccess] = useState(false);

  const targetCCC = cccList.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-carbon-800 pb-4">
        <h2 className="text-2xl font-bold text-white">Carbon Credit Retirement & Surrender</h2>
        <p className="text-xs text-carbon-400 mt-1">Permanent offset surrender console for compliance obligations</p>
      </div>

      <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6 space-y-6">
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Icons.Alert /> PERMANENT SURRENDER WARNING
          </div>
          <p>
            Retired certificates cannot be transferred, traded, or reactivated under any circumstances. Cryptographic
            burn proof will be registered in the CCTS ledger.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-carbon-400 block mb-1">Select Certificate to Retire</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
            >
              {cccList
                .filter((c) => c.status !== "RETIRED")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.origin} ({c.quantity} tCO₂e)
                  </option>
                ))}
            </select>
          </div>

          {targetCCC && (
            <div className="bg-carbon-900 p-4 rounded-2xl border border-carbon-800 space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-carbon-400">Origin Facility:</span> <span className="text-white">{targetCCC.plant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-carbon-400">Quantity:</span>{" "}
                <span className="text-emerald-400 font-bold">{targetCCC.quantity} tCO₂e</span>
              </div>
              <div className="flex justify-between">
                <span className="text-carbon-400">Current Owner:</span> <span className="text-white">{targetCCC.currentOwner}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-carbon-400 block mb-1">Surrender Purpose / Reason</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500"
            ></textarea>
          </div>
        </div>

        {!retiredSuccess ? (
          <button
            onClick={() => {
              onRetireCCC(selectedId);
              setRetiredSuccess(true);
            }}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-500/20"
          >
            PERMANENTLY RETIRE CERTIFICATE
          </button>
        ) : (
          <div className="p-5 bg-purple-500/10 border border-purple-500/40 text-purple-300 text-xs rounded-2xl text-center space-y-2">
            <div className="font-bold text-base text-purple-200">PERMANENTLY RETIRED</div>
            <p>Surrender certificate generated and signed. CCTS compliance obligation updated.</p>
          </div>
        )}
      </div>
    </div>
  );
}
