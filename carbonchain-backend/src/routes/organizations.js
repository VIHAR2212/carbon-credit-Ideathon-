import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

// GET /api/organizations/verifier-agencies — needed to populate the
// "assign verifier" dropdown on the registry admin's verification screen.
router.get("/verifier-agencies", authenticate, requireRole("REGISTRY_ADMIN", "SYSTEM_ADMIN"), async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("verifier_agencies")
    .select("id, accreditation_id, accreditation_body, is_active, organizations(name)")
    .eq("is_active", true);

  if (error) return res.status(500).json({ error: "QUERY_FAILED", message: error.message });
  res.json({ verifierAgencies: data });
});

export default router;
