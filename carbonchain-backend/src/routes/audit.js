import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

// GET /api/audit — auditor/admin see everything; others see only their org's trail.
router.get("/", authenticate, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize) || 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);

  const privileged = ["SYSTEM_ADMIN", "REGISTRY_ADMIN", "AUDITOR"].includes(req.user.role);
  if (!privileged) query = query.eq("actor_organization_id", req.user.organizationId);

  if (req.query.action) query = query.eq("action", req.query.action);
  if (req.query.resourceType) query = query.eq("resource_type", req.query.resourceType);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });

  res.json({ auditLogs: data, pagination: { page, pageSize, total: count } });
});

export default router;
