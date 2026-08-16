import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { writeAuditLog } from "../lib/audit.js";

const router = Router();

// POST /api/registration-requests — submitted right after Supabase sign-up,
// before any profiles row exists. Uses the authenticated session (the
// fresh account can call this even with no profile yet) to attach the
// company/facility details a registry admin will review.
router.post("/", authenticate, async (req, res) => {
  const { companyName, facilityType, addressLine, city, state, requestedRole } = req.body;

  if (!companyName || !addressLine || !city || !state) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "companyName, addressLine, city, and state are required",
    });
  }

  const { data: existing } = await supabaseAdmin
    .from("registration_requests")
    .select("id")
    .eq("auth_user_id", req.user.id)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: "ALREADY_SUBMITTED", message: "A registration request already exists for this account" });
  }

  const { data: request, error } = await supabaseAdmin
    .from("registration_requests")
    .insert({
      auth_user_id: req.user.id,
      email: req.user.email,
      company_name: companyName,
      facility_type: facilityType ?? null,
      address_line: addressLine,
      city,
      state,
      requested_role: requestedRole ?? null,
      status: "PENDING",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "ALREADY_SUBMITTED", message: "A registration request already exists for this account" });
    }
    return res.status(500).json({ error: "INSERT_FAILED", message: error.message });
  }

  res.status(201).json({ registrationRequest: request });
});

// GET /api/registration-requests — registry admins review pending applications.
router.get("/", authenticate, requireRole("REGISTRY_ADMIN", "SYSTEM_ADMIN"), async (req, res) => {
  let query = supabaseAdmin.from("registration_requests").select("*").order("created_at", { ascending: false });
  if (req.query.status) query = query.eq("status", req.query.status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });
  res.json({ registrationRequests: data });
});

// POST /api/registration-requests/:id/approve — creates the organization
// (if needed) and profile row, activating the applicant's account.
router.post("/:id/approve", authenticate, requireRole("REGISTRY_ADMIN", "SYSTEM_ADMIN"), async (req, res) => {
  const { role, organizationId, orgType } = req.body;
  if (!role) return res.status(400).json({ error: "VALIDATION_ERROR", message: "role is required" });

  const { data: request } = await supabaseAdmin.from("registration_requests").select("*").eq("id", req.params.id).single();
  if (!request) return res.status(404).json({ error: "NOT_FOUND" });
  if (request.status !== "PENDING") {
    return res.status(409).json({ error: "INVALID_STATE", message: `Request is already ${request.status}` });
  }

  let finalOrgId = organizationId;

  // No existing organization selected — create one from the submitted details.
  if (!finalOrgId) {
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: request.company_name,
        org_type: orgType ?? "OBLIGATED_ENTITY",
        registration_number: null,
      })
      .select()
      .single();
    if (orgError) return res.status(500).json({ error: "ORG_CREATE_FAILED", message: orgError.message });
    finalOrgId = org.id;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: request.auth_user_id,
      full_name: request.company_name,
      role,
      organization_id: finalOrgId,
      is_active: true,
    })
    .select()
    .single();

  if (profileError) return res.status(500).json({ error: "PROFILE_CREATE_FAILED", message: profileError.message });

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("registration_requests")
    .update({ status: "APPROVED", reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
    .eq("id", request.id)
    .select()
    .single();

  if (updateError) return res.status(500).json({ error: "UPDATE_FAILED", message: updateError.message });

  await writeAuditLog({
    req,
    action: "REGISTRATION_APPROVED",
    resourceType: "registration_request",
    resourceId: request.id,
    newState: { profileId: profile.id, organizationId: finalOrgId, role },
  });

  res.json({ registrationRequest: updated, profile });
});

// POST /api/registration-requests/:id/reject
router.post("/:id/reject", authenticate, requireRole("REGISTRY_ADMIN", "SYSTEM_ADMIN"), async (req, res) => {
  const { notes } = req.body;

  const { data: request } = await supabaseAdmin.from("registration_requests").select("*").eq("id", req.params.id).single();
  if (!request) return res.status(404).json({ error: "NOT_FOUND" });
  if (request.status !== "PENDING") {
    return res.status(409).json({ error: "INVALID_STATE", message: `Request is already ${request.status}` });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("registration_requests")
    .update({ status: "REJECTED", reviewed_by: req.user.id, reviewed_at: new Date().toISOString(), review_notes: notes ?? null })
    .eq("id", request.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "UPDATE_FAILED", message: error.message });

  await writeAuditLog({ req, action: "REGISTRATION_REJECTED", resourceType: "registration_request", resourceId: request.id, newState: updated });
  res.json({ registrationRequest: updated });
});

export default router;
