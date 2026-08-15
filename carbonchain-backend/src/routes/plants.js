import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { writeAuditLog } from "../lib/audit.js";

const router = Router();

// GET /api/plants — org sees own plants; privileged roles see all.
router.get("/", authenticate, async (req, res) => {
  let query = supabaseAdmin.from("plants").select("*").order("created_at", { ascending: false });

  const privileged = ["SYSTEM_ADMIN", "REGISTRY_ADMIN", "AUDITOR", "VERIFIER"].includes(req.user.role);
  if (!privileged) {
    query = query.eq("organization_id", req.user.organizationId);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });
  res.json({ plants: data });
});

// POST /api/plants — only obligated entities create plants for their own org.
router.post("/", authenticate, requireRole("OBLIGATED_ENTITY"), async (req, res) => {
  const { name, sector, location, state, baselineIntensity, baselineUnit } = req.body;

  if (!name || !sector || !location || !state) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "name, sector, location, state are required" });
  }

  const { data, error } = await supabaseAdmin
    .from("plants")
    .insert({
      organization_id: req.user.organizationId,
      name,
      sector,
      location,
      state,
      baseline_intensity: baselineIntensity ?? null,
      baseline_unit: baselineUnit ?? null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: "INSERT_FAILED", message: error.message });

  await writeAuditLog({
    req,
    action: "PLANT_CREATED",
    resourceType: "plant",
    resourceId: data.id,
    newState: data,
  });

  res.status(201).json({ plant: data });
});

// GET /api/plants/:id/data-sources
router.get("/:id/data-sources", authenticate, async (req, res) => {
  const { data: plant, error: plantError } = await supabaseAdmin
    .from("plants")
    .select("id, organization_id")
    .eq("id", req.params.id)
    .single();

  if (plantError || !plant) return res.status(404).json({ error: "NOT_FOUND" });

  const privileged = ["SYSTEM_ADMIN", "REGISTRY_ADMIN", "AUDITOR", "VERIFIER"].includes(req.user.role);
  if (!privileged && plant.organization_id !== req.user.organizationId) {
    return res.status(403).json({ error: "FORBIDDEN", message: "Cannot access another organization's plant" });
  }

  const { data, error } = await supabaseAdmin
    .from("data_sources")
    .select("*")
    .eq("plant_id", req.params.id)
    .order("name");

  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });
  res.json({ dataSources: data });
});

export default router;
