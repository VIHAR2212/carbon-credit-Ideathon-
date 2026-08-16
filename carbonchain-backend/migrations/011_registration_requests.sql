-- ============================================================================
-- CARBONCHAIN SCHEMA — Part 9: Pending Registration Requests
-- Captures company/factory details submitted at sign-up, before a registry
-- admin has assigned a role and organization. A fresh auth.users row has
-- no profiles row yet (profiles.organization_id is not-null), so this
-- gives the admin something concrete to review and act on.
-- ============================================================================

create table registration_requests (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  company_name text not null,
  facility_type text, -- e.g. Cement, Steel, Aluminium, Thermal Power, Verifier Agency, Trading Firm
  address_line text not null,
  city text not null,
  state text not null,
  requested_role text, -- what the applicant selected as their intended role
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);

create unique index uq_registration_requests_auth_user on registration_requests(auth_user_id);
create index idx_registration_requests_status on registration_requests(status);

alter table registration_requests enable row level security;

-- Applicants can read their own request (to see its status); everything
-- else (insert, and all admin actions) goes through the backend using
-- the service_role key, same pattern as the rest of the schema.
create policy "users read own registration request" on registration_requests
  for select using (auth_user_id = auth.uid());

create policy "admins read all registration requests" on registration_requests
  for select using (auth_role() in ('SYSTEM_ADMIN', 'REGISTRY_ADMIN'));
