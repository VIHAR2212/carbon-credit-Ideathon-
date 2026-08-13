-- Run this once in the Supabase SQL Editor (or via your migration tool).
-- Dedicated single-row table used purely to reset Supabase's inactivity
-- timer. Keeping it separate from real app tables means the keep-alive
-- job can never collide with actual data.

create table if not exists public._keep_alive (
  id integer primary key default 1,
  pinged_at timestamptz not null default now(),
  constraint _keep_alive_single_row check (id = 1)
);

insert into public._keep_alive (id, pinged_at)
values (1, now())
on conflict (id) do nothing;

-- Optional: restrict access so only the service role (used by the
-- backend) can touch this table, not anonymous/public clients.
alter table public._keep_alive enable row level security;

drop policy if exists "service role only" on public._keep_alive;
create policy "service role only"
  on public._keep_alive
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
