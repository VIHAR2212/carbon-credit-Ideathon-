"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "../shared/status-badge";
import { useAuth } from "@/lib/auth-context";
import { dataApi, Verification, IssuanceRequest } from "@/lib/data-api";
import { ApiError } from "@/lib/api-client";

export function ViewIssuance() {
  const { profile } = useAuth();
  const [approvedVerifications, setApprovedVerifications] = useState<Verification[]>([]);
  const [requests, setRequests] = useState<IssuanceRequest[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const isEntity = profile?.role === "OBLIGATED_ENTITY";
  const isRegistryAdmin = profile?.role === "REGISTRY_ADMIN" || profile?.role === "SYSTEM_ADMIN";

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [verRes, reqRes] = await Promise.all([dataApi.verifications.list(), dataApi.issuance.list()]);
      setApprovedVerifications(verRes.verifications.filter((v) => v.status === "APPROVED"));
      setRequests(reqRes.issuanceRequests);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestedVerificationIds = new Set(requests.map((r) => r.verification_id));

  const handleRequestIssuance = async (verificationId: string) => {
    setErrorMsg("");
    try {
      const { issuanceRequest } = await dataApi.issuance.request(verificationId);
      setStatusMsg(`Issuance request ${issuanceRequest.issuance_number} submitted for approval.`);
      refresh();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Request failed");
    }
  };

  const handleApprove = async (id: string) => {
    setErrorMsg("");
    try {
      const result = await dataApi.issuance.approve(id);
      setStatusMsg(`Batch issued: ${result.quantity} CCC certificates minted (${result.cccIds[0]}...${result.cccIds[result.cccIds.length - 1]}).`);
      refresh();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Issuance failed");
    }
  };

  const handleReject = async (id: string) => {
    setErrorMsg("");
    try {
      await dataApi.issuance.reject(id);
      setStatusMsg("Issuance request rejected.");
      refresh();
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Rejection failed");
    }
  };

  if (loading) return <div className="py-10 text-center text-xs text-carbon-400">Loading issuance workflow...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-carbon-800 pb-4">
        <h2 className="text-2xl font-bold text-white">Controlled CCC Issuance Workflow</h2>
        <p className="text-xs text-carbon-400 mt-1">Verified MRV → eligible quantity → registry admin approval → serial minting</p>
      </div>

      {errorMsg && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{errorMsg}</div>}
      {statusMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">{statusMsg}</div>}

      {isEntity && (
        <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Approved Verifications — Request Issuance</h3>
          {approvedVerifications.length === 0 ? (
            <div className="text-xs text-carbon-400">No approved verifications awaiting an issuance request.</div>
          ) : (
            <div className="space-y-3">
              {approvedVerifications.map((v) => (
                <div key={v.id} className="bg-carbon-900 border border-carbon-800 rounded-2xl p-4 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="text-brand-400">{v.verification_number}</div>
                    <div className="text-slate-200 font-sans font-semibold mt-0.5">{v.mrv_reports?.plants?.name}</div>
                    <div className="text-carbon-400">{v.claimed_reduction_tco2e} tCO₂e eligible</div>
                  </div>
                  {requestedVerificationIds.has(v.id) ? (
                    <span className="text-carbon-500 font-sans">Already requested</span>
                  ) : (
                    <button
                      onClick={() => handleRequestIssuance(v.id)}
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs rounded-xl transition-colors font-sans"
                    >
                      REQUEST ISSUANCE
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Issuance Requests</h3>
        {requests.length === 0 ? (
          <div className="text-xs text-carbon-400">No issuance requests yet.</div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="bg-carbon-900 border border-carbon-800 rounded-2xl p-4 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="text-brand-400">{r.issuance_number}</div>
                  <div className="text-slate-200 font-sans mt-0.5">{r.eligible_quantity_tco2e} tCO₂e eligible</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  {isRegistryAdmin && r.status === "PENDING_APPROVAL" && (
                    <>
                      <button onClick={() => handleReject(r.id)} className="px-3 py-1.5 bg-carbon-800 hover:bg-carbon-750 rounded-lg text-rose-400 font-sans">
                        Reject
                      </button>
                      <button onClick={() => handleApprove(r.id)} className="px-3 py-1.5 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-lg font-sans">
                        Approve & Issue
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
