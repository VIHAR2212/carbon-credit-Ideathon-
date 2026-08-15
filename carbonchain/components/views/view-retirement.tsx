"use client";

import { useCallback, useEffect, useState } from "react";
import { Icons } from "../shared/icons";
import { dataApi, CarbonCredit, Retirement } from "@/lib/data-api";
import { ApiError } from "@/lib/api-client";

export function ViewRetirement() {
  const [ownedCredits, setOwnedCredits] = useState<CarbonCredit[]>([]);
  const [retirements, setRetirements] = useState<Retirement[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [reason, setReason] = useState("Mandatory CCTS Compliance Surrender");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [creditsRes, retirementsRes] = await Promise.all([
        dataApi.registry.list({ status: "AVAILABLE", mine: true }),
        dataApi.retirements.list(),
      ]);
      setOwnedCredits(creditsRes.credits);
      setRetirements(retirementsRes.retirements);
      if (!selectedId && creditsRes.credits[0]) setSelectedId(creditsRes.credits[0].ccc_id);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const targetCredit = ownedCredits.find((c) => c.ccc_id === selectedId);

  const handleRetire = async () => {
    if (!selectedId || !reason.trim()) return;
    setErrorMsg("");
    setSubmitting(true);
    try {
      const result = await dataApi.retirements.retire(selectedId, reason);
      setStatusMsg(`${selectedId} permanently retired (${result.retirementNumber}).`);
      refresh();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Retirement failed");
    } finally {
      setSubmitting(false);
    }
  };

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
          <p>Retired certificates cannot be transferred, traded, or reactivated under any circumstances. This action is enforced at the database level and cannot be undone.</p>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-carbon-400">Loading your available credits...</div>
        ) : ownedCredits.length === 0 ? (
          <div className="py-6 text-center text-xs text-carbon-400">You have no AVAILABLE credits eligible for retirement.</div>
        ) : (
          <>
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-carbon-400 block mb-1">Select Certificate to Retire</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-600 font-mono"
                >
                  {ownedCredits.map((c) => (
                    <option key={c.ccc_id} value={c.ccc_id}>
                      {c.ccc_id} ({c.quantity_tco2e} tCO₂e)
                    </option>
                  ))}
                </select>
              </div>

              {targetCredit && (
                <div className="bg-carbon-900 p-4 rounded-2xl border border-carbon-800 space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-carbon-400">Origin Facility:</span> <span className="text-white">{targetCredit.plants?.name ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-carbon-400">Quantity:</span> <span className="text-emerald-400 font-bold">{targetCredit.quantity_tco2e} tCO₂e</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-carbon-400 block mb-1">Surrender Purpose / Reason</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            {errorMsg && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{errorMsg}</div>}

            <button
              onClick={handleRetire}
              disabled={submitting}
              className="w-full py-3.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-colors"
            >
              {submitting ? "PROCESSING..." : "PERMANENTLY RETIRE CERTIFICATE"}
            </button>
          </>
        )}

        {statusMsg && (
          <div className="p-5 bg-amber-700/10 border border-amber-700/40 text-amber-300 text-xs rounded-2xl text-center space-y-2">
            <div className="font-bold text-base text-amber-200">RETIREMENT CONFIRMED</div>
            <p>{statusMsg}</p>
          </div>
        )}

        {retirements.length > 0 && (
          <div className="pt-4 border-t border-carbon-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Retirement History</h4>
            <div className="space-y-2">
              {retirements.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-carbon-900 border border-carbon-800 rounded-xl p-3 text-xs font-mono">
                  <span className="text-carbon-300">{r.ccc_id}</span>
                  <span className="text-amber-400">{r.retirement_number}</span>
                  <span className="text-carbon-500">{new Date(r.retired_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
