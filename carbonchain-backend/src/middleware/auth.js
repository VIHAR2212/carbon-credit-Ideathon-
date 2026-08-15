import { supabaseAdmin, supabaseForUser } from "../lib/supabase.js";

/**
 * Verifies the Bearer token against Supabase Auth, loads the user's
 * profile (role + organization_id), and attaches both to req.
 * Every protected route depends on this running first.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.header("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "UNAUTHENTICATED", message: "Missing Authorization: Bearer <token> header" });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: "UNAUTHENTICATED", message: "Invalid or expired session" });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, role, organization_id, is_active")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) {
    return res.status(403).json({ error: "NO_PROFILE", message: "Account has no CarbonChain profile provisioned" });
  }

  if (!profile.is_active) {
    return res.status(403).json({ error: "ACCOUNT_DISABLED", message: "This account has been deactivated" });
  }

  req.authToken = token;
  req.user = {
    id: profile.id,
    fullName: profile.full_name,
    role: profile.role,
    organizationId: profile.organization_id,
    email: userData.user.email,
  };
  // RLS-scoped client, available to routes that prefer letting Postgres
  // enforce isolation rather than filtering manually.
  req.supabaseRLS = supabaseForUser(token);

  next();
}

/**
 * Restricts a route to a fixed set of roles. Returns 403, not a hidden
 * button — the frontend may also hide the control, but the enforcement
 * that actually matters lives here.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: `Role ${req.user.role} is not permitted to perform this action. Requires one of: ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
}
