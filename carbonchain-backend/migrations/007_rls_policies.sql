-- ============================================================================
-- CARBONCHAIN SCHEMA — Part 6: Row Level Security Policies
-- Enforces organization isolation and role checks AT THE DATABASE LEVEL,
-- so even a bug in the API cannot leak Organization A's data to Organization B.
-- Backend uses the service_role key for privileged writes (issuance, trades)
-- and always explicitly filters by the authenticated user's org — RLS is the
-- backstop, not the only mechanism.
-- ============================================================================

-- Helper: get the calling user's organization_id and role from their JWT.
create or replace function auth_organization_id()
returns uuid as $$
  select organization_id from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function auth_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

-- ---------- PROFILES ----------
create policy "users read own profile" on profiles
  for select using (id = auth.uid());

create policy "users read same-org profiles" on profiles
  for select using (organization_id = auth_organization_id());

create policy "admins read all profiles" on profiles
  for select using (auth_role() in ('SYSTEM_ADMIN', 'REGISTRY_ADMIN', 'AUDITOR'));

-- ---------- ORGANIZATIONS ----------
create policy "users read own org" on organizations
  for select using (id = auth_organization_id());

create policy "admins read all orgs" on organizations
  for select using (auth_role() in ('SYSTEM_ADMIN', 'REGISTRY_ADMIN', 'AUDITOR', 'VERIFIER'));

-- ---------- PLANTS ----------
create policy "org reads own plants" on plants
  for select using (organization_id = auth_organization_id());

create policy "privileged roles read all plants" on plants
  for select using (auth_role() in ('SYSTEM_ADMIN', 'REGISTRY_ADMIN', 'AUDITOR', 'VERIFIER'));

create policy "org manages own plants" on plants
  for insert with check (organization_id = auth_organization_id() and auth_role() = 'OBLIGATED_ENTITY');

-- ---------- DATA SOURCES / METER READINGS ----------
create policy "org reads own data sources" on data_sources
  for select using (
    plant_id in (select id from plants where organization_id = auth_organization_id())
  );

create policy "org reads own meter readings" on meter_readings
  for select using (
    plant_id in (select id from plants where organization_id = auth_organization_id())
  );

create policy "privileged roles read all meter readings" on meter_readings
  for select using (auth_role() in ('SYSTEM_ADMIN', 'REGISTRY_ADMIN', 'AUDITOR', 'VERIFIER'));

-- ---------- MRV REPORTS / CALCULATIONS ----------
create policy "org reads own mrv reports" on mrv_reports
  for select using (organization_id = auth_organization_id());

create policy "privileged roles read all mrv reports" on mrv_reports
  for select using (auth_role() in ('SYSTEM_ADMIN', 'REGISTRY_ADMIN', 'AUDITOR', 'VERIFIER'));

create policy "org reads own calculations" on mrv_calculations
  for select using (
    plant_id in (select id from plants where organization_id = auth_organization_id())
  );

create policy "privileged roles read all calculations" on mrv_calculations
  for select using (auth_role() in ('SYSTEM_ADMIN', 'REGISTRY_ADMIN', 'AUDITOR', 'VERIFIER'));

-- ---------- ANOMALIES ----------
create policy "org reads own anomalies" on anomalies
  for select using (
    plant_id in (select id from plants where organization_id = auth_organization_id())
  );

create policy "privileged roles read all anomalies" on anomalies
  for select using (auth_role() in ('SYSTEM_ADMIN', 'REGISTRY_ADMIN', 'AUDITOR', 'VERIFIER'));

-- ---------- VERIFICATIONS ----------
create policy "org reads own verifications" on verifications
  for select using (
    mrv_report_id in (select id from mrv_reports where organization_id = auth_organization_id())
  );

create policy "verifier reads assigned verifications" on verifications
  for select using (
    verifier_agency_id in (select id from verifier_agencies where organization_id = auth_organization_id())
  );

create policy "privileged roles read all verifications" on verifications
  for select using (auth_role() in ('SYSTEM_ADMIN', 'REGISTRY_ADMIN', 'AUDITOR'));

-- ---------- CARBON CREDITS (registry visibility is broader — market needs it) ----------
create policy "everyone reads available/traded credits" on carbon_credits
  for select using (status in ('AVAILABLE', 'LOCKED', 'IN_TRANSFER', 'RETIRED'));

create policy "org reads own credits regardless of status" on carbon_credits
  for select using (
    organization_id = auth_organization_id() or current_owner_organization_id = auth_organization_id()
  );

create policy "privileged roles read all credits" on carbon_credits
  for select using (auth_role() in ('SYSTEM_ADMIN', 'REGISTRY_ADMIN', 'AUDITOR'));

-- ---------- CCC EVENTS (provenance — public read for transparency) ----------
create policy "anyone authenticated reads ccc events" on carbon_credit_events
  for select using (auth.role() = 'authenticated');

-- ---------- ORDERS / TRADES (market data is broadly visible; order book is public) ----------
create policy "anyone authenticated reads open orders" on orders
  for select using (status in ('OPEN', 'PARTIALLY_FILLED') or organization_id = auth_organization_id());

create policy "anyone authenticated reads trades" on trades
  for select using (auth.role() = 'authenticated');

-- ---------- AUDIT LOGS (auditor + admin only) ----------
create policy "auditors and admins read audit logs" on audit_logs
  for select using (auth_role() in ('SYSTEM_ADMIN', 'REGISTRY_ADMIN', 'AUDITOR'));

create policy "org reads own audit trail" on audit_logs
  for select using (actor_organization_id = auth_organization_id());

-- ---------- INTEGRITY ALERTS (auditor + admin only) ----------
create policy "auditors and admins read integrity alerts" on integrity_alerts
  for select using (auth_role() in ('SYSTEM_ADMIN', 'REGISTRY_ADMIN', 'AUDITOR'));

-- ---------- BLOCKCHAIN ANCHORS (public read — this is meant to be inspectable) ----------
create policy "anyone authenticated reads anchors" on blockchain_anchors
  for select using (auth.role() = 'authenticated');

-- NOTE: All writes (INSERT/UPDATE) to sensitive tables — issuance, credits,
-- events, trades, retirements, audit_logs — are performed exclusively by
-- backend routes using the Supabase service_role key, which bypasses RLS
-- by design. RLS here governs client-side reads only. Every backend route
-- re-checks role/org membership in application code before writing
-- (see src/middleware/authorize.js) — RLS is the second layer, not the only one.
