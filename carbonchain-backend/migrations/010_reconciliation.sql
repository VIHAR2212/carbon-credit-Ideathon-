-- ============================================================================
-- CARBONCHAIN SCHEMA — Part 8: Reconciliation & Integrity Checks
-- ============================================================================

-- Total issued must always equal the sum across every valid current state.
-- Called periodically by the backend's integrity route; any mismatch is a
-- CRITICAL alert, never silently auto-corrected.
create or replace function reconcile_registry_supply()
returns table (
  total_issued bigint,
  available bigint,
  locked bigint,
  in_transfer bigint,
  frozen bigint,
  retired bigint,
  void_count bigint,
  reconciled boolean
) as $$
declare
  v_total bigint;
  v_available bigint;
  v_locked bigint;
  v_in_transfer bigint;
  v_frozen bigint;
  v_retired bigint;
  v_void bigint;
begin
  select count(*) into v_total from carbon_credits;
  select count(*) into v_available from carbon_credits where status = 'AVAILABLE';
  select count(*) into v_locked from carbon_credits where status = 'LOCKED';
  select count(*) into v_in_transfer from carbon_credits where status = 'IN_TRANSFER';
  select count(*) into v_frozen from carbon_credits where status = 'FROZEN';
  select count(*) into v_retired from carbon_credits where status = 'RETIRED';
  select count(*) into v_void from carbon_credits where status = 'VOID';

  return query select
    v_total, v_available, v_locked, v_in_transfer, v_frozen, v_retired, v_void,
    (v_total = v_available + v_locked + v_in_transfer + v_frozen + v_retired + v_void);
end;
$$ language plpgsql;

-- Runs a battery of integrity checks and returns any violations found.
-- Does NOT auto-fix anything — inserting into integrity_alerts is the
-- backend route's job, this function only detects.
create or replace function run_integrity_checks()
returns table (
  check_code text,
  severity text,
  resource_type text,
  resource_id text,
  reason text
) as $$
begin
  -- Duplicate CCC serials (should be impossible given the unique
  -- constraint, but checked here as defense-in-depth / early warning
  -- if the constraint were ever relaxed).
  return query
    select 'DUPLICATE_SERIAL'::text, 'CRITICAL'::text, 'carbon_credit'::text, ccc_id,
      'Duplicate ccc_id found in carbon_credits'::text
    from (select ccc_id, count(*) c from carbon_credits group by ccc_id having count(*) > 1) dup;

  -- Retired credits with any event after RETIRED that isn't itself a
  -- retirement — would indicate a bypass of the terminal-state trigger.
  return query
    select 'RETIRED_CREDIT_MOVED'::text, 'CRITICAL'::text, 'carbon_credit'::text, cc.ccc_id,
      'CCC is RETIRED but has events after retirement'::text
    from carbon_credits cc
    where cc.status = 'RETIRED'
      and exists (
        select 1 from carbon_credit_events e
        where e.ccc_id = cc.ccc_id and e.event_type <> 'RETIRED'
          and e.created_at > (select min(created_at) from carbon_credit_events e2 where e2.ccc_id = cc.ccc_id and e2.event_type = 'RETIRED')
      );

  -- Orphan locked-credit rows: locked in order_locked_credits but the
  -- credit itself isn't LOCKED.
  return query
    select 'ORPHAN_LOCK'::text, 'HIGH'::text, 'carbon_credit'::text, olc.ccc_id,
      'CCC is locked against an order but status is not LOCKED'::text
    from order_locked_credits olc
    join carbon_credits cc on cc.ccc_id = olc.ccc_id
    where cc.status <> 'LOCKED';

  -- Frozen credits that somehow have an open trade settlement.
  return query
    select 'FROZEN_CREDIT_TRADED'::text, 'CRITICAL'::text, 'carbon_credit'::text, cc.ccc_id,
      'CCC is FROZEN but has a trade settlement record'::text
    from carbon_credits cc
    join trade_settlements ts on ts.ccc_id = cc.ccc_id
    where cc.status = 'FROZEN';

  -- Reconciliation mismatch, surfaced as a row here too so one query
  -- (run_integrity_checks) covers everything the /api/integrity route needs.
  return query
    select 'RECONCILIATION_MISMATCH'::text, 'CRITICAL'::text, 'registry'::text, 'GLOBAL'::text,
      'Total issued does not equal the sum of all status buckets'::text
    where not (select reconciled from reconcile_registry_supply());
end;
$$ language plpgsql;
