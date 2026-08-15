// LEGACY FILE — kept for the existing /api/keep-alive route.
// New backend code uses src/lib/supabase.js (service role + anon clients).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — keep-alive and DB calls will fail until configured."
  );
}

export const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

/**
 * Pings Supabase with a trivial read (and optional write) to reset the
 * project's inactivity timer. Free-tier Supabase projects pause after
 * ~7 days with zero API/DB activity — this must run more often than that.
 *
 * Uses `_keep_alive` table if present; falls back to a harmless system
 * catalog read so this works even before any app tables exist.
 */
export async function pingSupabase() {
  const startedAt = Date.now();

  if (!supabase) {
    return { ok: false, method: "none", ms: Date.now() - startedAt, error: "Supabase not configured" };
  }

  // Preferred: touch a dedicated keep-alive table (created by migration below).
  const { error: writeError } = await supabase
    .from("_keep_alive")
    .upsert({ id: 1, pinged_at: new Date().toISOString() }, { onConflict: "id" });

  if (!writeError) {
    return { ok: true, method: "table_upsert", ms: Date.now() - startedAt };
  }

  // Fallback: read-only ping against Postgres system catalogs via RPC-less
  // select, works even if the app hasn't run migrations yet.
  const { error: readError } = await supabase.from("pg_stat_activity").select("*").limit(1);

  if (!readError) {
    return { ok: true, method: "catalog_read", ms: Date.now() - startedAt };
  }

  return {
    ok: false,
    method: "none",
    ms: Date.now() - startedAt,
    error: readError.message || writeError.message,
  };
}
