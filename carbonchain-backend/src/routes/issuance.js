import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { writeAuditLog } from "../lib/audit.js";
import { generateIssuanceNumber } from "../lib/ids.js";

const router = Router();

// POST /api/issuance/requests — obligated entity requests issuance for an approved verification.
router.post("/requests", authenticate, requireRole("OBLIGATED_ENTITY"), async (req, res) => {
  const { verificationId } = req.body;
  if (!verificationId) return res.status(400).json({ error: "VALIDATION_ERROR", message: "verificationId is required" });

  const { data: verification } = await supabaseAdmin
    .from("verifications")
    .select("*, mrv_reports(organization_id, plant_id)")
    .eq("id", verificationId)
    .single();

  if (!verification) return res.status(404).json({ error: "NOT_FOUND" });
  if (verification.mrv_reports.organization_id !== req.user.organizationId) {
    return res.status(403).json({ error: "FORBIDDEN", message: "Cannot request issuance for another organization's verification" });
  }
  if (verification.status !== "APPROVED") {
    return res.status(409).json({ error: "NOT_VERIFIED", message: "Issuance can only be requested for an APPROVED verification" });
  }

  const eligibleQuantity = verification.claimed_reduction_tco2e;
  if (!eligibleQuantity || eligibleQuantity <= 0) {
    return res.status(400).json({ error: "INVALID_QUANTITY", message: "Verification has no eligible reduction quantity recorded" });
  }

  const { data: request, error: insertError } = await supabaseAdmin
    .from("issuance_requests")
    .insert({
      issuance_number: generateIssuanceNumber(),
      verification_id: verificationId,
      organization_id: req.user.organizationId,
      eligible_quantity_tco2e: eligibleQuantity,
      status: "PENDING_APPROVAL",
      requested_by: req.user.id,
    })
    .select()
    .single();

  if (insertError) {
    // uq_issuance_per_verification catches double-issuance attempts.
    if (insertError.code === "23505") {
      return res.status(409).json({ error: "ALREADY_REQUESTED", message: "An issuance request already exists for this verification" });
    }
    return res.status(500).json({ error: "INSERT_FAILED", message: insertError.message });
  }

  await writeAuditLog({ req, action: "ISSUANCE_REQUESTED", resourceType: "issuance_request", resourceId: request.id, newState: request });

  res.status(201).json({ issuanceRequest: request });
});

// GET /api/issuance/requests
router.get("/requests", authenticate, async (req, res) => {
  let query = supabaseAdmin.from("issuance_requests").select("*, verifications(mrv_report_id)").order("created_at", { ascending: false });
  const privileged = ["SYSTEM_ADMIN", "REGISTRY_ADMIN", "AUDITOR"].includes(req.user.role);
  if (!privileged) query = query.eq("organization_id", req.user.organizationId);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });
  res.json({ issuanceRequests: data });
});

// POST /api/issuance/requests/:id/approve — registry admin approves and mints CCCs atomically.
router.post("/requests/:id/approve", authenticate, requireRole("REGISTRY_ADMIN", "SYSTEM_ADMIN"), async (req, res) => {
  const year = new Date().getFullYear();

  const { data: result, error } = await supabaseAdmin.rpc("issue_ccc_batch", {
    p_issuance_request_id: req.params.id,
    p_approved_by: req.user.id,
    p_year: year,
  });

  if (error) {
    const status = error.message?.includes("NOT_FOUND") ? 404 : error.message?.includes("INVALID_STATE") || error.message?.includes("VERIFICATION_NOT_APPROVED") ? 409 : 500;
    return res.status(status).json({ error: "ISSUANCE_FAILED", message: error.message });
  }

  const batch = result?.[0];

  await writeAuditLog({
    req,
    action: "CCC_ISSUED",
    resourceType: "carbon_credit_batch",
    resourceId: batch?.batch_id,
    newState: { quantity: batch?.ccc_ids?.length, cccIds: batch?.ccc_ids },
  });

  res.json({ batchId: batch?.batch_id, cccIds: batch?.ccc_ids, quantity: batch?.ccc_ids?.length });
});

// POST /api/issuance/requests/:id/reject
router.post("/requests/:id/reject", authenticate, requireRole("REGISTRY_ADMIN", "SYSTEM_ADMIN"), async (req, res) => {
  const { reason } = req.body;

  const { data: existing } = await supabaseAdmin.from("issuance_requests").select("*").eq("id", req.params.id).single();
  if (!existing) return res.status(404).json({ error: "NOT_FOUND" });
  if (existing.status !== "PENDING_APPROVAL") {
    return res.status(409).json({ error: "INVALID_STATE", message: `Request is ${existing.status}, not PENDING_APPROVAL` });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("issuance_requests")
    .update({ status: "REJECTED", rejection_reason: reason ?? null, approved_by: req.user.id, approved_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "UPDATE_FAILED", message: error.message });

  await writeAuditLog({ req, action: "ISSUANCE_REJECTED", resourceType: "issuance_request", resourceId: existing.id, previousState: existing, newState: updated });
  res.json({ issuanceRequest: updated });
});

export default router;
