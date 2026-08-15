import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

// GET /api/integrity/reconciliation — live supply reconciliation snapshot.
router.get("/reconciliation", authenticate, requireRole("REGISTRY_ADMIN", "SYSTEM_ADMIN", "AUDITOR"), async (req, res) => {
  const { data, error } = await supabaseAdmin.rpc("reconcile_registry_supply");
  if (error) return res.status(500).json({ error: "RECONCILIATION_FAILED", message: error.message });
  res.json({ reconciliation: data?.[0] ?? null });
});

// POST /api/integrity/run-checks — runs the full integrity check battery,
// persists any violations as integrity_alerts, returns the results.
router.post("/run-checks", authenticate, requireRole("REGISTRY_ADMIN", "SYSTEM_ADMIN", "AUDITOR"), async (req, res) => {
  const { data: violations, error } = await supabaseAdmin.rpc("run_integrity_checks");
  if (error) return res.status(500).json({ error: "INTEGRITY_CHECK_FAILED", message: error.message });

  const created = [];
  for (const v of violations || []) {
    const { data: alert, error: insertError } = await supabaseAdmin
      .from("integrity_alerts")
      .insert({
        severity: v.severity,
        check_code: v.check_code,
        resource_type: v.resource_type,
        resource_id: v.resource_id,
        reason: v.reason,
        status: "OPEN",
      })
      .select()
      .single();
    if (!insertError) created.push(alert);
  }

  res.json({ violationsFound: violations?.length ?? 0, alerts: created });
});

// GET /api/integrity/alerts
router.get("/alerts", authenticate, requireRole("REGISTRY_ADMIN", "SYSTEM_ADMIN", "AUDITOR"), async (req, res) => {
  let query = supabaseAdmin.from("integrity_alerts").select("*").order("detected_at", { ascending: false });
  if (req.query.status) query = query.eq("status", req.query.status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });
  res.json({ alerts: data });
});

// POST /api/integrity/alerts/:id/resolve
router.post("/alerts/:id/resolve", authenticate, requireRole("REGISTRY_ADMIN", "SYSTEM_ADMIN"), async (req, res) => {
  const { resolutionNotes } = req.body;

  const { data, error } = await supabaseAdmin
    .from("integrity_alerts")
    .update({ status: "RESOLVED", resolved_by: req.user.id, resolved_at: new Date().toISOString(), resolution_notes: resolutionNotes ?? null })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "UPDATE_FAILED", message: error.message });
  res.json({ alert: data });
});

export default router;
