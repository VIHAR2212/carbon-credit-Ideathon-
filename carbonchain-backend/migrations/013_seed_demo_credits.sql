-- ============================================================================
-- CARBONCHAIN SEED DATA — Part 3: Demo Carbon Credits
-- DEMO / SIMULATED — same fictional-data disclaimer as prior seed migrations.
-- Requires 008 and 012 to have run first (references their plants/orgs/MRV).
-- Populates the registry dashboard counts (Available / Locked / Retired)
-- immediately, without needing to run the full issuance workflow live.
-- ============================================================================

-- ---------- Backing verification + issuance request for the seeded batch ----------
-- (carbon_credits requires a real verification_id and mrv_report_id — these
-- give the seeded CCCs a valid, traceable origin instead of dangling FKs.)

insert into verifications (
  id, verification_number, mrv_report_id, verifier_agency_id, status,
  claimed_reduction_tco2e, verified_emission_rate, baseline_emission_rate,
  decision_notes, decided_by, decided_at, signature_hash
)
select
  'b1111111-1111-1111-1111-111111111111', 'VER-DEMO-00001', r.id, va.id, 'APPROVED',
  10427, 0.824, 0.890, 'DEMO seed — pre-approved for dashboard demonstration.',
  null, now() - interval '2 days', 'demo-seed-hash-0001'
from mrv_reports r, verifier_agencies va
where r.mrv_number = 'MRV-DEMO-00001' and va.accreditation_id = 'VER-ACVA002'
on conflict (id) do nothing;

-- Guard: this migration needs at least one profile in the ABC Cement and
-- Registry Admin demo organizations to exist already (created via Supabase
-- Auth + the profiles insert from setup). If you haven't created your demo
-- accounts yet, do that first — otherwise the inserts below silently
-- affect 0 rows instead of erroring, which is harder to debug.
do $$
begin
  if not exists (select 1 from profiles where organization_id = '11111111-1111-1111-1111-111111111111') then
    raise exception 'SETUP_INCOMPLETE: no profile found for organization 11111111-... (ABC Cement demo entity). Create your demo Supabase Auth user + profiles row first, then re-run this migration.';
  end if;
  if not exists (select 1 from profiles where organization_id = '44444444-4444-4444-4444-444444444444') then
    raise exception 'SETUP_INCOMPLETE: no profile found for organization 44444444-... (Registry Admin demo). Create your demo Supabase Auth user + profiles row first, then re-run this migration.';
  end if;
end $$;

insert into issuance_requests (
  id, issuance_number, verification_id, organization_id,
  eligible_quantity_tco2e, status, requested_by, approved_by, approved_at
)
select
  'c1111111-1111-1111-1111-111111111111', 'ISS-DEMO-00001', 'b1111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111', 10427, 'ISSUED',
  p_entity.id, p_admin.id, now() - interval '1 day'
from
  (select id from profiles where organization_id = '11111111-1111-1111-1111-111111111111' limit 1) p_entity,
  (select id from profiles where organization_id = '44444444-4444-4444-4444-444444444444' limit 1) p_admin
on conflict (id) do nothing;

insert into carbon_credit_batches (id, issuance_request_id, batch_serial_start, batch_serial_end, quantity)
values (
  'd1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111',
  'CCC-IN-2026-00010001', 'CCC-IN-2026-00010010', 10
)
on conflict (id) do nothing;

-- ---------- Individual CCCs across different statuses ----------
-- 6 AVAILABLE, 2 LOCKED, 2 RETIRED — gives every dashboard stat a
-- non-zero number without needing to run the trade/retire flow live.

insert into carbon_credits (
  ccc_id, batch_id, organization_id, plant_id, mrv_report_id, verification_id,
  reporting_period_label, quantity_tco2e, current_owner_organization_id, status
)
select
  'CCC-IN-2026-0001000' || gs::text,
  'd1111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '55555555-5555-5555-5555-555555555555',
  r.id,
  'b1111111-1111-1111-1111-111111111111',
  'Q2 2026',
  1,
  '11111111-1111-1111-1111-111111111111',
  case
    when gs <= 6 then 'AVAILABLE'
    when gs <= 8 then 'LOCKED'
    else 'RETIRED'
  end
from generate_series(1, 10) gs, mrv_reports r
where r.mrv_number = 'MRV-DEMO-00001'
on conflict (ccc_id) do nothing;

-- ---------- Genesis events for each seeded credit (keeps provenance real) ----------
insert into carbon_credit_events (ccc_id, event_type, previous_status, new_status, event_hash, metadata)
select
  cc.ccc_id, 'ISSUED', null, 'AVAILABLE',
  encode(sha256((cc.ccc_id || '|ISSUED||AVAILABLE|' || now()::text || '|GENESIS')::bytea), 'hex'),
  jsonb_build_object('seed', true, 'batch_id', cc.batch_id)
from carbon_credits cc
where cc.batch_id = 'd1111111-1111-1111-1111-111111111111'
  and not exists (select 1 from carbon_credit_events e where e.ccc_id = cc.ccc_id);

-- Retirement records for the 2 seeded RETIRED credits, so their status is
-- consistent with a real retirements row (matches the RETIRED status set above).
insert into retirements (retirement_number, ccc_id, organization_id, requested_by, reason, status)
select
  'SUR-DEMO-' || row_number() over (),
  cc.ccc_id,
  '11111111-1111-1111-1111-111111111111',
  (select id from profiles where organization_id = '11111111-1111-1111-1111-111111111111' limit 1),
  'DEMO seed — mandatory CCTS compliance surrender FY2026.',
  'CONFIRMED'
from carbon_credits cc
where cc.batch_id = 'd1111111-1111-1111-1111-111111111111' and cc.status = 'RETIRED'
on conflict (ccc_id) do nothing;
