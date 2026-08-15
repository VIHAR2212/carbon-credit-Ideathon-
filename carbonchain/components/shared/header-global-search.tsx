"use client";

import { useEffect, useState } from "react";
import { Icons } from "./icons";
import { dataApi, CarbonCredit, MrvReport } from "@/lib/data-api";

interface SearchResult {
  type: "CARBON CREDIT" | "MRV RECORD";
  title: string;
  subtitle: string;
  item: { id?: string; ccc_id?: string };
  targetView: string;
}

export function HeaderGlobalSearch({
  onSelectResult,
}: {
  onSelectResult: (result: SearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const q = query.toLowerCase();
        const [creditsRes, mrvRes] = await Promise.all([
          dataApi.registry.list({ page: 1 }).catch(() => ({ credits: [] as CarbonCredit[] })),
          dataApi.mrv.list().catch(() => ({ mrvReports: [] as MrvReport[] })),
        ]);

        const matchingCredits: SearchResult[] = creditsRes.credits
          .filter((c) => c.ccc_id.toLowerCase().includes(q) || c.plants?.name.toLowerCase().includes(q))
          .slice(0, 5)
          .map((c) => ({
            type: "CARBON CREDIT",
            title: c.ccc_id,
            subtitle: `${c.plants?.name ?? "Unknown plant"} · ${c.status}`,
            item: { ccc_id: c.ccc_id },
            targetView: "registryDetail",
          }));

        const matchingMrv: SearchResult[] = mrvRes.mrvReports
          .filter((m) => m.mrv_number.toLowerCase().includes(q) || m.plants?.name.toLowerCase().includes(q))
          .slice(0, 5)
          .map((m) => ({
            type: "MRV RECORD",
            title: m.mrv_number,
            subtitle: `${m.plants?.name ?? "Unknown plant"} · ${m.status}`,
            item: { id: m.id },
            targetView: "mrv",
          }));

        setResults([...matchingCredits, ...matchingMrv]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-carbon-400">
          <Icons.Search />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search registry... (CCC ID, MRV ID, Plant)"
          className="w-full bg-carbon-900 border border-carbon-750 text-slate-200 placeholder-carbon-500 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors shadow-inner"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-carbon-400 hover:text-white">
            ×
          </button>
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-carbon-850/95 border border-carbon-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl divide-y divide-carbon-800">
          <div className="p-2 text-[10px] font-mono tracking-wider text-carbon-400 uppercase bg-carbon-900/60 px-3">
            {searching ? "Searching..." : `Matching Registry Identifiers (${results.length})`}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {!searching && results.length === 0 ? (
              <div className="p-4 text-xs text-carbon-400 text-center">No matching records found</div>
            ) : (
              results.map((res, i) => (
                <div
                  key={i}
                  onClick={() => {
                    onSelectResult(res);
                    setIsOpen(false);
                  }}
                  className="p-3 hover:bg-carbon-750/60 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg text-xs font-bold ${
                        res.type === "CARBON CREDIT" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {res.type === "CARBON CREDIT" ? "C" : "M"}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-medium text-slate-200 group-hover:text-brand-400">{res.title}</div>
                      <div className="text-[11px] text-carbon-400">{res.subtitle}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
