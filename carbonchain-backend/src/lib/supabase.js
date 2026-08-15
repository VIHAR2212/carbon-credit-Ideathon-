import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.warn("[lib/supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — backend DB calls will fail.");
}

/**
 * Privileged client — bypasses RLS entirely. Used ONLY inside route
 * handlers, and ONLY after authenticate() + authorize() middleware have
 * confirmed the caller's identity, role, and organization. Every write
 * using this client must manually filter by the caller's organization_id
 * where relevant — RLS is not there to save us here, application logic is.
 */
export const supabaseAdmin = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SERVICE_ROLE_KEY || "placeholder-key",
  { auth: { persistSession: false, autoRefreshToken: false } }
);

/**
 * Per-request client scoped to the calling user's JWT, so RLS policies
 * apply. Used for read endpoints where "let Postgres enforce org
 * isolation" is preferable to hand-rolling the same filter in every route.
 */
export function supabaseForUser(accessToken) {
  return createClient(SUPABASE_URL, ANON_KEY || SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
