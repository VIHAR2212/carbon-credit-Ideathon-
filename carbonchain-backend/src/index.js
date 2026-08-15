import "dotenv/config";
import express from "express";
import cors from "cors";
import { pingSupabase } from "./supabase.js";

import authRoutes from "./routes/auth.js";
import organizationsRoutes from "./routes/organizations.js";
import plantsRoutes from "./routes/plants.js";
import mrvRoutes from "./routes/mrv.js";
import verificationsRoutes from "./routes/verifications.js";
import issuanceRoutes from "./routes/issuance.js";
import registryRoutes from "./routes/registry.js";
import marketRoutes from "./routes/market.js";
import retirementsRoutes from "./routes/retirements.js";
import auditRoutes from "./routes/audit.js";
import integrityRoutes from "./routes/integrity.js";

const app = express();
const PORT = process.env.PORT || 4000;
const KEEP_ALIVE_SECRET = process.env.KEEP_ALIVE_SECRET;

app.use(cors());
app.use(express.json({ limit: "2mb" })); // covers CSV uploads pasted as text; large files should go via Storage instead

// Basic request log — cheap observability, no secrets logged.
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Render free-tier web services spin down after ~15 min of no inbound
 * HTTP traffic, and take 30-60s to cold-start on the next request.
 * Any request to this app (including this endpoint) resets that timer,
 * so simply being pinged periodically keeps Render awake too.
 */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "carbonchain-backend", time: new Date().toISOString() });
});

/**
 * Keep-alive endpoint: pings Supabase so its free-tier project doesn't
 * auto-pause from inactivity. Protected by a shared secret so randoms
 * on the internet can't spam your DB — the GitHub Actions workflow
 * sends this secret as a header.
 */
app.get("/api/keep-alive", async (req, res) => {
  if (KEEP_ALIVE_SECRET) {
    const provided = req.header("x-keep-alive-secret");
    if (provided !== KEEP_ALIVE_SECRET) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
  }

  const result = await pingSupabase();
  const status = result.ok ? 200 : 502;
  res.status(status).json({ ...result, time: new Date().toISOString() });
});

// ---------- CarbonChain API ----------
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationsRoutes);
app.use("/api/plants", plantsRoutes);
app.use("/api/mrv", mrvRoutes);
app.use("/api/verifications", verificationsRoutes);
app.use("/api/issuance", issuanceRoutes);
app.use("/api/registry", registryRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/retirements", retirementsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/integrity", integrityRoutes);

// Centralized fallback error handler — never leak stack traces to clients.
app.use((err, _req, res, _next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: "INTERNAL_ERROR", message: "An unexpected error occurred" });
});

app.listen(PORT, () => {
  console.log(`carbonchain-backend listening on port ${PORT}`);
});
