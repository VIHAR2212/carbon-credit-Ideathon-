-- ============================================================================
-- CARBONCHAIN SEED DATA — Part 2: Extra Demo Plants + MRV Activity
-- DEMO / SIMULATED — same fictional-data disclaimer as 008_seed_demo_data.sql.
-- Gives the dashboard real numbers to show immediately after migrations run,
-- without requiring manual CSV upload through the UI first.
-- ============================================================================

-- ---------- ADDITIONAL PLANTS ----------
insert into plants (id, organization_id, name, sector, location, state, baseline_intensity, baseline_unit) values
  ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111',
   'Gujarat Steel Works [DEMO]', 'Steel', 'Surat', 'Gujarat', 1.740, 'tCO2e/t steel'),
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111',
   'Odisha Aluminium Smelter [DEMO]', 'Aluminium', 'Jharsuguda', 'Odisha', 15.200, 'tCO2e/t aluminium'),
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111',
   'Rajasthan Thermal Power Unit 2 [DEMO]', 'Thermal Power', 'Kota', 'Rajasthan', 0.912, 'tCO2e/MWh')
on conflict (id) do nothing;

insert into data_sources (plant_id, name, source_type, status, last_sync_at) values
  ('66666666-6666-6666-6666-666666666666', 'CEMS Gas Analyzer (DEMO)', 'SIMULATED_IOT', 'Online', now() - interval '12 seconds'),
  ('77777777-7777-7777-7777-777777777777', 'CEMS Gas Analyzer (DEMO)', 'SIMULATED_IOT', 'Online', now() - interval '8 seconds'),
  ('88888888-8888-8888-8888-888888888888', 'CEMS Gas Analyzer (DEMO)', 'SIMULATED_IOT', 'Online', now() - interval '3 seconds')
on conflict do nothing;

-- ---------- MRV CALCULATIONS + REPORTS ----------
-- One verified, one processing, one needs-review, one fresh upload —
-- covers the full status range a judge would want to see on the dashboard.

insert into mrv_calculations (
  id, plant_id, reporting_period_start, reporting_period_end, batch_id,
  methodology_version, input_snapshot, conversion_factors,
  total_emissions_tco2e, production_quantity, production_unit,
  emission_intensity, intensity_unit, baseline_intensity
) values
  ('a1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555',
   '2026-04-01', '2026-06-30', gen_random_uuid(), 'CCTS-INTENSITY-V1',
   '{"totals": {"ELECTRICITY": 18420, "FUEL": 24100, "PRODUCTION": 76290}}'::jsonb,
   '{"ELECTRICITY": {"factor": 0.82}, "FUEL_COAL": {"factor": 2.42}}'::jsonb,
   82431.0, 76290, 't clinker', 0.824, 'tCO2e/t clinker', 0.890),
  ('a2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666',
   '2026-04-01', '2026-06-30', gen_random_uuid(), 'CCTS-INTENSITY-V1',
   '{"totals": {"ELECTRICITY": 34210, "FUEL": 45900, "PRODUCTION": 82128}}'::jsonb,
   '{"ELECTRICITY": {"factor": 0.82}, "FUEL_COAL": {"factor": 2.42}}'::jsonb,
   142900.0, 82128, 't steel', 1.740, 'tCO2e/t steel', 1.740),
  ('a3333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777',
   '2026-04-01', '2026-06-30', gen_random_uuid(), 'CCTS-INTENSITY-V1',
   '{"totals": {"ELECTRICITY": 61208, "FUEL": 8900, "PRODUCTION": 4021}}'::jsonb,
   '{"ELECTRICITY": {"factor": 0.82}, "FUEL_COAL": {"factor": 2.42}}'::jsonb,
   61208.0, 4021, 't aluminium', 15.220, 'tCO2e/t aluminium', 15.200),
  ('a4444444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888',
   '2026-04-01', '2026-06-30', gen_random_uuid(), 'CCTS-INTENSITY-V1',
   '{"totals": {"ELECTRICITY": 210450, "FUEL": 0, "PRODUCTION": 230800}}'::jsonb,
   '{"ELECTRICITY": {"factor": 0.82}, "FUEL_COAL": {"factor": 2.42}}'::jsonb,
   210450.0, 230800, 'MWh', 0.912, 'tCO2e/MWh', 0.912)
on conflict (id) do nothing;

insert into mrv_reports (
  mrv_number, plant_id, organization_id, calculation_id,
  reporting_period_label, status, data_quality_pct
) values
  ('MRV-DEMO-00001', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111',
   'a1111111-1111-1111-1111-111111111111', 'Q2 2026', 'VERIFIED', 99.8),
  ('MRV-DEMO-00002', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111',
   'a2222222-2222-2222-2222-222222222222', 'Q2 2026', 'SUBMITTED_FOR_VERIFICATION', 99.9),
  ('MRV-DEMO-00003', '77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111',
   'a3333333-3333-3333-3333-333333333333', 'Q2 2026', 'NEEDS_REVIEW', 96.2),
  ('MRV-DEMO-00004', '88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111',
   'a4444444-4444-4444-4444-444444444444', 'Q2 2026', 'PROCESSING', 98.4)
on conflict (mrv_number) do nothing;

-- ---------- SAMPLE ANOMALY (for the demo dashboard badge + Anomalies tab) ----------
insert into anomalies (
  anomaly_number, plant_id, mrv_report_id, rule_code, priority,
  title, description, detected_values, status
)
select
  'ANM-DEMO-0001', '77777777-7777-7777-7777-777777777777', r.id,
  'IMPOSSIBLE_INTENSITY', 'MEDIUM',
  'Emission intensity implausibly below baseline',
  'Reported intensity (15.220) is close to facility baseline (15.200); flagged for routine review, not a material misstatement.',
  '{"ratio": 1.0}'::jsonb, 'DETECTED'
from mrv_reports r where r.mrv_number = 'MRV-DEMO-00003'
on conflict (anomaly_number) do nothing;
