"use client";

import { useState } from "react";
import { Icons } from "../shared/icons";
import { StatusBadge } from "../shared/status-badge";
import { Anomaly, MRVRecord } from "@/lib/types";

const DATA_SOURCES = [
  { name: "Electricity Meter SCADA", type: "IoT Gateway / Modbus", status: "Online", sync: "12 sec ago", quality: "99.9%", records: "1,420,918" },
  { name: "Fuel Flow Telemetry", type: "Mass Flow Meter", status: "Online", sync: "45 sec ago", quality: "99.4%", records: "891,200" },
  { name: "Production System ERP", type: "SAP S/4HANA Connector", status: "Online", sync: "2 min ago", quality: "100%", records: "412,091" },
  { name: "Continuous Emission Monitoring", type: "CEMS Gas Analyzer", status: "Online", sync: "5 sec ago", quality: "99.8%", records: "3,110,400" },
  { name: "Steam Boiler Sensors", type: "Pressure & Temp Sensors", status: "Warning", sync: "14 min ago", quality: "94.2%", records: "712,000" },
  { name: "Manual Upload Portal", type: "Verified Lab Certificates", status: "Idle", sync: "2 days ago", quality: "100%", records: "184" },
];

export function ViewMRV({
  mrvList,
  anomalies,
  onResolveAnomaly,
}: {
  mrvList: MRVRecord[];
  anomalies: Anomaly[];
  onResolveAnomaly: (id: string) => void;
}) {
  const [mrvSubTab, setMrvSubTab] = useState("Emissions");
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-carbon-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">MRV Engine & Telemetry</h2>
          <p className="text-xs text-carbon-400 mt-1">Continuous Monitoring, Reporting, and Verification data pipeline</p>
        </div>
        <div className="flex items-center bg-carbon-900 p-1 rounded-xl border border-carbon-750">
          {["Emissions", "Data Sources", "Reports", "Anomalies"].map((tab) => (
            <button
              key={tab}
              onClick={() => setMrvSubTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                mrvSubTab === tab ? "bg-carbon-750 text-white shadow" : "text-carbon-400 hover:text-slate-200"
              }`}
            >
              {tab}
              {tab === "Anomalies" && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-mono">
                  {anomalies.filter((a) => a.status === "UNDER REVIEW").length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {mrvSubTab === "Data Sources" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DATA_SOURCES.map((src, idx) => (
            <div key={idx} className="bg-carbon-850 border border-carbon-750 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-100 text-sm">{src.name}</h4>
                  <span className="text-[11px] font-mono text-carbon-400">{src.type}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                    src.status === "Online"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {src.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-carbon-800 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-carbon-400 block font-sans">Last Sync</span>
                  <span className="text-carbon-200">{src.sync}</span>
                </div>
                <div>
                  <span className="text-[10px] text-carbon-400 block font-sans">Data Quality</span>
                  <span className="text-emerald-400">{src.quality}</span>
                </div>
                <div>
                  <span className="text-[10px] text-carbon-400 block font-sans">Total Logs</span>
                  <span className="text-carbon-200">{src.records}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(mrvSubTab === "Anomalies" || mrvSubTab === "Emissions" || mrvSubTab === "Reports") && (
        <div className="space-y-6">
          <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Anomaly Center</h3>
                <p className="text-xs text-carbon-400">
                  Automated AI detection for emission spikes, data loss, and double-counting risks
                </p>
              </div>
              <span className="text-xs text-carbon-400">2 Active Case File(s)</span>
            </div>

            <div className="space-y-4">
              {anomalies.map((anm) => (
                <div
                  key={anm.id}
                  className="bg-carbon-900 border border-carbon-750 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          anm.priority === "HIGH PRIORITY"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {anm.priority}
                      </span>
                      <span className="text-xs font-mono text-carbon-400">{anm.id}</span>
                      <span className="text-xs font-semibold text-slate-300">{anm.plant}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">{anm.title}</h4>
                    <p className="text-xs text-carbon-300">{anm.description}</p>
                    <div className="text-[11px] font-mono text-carbon-400">
                      Detected: {anm.timestamp} · Related MRV: {anm.mrvId}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end md:self-center">
                    {anm.status === "UNDER REVIEW" ? (
                      <>
                        <button
                          onClick={() => setSelectedAnomaly(anm)}
                          className="px-4 py-2 bg-carbon-750 hover:bg-carbon-700 text-xs font-medium rounded-xl text-slate-200 transition-colors border border-carbon-600"
                        >
                          INVESTIGATE
                        </button>
                        <button
                          onClick={() => onResolveAnomaly(anm.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium rounded-xl text-black font-semibold transition-colors shadow-lg shadow-emerald-500/20"
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
          </div>

          <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6">
            <h3 className="text-base font-semibold text-white mb-4">Facility Emission Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-carbon-400 font-mono text-[11px] uppercase border-b border-carbon-800">
                    <th className="py-3 px-4">Plant</th>
                    <th className="py-3 px-4">Sector</th>
                    <th className="py-3 px-4">Reporting Period</th>
                    <th className="py-3 px-4">Emissions</th>
                    <th className="py-3 px-4">Intensity Target</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-800/50">
                  {mrvList.map((m) => (
                    <tr key={m.id} className="hover:bg-carbon-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-200">{m.plant}</td>
                      <td className="py-3 px-4 text-carbon-300">{m.category}</td>
                      <td className="py-3 px-4 font-mono text-carbon-400">{m.period}</td>
                      <td className="py-3 px-4 font-mono font-medium text-white">{m.emissions}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400">{m.intensity}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                Anomaly File: {selectedAnomaly.id}
              </h3>
              <button onClick={() => setSelectedAnomaly(null)} className="text-carbon-400 hover:text-white text-xl">
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-carbon-400 block">Facility Name</span>
                <span className="font-semibold text-slate-200 text-sm">{selectedAnomaly.plant}</span>
              </div>
              <div>
                <span className="text-carbon-400 block">Divergence Report</span>
                <p className="text-slate-300 bg-carbon-900 p-3 rounded-xl border border-carbon-800 leading-relaxed mt-1">
                  {selectedAnomaly.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 font-mono bg-carbon-900/60 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-carbon-400 block">Telemetry Stream</span>
                  <span className="text-amber-400">Modbus Node #04 (Chlorine Cell)</span>
                </div>
                <div>
                  <span className="text-[10px] text-carbon-400 block">Risk Matrix</span>
                  <span className="text-rose-400">Potential Over-Issuance Risk</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-carbon-750">
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="px-4 py-2 bg-carbon-750 text-xs font-medium text-slate-300 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onResolveAnomaly(selectedAnomaly.id);
                  setSelectedAnomaly(null);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl"
              >
                Mark Resolved & Re-verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
