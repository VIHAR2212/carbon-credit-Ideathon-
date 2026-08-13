"use client";

import { useState } from "react";
import { OrderBook } from "@/lib/types";

export function ViewMarketplace({
  orderBook,
  onExecuteTrade,
}: {
  orderBook: OrderBook;
  onExecuteTrade: (trade: { type: string; qty: number; price: number }) => void;
}) {
  const [tradeType, setTradeType] = useState("BUY");
  const [tradeQty, setTradeQty] = useState(100);
  const [tradePrice, setTradePrice] = useState(1284);
  const [tradeMsg, setTradeMsg] = useState("");

  const calculatedTotal = tradeQty * tradePrice;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-carbon-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Carbon Credit Exchange</h2>
          <p className="text-xs text-carbon-400 mt-1">Institutional Order Book & Trading Desk for CCTS Compliance Units</p>
        </div>
        <div className="flex items-center space-x-4 font-mono text-xs">
          <span className="text-carbon-400">
            24h Vol: <span className="text-white font-bold">{orderBook.volume24h}</span>
          </span>
          <span className="text-carbon-400">
            Active Orders: <span className="text-emerald-400 font-bold">{orderBook.activeOrders}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-carbon-850 border border-carbon-750 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Institutional Depth</h3>
              <p className="text-xs text-carbon-400">Real-time CCTS Carbon Credit Limit Order Book</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-2xl font-extrabold text-emerald-400">₹{orderBook.currentPrice}</span>
              <span className="text-xs text-emerald-400 ml-2 font-semibold">{orderBook.change24h}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-carbon-400 uppercase text-[10px] pb-1 border-b border-carbon-800">
                <span>Ask Price (₹)</span>
                <span>Quantity (CCC)</span>
                <span>Total (₹)</span>
              </div>
              {orderBook.sells.map((s, i) => (
                <div key={i} className="relative flex items-center justify-between py-1.5 px-2 rounded hover:bg-carbon-800/50">
                  <div className="absolute inset-y-0 right-0 bg-rose-500/10 rounded-xs" style={{ width: s.depth }}></div>
                  <span className="text-rose-400 font-bold z-10">₹{s.price}</span>
                  <span className="text-slate-200 z-10">{s.quantity}</span>
                  <span className="text-carbon-400 text-[11px] z-10">₹{s.total.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-carbon-400 uppercase text-[10px] pb-1 border-b border-carbon-800">
                <span>Bid Price (₹)</span>
                <span>Quantity (CCC)</span>
                <span>Total (₹)</span>
              </div>
              {orderBook.buys.map((b, i) => (
                <div key={i} className="relative flex items-center justify-between py-1.5 px-2 rounded hover:bg-carbon-800/50">
                  <div className="absolute inset-y-0 left-0 bg-emerald-500/10 rounded-xs" style={{ width: b.depth }}></div>
                  <span className="text-emerald-400 font-bold z-10">₹{b.price}</span>
                  <span className="text-slate-200 z-10">{b.quantity}</span>
                  <span className="text-carbon-400 text-[11px] z-10">₹{b.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-carbon-850 border border-carbon-750 rounded-3xl p-6 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center bg-carbon-900 p-1 rounded-xl border border-carbon-750 mb-4">
              <button
                onClick={() => setTradeType("BUY")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  tradeType === "BUY" ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20" : "text-carbon-400 hover:text-white"
                }`}
              >
                BUY CCC
              </button>
              <button
                onClick={() => setTradeType("SELL")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  tradeType === "SELL" ? "bg-rose-500 text-black shadow-md shadow-rose-500/20" : "text-carbon-400 hover:text-white"
                }`}
              >
                SELL CCC
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-carbon-400 block mb-1">Order Type</label>
                <select className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono">
                  <option>Limit Order</option>
                  <option>Market Order</option>
                  <option>Compliance OTC Block</option>
                </select>
              </div>

              <div>
                <label className="text-carbon-400 block mb-1">Quantity (tCO₂e Units)</label>
                <input
                  type="number"
                  value={tradeQty}
                  onChange={(e) => setTradeQty(Number(e.target.value))}
                  className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="text-carbon-400 block mb-1">Limit Price (₹ per CCC)</label>
                <input
                  type="number"
                  value={tradePrice}
                  onChange={(e) => setTradePrice(Number(e.target.value))}
                  className="w-full bg-carbon-900 border border-carbon-750 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="bg-carbon-900 p-3.5 rounded-xl border border-carbon-800 space-y-1.5 font-mono">
                <div className="flex justify-between text-carbon-400">
                  <span>Gross Value</span>
                  <span>₹{calculatedTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-carbon-400">
                  <span>Exchange Fee (0.05%)</span>
                  <span>₹{(calculatedTotal * 0.0005).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-carbon-800">
                  <span>Total Net</span>
                  <span className="text-emerald-400">₹{(calculatedTotal * 1.0005).toLocaleString()}</span>
                </div>
              </div>

              {tradeMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">
                  {tradeMsg}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              onExecuteTrade({ type: tradeType, qty: tradeQty, price: tradePrice });
              setTradeMsg(`✓ ${tradeType} Order for ${tradeQty} CCC executed at ₹${tradePrice}!`);
            }}
            className={`w-full py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg ${
              tradeType === "BUY"
                ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                : "bg-rose-500 hover:bg-rose-400 text-black shadow-rose-500/20"
            }`}
          >
            PLACE {tradeType} ORDER
          </button>
        </div>
      </div>
    </div>
  );
}
