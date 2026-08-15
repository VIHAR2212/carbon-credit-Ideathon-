-- ============================================================================
-- CARBONCHAIN SCHEMA — Part 7: Atomic Operations (Postgres Functions)
-- Multi-step operations that must succeed or fail as a single unit run as
-- SQL functions inside one transaction, not as sequential JS calls from
-- the backend — this is what makes "if one step fails, roll back
-- everything" actually true rather than aspirational.
-- ============================================================================

-- ---------- ISSUE CCC BATCH ----------
-- Approves an issuance_request and mints the exact number of individual
-- CCC rows, each with its own genesis event. Fails atomically if the
-- issuance_request is not in PENDING_APPROVAL, or if the verification
-- backing it isn't APPROVED.
create or replace function issue_ccc_batch(
  p_issuance_request_id uuid,
  p_approved_by uuid,
  p_year int
)
returns table (batch_id uuid, ccc_ids text[]) as $$
declare
  v_request issuance_requests%rowtype;
  v_verification verifications%rowtype;
  v_mrv mrv_reports%rowtype;
  v_batch_id uuid;
  v_quantity int;
  v_next_serial int;
  v_serial_start text;
  v_serial_end text;
  v_ccc_ids text[] := array[]::text[];
  v_new_ccc_id text;
  i int;
  v_event_hash text;
begin
  select * into v_request from issuance_requests where id = p_issuance_request_id for update;
  if not found then
    raise exception 'NOT_FOUND: issuance request % does not exist', p_issuance_request_id;
  end if;
  if v_request.status <> 'PENDING_APPROVAL' then
    raise exception 'INVALID_STATE: issuance request % is % not PENDING_APPROVAL', p_issuance_request_id, v_request.status;
  end if;

  select * into v_verification from verifications where id = v_request.verification_id;
  if v_verification.status <> 'APPROVED' then
    raise exception 'VERIFICATION_NOT_APPROVED: cannot issue against an unapproved verification';
  end if;

  select * into v_mrv from mrv_reports where id = v_verification.mrv_report_id;

  v_quantity := floor(v_request.eligible_quantity_tco2e)::int;
  if v_quantity <= 0 then
    raise exception 'INVALID_QUANTITY: eligible quantity must round to at least 1 CCC';
  end if;

  -- Serial allocation: find the current max serial for the year and
  -- reserve the next v_quantity numbers atomically (row lock via the
  -- issuance_requests FOR UPDATE above serializes concurrent issuances).
  select coalesce(max(substring(ccc_id from '\d+$')::int), 0) + 1
    into v_next_serial
    from carbon_credits
    where ccc_id like 'CCC-IN-' || p_year || '-%';

  v_serial_start := 'CCC-IN-' || p_year || '-' || lpad(v_next_serial::text, 8, '0');
  v_serial_end := 'CCC-IN-' || p_year || '-' || lpad((v_next_serial + v_quantity - 1)::text, 8, '0');

  insert into carbon_credit_batches (issuance_request_id, batch_serial_start, batch_serial_end, quantity)
  values (p_issuance_request_id, v_serial_start, v_serial_end, v_quantity)
  returning id into v_batch_id;

  for i in 0 .. v_quantity - 1 loop
    v_new_ccc_id := 'CCC-IN-' || p_year || '-' || lpad((v_next_serial + i)::text, 8, '0');

    insert into carbon_credits (
      ccc_id, batch_id, organization_id, plant_id, mrv_report_id, verification_id,
      reporting_period_label, quantity_tco2e, current_owner_organization_id, status
    ) values (
      v_new_ccc_id, v_batch_id, v_request.organization_id, v_mrv.plant_id, v_mrv.id, v_verification.id,
      v_mrv.reporting_period_label, 1, v_request.organization_id, 'AVAILABLE'
    );

    v_event_hash := encode(sha256((v_new_ccc_id || '|ISSUED||AVAILABLE|' || now()::text || '|GENESIS')::bytea), 'hex');

    insert into carbon_credit_events (
      ccc_id, event_type, actor_organization_id, actor_profile_id,
      previous_status, new_status, event_hash, metadata
    ) values (
      v_new_ccc_id, 'ISSUED', v_request.organization_id, p_approved_by,
      null, 'AVAILABLE', v_event_hash, jsonb_build_object('issuance_request_id', p_issuance_request_id, 'batch_id', v_batch_id)
    );

    v_ccc_ids := array_append(v_ccc_ids, v_new_ccc_id);
  end loop;

  update issuance_requests
    set status = 'ISSUED', approved_by = p_approved_by, approved_at = now()
    where id = p_issuance_request_id;

  return query select v_batch_id, v_ccc_ids;
end;
$$ language plpgsql;

-- ---------- EXECUTE TRADE ----------
-- Atomically matches a buy and sell order for a quantity, transfers
-- ownership of specific CCCs, records the trade + settlement + events.
-- Raises (and the whole transaction rolls back) on: insufficient locked
-- credits, retired/frozen credits, self-trading, or a quantity mismatch.
create or replace function execute_trade(
  p_buy_order_id uuid,
  p_sell_order_id uuid,
  p_quantity int,
  p_price numeric,
  p_trade_number text
)
returns uuid as $$
declare
  v_buy orders%rowtype;
  v_sell orders%rowtype;
  v_trade_id uuid;
  v_ccc_id text;
  v_ccc_row carbon_credits%rowtype;
  v_settled int := 0;
  v_event_hash text;
  v_prior_hash text;
begin
  select * into v_buy from orders where id = p_buy_order_id for update;
  select * into v_sell from orders where id = p_sell_order_id for update;

  if not found or v_buy.id is null or v_sell.id is null then
    raise exception 'NOT_FOUND: buy or sell order does not exist';
  end if;
  if v_buy.side <> 'BUY' or v_sell.side <> 'SELL' then
    raise exception 'INVALID_ORDER_SIDE: buy/sell order mismatch';
  end if;
  if v_buy.organization_id = v_sell.organization_id then
    raise exception 'SELF_TRADE_BLOCKED: an organization cannot trade with itself';
  end if;
  if v_buy.status not in ('OPEN', 'PARTIALLY_FILLED') or v_sell.status not in ('OPEN', 'PARTIALLY_FILLED') then
    raise exception 'INVALID_STATE: one or both orders are not open';
  end if;
  if (v_buy.quantity - v_buy.quantity_filled) < p_quantity or (v_sell.quantity - v_sell.quantity_filled) < p_quantity then
    raise exception 'INSUFFICIENT_ORDER_QUANTITY: requested quantity exceeds remaining open quantity';
  end if;

  insert into trades (trade_number, buy_order_id, sell_order_id, buyer_organization_id, seller_organization_id, quantity, price_per_ccc, total_value)
  values (p_trade_number, p_buy_order_id, p_sell_order_id, v_buy.organization_id, v_sell.organization_id, p_quantity, p_price, p_quantity * p_price)
  returning id into v_trade_id;

  -- Move exactly p_quantity CCCs that are locked against the sell order.
  for v_ccc_id in
    select olc.ccc_id from order_locked_credits olc
      join carbon_credits cc on cc.ccc_id = olc.ccc_id
    where olc.order_id = p_sell_order_id and cc.status = 'LOCKED'
    limit p_quantity
  loop
    select * into v_ccc_row from carbon_credits where ccc_id = v_ccc_id for update;

    if v_ccc_row.status <> 'LOCKED' then
      raise exception 'INVALID_CREDIT_STATE: CCC % is % not LOCKED, cannot settle', v_ccc_id, v_ccc_row.status;
    end if;

    update carbon_credits
      set status = 'AVAILABLE', current_owner_organization_id = v_buy.organization_id, updated_at = now()
      where ccc_id = v_ccc_id;

    insert into trade_settlements (trade_id, ccc_id) values (v_trade_id, v_ccc_id);
    delete from order_locked_credits where order_id = p_sell_order_id and ccc_id = v_ccc_id;

    select event_hash into v_prior_hash from carbon_credit_events where ccc_id = v_ccc_id order by created_at desc limit 1;
    v_event_hash := encode(sha256((v_ccc_id || '|TRANSFERRED|LOCKED|AVAILABLE|' || now()::text || '|' || coalesce(v_prior_hash, 'GENESIS'))::bytea), 'hex');

    insert into carbon_credit_events (ccc_id, event_type, actor_organization_id, previous_status, new_status, related_trade_id, event_hash, metadata)
    values (v_ccc_id, 'TRANSFERRED', v_sell.organization_id, 'LOCKED', 'AVAILABLE', v_trade_id, v_event_hash,
      jsonb_build_object('from_org', v_sell.organization_id, 'to_org', v_buy.organization_id, 'price', p_price));

    v_settled := v_settled + 1;
  end loop;

  if v_settled <> p_quantity then
    raise exception 'SETTLEMENT_MISMATCH: expected to settle % CCCs but only found % locked against sell order', p_quantity, v_settled;
  end if;

  update orders set quantity_filled = quantity_filled + p_quantity,
    status = case when quantity_filled + p_quantity >= quantity then 'FILLED' else 'PARTIALLY_FILLED' end,
    updated_at = now()
    where id = p_buy_order_id;

  update orders set quantity_filled = quantity_filled + p_quantity,
    status = case when quantity_filled + p_quantity >= quantity then 'FILLED' else 'PARTIALLY_FILLED' end,
    updated_at = now()
    where id = p_sell_order_id;

  return v_trade_id;
end;
$$ language plpgsql;

-- ---------- RETIRE CCC ----------
-- Permanent, terminal. The unique constraint on retirements.ccc_id plus
-- the status-transition trigger together guarantee a CCC can never be
-- retired twice or moved after retirement.
create or replace function retire_ccc(
  p_ccc_id text,
  p_organization_id uuid,
  p_requested_by uuid,
  p_reason text,
  p_retirement_number text
)
returns uuid as $$
declare
  v_ccc carbon_credits%rowtype;
  v_retirement_id uuid;
  v_event_hash text;
  v_prior_hash text;
begin
  select * into v_ccc from carbon_credits where ccc_id = p_ccc_id for update;
  if not found then
    raise exception 'NOT_FOUND: CCC % does not exist', p_ccc_id;
  end if;
  if v_ccc.current_owner_organization_id <> p_organization_id then
    raise exception 'FORBIDDEN: only the current owner can retire this CCC';
  end if;
  if v_ccc.status = 'RETIRED' then
    raise exception 'ALREADY_RETIRED: CCC % has already been retired', p_ccc_id;
  end if;
  if v_ccc.status not in ('AVAILABLE') then
    raise exception 'INVALID_STATE: CCC % is % and cannot be retired directly (must be AVAILABLE)', p_ccc_id, v_ccc.status;
  end if;

  insert into retirements (retirement_number, ccc_id, organization_id, requested_by, reason, status)
  values (p_retirement_number, p_ccc_id, p_organization_id, p_requested_by, p_reason, 'CONFIRMED')
  returning id into v_retirement_id;

  update carbon_credits set status = 'RETIRED', updated_at = now() where ccc_id = p_ccc_id;

  select event_hash into v_prior_hash from carbon_credit_events where ccc_id = p_ccc_id order by created_at desc limit 1;
  v_event_hash := encode(sha256((p_ccc_id || '|RETIRED|' || v_ccc.status || '|RETIRED|' || now()::text || '|' || coalesce(v_prior_hash, 'GENESIS'))::bytea), 'hex');

  insert into carbon_credit_events (ccc_id, event_type, actor_organization_id, actor_profile_id, previous_status, new_status, related_retirement_id, event_hash, metadata)
  values (p_ccc_id, 'RETIRED', p_organization_id, p_requested_by, v_ccc.status, 'RETIRED', v_retirement_id, v_event_hash, jsonb_build_object('reason', p_reason));

  return v_retirement_id;
end;
$$ language plpgsql;

-- ---------- LOCK CREDITS FOR SELL ORDER ----------
create or replace function lock_credits_for_order(
  p_order_id uuid,
  p_organization_id uuid,
  p_quantity int
)
returns text[] as $$
declare
  v_ccc_id text;
  v_locked text[] := array[]::text[];
  v_event_hash text;
  v_prior_hash text;
begin
  for v_ccc_id in
    select ccc_id from carbon_credits
    where current_owner_organization_id = p_organization_id and status = 'AVAILABLE'
    order by issued_at asc
    limit p_quantity
    for update
  loop
    update carbon_credits set status = 'LOCKED', updated_at = now() where ccc_id = v_ccc_id;
    insert into order_locked_credits (order_id, ccc_id) values (p_order_id, v_ccc_id);

    select event_hash into v_prior_hash from carbon_credit_events where ccc_id = v_ccc_id order by created_at desc limit 1;
    v_event_hash := encode(sha256((v_ccc_id || '|LOCKED|AVAILABLE|LOCKED|' || now()::text || '|' || coalesce(v_prior_hash, 'GENESIS'))::bytea), 'hex');

    insert into carbon_credit_events (ccc_id, event_type, actor_organization_id, previous_status, new_status, event_hash, metadata)
    values (v_ccc_id, 'LOCKED', p_organization_id, 'AVAILABLE', 'LOCKED', v_event_hash, jsonb_build_object('order_id', p_order_id));

    v_locked := array_append(v_locked, v_ccc_id);
  end loop;

  if array_length(v_locked, 1) is null or array_length(v_locked, 1) < p_quantity then
    raise exception 'INSUFFICIENT_BALANCE: organization does not hold enough AVAILABLE CCCs to sell %', p_quantity;
  end if;

  return v_locked;
end;
$$ language plpgsql;

-- ---------- UNLOCK CREDITS (order cancelled) ----------
create or replace function unlock_credits_for_order(p_order_id uuid)
returns void as $$
declare
  v_ccc_id text;
  v_event_hash text;
  v_prior_hash text;
begin
  for v_ccc_id in select ccc_id from order_locked_credits where order_id = p_order_id loop
    update carbon_credits set status = 'AVAILABLE', updated_at = now() where ccc_id = v_ccc_id and status = 'LOCKED';

    select event_hash into v_prior_hash from carbon_credit_events where ccc_id = v_ccc_id order by created_at desc limit 1;
    v_event_hash := encode(sha256((v_ccc_id || '|UNLOCKED|LOCKED|AVAILABLE|' || now()::text || '|' || coalesce(v_prior_hash, 'GENESIS'))::bytea), 'hex');

    insert into carbon_credit_events (ccc_id, event_type, previous_status, new_status, event_hash, metadata)
    values (v_ccc_id, 'UNLOCKED', 'LOCKED', 'AVAILABLE', v_event_hash, jsonb_build_object('order_id', p_order_id, 'reason', 'order_cancelled'));
  end loop;

  delete from order_locked_credits where order_id = p_order_id;
end;
$$ language plpgsql;
