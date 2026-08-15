"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "../shared/status-badge";
import { useAuth } from "@/lib/auth-context";
import { dataApi, Verification, VerificationFinding, MrvReport } from "@/lib/data-api";
import { ApiError } from "@/lib/api-client";

export function ViewVerification() {
  const { profile } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [selected, setSelected] = useState<Verification | null>(null);
  const [findings, setFindings] = useState<VerificationFinding[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // Registry admin: assign verifier
  const [submittedReports, setSubmittedReports] = useState<MrvReport[]>([]);
  const [verifierAgencies, setVerifierAgencies] = useState<{ id: string; accreditation_id: string; organizations: { name: string } }[]>([]);
  const [assignMrvId, setAssignMrvId] = useState("");
  const [assignAgencyId, setAssignAgencyId] = useState("");

  const isVerifier = profile?.role === "VERIFIER";
  const isRegistryAdmin = profile?.role === "REGISTRY_ADMIN" || profile?.role === "SYSTEM_ADMIN";

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { verifications: list } = await dataApi.verifications.list();
      setVerifications(list);

      if (isRegistryAdmin) {
        const [mrvRes, agenciesRes] = await Promise.all([dataApi.mrv.list(), dataApi.organizations.verifierAgencies()]);
        setSubmittedReports(mrvRes.mrvReports.filter((m) => m.status === "SUBMITTED_FOR_VERIFICATION"));
        setVerifierAgencies(agenciesRes.verifierAgencies);
      }
    } finally {
      setLoading(false);
    }
  }, [isRegistryAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openVerification = async (v: Verification) => {
    setSelected(v);
    setStatusMsg("");
    setErrorMsg("");
    const detail = await dataApi.verifications.detail(v.id);
    setFindings(detail.findings);
  };

  const toggleFinding = async (checkKey: string, current: boolean) => {
    if (!selected) return;
    await dataApi.verifications.toggleFinding(selected.id, checkKey, !current);
    const detail = await dataApi.verifications.detail(selected.id);
    setFindings(detail.findings);
  };

  const allSatisfied = findings.length > 0 && findings.every((f) => f.is_satisfied);

  const handleDecision = async (decision: "approve" | "reject") => {
    if (!selected) return;
    setErrorMsg("");
    try {
      if (decision === "approve") {
        await dataApi.verifications.approve(selected.id);
        setStatusMsg("Audit approved. Certificate digitally signed and transmitted to the issuance queue.");
      } else {
        await dataApi.verifications.reject(selected.id);
        setStatusMsg("Verification rejected.");
      }
      refresh();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Decision failed");
    }
  };

  const handleAssign = async () => {
    if (!assignMrvId || !assignAgencyId) return;
    setErrorMsg("");
    try {
      await dataApi.verifications.assign({ mrvReportId: assignMrvId, verifierAgencyId: assignAgencyId });
      setStatusMsg("Verifier assigned.");
      setAssignMrvId("");
      setAssignAgencyId("");
      refresh();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Assignment failed");
    }
  };

  if (loading) return <div className="py-10 text-center text-xs text-carbon-400">Loading verification desk...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-carbon-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Verifier Command Center</h2>
          <p className="text-xs text-carbon-400 mt-1">Independent verification workflow, evidence review, and sign-off</p>
        </div>
      </div>

      {errorMsg && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{errorMsg}</div>}
      {statusMsg && !selected && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">{statusMsg}</div>
      )}

      {isRegistryAdmin && (
        <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Assign Verifier</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-carbon-400 block mb-1">MRV Report (submitted, unassigned)</label>
              <select
                value={assignMrvId}
                onChange={(e) => setAssignMrvId(e.target.value)}
                className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 font-mono"
              >
                <option value="">Select...</option>
                {submittedReports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.mrv_number} — {r.plants?.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-carbon-400 block mb-1">Verifier Agency</label>
              <select
                value={assignAgencyId}
                onChange={(e) => setAssignAgencyId(e.target.value)}
                className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 font-mono"
              >
                <option value="">Select...</option>
                {verifierAgencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.organizations.name} ({a.accreditation_id})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAssign}
                disabled={!assignMrvId || !assignAgencyId}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black font-bold text-xs rounded-xl transition-colors"
              >
                ASSIGN
              </button>
            </div>
          </div>
        </div>
      )}

      {!selected ? (
        <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">
            {isVerifier ? "Assigned Verification Queue" : "Verifications"}
          </h3>
          {verifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-carbon-400">No verification records yet.</div>
          ) : (
            <div className="space-y-3">
              {verifications.map((v) => (
                <div
                  key={v.id}
                  onClick={() => openVerification(v)}
                  className="bg-carbon-900 border border-carbon-750 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-carbon-600 transition-colors"
                >
                  <div>
                    <div className="text-xs font-mono text-brand-400">{v.verification_number}</div>
                    <div className="text-sm font-semibold text-white mt-0.5">{v.mrv_reports?.plants?.name ?? "—"}</div>
                    <div className="text-[11px] text-carbon-400 font-mono">{v.mrv_reports?.mrv_number}</div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <button onClick={() => setSelected(null)} className="text-xs font-medium text-carbon-400 hover:text-white">
              ← Back to queue
            </button>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-brand-400">{selected.verification_number}</span>
                <h3 className="text-lg font-bold text-white mt-1">{selected.mrv_reports?.plants?.name}</h3>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="bg-carbon-900 border border-carbon-750 rounded-2xl p-4 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-carbon-400">Claimed Reduction:</span>{" "}
                  <span className="text-emerald-400 font-mono font-bold">{selected.claimed_reduction_tco2e ?? "—"} tCO₂e</span>
                </div>
                <div>
                  <span className="text-carbon-400">Baseline Rate:</span>{" "}
                  <span className="text-slate-200 font-mono">{selected.baseline_emission_rate ?? "—"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Evidence Checklist</h4>
              {findings.map((item) => (
                <label
                  key={item.check_key}
                  onClick={() => isVerifier && selected.status === "EVIDENCE_REVIEW" && toggleFinding(item.check_key, item.is_satisfied)}
                  className={`flex items-center justify-between p-3 bg-carbon-900 border border-carbon-750/80 rounded-xl transition-colors ${
                    isVerifier && selected.status === "EVIDENCE_REVIEW" ? "cursor-pointer hover:border-carbon-600" : "opacity-70"
                  }`}
                >
                  <span className="text-xs text-slate-200 font-medium">{item.check_label}</span>
                  <input type="checkbox" checked={item.is_satisfied} onChange={() => {}} className="w-4 h-4 accent-emerald-500 rounded" />
                </label>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-carbon-900 border border-carbon-750 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-white mb-2">Verifier Decision Desk</h4>
              <p className="text-xs text-carbon-400 mb-4">
                Approval records a cryptographic signature and unlocks CCC issuance eligibility.
              </p>
              {statusMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl mb-4">{statusMsg}</div>}
            </div>

            {isVerifier && selected.status === "EVIDENCE_REVIEW" && (
              <div className="space-y-3 pt-4 border-t border-carbon-800">
                <button
                  onClick={() => handleDecision("reject")}
                  className="w-full py-2.5 bg-carbon-800 hover:bg-carbon-750 border border-carbon-700 text-xs font-semibold text-rose-400 rounded-xl transition-colors"
                >
                  REJECT VERIFICATION
                </button>
                <button
                  disabled={!allSatisfied}
                  onClick={() => handleDecision("approve")}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-colors ${
                    allSatisfied ? "bg-emerald-500 hover:bg-emerald-400 text-black" : "bg-carbon-800 text-carbon-500 cursor-not-allowed border border-carbon-750"
                  }`}
                >
                  APPROVE VERIFICATION & SIGN
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
