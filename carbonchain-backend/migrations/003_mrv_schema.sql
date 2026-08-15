-- ============================================================================
-- CARBONCHAIN SCHEMA — Part 2: MRV Calculations, Reports, Anomalies
-- ============================================================================

-- ---------- MRV CALCULATIONS ----------
-- Deterministic, versioned. A recalculation creates a NEW row, never
-- overwrites an old one — see calculate.js for the pure function used here.
create table mrv_calculations (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references plants(id) on delete cascade,
  reporting_period_start date not null,
  reporting_period_end date not null,
  batch_id uuid not null, -- the meter_readings.batch_id this calc consumed
  methodology_version text not null default 'CCTS-INTENSITY-V1',
  input_snapshot jsonb not null, -- exact inputs used (totals per reading_type)
  conversion_factors jsonb not null,
  total_emissions_tco2e numeric(18, 4) not null,
  production_quantity numeric(18, 4),
  production_unit text,
  emission_intensity numeric(10, 4),
  intensity_unit text,
  baseline_intensity numeric(10, 4),
  calculated_by uuid references profiles(id), -- null if system-triggered
  calculation_version int not null default 1,
  superseded_by uuid references mrv_calculations(id),
  created_at timestamptz not null default now()
);

create index idx_mrv_calc_plant on mrv_calculations(plant_id);
create index idx_mrv_calc_period on mrv_calculations(reporting_period_start, reporting_period_end);

-- ---------- MRV REPORTS ----------
-- The user-facing "MRV record" — one per plant per reporting period,
-- wraps a calculation and carries lifecycle status.
create table mrv_reports (
  id uuid primary key default gen_random_uuid(),
  mrv_number text not null unique, -- e.g. MRV-95352733385
  plant_id uuid not null references plants(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  calculation_id uuid not null references mrv_calculations(id),
  reporting_period_label text not null, -- e.g. "Q2 2026"
  status text not null default 'PROCESSING' check (
    status in ('PROCESSING', 'NEEDS_REVIEW', 'SUBMITTED_FOR_VERIFICATION', 'VERIFIED', 'REJECTED')
  ),
  data_quality_pct numeric(5, 2),
  submitted_at timestamptz,
  submitted_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_mrv_reports_plant on mrv_reports(plant_id);
create index idx_mrv_reports_org on mrv_reports(organization_id);
create index idx_mrv_reports_status on mrv_reports(status);

-- ---------- MRV EVIDENCE ----------
create table mrv_evidence (
  id uuid primary key default gen_random_uuid(),
  mrv_report_id uuid not null references mrv_reports(id) on delete cascade,
  document_type text not null,
  file_path text not null, -- Supabase Storage path
  file_name text not null,
  sha256_hash text not null,
  version int not null default 1,
  superseded_by uuid references mrv_evidence(id),
  uploaded_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_mrv_evidence_report on mrv_evidence(mrv_report_id);

-- ---------- ANOMALIES ----------
create table anomalies (
  id uuid primary key default gen_random_uuid(),
  anomaly_number text not null unique, -- e.g. ANM-2026-0812
  plant_id uuid not null references plants(id) on delete cascade,
  mrv_report_id uuid references mrv_reports(id) on delete set null,
  rule_code text not null, -- e.g. 'ELECTRICITY_PRODUCTION_DIVERGENCE'
  priority text not null check (priority in ('HIGH', 'MEDIUM', 'LOW')),
  title text not null,
  description text not null,
  detected_values jsonb, -- the actual numbers that triggered the rule
  status text not null default 'DETECTED' check (
    status in ('DETECTED', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED')
  ),
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  resolution_notes text,
  detected_at timestamptz not null default now()
);

create index idx_anomalies_plant on anomalies(plant_id);
create index idx_anomalies_status on anomalies(status);
create index idx_anomalies_mrv on anomalies(mrv_report_id);

alter table mrv_calculations enable row level security;
alter table mrv_reports enable row level security;
alter table mrv_evidence enable row level security;
alter table anomalies enable row level security;
