"use client";

import { useCallback, useEffect, useState } from "react";
import { Icons } from "../shared/icons";
import { StatusBadge } from "../shared/status-badge";
import { dataApi, Anomaly, MrvReport, Plant } from "@/lib/data-api";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";

export function ViewMRV({ onAnomaliesChanged }: { onAnomaliesChanged: () => void }) {
  const { profile } = useAuth();
  const [mrvSubTab, setMrvSubTab] = useState("Emissions");
  const [mrvList, setMrvList] = useState<MrvReport[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload form state
  const [uploadPlantId, setUploadPlantId] = useState("");
  const [csvText, setCsvText] = useState("reading_type,reading_timestamp,value,unit\n");
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [periodLabel, setPeriodLabel] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [productionQty, setProductionQty] = useState("");
  const [productionUnit, setProductionUnit] = useState("t clinker");
  const [submitting, setSubmitting] = useState(false);

  const canUpload = profile?.role === "OBLIGATED_ENTITY";

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [mrvRes, anomaliesRes, plantsRes] = await Promise.all([
        dataApi.mrv.list(),
        dataApi.mrv.anomalies(),
        dataApi.plants.list().catch(() => ({ plants: [] as Plant[] })),
      ]);
      setMrvList(mrvRes.mrvReports);
      setAnomalies(anomaliesRes.anomalies);
      setPlants(plantsRes.plants);
      if (!uploadPlantId && plantsRes.plants[0]) setUploadPlantId(plantsRes.plants[0].id);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUploadAndCalculate = async () => {
    setUploadError(null);
    setUploadResult(null);
    if (!uploadPlantId || !periodLabel || !periodStart || !periodEnd) {
      setUploadError("Select a plant and fill in the reporting period before uploading.");
      return;
    }

    setSubmitting(true);
    try {
      const upload = await dataApi.mrv.upload({ plantId: uploadPlantId, csvText });
      const summary = upload.summary;

      const calc = await dataApi.mrv.calculate({
        plantId: uploadPlantId,
        batchId: upload.batchId,
        reportingPeriodStart: periodStart,
        reportingPeriodEnd: periodEnd,
        reportingPeriodLabel: periodLabel,
        productionQuantity: productionQty ? Number(productionQty) : undefined,
        productionUnit,
      });

      setUploadResult(
        `${summary.totalRows} records imported · ${summary.validRows} valid · ${summary.warningRows} warnings · ${summary.rejectedRows} rejected. ` +
          `MRV report ${calc.mrvReport.mrv_number} created (${calc.anomalies.length} anomal${calc.anomalies.length === 1 ? "y" : "ies"} detected).`
      );
      refresh();
      onAnomaliesChanged();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    await dataApi.mrv.resolveAnomaly(id);
    refresh();
    onAnomaliesChanged();
  };

  const openAnomalyCount = anomalies.filter((a) => a.status !== "RESOLVED" && a.status !== "DISMISSED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-carbon-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">MRV Engine & Telemetry</h2>
          <p className="text-xs text-carbon-400 mt-1">Continuous Monitoring, Reporting, and Verification data pipeline</p>
        </div>
        <div className="flex items-center bg-carbon-900 p-1 rounded-xl border border-carbon-750">
          {(canUpload ? ["Upload", "Emissions", "Anomalies"] : ["Emissions", "Anomalies"]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMrvSubTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                mrvSubTab === tab ? "bg-carbon-750 text-white" : "text-carbon-400 hover:text-slate-200"
              }`}
            >
              {tab}
              {tab === "Anomalies" && openAnomalyCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-mono">{openAnomalyCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {mrvSubTab === "Upload" && canUpload && (
        <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-white">Upload Meter Readings (CSV)</h3>
          <p className="text-xs text-carbon-400">
            Columns: <code className="text-carbon-300">reading_type,reading_timestamp,value,unit</code>. reading_type must be
            ELECTRICITY, FUEL, PRODUCTION, or EMISSIONS_DIRECT.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-carbon-400 block mb-1">Plant</label>
              <select
                value={uploadPlantId}
                onChange={(e) => setUploadPlantId(e.target.value)}
                className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              >
                {plants.length === 0 && <option value="">No plants — create one first</option>}
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-carbon-400 block mb-1">Reporting Period Label</label>
              <input
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="Q2 2026"
                className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="text-carbon-400 block mb-1">Period Start</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="text-carbon-400 block mb-1">Period End</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="text-carbon-400 block mb-1">Production Quantity (optional)</label>
              <input
                type="number"
                value={productionQty}
                onChange={(e) => setProductionQty(e.target.value)}
                className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="text-carbon-400 block mb-1">Production Unit</label>
              <input
                value={productionUnit}
                onChange={(e) => setProductionUnit(e.target.value)}
                className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-carbon-400 block mb-1 text-xs">CSV Data</label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={8}
              className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500 font-mono text-xs"
            />
          </div>

          {uploadError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{uploadError}</div>}
          {uploadResult && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">{uploadResult}</div>}

          <button
            onClick={handleUploadAndCalculate}
            disabled={submitting || plants.length === 0}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-xs rounded-xl transition-colors"
          >
            {submitting ? "Processing..." : "UPLOAD & CALCULATE EMISSIONS"}
          </button>
        </div>
      )}

      {(mrvSubTab === "Anomalies" || mrvSubTab === "Emissions") && (
        <div className="space-y-6">
          <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Anomaly Center</h3>
                <p className="text-xs text-carbon-400">Automated rule-based detection for emission spikes and data-quality risks</p>
              </div>
              <span className="text-xs text-carbon-400">{openAnomalyCount} Active Case File(s)</span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-carbon-400">Loading...</div>
            ) : anomalies.length === 0 ? (
              <div className="py-6 text-center text-xs text-carbon-400">No anomalies detected.</div>
            ) : (
              <div className="space-y-4">
                {anomalies.map((anm) => (
                  <div key={anm.id} className="bg-carbon-900 border border-carbon-750 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            anm.priority === "HIGH"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {anm.priority} PRIORITY
                        </span>
                        <span className="text-xs font-mono text-carbon-400">{anm.anomaly_number}</span>
                        <span className="text-xs font-semibold text-slate-300">{anm.plants?.name}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">{anm.title}</h4>
                      <p className="text-xs text-carbon-300">{anm.description}</p>
                      <div className="text-[11px] font-mono text-carbon-400">
                        Detected: {new Date(anm.detected_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end md:self-center">
                      {anm.status !== "RESOLVED" && anm.status !== "DISMISSED" ? (
                        <>
                          <button
                            onClick={() => setSelectedAnomaly(anm)}
                            className="px-4 py-2 bg-carbon-750 hover:bg-carbon-700 text-xs font-medium rounded-xl text-slate-200 transition-colors border border-carbon-600"
                          >
                            INVESTIGATE
                          </button>
                          <button
                            onClick={() => handleResolve(anm.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium rounded-xl text-black font-semibold transition-colors"
                          >
                            RESOLVE
                          </button>
                        </>
                      ) : (
                        <StatusBadge status="RESOLVED" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6">
            <h3 className="text-base font-semibold text-white mb-4">Facility Emission Ledger</h3>
            {loading ? (
              <div className="py-6 text-center text-xs text-carbon-400">Loading...</div>
            ) : mrvList.length === 0 ? (
              <div className="py-6 text-center text-xs text-carbon-400">No MRV reports yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-carbon-400 font-mono text-[11px] uppercase border-b border-carbon-800">
                      <th className="py-3 px-4">Plant</th>
                      <th className="py-3 px-4">Reporting Period</th>
                      <th className="py-3 px-4">Emissions</th>
                      <th className="py-3 px-4">Intensity</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-carbon-800/50">
                    {mrvList.map((m) => (
                      <tr key={m.id} className="hover:bg-carbon-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-200">{m.plants?.name ?? "—"}</td>
                        <td className="py-3 px-4 font-mono text-carbon-400">{m.reporting_period_label}</td>
                        <td className="py-3 px-4 font-mono font-medium text-white">
                          {m.mrv_calculations?.total_emissions_tco2e?.toLocaleString() ?? "—"} tCO₂e
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400">
                          {m.mrv_calculations?.emission_intensity ?? "—"} {m.mrv_calculations?.intensity_unit ?? ""}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={m.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedAnomaly && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-carbon-850 border border-carbon-750 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-carbon-750 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-rose-400">
                  <Icons.Alert />
                </span>
                Anomaly File: {selectedAnomaly.anomaly_number}
              </h3>
              <button onClick={() => setSelectedAnomaly(null)} className="text-carbon-400 hover:text-white text-xl">
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-carbon-400 block">Facility Name</span>
                <span className="font-semibold text-slate-200 text-sm">{selectedAnomaly.plants?.name}</span>
              </div>
              <div>
                <span className="text-carbon-400 block">Rule Triggered</span>
                <span className="font-mono text-slate-300">{selectedAnomaly.rule_code}</span>
              </div>
              <div>
                <span className="text-carbon-400 block">Divergence Report</span>
                <p className="text-slate-300 bg-carbon-900 p-3 rounded-xl border border-carbon-800 leading-relaxed mt-1">
                  {selectedAnomaly.description}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-carbon-750">
              <button onClick={() => setSelectedAnomaly(null)} className="px-4 py-2 bg-carbon-750 text-xs font-medium text-slate-300 rounded-xl">
                Close
              </button>
              <button
                onClick={() => {
                  handleResolve(selectedAnomaly.id);
                  setSelectedAnomaly(null);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
