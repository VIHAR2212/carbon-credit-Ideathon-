-- ============================================================================
-- CARBONCHAIN CORE SCHEMA — Part 1: Identity, Organizations, Plants, MRV
-- Run in Supabase SQL Editor, in order (001, 002, 003...).
-- Uses Supabase Auth (auth.users) as the identity source; this migration
-- adds the application-level tables that reference it.
-- ============================================================================

-- ---------- ROLES ----------
create type user_role as enum (
  'OBLIGATED_ENTITY',
  'VERIFIER',
  'TRADER',
  'AUDITOR',
  'REGISTRY_ADMIN',
  'SYSTEM_ADMIN'
);

-- ---------- ORGANIZATIONS ----------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_type text not null check (org_type in ('OBLIGATED_ENTITY', 'VERIFIER_AGENCY', 'TRADER', 'REGISTRY_ADMIN')),
  registration_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- USER PROFILES (extends auth.users) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null,
  organization_id uuid references organizations(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_organization on profiles(organization_id);
create index idx_profiles_role on profiles(role);

-- ---------- VERIFIER AGENCIES (subset of organizations, extra fields) ----------
create table verifier_agencies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  accreditation_id text not null unique,
  accreditation_body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- PLANTS ----------
create table plants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  sector text not null check (sector in ('Cement', 'Steel', 'Aluminium', 'Thermal Power', 'Chemicals', 'Other')),
  location text not null,
  state text not null,
  baseline_intensity numeric(10, 4),
  baseline_unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_plants_organization on plants(organization_id);

-- ---------- DATA SOURCES ----------
create table data_sources (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references plants(id) on delete cascade,
  name text not null,
  source_type text not null check (source_type in ('CSV_UPLOAD', 'API', 'SIMULATED_IOT', 'MANUAL_ENTRY')),
  status text not null default 'Idle' check (status in ('Online', 'Warning', 'Idle', 'Offline')),
  last_sync_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_data_sources_plant on data_sources(plant_id);

-- ---------- RAW MEASUREMENT RECORDS ----------
-- Individual ingested rows (from CSV/API/manual) prior to MRV calculation.
create table meter_readings (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references plants(id) on delete cascade,
  data_source_id uuid references data_sources(id) on delete set null,
  reading_type text not null check (reading_type in ('ELECTRICITY', 'FUEL', 'PRODUCTION', 'EMISSIONS_DIRECT')),
  reading_timestamp timestamptz not null,
  value numeric(18, 4) not null,
  unit text not null,
  uploaded_by uuid not null references profiles(id),
  batch_id uuid not null, -- groups readings uploaded together in one CSV import
  is_valid boolean not null default true,
  validation_notes text,
  created_at timestamptz not null default now()
);

create index idx_meter_readings_plant on meter_readings(plant_id);
create index idx_meter_readings_batch on meter_readings(batch_id);
create index idx_meter_readings_type_ts on meter_readings(reading_type, reading_timestamp);

-- Prevent exact duplicate rows within the same plant/type/timestamp
create unique index uq_meter_readings_dedup
  on meter_readings(plant_id, reading_type, reading_timestamp, data_source_id)
  where is_valid = true;

-- ============================================================================
-- Enable RLS everywhere (policies added in 004_rls_policies.sql)
-- ============================================================================
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table verifier_agencies enable row level security;
alter table plants enable row level security;
alter table data_sources enable row level security;
alter table meter_readings enable row level security;
