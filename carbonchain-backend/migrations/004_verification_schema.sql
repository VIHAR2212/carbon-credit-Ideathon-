-- ============================================================================
-- CARBONCHAIN SCHEMA — Part 3: Verification Workflow
-- ============================================================================

create table verifications (
  id uuid primary key default gen_random_uuid(),
  verification_number text not null unique, -- e.g. VER-ACVA002-2026-00918
  mrv_report_id uuid not null references mrv_reports(id) on delete cascade,
  verifier_agency_id uuid not null references verifier_agencies(id),
  assigned_verifier_id uuid references profiles(id), -- individual verifier user
  status text not null default 'ASSIGNED' check (
    status in ('ASSIGNED', 'EVIDENCE_REVIEW', 'CORRECTION_REQUESTED', 'APPROVED', 'REJECTED')
  ),
  claimed_reduction_tco2e numeric(18, 4),
  verified_emission_rate numeric(10, 4),
  baseline_emission_rate numeric(10, 4),
  decision_notes text,
  decided_by uuid references profiles(id),
  decided_at timestamptz,
  signature_hash text, -- sha256 of (verification_id + decided_by + decision + timestamp)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_verifications_mrv on verifications(mrv_report_id);
create index idx_verifications_agency on verifications(verifier_agency_id);
create index idx_verifications_status on verifications(status);

-- Enforces: a verifier agency cannot verify an MRV report belonging to
-- their own organization (conflict of interest check, done at insert time
-- via a trigger since it spans two tables).
create or replace function check_verifier_conflict_of_interest()
returns trigger as $$
declare
  mrv_org_id uuid;
  verifier_org_id uuid;
begin
  select organization_id into mrv_org_id from mrv_reports where id = new.mrv_report_id;
  select organization_id into verifier_org_id from verifier_agencies where id = new.verifier_agency_id;

  if mrv_org_id = verifier_org_id then
    raise exception 'CONFLICT_OF_INTEREST: verifier agency cannot verify its own organization''s MRV report';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_verifier_conflict_check
  before insert or update on verifications
  for each row execute function check_verifier_conflict_of_interest();

-- ---------- VERIFICATION FINDINGS (checklist items) ----------
create table verification_findings (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references verifications(id) on delete cascade,
  check_key text not null, -- e.g. 'production', 'electricity', 'fuel'
  check_label text not null,
  is_satisfied boolean not null default false,
  notes text,
  updated_at timestamptz not null default now()
);

create unique index uq_verification_findings on verification_findings(verification_id, check_key);

alter table verifications enable row level security;
alter table verification_findings enable row level security;
