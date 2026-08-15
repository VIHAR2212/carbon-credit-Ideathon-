"use client";

import { useEffect, useState } from "react";
import { dataApi, AuditLogEntry } from "@/lib/data-api";

export function ViewAudit() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataApi.audit
      .list()
      .then((res) => setLogs(res.auditLogs))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-carbon-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Immutable Audit Trail</h2>
          <p className="text-xs text-carbon-400 mt-1">Append-only transaction log — every state change, ownership transfer, and decision</p>
        </div>
      </div>

      <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6">
        {loading ? (
          <div className="py-8 text-center text-xs text-carbon-400">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-carbon-400">No audit events yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-carbon-400 font-mono text-[11px] uppercase border-b border-carbon-800">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800/50 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-carbon-800/40">
                    <td className="py-3.5 px-4 text-carbon-400">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-200">{log.actor_role?.replace(/_/g, " ") ?? "—"}</td>
                    <td className="py-3.5 px-4 text-brand-400 font-bold">{log.action}</td>
                    <td className="py-3.5 px-4 text-carbon-300 text-[11px]">
                      {log.resource_type}: {log.resource_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
