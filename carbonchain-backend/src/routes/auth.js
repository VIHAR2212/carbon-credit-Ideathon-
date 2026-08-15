import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router = Router();

/**
 * Returns the current user's profile + organization. Frontend calls this
 * once after login to know which role/org context to render.
 */
router.get("/me", authenticate, async (req, res) => {
  const { data: org, error } = await supabaseAdmin
    .from("organizations")
    .select("id, name, org_type")
    .eq("id", req.user.organizationId)
    .single();

  if (error) {
    return res.status(500).json({ error: "PROFILE_LOOKUP_FAILED", message: error.message });
  }

  res.json({
    id: req.user.id,
    fullName: req.user.fullName,
    email: req.user.email,
    role: req.user.role,
    organization: org,
  });
});

export default router;
