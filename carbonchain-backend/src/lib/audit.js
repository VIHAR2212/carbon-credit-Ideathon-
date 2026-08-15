import { supabaseAdmin } from "./supabase.js";

/**
 * Writes one append-only audit event. Call this from every route that
 * mutates state (issuance, verification decisions, trades, retirements,
 * anomaly resolution, freezes). Never call UPDATE/DELETE against
 * audit_logs — the DB grants block it for non-service-role callers, and
 * this app never attempts it either.
 */
export async function writeAuditLog({
  req,
  action,
  resourceType,
  resourceId,
  previousState = null,
  newState = null,
}) {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    actor_profile_id: req.user?.id ?? null,
    actor_organization_id: req.user?.organizationId ?? null,
    actor_role: req.user?.role ?? null,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    request_id: req.header("x-request-id") || null,
    previous_state: previousState,
    new_state: newState,
    ip_address: req.ip || null,
  });

  if (error) {
    // Audit logging failure must never silently vanish — log loudly to
    // stdout (captured by Render logs) even though we don't fail the
    // parent request, since the primary action already succeeded.
    console.error("[audit] FAILED TO WRITE AUDIT LOG", { action, resourceType, resourceId, error: error.message });
  }
}
