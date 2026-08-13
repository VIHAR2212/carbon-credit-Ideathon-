import "dotenv/config";
import express from "express";
import cors from "cors";
import { pingSupabase } from "./supabase.js";

const app = express();
const PORT = process.env.PORT || 4000;
const KEEP_ALIVE_SECRET = process.env.KEEP_ALIVE_SECRET;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`carbonchain-backend listening on port ${PORT}`);
});
