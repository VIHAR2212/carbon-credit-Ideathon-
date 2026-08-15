import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { writeAuditLog } from "../lib/audit.js";

const router = Router();

// GET /api/registry — paginated, filterable list of CCCs.
router.get("/", authenticate, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("carbon_credits")
    .select("*, plants(name, location), organizations!carbon_credits_organization_id_fkey(name)", { count: "exact" })
    .order("issued_at", { ascending: false })
    .range(from, to);

  if (req.query.status) query = query.eq("status", req.query.status);
  if (req.query.plantId) query = query.eq("plant_id", req.query.plantId);
  if (req.query.mine === "true") query = query.eq("current_owner_organization_id", req.user.organizationId);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });

  res.json({ credits: data, pagination: { page, pageSize, total: count } });
});

// GET /api/registry/:cccId — full detail + provenance chain built from real events.
router.get("/:cccId", authenticate, async (req, res) => {
  const { data: credit, error } = await supabaseAdmin
    .from("carbon_credits")
    .select(`
      *,
      plants(name, location, sector),
      mrv_reports(mrv_number, reporting_period_label, data_quality_pct),
      verifications(verification_number, decided_at, verifier_agencies(accreditation_id))
    `)
    .eq("ccc_id", req.params.cccId)
    .single();

  if (error || !credit) return res.status(404).json({ error: "NOT_FOUND" });

  const { data: events, error: eventsError } = await supabaseAdmin
    .from("carbon_credit_events")
    .select("*")
    .eq("ccc_id", req.params.cccId)
    .order("created_at", { ascending: true });

  if (eventsError) return res.status(500).json({ error: "QUERY_FAILED", message: eventsError.message });

  res.json({ credit, provenance: events });
});

// POST /api/registry/:cccId/freeze — registry admin safety interlock.
router.post("/:cccId/freeze", authenticate, requireRole("REGISTRY_ADMIN", "SYSTEM_ADMIN"), async (req, res) => {
  const { reason } = req.body;

  const { data: credit } = await supabaseAdmin.from("carbon_credits").select("*").eq("ccc_id", req.params.cccId).single();
  if (!credit) return res.status(404).json({ error: "NOT_FOUND" });
  if (credit.status === "RETIRED" || credit.status === "VOID") {
    return res.status(409).json({ error: "INVALID_STATE", message: `Cannot freeze a ${credit.status} credit` });
  }
  if (credit.status === "FROZEN") {
    return res.status(409).json({ error: "ALREADY_FROZEN" });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("carbon_credits")
    .update({ status: "FROZEN", updated_at: new Date().toISOString() })
    .eq("ccc_id", req.params.cccId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "UPDATE_FAILED", message: error.message });

  await supabaseAdmin.from("carbon_credit_events").insert({
    ccc_id: req.params.cccId,
    event_type: "FROZEN",
    actor_organization_id: req.user.organizationId,
    actor_profile_id: req.user.id,
    previous_status: credit.status,
    new_status: "FROZEN",
    event_hash: "pending", // recomputed properly in a DB trigger-backed path for admin actions; acceptable for demo freeze/unfreeze which are rare manual admin actions
    metadata: { reason },
  });

  await writeAuditLog({ req, action: "CREDIT_FROZEN", resourceType: "carbon_credit", resourceId: req.params.cccId, previousState: credit, newState: updated });
  res.json({ credit: updated });
});

// POST /api/registry/:cccId/unfreeze
router.post("/:cccId/unfreeze", authenticate, requireRole("REGISTRY_ADMIN", "SYSTEM_ADMIN"), async (req, res) => {
  const { data: credit } = await supabaseAdmin.from("carbon_credits").select("*").eq("ccc_id", req.params.cccId).single();
  if (!credit) return res.status(404).json({ error: "NOT_FOUND" });
  if (credit.status !== "FROZEN") {
    return res.status(409).json({ error: "INVALID_STATE", message: "Credit is not currently frozen" });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("carbon_credits")
    .update({ status: "AVAILABLE", updated_at: new Date().toISOString() })
    .eq("ccc_id", req.params.cccId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "UPDATE_FAILED", message: error.message });

  await supabaseAdmin.from("carbon_credit_events").insert({
    ccc_id: req.params.cccId,
    event_type: "UNFROZEN",
    actor_organization_id: req.user.organizationId,
    actor_profile_id: req.user.id,
    previous_status: "FROZEN",
    new_status: "AVAILABLE",
    event_hash: "pending",
  });

  await writeAuditLog({ req, action: "CREDIT_UNFROZEN", resourceType: "carbon_credit", resourceId: req.params.cccId, previousState: credit, newState: updated });
  res.json({ credit: updated });
});

export default router;
