import { Router } from "express";
import crypto from "node:crypto";
import { authenticate, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { writeAuditLog } from "../lib/audit.js";
import { parseAndValidateCsv } from "../lib/csv-validation.js";
import { calculateEmissions } from "../lib/calculate.js";
import { detectAnomalies } from "../lib/anomaly-detection.js";
import { generateMrvNumber, generateAnomalyNumber } from "../lib/ids.js";

const router = Router();

async function assertOwnsPlant(req, plantId, allowPrivileged = true) {
  const { data: plant, error } = await supabaseAdmin
    .from("plants")
    .select("id, organization_id")
    .eq("id", plantId)
    .single();

  if (error || !plant) return { ok: false, status: 404, message: "Plant not found" };

  const privileged = allowPrivileged && ["SYSTEM_ADMIN", "REGISTRY_ADMIN", "AUDITOR", "VERIFIER"].includes(req.user.role);
  if (!privileged && plant.organization_id !== req.user.organizationId) {
    return { ok: false, status: 403, message: "Cannot access another organization's plant" };
  }
  return { ok: true, plant };
}

// POST /api/mrv/upload — CSV ingestion with validation, returns per-row results.
router.post("/upload", authenticate, requireRole("OBLIGATED_ENTITY"), async (req, res) => {
  const { plantId, csvText, dataSourceId } = req.body;
  if (!plantId || !csvText) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "plantId and csvText are required" });
  }

  const ownership = await assertOwnsPlant(req, plantId, false);
  if (!ownership.ok) return res.status(ownership.status).json({ error: "FORBIDDEN", message: ownership.message });

  let parsed;
  try {
    parsed = parseAndValidateCsv(csvText);
  } catch (err) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: err.message });
  }

  const batchId = crypto.randomUUID();

  if (parsed.valid.length > 0) {
    const rows = parsed.valid.map((r) => ({
      plant_id: plantId,
      data_source_id: dataSourceId ?? null,
      reading_type: r.reading_type,
      reading_timestamp: r.reading_timestamp,
      value: r.value,
      unit: r.unit,
      uploaded_by: req.user.id,
      batch_id: batchId,
    }));

    const { error: insertError } = await supabaseAdmin.from("meter_readings").insert(rows);
    if (insertError) {
      return res.status(500).json({ error: "INSERT_FAILED", message: insertError.message });
    }
  }

  await writeAuditLog({
    req,
    action: "DATA_UPLOAD",
    resourceType: "meter_readings_batch",
    resourceId: batchId,
    newState: { plantId, totalRows: parsed.totalRows, valid: parsed.valid.length, rejected: parsed.rejected.length },
  });

  res.status(201).json({
    batchId,
    summary: {
      totalRows: parsed.totalRows,
      validRows: parsed.valid.length,
      warningRows: parsed.warnings.length,
      rejectedRows: parsed.rejected.length,
    },
    warnings: parsed.warnings,
    rejected: parsed.rejected,
  });
});

// POST /api/mrv/calculate — runs the deterministic engine over a batch,
// creates an mrv_calculations row + mrv_reports row, runs anomaly detection.
router.post("/calculate", authenticate, requireRole("OBLIGATED_ENTITY"), async (req, res) => {
  const { plantId, batchId, reportingPeriodStart, reportingPeriodEnd, reportingPeriodLabel, productionQuantity, productionUnit } =
    req.body;

  if (!plantId || !batchId || !reportingPeriodStart || !reportingPeriodEnd || !reportingPeriodLabel) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "plantId, batchId, reportingPeriodStart, reportingPeriodEnd, reportingPeriodLabel are required",
    });
  }

  const ownership = await assertOwnsPlant(req, plantId, false);
  if (!ownership.ok) return res.status(ownership.status).json({ error: "FORBIDDEN", message: ownership.message });

  const { data: readings, error: readingsError } = await supabaseAdmin
    .from("meter_readings")
    .select("reading_type, value, unit")
    .eq("plant_id", plantId)
    .eq("batch_id", batchId)
    .eq("is_valid", true);

  if (readingsError) return res.status(500).json({ error: "QUERY_FAILED", message: readingsError.message });
  if (!readings || readings.length === 0) {
    return res.status(400).json({ error: "NO_DATA", message: "No valid readings found for this batch" });
  }

  let calcResult;
  try {
    calcResult = calculateEmissions({
      readings,
      productionQuantity,
      productionUnit,
      baselineIntensity: ownership.plant.baseline_intensity,
    });
  } catch (err) {
    return res.status(400).json({ error: "CALCULATION_ERROR", message: err.message });
  }

  const { data: calcRow, error: calcInsertError } = await supabaseAdmin
    .from("mrv_calculations")
    .insert({
      plant_id: plantId,
      reporting_period_start: reportingPeriodStart,
      reporting_period_end: reportingPeriodEnd,
      batch_id: batchId,
      methodology_version: calcResult.methodologyVersion,
      input_snapshot: calcResult.inputSnapshot,
      conversion_factors: calcResult.conversionFactorsUsed,
      total_emissions_tco2e: calcResult.totalEmissionsTco2e,
      production_quantity: calcResult.inputSnapshot.productionQuantity,
      production_unit: productionUnit,
      emission_intensity: calcResult.emissionIntensity,
      intensity_unit: calcResult.intensityUnit,
      baseline_intensity: calcResult.baselineIntensity,
      calculated_by: req.user.id,
    })
    .select()
    .single();

  if (calcInsertError) return res.status(500).json({ error: "INSERT_FAILED", message: calcInsertError.message });

  const dataQualityPct = Math.min(100, 90 + Math.min(readings.length, 10)); // demo heuristic, not a real QA metric

  const { data: reportRow, error: reportInsertError } = await supabaseAdmin
    .from("mrv_reports")
    .insert({
      mrv_number: generateMrvNumber(),
      plant_id: plantId,
      organization_id: req.user.organizationId,
      calculation_id: calcRow.id,
      reporting_period_label: reportingPeriodLabel,
      status: "PROCESSING",
      data_quality_pct: dataQualityPct,
    })
    .select()
    .single();

  if (reportInsertError) return res.status(500).json({ error: "INSERT_FAILED", message: reportInsertError.message });

  // Anomaly detection against the most recent prior calculation for this plant.
  const { data: priorCalcs } = await supabaseAdmin
    .from("mrv_calculations")
    .select("*")
    .eq("plant_id", plantId)
    .neq("id", calcRow.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const previousCalc = priorCalcs?.[0]
    ? {
        totalEmissionsTco2e: priorCalcs[0].total_emissions_tco2e,
        inputSnapshot: priorCalcs[0].input_snapshot,
      }
    : null;

  const findings = detectAnomalies(calcResult, previousCalc);
  const createdAnomalies = [];

  for (const finding of findings) {
    const { data: anomalyRow, error: anomalyError } = await supabaseAdmin
      .from("anomalies")
      .insert({
        anomaly_number: generateAnomalyNumber(),
        plant_id: plantId,
        mrv_report_id: reportRow.id,
        rule_code: finding.code,
        priority: finding.priority,
        title: finding.title,
        description: finding.description,
        detected_values: finding.detectedValues,
        status: "DETECTED",
      })
      .select()
      .single();

    if (!anomalyError) createdAnomalies.push(anomalyRow);
  }

  // If anomalies were found, the report needs review before it can be
  // submitted for verification; otherwise it's ready.
  const finalStatus = createdAnomalies.length > 0 ? "NEEDS_REVIEW" : "PROCESSING";
  await supabaseAdmin.from("mrv_reports").update({ status: finalStatus }).eq("id", reportRow.id);

  await writeAuditLog({
    req,
    action: "MRV_CREATED",
    resourceType: "mrv_report",
    resourceId: reportRow.id,
    newState: { ...reportRow, status: finalStatus, anomaliesDetected: createdAnomalies.length },
  });

  res.status(201).json({
    mrvReport: { ...reportRow, status: finalStatus },
    calculation: calcRow,
    anomalies: createdAnomalies,
  });
});

// GET /api/mrv — list reports (org-scoped or privileged)
router.get("/", authenticate, async (req, res) => {
  let query = supabaseAdmin
    .from("mrv_reports")
    .select("*, plants(name, location, sector), mrv_calculations(total_emissions_tco2e, emission_intensity, intensity_unit)")
    .order("created_at", { ascending: false });

  const privileged = ["SYSTEM_ADMIN", "REGISTRY_ADMIN", "AUDITOR", "VERIFIER"].includes(req.user.role);
  if (!privileged) {
    query = query.eq("organization_id", req.user.organizationId);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });
  res.json({ mrvReports: data });
});

// GET /api/mrv/anomalies — list anomalies (org-scoped or privileged)
router.get("/anomalies", authenticate, async (req, res) => {
  const privileged = ["SYSTEM_ADMIN", "REGISTRY_ADMIN", "AUDITOR", "VERIFIER"].includes(req.user.role);

  let plantIds = null;
  if (!privileged) {
    const { data: plants } = await supabaseAdmin.from("plants").select("id").eq("organization_id", req.user.organizationId);
    plantIds = (plants || []).map((p) => p.id);
    if (plantIds.length === 0) return res.json({ anomalies: [] });
  }

  let query = supabaseAdmin.from("anomalies").select("*, plants(name)").order("detected_at", { ascending: false });
  if (plantIds) query = query.in("plant_id", plantIds);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });
  res.json({ anomalies: data });
});

// POST /api/mrv/anomalies/:id/resolve
router.post("/anomalies/:id/resolve", authenticate, requireRole("OBLIGATED_ENTITY", "VERIFIER", "REGISTRY_ADMIN"), async (req, res) => {
  const { resolutionNotes } = req.body;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("anomalies")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (fetchError || !existing) return res.status(404).json({ error: "NOT_FOUND" });
  if (existing.status === "RESOLVED") {
    return res.status(409).json({ error: "ALREADY_RESOLVED", message: "This anomaly is already resolved" });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("anomalies")
    .update({
      status: "RESOLVED",
      resolved_by: req.user.id,
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes ?? null,
    })
    .eq("id", req.params.id)
    .select()
    .single();

  if (updateError) return res.status(500).json({ error: "UPDATE_FAILED", message: updateError.message });

  await writeAuditLog({
    req,
    action: "ANOMALY_RESOLVED",
    resourceType: "anomaly",
    resourceId: existing.id,
    previousState: existing,
    newState: updated,
  });

  res.json({ anomaly: updated });
});

// POST /api/mrv/:id/submit — submit an MRV report for verification.
router.post("/:id/submit", authenticate, requireRole("OBLIGATED_ENTITY"), async (req, res) => {
  const { data: report, error: fetchError } = await supabaseAdmin
    .from("mrv_reports")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (fetchError || !report) return res.status(404).json({ error: "NOT_FOUND" });
  if (report.organization_id !== req.user.organizationId) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  if (report.status !== "PROCESSING") {
    return res.status(409).json({
      error: "INVALID_STATE",
      message: `Report must be in PROCESSING status to submit (currently ${report.status}). Resolve any open anomalies first.`,
    });
  }

  const { data: openAnomalies } = await supabaseAdmin
    .from("anomalies")
    .select("id")
    .eq("mrv_report_id", report.id)
    .neq("status", "RESOLVED")
    .neq("status", "DISMISSED");

  if (openAnomalies && openAnomalies.length > 0) {
    return res.status(409).json({ error: "OPEN_ANOMALIES", message: "Resolve all open anomalies before submitting for verification" });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("mrv_reports")
    .update({ status: "SUBMITTED_FOR_VERIFICATION", submitted_at: new Date().toISOString(), submitted_by: req.user.id })
    .eq("id", report.id)
    .select()
    .single();

  if (updateError) return res.status(500).json({ error: "UPDATE_FAILED", message: updateError.message });

  await writeAuditLog({
    req,
    action: "MRV_SUBMITTED",
    resourceType: "mrv_report",
    resourceId: report.id,
    previousState: report,
    newState: updated,
  });

  res.json({ mrvReport: updated });
});

export default router;
