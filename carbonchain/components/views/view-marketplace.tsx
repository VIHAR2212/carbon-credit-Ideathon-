"use client";

import { useCallback, useEffect, useState } from "react";
import { dataApi, OrderBook, Order } from "@/lib/data-api";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import { StatusBadge } from "../shared/status-badge";

export function ViewMarketplace() {
  const { profile } = useAuth();
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [tradeQty, setTradeQty] = useState(10);
  const [tradePrice, setTradePrice] = useState(1284);
  const [tradeMsg, setTradeMsg] = useState("");
  const [tradeError, setTradeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const canTrade = profile?.role === "TRADER" || profile?.role === "OBLIGATED_ENTITY";

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ob, orders] = await Promise.all([dataApi.market.orderBook(), dataApi.market.myOrders()]);
      setOrderBook(ob);
      setMyOrders(orders.orders);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const calculatedTotal = tradeQty * tradePrice;

  const handlePlaceOrder = async () => {
    setTradeError("");
    setTradeMsg("");
    setSubmitting(true);
    try {
      const { order } = await dataApi.market.placeOrder({ side: tradeType, quantity: tradeQty, pricePerCcc: tradePrice });
      setTradeMsg(`${tradeType} order ${order.order_number} placed for ${tradeQty} CCC at ₹${tradePrice}.`);
      refresh();
    } catch (err) {
      setTradeError(err instanceof ApiError ? err.message : "Order failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMatch = async (orderId: string) => {
    setTradeError("");
    setTradeMsg("");
    try {
      const result = await dataApi.market.matchOrder(orderId);
      setTradeMsg(`Trade executed: ${result.quantity} CCC at ₹${result.price}.`);
      refresh();
    } catch (err) {
      setTradeError(err instanceof ApiError ? err.message : "No match found");
    }
  };

  const handleCancel = async (orderId: string) => {
    await dataApi.market.cancelOrder(orderId);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-carbon-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Carbon Credit Exchange</h2>
          <p className="text-xs text-carbon-400 mt-1">Order Book & Trading Desk for CCTS Compliance Units</p>
        </div>
        <div className="flex items-center space-x-4 font-mono text-xs">
          <span className="text-carbon-400">
            Active Orders: <span className="text-emerald-400 font-bold">{orderBook?.activeOrders ?? "—"}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-carbon-850 border border-carbon-750 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Order Book Depth</h3>
              <p className="text-xs text-carbon-400">Real-time CCTS Carbon Credit Limit Order Book</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-2xl font-extrabold text-emerald-400">
                {orderBook?.currentPrice ? `₹${orderBook.currentPrice}` : "—"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-carbon-400">Loading order book...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-carbon-400 uppercase text-[10px] pb-1 border-b border-carbon-800">
                  <span>Ask Price (₹)</span>
                  <span>Quantity</span>
                </div>
                {(orderBook?.sells.length ?? 0) === 0 ? (
                  <div className="text-carbon-500 py-2">No open sell orders</div>
                ) : (
                  orderBook!.sells.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-carbon-800/50">
                      <span className="text-rose-400 font-bold">₹{s.price}</span>
                      <span className="text-slate-200">{s.quantity}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-carbon-400 uppercase text-[10px] pb-1 border-b border-carbon-800">
                  <span>Bid Price (₹)</span>
                  <span>Quantity</span>
                </div>
                {(orderBook?.buys.length ?? 0) === 0 ? (
                  <div className="text-carbon-500 py-2">No open buy orders</div>
                ) : (
                  orderBook!.buys.map((b, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-carbon-800/50">
                      <span className="text-emerald-400 font-bold">₹{b.price}</span>
                      <span className="text-slate-200">{b.quantity}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-carbon-750/60">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">My Open Orders</h4>
            {myOrders.length === 0 ? (
              <div className="text-xs text-carbon-500">No open orders.</div>
            ) : (
              <div className="space-y-2">
                {myOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between bg-carbon-900 border border-carbon-750 rounded-xl p-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className={o.side === "BUY" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{o.side}</span>
                      <span className="font-mono text-carbon-300">{o.order_number}</span>
                      <span className="font-mono text-slate-200">
                        {o.quantity_filled}/{o.quantity} @ ₹{o.price_per_ccc}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                    {["OPEN", "PARTIALLY_FILLED"].includes(o.status) && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleMatch(o.id)} className="px-3 py-1.5 bg-carbon-750 hover:bg-carbon-700 rounded-lg text-carbon-200">
                          Try Match
                        </button>
                        <button onClick={() => handleCancel(o.id)} className="px-3 py-1.5 bg-carbon-800 hover:bg-carbon-750 rounded-lg text-rose-400">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {canTrade && (
          <div className="lg:col-span-4 bg-carbon-850 border border-carbon-750 rounded-3xl p-6 space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center bg-carbon-900 p-1 rounded-xl border border-carbon-750 mb-4">
                <button
                  onClick={() => setTradeType("BUY")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                    tradeType === "BUY" ? "bg-emerald-500 text-black" : "text-carbon-400 hover:text-white"
                  }`}
                >
                  BUY CCC
                </button>
                <button
                  onClick={() => setTradeType("SELL")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                    tradeType === "SELL" ? "bg-rose-500 text-black" : "text-carbon-400 hover:text-white"
                  }`}
                >
                  SELL CCC
                </button>
              </div>

              <div className="space-y-4 text-xs">
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
                  <div className="flex justify-between font-bold text-white">
                    <span>Total</span>
                    <span className="text-emerald-400">₹{calculatedTotal.toLocaleString()}</span>
                  </div>
                </div>

                {tradeError && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">{tradeError}</div>}
                {tradeMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">{tradeMsg}</div>}
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className={`w-full py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                tradeType === "BUY" ? "bg-emerald-500 hover:bg-emerald-400 text-black" : "bg-rose-500 hover:bg-rose-400 text-black"
              }`}
            >
              {submitting ? "PLACING..." : `PLACE ${tradeType} ORDER`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
