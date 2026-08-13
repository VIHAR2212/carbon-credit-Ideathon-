"use client";

import { useMemo, useState } from "react";
import { Icons } from "./icons";
import { CCC, MRVRecord, SearchResult } from "@/lib/types";

export function HeaderGlobalSearch({
  onSelectResult,
  cccList,
  mrvList,
}: {
  onSelectResult: (result: SearchResult) => void;
  cccList: CCC[];
  mrvList: MRVRecord[];
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const results: SearchResult[] = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matchingCCCs: SearchResult[] = cccList
      .filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.origin.toLowerCase().includes(q) ||
          c.plant.toLowerCase().includes(q) ||
          c.verificationId.toLowerCase().includes(q)
      )
      .map((c) => ({
        type: "CARBON CREDIT",
        title: c.id,
        subtitle: `${c.origin} · ${c.status}`,
        item: c,
        targetView: "registryDetail",
      }));

    const matchingMRVs: SearchResult[] = mrvList
      .filter((m) => m.id.toLowerCase().includes(q) || m.plant.toLowerCase().includes(q))
      .map((m) => ({
        type: "MRV RECORD",
        title: m.id,
        subtitle: `${m.plant} · ${m.status}`,
        item: m,
        targetView: "mrv",
      }));

    const extraResults: SearchResult[] = [];
    if ("tx-009821".includes(q) || "transaction".includes(q)) {
      extraResults.push({
        type: "TRANSACTION",
        title: "TX-009821-BC",
        subtitle: "Verified MRV Transfer Batch #1092",
        targetView: "audit",
      });
    }
    if ("ver-acva002".includes(q) || "verification".includes(q)) {
      extraResults.push({
        type: "VERIFICATION RECORD",
        title: "VER-ACVA002-2026-00918",
        subtitle: "Bureau Veritas Audit Signed",
        targetView: "verification",
      });
    }

    return [...matchingCCCs, ...matchingMRVs, ...extraResults];
  }, [query, cccList, mrvList]);

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
          placeholder="Global search... (CCC ID, MRV ID, Plant, TX Hash)"
          className="w-full bg-carbon-900 border border-carbon-750 text-slate-200 placeholder-carbon-500 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-inner"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-carbon-400 hover:text-white"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-carbon-850/95 border border-carbon-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl divide-y divide-carbon-800">
          <div className="p-2 text-[10px] font-mono tracking-wider text-carbon-400 uppercase bg-carbon-900/60 px-3">
            Matching Registry Identifiers ({results.length})
          </div>
          <div className="max-h-72 overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-4 text-xs text-carbon-400 text-center">No matching audit or credit records found</div>
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
                        res.type === "CARBON CREDIT"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : res.type === "MRV RECORD"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-purple-500/10 text-purple-400"
                      }`}
                    >
                      {res.type === "CARBON CREDIT" ? "C" : res.type === "MRV RECORD" ? "M" : "T"}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-medium text-slate-200 group-hover:text-brand-400 flex items-center gap-1.5">
                        {res.title}
                      </div>
                      <div className="text-[11px] text-carbon-400">{res.subtitle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-carbon-400 bg-carbon-800 px-2 py-1 rounded border border-carbon-700">
                    ID: {res.title}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
