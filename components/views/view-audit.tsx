"use client";

import { StatusBadge } from "../shared/status-badge";
import { AuditLogEntry } from "@/lib/types";

export function ViewAudit({ auditLogs }: { auditLogs: AuditLogEntry[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-carbon-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Immutable Audit Trail</h2>
          <p className="text-xs text-carbon-400 mt-1">Append-only cryptographic transaction log for CCTS compliance inspectors</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30">
          Merkle Root Synchronized
        </span>
      </div>

      <div className="bg-carbon-850 border border-carbon-750 rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-carbon-400 font-mono text-[11px] uppercase border-b border-carbon-800">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource ID</th>
                <th className="py-3 px-4">Tx Hash</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-800/50 font-mono">
              {auditLogs.map((log, i) => (
                <tr key={i} className="hover:bg-carbon-800/40">
                  <td className="py-3.5 px-4 text-carbon-400">{log.timestamp}</td>
                  <td className="py-3.5 px-4 font-sans font-medium text-slate-200">{log.actor}</td>
                  <td className="py-3.5 px-4 text-brand-400 font-bold">{log.action}</td>
                  <td className="py-3.5 px-4 text-carbon-300">{log.resource}</td>
                  <td className="py-3.5 px-4 text-carbon-400 text-[11px]">{log.tx}</td>
                  <td className="py-3.5 px-4 text-right">
                    <StatusBadge status={log.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
