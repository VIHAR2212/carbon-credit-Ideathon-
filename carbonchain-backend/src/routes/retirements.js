import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { writeAuditLog } from "../lib/audit.js";
import { generateRetirementNumber } from "../lib/ids.js";

const router = Router();

// POST /api/retirements — permanently retire a CCC the caller's org owns.
router.post("/", authenticate, requireRole("OBLIGATED_ENTITY", "TRADER"), async (req, res) => {
  const { cccId, reason } = req.body;
  if (!cccId || !reason) return res.status(400).json({ error: "VALIDATION_ERROR", message: "cccId and reason are required" });

  const retirementNumber = generateRetirementNumber();

  const { data: retirementId, error } = await supabaseAdmin.rpc("retire_ccc", {
    p_ccc_id: cccId,
    p_organization_id: req.user.organizationId,
    p_requested_by: req.user.id,
    p_reason: reason,
    p_retirement_number: retirementNumber,
  });

  if (error) {
    const status = error.message?.includes("NOT_FOUND")
      ? 404
      : error.message?.includes("FORBIDDEN")
      ? 403
      : error.message?.includes("ALREADY_RETIRED") || error.message?.includes("INVALID_STATE")
      ? 409
      : 500;
    return res.status(status).json({ error: "RETIREMENT_FAILED", message: error.message });
  }

  await writeAuditLog({ req, action: "CREDIT_RETIRED", resourceType: "carbon_credit", resourceId: cccId, newState: { retirementId, retirementNumber, reason } });

  res.status(201).json({ retirementId, retirementNumber, cccId });
});

// GET /api/retirements — org's own retirements, or all for privileged roles.
router.get("/", authenticate, async (req, res) => {
  let query = supabaseAdmin.from("retirements").select("*").order("retired_at", { ascending: false });
  const privileged = ["SYSTEM_ADMIN", "REGISTRY_ADMIN", "AUDITOR"].includes(req.user.role);
  if (!privileged) query = query.eq("organization_id", req.user.organizationId);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });
  res.json({ retirements: data });
});

export default router;
