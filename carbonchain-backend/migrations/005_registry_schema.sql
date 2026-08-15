-- ============================================================================
-- CARBONCHAIN SCHEMA — Part 4: Registry, Issuance, CCC Lifecycle
-- This is the highest-integrity part of the system: status transitions are
-- enforced in the database, not just in application code.
-- ============================================================================

create type ccc_status as enum (
  'PENDING',
  'AVAILABLE',
  'LOCKED',        -- reserved by an open sell order
  'IN_TRANSFER',   -- mid-settlement
  'FROZEN',        -- registry safety interlock (anomaly/fraud suspicion)
  'RETIRED',       -- permanent, terminal
  'VOID'           -- issuance error correction, terminal
);

-- ---------- ISSUANCE REQUESTS ----------
create table issuance_requests (
  id uuid primary key default gen_random_uuid(),
  issuance_number text not null unique, -- e.g. ISS-2026-00412
  verification_id uuid not null references verifications(id),
  organization_id uuid not null references organizations(id),
  eligible_quantity_tco2e numeric(18, 4) not null check (eligible_quantity_tco2e > 0),
  status text not null default 'PENDING_APPROVAL' check (
    status in ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ISSUED')
  ),
  requested_by uuid not null references profiles(id),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

-- A verification can only ever back ONE issuance request — hard stop
-- against double issuance from the same verified quantity.
create unique index uq_issuance_per_verification on issuance_requests(verification_id);

create index idx_issuance_org on issuance_requests(organization_id);
create index idx_issuance_status on issuance_requests(status);

-- ---------- CARBON CREDIT BATCHES ----------
create table carbon_credit_batches (
  id uuid primary key default gen_random_uuid(),
  issuance_request_id uuid not null unique references issuance_requests(id),
  batch_serial_start text not null,
  batch_serial_end text not null,
  quantity int not null check (quantity > 0),
  merkle_root text, -- populated once anchored
  created_at timestamptz not null default now()
);

-- ---------- CARBON CREDITS (individual CCCs) ----------
create table carbon_credits (
  id uuid primary key default gen_random_uuid(),
  ccc_id text not null unique, -- e.g. CCC-IN-2026-00018473
  batch_id uuid not null references carbon_credit_batches(id),
  organization_id uuid not null references organizations(id), -- origin entity
  plant_id uuid not null references plants(id),
  mrv_report_id uuid not null references mrv_reports(id),
  verification_id uuid not null references verifications(id),
  reporting_period_label text not null,
  quantity_tco2e numeric(18, 4) not null default 1 check (quantity_tco2e > 0),
  current_owner_organization_id uuid not null references organizations(id),
  status ccc_status not null default 'PENDING',
  issued_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_credits_owner on carbon_credits(current_owner_organization_id);
create index idx_credits_status on carbon_credits(status);
create index idx_credits_batch on carbon_credits(batch_id);
create index idx_credits_plant on carbon_credits(plant_id);

-- ---------- CCC EVENTS (append-only provenance chain) ----------
-- This table is the single source of truth for a CCC's full history.
-- Rows are NEVER updated or deleted by application code (enforced by
-- REVOKE below + no UPDATE/DELETE routes in the API).
create table carbon_credit_events (
  id uuid primary key default gen_random_uuid(),
  ccc_id text not null references carbon_credits(ccc_id),
  event_type text not null check (event_type in (
    'ISSUED', 'LOCKED', 'UNLOCKED', 'TRANSFERRED', 'FROZEN', 'UNFROZEN',
    'RETIREMENT_REQUESTED', 'RETIRED', 'VOIDED'
  )),
  actor_organization_id uuid references organizations(id),
  actor_profile_id uuid references profiles(id),
  previous_status ccc_status,
  new_status ccc_status not null,
  related_trade_id uuid, -- FK added after trades table exists
  related_retirement_id uuid,
  metadata jsonb,
  event_hash text not null, -- sha256(ccc_id + event_type + prev + new + timestamp + prior_hash)
  created_at timestamptz not null default now()
);

create index idx_ccc_events_ccc on carbon_credit_events(ccc_id, created_at);

-- Enforce valid state transitions at the database level.
create or replace function validate_ccc_status_transition()
returns trigger as $$
begin
  -- RETIRED and VOID are terminal — nothing can move out of them.
  if old.status in ('RETIRED', 'VOID') and new.status is distinct from old.status then
    raise exception 'INVALID_TRANSITION: CCC % is in terminal state % and cannot change', old.ccc_id, old.status;
  end if;

  -- FROZEN credits cannot be transferred or locked for sale.
  if old.status = 'FROZEN' and new.status in ('LOCKED', 'IN_TRANSFER') then
    raise exception 'INVALID_TRANSITION: CCC % is FROZEN and cannot be locked or transferred', old.ccc_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_ccc_status_transition
  before update on carbon_credits
  for each row
  when (old.status is distinct from new.status)
  execute function validate_ccc_status_transition();

-- No application role may UPDATE or DELETE events directly — only INSERT
-- via the service role from backend code. This is the DB-level guarantee
-- behind "no application API can rewrite history."
revoke update, delete on carbon_credit_events from authenticated, anon;

alter table issuance_requests enable row level security;
alter table carbon_credit_batches enable row level security;
alter table carbon_credits enable row level security;
alter table carbon_credit_events enable row level security;
