"use client";

import { useState } from "react";
import { StatusBadge } from "../shared/status-badge";

export function ViewIssuance({ onMintNewBatch }: { onMintNewBatch: () => void }) {
  const [step, setStep] = useState(1);
  const [issued, setIssued] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-carbon-800 pb-4">
        <h2 className="text-2xl font-bold text-white">Controlled CCC Issuance Workflow</h2>
        <p className="text-xs text-carbon-400 mt-1">Multi-signatory approval pipeline for Bureau of Energy Efficiency (BEE)</p>
      </div>

      <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6 space-y-6">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {["1. Verified MRV", "2. Quantity Check", "3. Multi-Sig Approval", "4. Serial Minting"].map((s, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border ${
                step >= i + 1
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-semibold"
                  : "bg-carbon-900 border-carbon-800 text-carbon-500"
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        <div className="bg-carbon-900 border border-carbon-800 rounded-2xl p-5 space-y-4 text-xs font-mono">
          <div className="flex justify-between text-carbon-300">
            <span>Originating Plant:</span>
            <span className="text-white font-bold">ABC Cement Infrastructure Ltd.</span>
          </div>
          <div className="flex justify-between text-carbon-300">
            <span>Verification ID:</span>
            <span className="text-emerald-400">VER-ACVA002-2026-00918</span>
          </div>
          <div className="flex justify-between text-carbon-300">
            <span>Eligible Quantity:</span>
            <span className="text-white font-bold">10,427 tCO₂e</span>
          </div>
          <div className="flex justify-between text-carbon-300">
            <span>Generated Serial Batch:</span>
            <span className="text-brand-400">CCC-IN-2026-00010001 to CCC-IN-2026-00020427</span>
          </div>
        </div>

        <div className="bg-carbon-900/60 border border-carbon-800 rounded-2xl p-4 space-y-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Multi-Sig Signatory Matrix</span>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-carbon-300">Issuer Authorization (ABC Cement)</span>
            <StatusBadge status="VERIFIED" />
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-carbon-300">Third-Party Verifier (Bureau Veritas)</span>
            <StatusBadge status="VERIFIED" />
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-carbon-300">Registry Admin (Bureau of Energy Efficiency)</span>
            <StatusBadge status={issued ? "VERIFIED" : "PENDING"} />
          </div>
        </div>

        {!issued ? (
          <button
            onClick={() => {
              setStep(4);
              setIssued(true);
              onMintNewBatch();
            }}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
          >
            EXECUTE CCC BATCH ISSUANCE
          </button>
        ) : (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs rounded-2xl text-center space-y-2">
            <div className="font-bold text-sm">✓ BATCH ISSUANCE COMPLETE</div>
            <p>10,427 CCC Certificates successfully minted and transferred to custodian wallet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
