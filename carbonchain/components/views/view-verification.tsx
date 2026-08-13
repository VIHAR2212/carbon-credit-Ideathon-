"use client";

import { useState } from "react";
import { StatusBadge } from "../shared/status-badge";

const CHECKLIST_ITEMS = [
  { key: "production", label: "Production Data (Clinker Weighbridge Log Verification)" },
  { key: "electricity", label: "Electricity Consumption (State Electricity Utility Invoices & Submeter SCADA)" },
  { key: "fuel", label: "Fuel Data (Coal & Alternative Fuel Calorific Value Test Certificates)" },
  { key: "calculation", label: "Calculation Methodology (CCTS Sectoral Emission Intensity Algorithm)" },
  { key: "documents", label: "Supporting Documents (Third-party Calibration Reports)" },
  { key: "mrvReport", label: "MRV Report Digital Signature & Cryptographic Integrity Check" },
] as const;

type ChecklistKey = (typeof CHECKLIST_ITEMS)[number]["key"];

export function ViewVerification({ onApproveVerification }: { onApproveVerification: () => void }) {
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    production: true,
    electricity: true,
    fuel: true,
    calculation: true,
    documents: true,
    mrvReport: false,
  });
  const [statusMsg, setStatusMsg] = useState("");

  const allChecked = Object.values(checklist).every(Boolean);

  const toggleCheck = (key: ChecklistKey) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-carbon-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Verifier Command Center</h2>
          <p className="text-xs text-carbon-400 mt-1">Accredited Independent Verification Agency Audit Workdesk</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
          Agency: Bureau Veritas India (ID: VER-ACVA002)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-carbon-850 border border-carbon-750 rounded-2xl p-4">
          <span className="text-xs text-carbon-400 font-medium">Pending Reviews</span>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1">3 Facilities</div>
        </div>
        <div className="bg-carbon-850 border border-carbon-750 rounded-2xl p-4">
          <span className="text-xs text-carbon-400 font-medium">Verified This Month</span>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">18 Facilities</div>
        </div>
        <div className="bg-carbon-850 border border-carbon-750 rounded-2xl p-4">
          <span className="text-xs text-carbon-400 font-medium">Corrections Requested</span>
          <div className="text-2xl font-mono font-bold text-sky-400 mt-1">2 Reports</div>
        </div>
        <div className="bg-carbon-850 border border-carbon-750 rounded-2xl p-4">
          <span className="text-xs text-carbon-400 font-medium">Rejected</span>
          <div className="text-2xl font-mono font-bold text-rose-400 mt-1">0 Facilities</div>
        </div>
      </div>

      <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-brand-400">INSPECTION FILE #VER-ACVA002-2026-00918</span>
              <h3 className="text-lg font-bold text-white mt-1">ABC Cement Infrastructure Ltd. — Q2 2026 Audit</h3>
            </div>
            <StatusBadge status="PENDING" />
          </div>

          <div className="bg-carbon-900 border border-carbon-750 rounded-2xl p-4 text-xs space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-carbon-400">Facility:</span>{" "}
                <span className="text-slate-200 font-medium">Maharashtra Plant 04</span>
              </div>
              <div>
                <span className="text-carbon-400">Claimed Reduction:</span>{" "}
                <span className="text-emerald-400 font-mono font-bold">10,427 tCO₂e</span>
              </div>
              <div>
                <span className="text-carbon-400">Baseline Emission Rate:</span>{" "}
                <span className="text-slate-200 font-mono">0.890 tCO₂e/t</span>
              </div>
              <div>
                <span className="text-carbon-400">Verified Emission Rate:</span>{" "}
                <span className="text-slate-200 font-mono">0.824 tCO₂e/t</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Independent Evidence Checklist</h4>

            {CHECKLIST_ITEMS.map((item) => (
              <label
                key={item.key}
                onClick={() => toggleCheck(item.key)}
                className="flex items-center justify-between p-3 bg-carbon-900 border border-carbon-750/80 rounded-xl cursor-pointer hover:border-carbon-600 transition-all"
              >
                <span className="text-xs text-slate-200 font-medium">{item.label}</span>
                <input
                  type="checkbox"
                  checked={checklist[item.key]}
                  onChange={() => {}}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-carbon-900 border border-carbon-750 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white mb-2">Verifier Decision Desk</h4>
            <p className="text-xs text-carbon-400 mb-4">
              Signing this approval will record your cryptographic signature to the CCTS immutable registry and unlock
              CCC issuance eligibility.
            </p>

            {statusMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl mb-4">
                {statusMsg}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-carbon-800">
            <button
              onClick={() => setStatusMsg("Correction request sent to ABC Cement facility lead.")}
              className="w-full py-2.5 bg-carbon-800 hover:bg-carbon-750 border border-carbon-700 text-xs font-semibold text-amber-400 rounded-xl transition-colors"
            >
              REQUEST CORRECTION
            </button>
            <button
              onClick={() => setStatusMsg("Verification file rejected. Interlock logged.")}
              className="w-full py-2.5 bg-carbon-800 hover:bg-carbon-750 border border-carbon-700 text-xs font-semibold text-rose-400 rounded-xl transition-colors"
            >
              REJECT VERIFICATION
            </button>
            <button
              disabled={!allChecked}
              onClick={() => {
                onApproveVerification();
                setStatusMsg("✓ Audit approved! Certificate digitally signed and transmitted to CCTS Issuance Queue.");
              }}
              className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-lg ${
                allChecked
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                  : "bg-carbon-800 text-carbon-500 cursor-not-allowed border border-carbon-750"
              }`}
            >
              APPROVE VERIFICATION & SIGN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
