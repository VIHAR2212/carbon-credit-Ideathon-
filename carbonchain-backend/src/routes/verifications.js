import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { writeAuditLog } from "../lib/audit.js";
import { sha256Hex, generateVerificationNumber } from "../lib/ids.js";

const router = Router();

const DEFAULT_CHECKLIST = [
  { check_key: "production", check_label: "Production Data (Weighbridge / Output Log Verification)" },
  { check_key: "electricity", check_label: "Electricity Consumption (Utility Invoices & Submeter Telemetry)" },
  { check_key: "fuel", check_label: "Fuel Data (Calorific Value Test Certificates)" },
  { check_key: "calculation", check_label: "Calculation Methodology (Sectoral Emission Intensity Algorithm)" },
  { check_key: "documents", check_label: "Supporting Documents (Third-party Calibration Reports)" },
  { check_key: "mrvReport", check_label: "MRV Report Digital Signature & Cryptographic Integrity Check" },
];

// GET /api/verifications — verifier sees assigned queue; entity sees own; privileged see all.
router.get("/", authenticate, async (req, res) => {
  let query = supabaseAdmin
    .from("verifications")
    .select("*, mrv_reports(mrv_number, plant_id, organization_id, plants(name)), verifier_agencies(accreditation_id, organization_id)")
    .order("created_at", { ascending: false });

  if (req.user.role === "VERIFIER") {
    const { data: agency } = await supabaseAdmin
      .from("verifier_agencies")
      .select("id")
      .eq("organization_id", req.user.organizationId)
      .single();
    if (!agency) return res.json({ verifications: [] });
    query = query.eq("verifier_agency_id", agency.id);
  } else if (!["SYSTEM_ADMIN", "REGISTRY_ADMIN", "AUDITOR"].includes(req.user.role)) {
    query = query.eq("mrv_reports.organization_id", req.user.organizationId);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });
  res.json({ verifications: data });
});

// POST /api/verifications — registry admin assigns a verifier agency to a submitted MRV report.
router.post("/", authenticate, requireRole("REGISTRY_ADMIN", "SYSTEM_ADMIN"), async (req, res) => {
  const { mrvReportId, verifierAgencyId, claimedReductionTco2e } = req.body;
  if (!mrvReportId || !verifierAgencyId) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "mrvReportId and verifierAgencyId are required" });
  }

  const { data: report } = await supabaseAdmin.from("mrv_reports").select("*, mrv_calculations(*)").eq("id", mrvReportId).single();
  if (!report) return res.status(404).json({ error: "NOT_FOUND", message: "MRV report not found" });
  if (report.status !== "SUBMITTED_FOR_VERIFICATION") {
    return res.status(409).json({ error: "INVALID_STATE", message: "MRV report must be SUBMITTED_FOR_VERIFICATION" });
  }

  const { data: agency } = await supabaseAdmin.from("verifier_agencies").select("accreditation_id").eq("id", verifierAgencyId).single();
  if (!agency) return res.status(404).json({ error: "NOT_FOUND", message: "Verifier agency not found" });

  const { data: verification, error: insertError } = await supabaseAdmin
    .from("verifications")
    .insert({
      verification_number: generateVerificationNumber(agency.accreditation_id),
      mrv_report_id: mrvReportId,
      verifier_agency_id: verifierAgencyId,
      status: "EVIDENCE_REVIEW",
      claimed_reduction_tco2e: claimedReductionTco2e ?? report.mrv_calculations?.total_emissions_tco2e ?? null,
      verified_emission_rate: report.mrv_calculations?.emission_intensity ?? null,
      baseline_emission_rate: report.mrv_calculations?.baseline_intensity ?? null,
    })
    .select()
    .single();

  // The DB trigger raises on conflict-of-interest — surface that cleanly.
  if (insertError) {
    if (insertError.message?.includes("CONFLICT_OF_INTEREST")) {
      return res.status(409).json({ error: "CONFLICT_OF_INTEREST", message: "This verifier agency cannot verify its own organization's MRV report" });
    }
    return res.status(500).json({ error: "INSERT_FAILED", message: insertError.message });
  }

  await supabaseAdmin.from("verification_findings").insert(
    DEFAULT_CHECKLIST.map((item) => ({ verification_id: verification.id, ...item }))
  );

  await writeAuditLog({
    req,
    action: "VERIFICATION_STARTED",
    resourceType: "verification",
    resourceId: verification.id,
    newState: verification,
  });

  res.status(201).json({ verification });
});

// GET /api/verifications/:id — full detail with checklist
router.get("/:id", authenticate, async (req, res) => {
  const { data: verification, error } = await supabaseAdmin
    .from("verifications")
    .select("*, mrv_reports(*, plants(name, location), mrv_calculations(*)), verifier_agencies(accreditation_id, organization_id)")
    .eq("id", req.params.id)
    .single();

  if (error || !verification) return res.status(404).json({ error: "NOT_FOUND" });

  const { data: findings } = await supabaseAdmin
    .from("verification_findings")
    .select("*")
    .eq("verification_id", verification.id)
    .order("check_key");

  res.json({ verification, findings });
});

// PATCH /api/verifications/:id/findings/:checkKey — toggle a checklist item
router.patch("/:id/findings/:checkKey", authenticate, requireRole("VERIFIER"), async (req, res) => {
  const { isSatisfied, notes } = req.body;

  const { data: verification } = await supabaseAdmin
    .from("verifications")
    .select("id, verifier_agency_id, status")
    .eq("id", req.params.id)
    .single();
  if (!verification) return res.status(404).json({ error: "NOT_FOUND" });

  const { data: agency } = await supabaseAdmin
    .from("verifier_agencies")
    .select("id")
    .eq("organization_id", req.user.organizationId)
    .single();
  if (!agency || agency.id !== verification.verifier_agency_id) {
    return res.status(403).json({ error: "FORBIDDEN", message: "Not the assigned verifier for this record" });
  }
  if (verification.status === "APPROVED" || verification.status === "REJECTED") {
    return res.status(409).json({ error: "INVALID_STATE", message: "Verification decision already recorded" });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("verification_findings")
    .update({ is_satisfied: !!isSatisfied, notes: notes ?? null, updated_at: new Date().toISOString() })
    .eq("verification_id", req.params.id)
    .eq("check_key", req.params.checkKey)
    .select()
    .single();

  if (error) return res.status(500).json({ error: "UPDATE_FAILED", message: error.message });
  res.json({ finding: updated });
});

async function decideVerification(req, res, decision) {
  const { notes } = req.body;

  const { data: verification, error: fetchError } = await supabaseAdmin
    .from("verifications")
    .select("*, mrv_reports(id, organization_id, status)")
    .eq("id", req.params.id)
    .single();

  if (fetchError || !verification) return res.status(404).json({ error: "NOT_FOUND" });

  const { data: agency } = await supabaseAdmin
    .from("verifier_agencies")
    .select("id")
    .eq("organization_id", req.user.organizationId)
    .single();
  if (!agency || agency.id !== verification.verifier_agency_id) {
    return res.status(403).json({ error: "FORBIDDEN", message: "Not the assigned verifier for this record" });
  }
  if (verification.status === "APPROVED" || verification.status === "REJECTED") {
    return res.status(409).json({ error: "ALREADY_DECIDED", message: "This verification already has a recorded decision" });
  }

  if (decision === "APPROVED") {
    const { data: findings } = await supabaseAdmin
      .from("verification_findings")
      .select("is_satisfied")
      .eq("verification_id", verification.id);
    const allSatisfied = findings?.every((f) => f.is_satisfied);
    if (!allSatisfied) {
      return res.status(409).json({ error: "CHECKLIST_INCOMPLETE", message: "All evidence checklist items must be satisfied before approval" });
    }
  }

  const decidedAt = new Date().toISOString();
  const signatureHash = sha256Hex(`${verification.id}|${req.user.id}|${decision}|${decidedAt}`);

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("verifications")
    .update({ status: decision, decision_notes: notes ?? null, decided_by: req.user.id, decided_at: decidedAt, signature_hash: signatureHash })
    .eq("id", verification.id)
    .select()
    .single();

  if (updateError) return res.status(500).json({ error: "UPDATE_FAILED", message: updateError.message });

  const newReportStatus = decision === "APPROVED" ? "VERIFIED" : "REJECTED";
  await supabaseAdmin.from("mrv_reports").update({ status: newReportStatus }).eq("id", verification.mrv_report_id);

  await writeAuditLog({
    req,
    action: decision === "APPROVED" ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED",
    resourceType: "verification",
    resourceId: verification.id,
    previousState: { status: verification.status },
    newState: updated,
  });

  res.json({ verification: updated });
}

router.post("/:id/approve", authenticate, requireRole("VERIFIER"), (req, res) => decideVerification(req, res, "APPROVED"));
router.post("/:id/reject", authenticate, requireRole("VERIFIER"), (req, res) => decideVerification(req, res, "REJECTED"));

export default router;
