const styles: Record<string, string> = {
  VERIFIED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border",
  Verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border",
  AVAILABLE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border",
  HEALTHY: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border",
  ISSUED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border",

  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/30 border",
  "Needs Review": "bg-amber-500/10 text-amber-400 border-amber-500/30 border",
  Processing: "bg-sky-500/10 text-sky-400 border-sky-500/30 border",
  IN_TRANSFER: "bg-sky-500/10 text-sky-400 border-sky-500/30 border",
  "UNDER REVIEW": "bg-amber-500/10 text-amber-400 border-amber-500/30 border",

  FROZEN: "bg-rose-500/10 text-rose-400 border-rose-500/30 border",
  REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/30 border",
  CRITICAL: "bg-rose-500/10 text-rose-400 border-rose-500/30 border",

  RETIRED: "bg-purple-500/10 text-purple-400 border-purple-500/30 border",
  PERMANENTLY_RETIRED: "bg-purple-500/10 text-purple-400 border-purple-500/30 border",
  CURRENT_OWNER: "bg-blue-500/10 text-blue-400 border-blue-500/30 border",
};

export function StatusBadge({ status }: { status: string }) {
  const style = styles[status] || "bg-carbon-700 text-carbon-300 border-carbon-600 border";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {status}
    </span>
  );
}
