-- ═══════════════════════════════════════════════════════════
-- Store Hours — structured schedule + manual override
-- ═══════════════════════════════════════════════════════════

-- 1) Structured store hours per day of week
create table if not exists public.store_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week integer not null check (day_of_week between 0 and 6),
  is_closed boolean not null default false,
  ranges jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now(),
  unique(day_of_week)
);

-- 2) Manual open/close override (single row)
create table if not exists public.store_override (
  id uuid primary key default gen_random_uuid(),
  is_forced_closed boolean not null default false,
  reason text check (reason in ('break', 'emergency', 'staffing', 'other')),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- 3) Add timezone + cutoff to store_settings
insert into public.store_settings (id, key, value, updated_at)
values
  (gen_random_uuid(), 'timezone', 'America/New_York', now()),
  (gen_random_uuid(), 'last_order_cutoff_minutes', '0', now())
on conflict (key) do nothing;

-- 4) Seed default hours: Mon-Sat 7am-5pm, Sun 9am-3pm
insert into public.store_hours (day_of_week, is_closed, ranges) values
  (0, false, '[{"open":"09:00","close":"15:00"}]'::jsonb),
  (1, false, '[{"open":"07:00","close":"17:00"}]'::jsonb),
  (2, false, '[{"open":"07:00","close":"17:00"}]'::jsonb),
  (3, false, '[{"open":"07:00","close":"17:00"}]'::jsonb),
  (4, false, '[{"open":"07:00","close":"17:00"}]'::jsonb),
  (5, false, '[{"open":"07:00","close":"17:00"}]'::jsonb),
  (6, false, '[{"open":"07:00","close":"17:00"}]'::jsonb)
on conflict (day_of_week) do nothing;

-- 5) Seed single override row (not forced closed by default)
insert into public.store_override (is_forced_closed, reason)
values (false, null);

-- 6) RLS policies
alter table public.store_hours enable row level security;
alter table public.store_override enable row level security;

-- Anyone can read store hours
create policy "Anyone can view store hours"
  on public.store_hours for select using (true);

-- Only admins can modify store hours
create policy "Admins can manage store hours"
  on public.store_hours for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Anyone can read the override (needed by customer UI)
create policy "Anyone can view store override"
  on public.store_override for select using (true);

-- Staff and admins can toggle the override
create policy "Staff and admins can toggle store override"
  on public.store_override for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin'))
  );
