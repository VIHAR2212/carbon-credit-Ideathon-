-- ============================================================================
-- CARBONCHAIN SCHEMA — Part 5: Marketplace, Retirement, Audit, Integrity
-- ============================================================================

-- ---------- ORDERS ----------
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique, -- e.g. ORD-2026-9918
  organization_id uuid not null references organizations(id),
  created_by uuid not null references profiles(id),
  side text not null check (side in ('BUY', 'SELL')),
  quantity int not null check (quantity > 0),
  quantity_filled int not null default 0,
  price_per_ccc numeric(12, 2) not null check (price_per_ccc > 0),
  status text not null default 'OPEN' check (
    status in ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_org on orders(organization_id);
create index idx_orders_status_side on orders(status, side);

-- Which specific CCCs are locked against a SELL order (many-to-many,
-- since one order can be filled from several credits).
create table order_locked_credits (
  order_id uuid not null references orders(id) on delete cascade,
  ccc_id text not null references carbon_credits(ccc_id),
  primary key (order_id, ccc_id)
);

-- ---------- TRADES ----------
create table trades (
  id uuid primary key default gen_random_uuid(),
  trade_number text not null unique,
  buy_order_id uuid not null references orders(id),
  sell_order_id uuid not null references orders(id),
  buyer_organization_id uuid not null references organizations(id),
  seller_organization_id uuid not null references organizations(id),
  quantity int not null check (quantity > 0),
  price_per_ccc numeric(12, 2) not null,
  total_value numeric(18, 2) not null,
  executed_at timestamptz not null default now(),
  constraint chk_no_self_trade check (buyer_organization_id <> seller_organization_id)
);

create index idx_trades_buyer on trades(buyer_organization_id);
create index idx_trades_seller on trades(seller_organization_id);

-- Which specific CCCs moved in a trade (settlement detail).
create table trade_settlements (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references trades(id) on delete cascade,
  ccc_id text not null references carbon_credits(ccc_id),
  created_at timestamptz not null default now()
);

create unique index uq_trade_settlement_ccc on trade_settlements(ccc_id, trade_id);

alter table carbon_credit_events
  add constraint fk_related_trade foreign key (related_trade_id) references trades(id);

-- ---------- RETIREMENTS ----------
create table retirements (
  id uuid primary key default gen_random_uuid(),
  retirement_number text not null unique, -- e.g. SUR-9901
  ccc_id text not null unique references carbon_credits(ccc_id), -- unique = can't retire twice
  organization_id uuid not null references organizations(id),
  requested_by uuid not null references profiles(id),
  reason text not null,
  status text not null default 'CONFIRMED' check (status in ('PENDING', 'CONFIRMED')),
  retired_at timestamptz not null default now()
);

alter table carbon_credit_events
  add constraint fk_related_retirement foreign key (related_retirement_id) references retirements(id);

-- ---------- AUDIT LOGS (append-only, immutable) ----------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references profiles(id),
  actor_organization_id uuid references organizations(id),
  actor_role user_role,
  action text not null, -- e.g. 'APPROVE_VERIFICATION', 'CCC_ISSUED'
  resource_type text not null,
  resource_id text not null,
  request_id text,
  previous_state jsonb,
  new_state jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_actor on audit_logs(actor_profile_id);
create index idx_audit_logs_resource on audit_logs(resource_type, resource_id);
create index idx_audit_logs_created on audit_logs(created_at desc);

revoke update, delete on audit_logs from authenticated, anon;

-- ---------- INTEGRITY ALERTS ----------
create table integrity_alerts (
  id uuid primary key default gen_random_uuid(),
  severity text not null check (severity in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  check_code text not null, -- e.g. 'DUPLICATE_SERIAL', 'RECONCILIATION_MISMATCH'
  resource_type text,
  resource_id text,
  reason text not null,
  expected_state jsonb,
  actual_state jsonb,
  status text not null default 'OPEN' check (status in ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references profiles(id),
  resolution_notes text
);

create index idx_integrity_alerts_status on integrity_alerts(status);

-- ---------- BLOCKCHAIN ANCHORS ----------
create table blockchain_anchors (
  id uuid primary key default gen_random_uuid(),
  anchor_type text not null check (anchor_type in ('ISSUANCE', 'TRANSFER', 'RETIREMENT', 'AUDIT_CHECKPOINT')),
  resource_type text not null,
  resource_id text not null,
  merkle_root text,
  content_hash text not null,
  tx_hash text,
  block_number bigint,
  network text not null default 'sepolia',
  status text not null default 'PENDING' check (status in ('PENDING', 'CONFIRMED', 'FAILED')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index idx_blockchain_anchors_resource on blockchain_anchors(resource_type, resource_id);

alter table orders enable row level security;
alter table order_locked_credits enable row level security;
alter table trades enable row level security;
alter table trade_settlements enable row level security;
alter table retirements enable row level security;
alter table audit_logs enable row level security;
alter table integrity_alerts enable row level security;
alter table blockchain_anchors enable row level security;
