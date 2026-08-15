-- ============================================================================
-- CARBONCHAIN SEED DATA — DEMO / SIMULATED
-- This is NOT official CCTS/BEE registry data. All entities, plants, and
-- figures below are fictional, created for hackathon demonstration only.
--
-- Run AFTER all migrations. Also requires creating matching Supabase Auth
-- users first (see README "Seeding" section for the exact steps, since
-- auth.users must be created via the Auth API, not plain SQL).
-- ============================================================================

-- ---------- ORGANIZATIONS ----------
insert into organizations (id, name, org_type, registration_number) values
  ('11111111-1111-1111-1111-111111111111', 'ABC Cement Infrastructure Ltd. (DEMO)', 'OBLIGATED_ENTITY', 'DEMO-CIN-001'),
  ('22222222-2222-2222-2222-222222222222', 'Bureau Veritas India (DEMO)', 'VERIFIER_AGENCY', 'DEMO-VER-001'),
  ('33333333-3333-3333-3333-333333333333', 'GreenFuture Capital Funds (DEMO)', 'TRADER', 'DEMO-TRD-001'),
  ('44444444-4444-4444-4444-444444444444', 'CCTS Registry Administrator (DEMO)', 'REGISTRY_ADMIN', 'DEMO-REG-001')
on conflict (id) do nothing;

insert into verifier_agencies (organization_id, accreditation_id, accreditation_body) values
  ('22222222-2222-2222-2222-222222222222', 'VER-ACVA002', 'National Accreditation Board (DEMO)')
on conflict do nothing;

-- ---------- PLANTS ----------
insert into plants (id, organization_id, name, sector, location, state, baseline_intensity, baseline_unit) values
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111',
   'Maharashtra Plant 04 (Chandrapur) [DEMO]', 'Cement', 'Chandrapur', 'Maharashtra', 0.890, 'tCO2e/t clinker')
on conflict (id) do nothing;

-- ---------- DATA SOURCES ----------
insert into data_sources (plant_id, name, source_type, status, last_sync_at) values
  ('55555555-5555-5555-5555-555555555555', 'CEMS Gas Analyzer (DEMO)', 'SIMULATED_IOT', 'Online', now() - interval '5 seconds'),
  ('55555555-5555-5555-5555-555555555555', 'Production ERP Connector (DEMO)', 'API', 'Online', now() - interval '2 minutes'),
  ('55555555-5555-5555-5555-555555555555', 'Manual Upload Portal (DEMO)', 'MANUAL_ENTRY', 'Idle', now() - interval '2 days')
on conflict do nothing;

-- NOTE: profiles rows are intentionally NOT seeded here — they must be
-- created after corresponding Supabase Auth users exist (profiles.id is a
-- foreign key to auth.users.id). See README.md "Seeding demo accounts".
