import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { writeAuditLog } from "../lib/audit.js";
import { generateOrderNumber, generateTradeNumber } from "../lib/ids.js";

const router = Router();

// GET /api/market/orderbook — public depth view (top N per side).
router.get("/orderbook", authenticate, async (req, res) => {
  const { data: sells, error: sellError } = await supabaseAdmin
    .from("orders")
    .select("price_per_ccc, quantity, quantity_filled")
    .eq("side", "SELL")
    .in("status", ["OPEN", "PARTIALLY_FILLED"])
    .order("price_per_ccc", { ascending: true })
    .limit(10);

  const { data: buys, error: buyError } = await supabaseAdmin
    .from("orders")
    .select("price_per_ccc, quantity, quantity_filled")
    .eq("side", "BUY")
    .in("status", ["OPEN", "PARTIALLY_FILLED"])
    .order("price_per_ccc", { ascending: false })
    .limit(10);

  if (sellError || buyError) return res.status(500).json({ error: "QUERY_FAILED" });

  const { data: lastTrade } = await supabaseAdmin.from("trades").select("price_per_ccc").order("executed_at", { ascending: false }).limit(1).single();

  const { count: activeOrders } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["OPEN", "PARTIALLY_FILLED"]);

  res.json({
    sells: sells.map((s) => ({ price: s.price_per_ccc, quantity: s.quantity - s.quantity_filled })),
    buys: buys.map((b) => ({ price: b.price_per_ccc, quantity: b.quantity - b.quantity_filled })),
    currentPrice: lastTrade?.price_per_ccc ?? null,
    activeOrders: activeOrders ?? 0,
  });
});

// GET /api/market/orders — org's own orders.
router.get("/orders", authenticate, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("organization_id", req.user.organizationId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });
  res.json({ orders: data });
});

// POST /api/market/orders — place a buy or sell order.
router.post("/orders", authenticate, requireRole("TRADER", "OBLIGATED_ENTITY"), async (req, res) => {
  const { side, quantity, pricePerCcc } = req.body;

  if (!["BUY", "SELL"].includes(side) || !quantity || quantity <= 0 || !pricePerCcc || pricePerCcc <= 0) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "side (BUY/SELL), quantity > 0, pricePerCcc > 0 are required" });
  }

  const orderNumber = generateOrderNumber();

  const { data: order, error: insertError } = await supabaseAdmin
    .from("orders")
    .insert({
      order_number: orderNumber,
      organization_id: req.user.organizationId,
      created_by: req.user.id,
      side,
      quantity,
      price_per_ccc: pricePerCcc,
      status: "OPEN",
    })
    .select()
    .single();

  if (insertError) return res.status(500).json({ error: "INSERT_FAILED", message: insertError.message });

  // SELL orders must lock real, owned, AVAILABLE credits immediately —
  // this is what prevents "insufficient balance" trades from ever reaching
  // the market, and what makes cancel -> unlock meaningful.
  if (side === "SELL") {
    const { data: lockedIds, error: lockError } = await supabaseAdmin.rpc("lock_credits_for_order", {
      p_order_id: order.id,
      p_organization_id: req.user.organizationId,
      p_quantity: quantity,
    });

    if (lockError) {
      await supabaseAdmin.from("orders").update({ status: "CANCELLED" }).eq("id", order.id);
      const status = lockError.message?.includes("INSUFFICIENT_BALANCE") ? 409 : 500;
      return res.status(status).json({ error: "ORDER_FAILED", message: lockError.message });
    }

    await writeAuditLog({ req, action: "ORDER_CREATED", resourceType: "order", resourceId: order.id, newState: { ...order, lockedCredits: lockedIds } });
    return res.status(201).json({ order, lockedCredits: lockedIds });
  }

  await writeAuditLog({ req, action: "ORDER_CREATED", resourceType: "order", resourceId: order.id, newState: order });
  res.status(201).json({ order });
});

// POST /api/market/orders/:id/cancel
router.post("/orders/:id/cancel", authenticate, async (req, res) => {
  const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", req.params.id).single();
  if (!order) return res.status(404).json({ error: "NOT_FOUND" });
  if (order.organization_id !== req.user.organizationId) return res.status(403).json({ error: "FORBIDDEN" });
  if (!["OPEN", "PARTIALLY_FILLED"].includes(order.status)) {
    return res.status(409).json({ error: "INVALID_STATE", message: `Order is ${order.status}, cannot cancel` });
  }

  if (order.side === "SELL") {
    const { error: unlockError } = await supabaseAdmin.rpc("unlock_credits_for_order", { p_order_id: order.id });
    if (unlockError) return res.status(500).json({ error: "UNLOCK_FAILED", message: unlockError.message });
  }

  const { data: updated, error } = await supabaseAdmin.from("orders").update({ status: "CANCELLED", updated_at: new Date().toISOString() }).eq("id", order.id).select().single();
  if (error) return res.status(500).json({ error: "UPDATE_FAILED", message: error.message });

  await writeAuditLog({ req, action: "ORDER_CANCELLED", resourceType: "order", resourceId: order.id, previousState: order, newState: updated });
  res.json({ order: updated });
});

// POST /api/market/orders/:id/match — attempts to match this order against
// the best opposing open order and execute a trade atomically. This is a
// simplified matching engine: exact best-price counterparty, full or
// partial fill, one match per call (demo scope — not continuous matching).
router.post("/orders/:id/match", authenticate, async (req, res) => {
  const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", req.params.id).single();
  if (!order) return res.status(404).json({ error: "NOT_FOUND" });
  if (order.organization_id !== req.user.organizationId) return res.status(403).json({ error: "FORBIDDEN" });
  if (!["OPEN", "PARTIALLY_FILLED"].includes(order.status)) {
    return res.status(409).json({ error: "INVALID_STATE", message: `Order is ${order.status}` });
  }

  const opposingSide = order.side === "BUY" ? "SELL" : "BUY";
  const priceFilter = order.side === "BUY" ? { lte: order.price_per_ccc } : { gte: order.price_per_ccc };
  const orderBy = order.side === "BUY" ? { ascending: true } : { ascending: false };

  let query = supabaseAdmin
    .from("orders")
    .select("*")
    .eq("side", opposingSide)
    .in("status", ["OPEN", "PARTIALLY_FILLED"])
    .neq("organization_id", order.organization_id) // no self-trading, redundant with DB check but fails faster
    .order("price_per_ccc", orderBy)
    .limit(1);

  query = order.side === "BUY" ? query.lte("price_per_ccc", order.price_per_ccc) : query.gte("price_per_ccc", order.price_per_ccc);

  const { data: matches } = await query;
  const counterparty = matches?.[0];

  if (!counterparty) {
    return res.status(404).json({ error: "NO_MATCH", message: "No opposing order at an acceptable price was found" });
  }

  const remainingThis = order.quantity - order.quantity_filled;
  const remainingCounterparty = counterparty.quantity - counterparty.quantity_filled;
  const matchQuantity = Math.min(remainingThis, remainingCounterparty);
  const executionPrice = counterparty.price_per_ccc; // resting order sets the price

  const buyOrderId = order.side === "BUY" ? order.id : counterparty.id;
  const sellOrderId = order.side === "SELL" ? order.id : counterparty.id;

  const { data: tradeId, error: tradeError } = await supabaseAdmin.rpc("execute_trade", {
    p_buy_order_id: buyOrderId,
    p_sell_order_id: sellOrderId,
    p_quantity: matchQuantity,
    p_price: executionPrice,
    p_trade_number: generateTradeNumber(),
  });

  if (tradeError) {
    return res.status(409).json({ error: "TRADE_FAILED", message: tradeError.message });
  }

  await writeAuditLog({
    req,
    action: "TRADE_EXECUTED",
    resourceType: "trade",
    resourceId: tradeId,
    newState: { buyOrderId, sellOrderId, quantity: matchQuantity, price: executionPrice },
  });

  res.json({ tradeId, quantity: matchQuantity, price: executionPrice });
});

// GET /api/market/trades — trade history.
router.get("/trades", authenticate, async (req, res) => {
  const { data, error } = await supabaseAdmin.from("trades").select("*").order("executed_at", { ascending: false }).limit(50);
  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });
  res.json({ trades: data });
});

export default router;
