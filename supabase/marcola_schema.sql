-- ───────────────────────── MARCOLA PRIME · Schema ─────────────────────────
-- Apply this on your Supabase project once (SQL Editor).
-- All tables are owner-scoped via auth.uid().

create extension if not exists "pgcrypto";

-- 1. ROUTINES ----------------------------------------------------------------
create table if not exists public.routines (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  split       text not null,
  days        jsonb not null,
  updated_at  timestamptz not null default now(),
  unique (owner, name)
);
grant select, insert, update, delete on public.routines to authenticated;
grant all on public.routines to service_role;
alter table public.routines enable row level security;
drop policy if exists "owner read routines" on public.routines;
create policy "owner read routines"   on public.routines for select using (auth.uid() = owner);
drop policy if exists "owner write routines" on public.routines;
create policy "owner write routines"  on public.routines for all
  using (auth.uid() = owner) with check (auth.uid() = owner);

-- 2. WORKOUT_LOGS ------------------------------------------------------------
create table if not exists public.workout_logs (
  id              uuid primary key default gen_random_uuid(),
  owner           uuid not null references auth.users(id) on delete cascade,
  exercise_id     text not null,
  exercise_name   text not null,
  primary_muscle  text not null,
  set_index       int  not null,
  reps            int  not null,
  weight          numeric not null,
  rpe             numeric,
  performed_at    timestamptz not null default now()
);
create index if not exists workout_logs_owner_ts on public.workout_logs(owner, performed_at desc);
grant select, insert, update, delete on public.workout_logs to authenticated;
grant all on public.workout_logs to service_role;
alter table public.workout_logs enable row level security;
drop policy if exists "owner read logs"  on public.workout_logs;
create policy "owner read logs"  on public.workout_logs for select using (auth.uid() = owner);
drop policy if exists "owner write logs" on public.workout_logs;
create policy "owner write logs" on public.workout_logs for all
  using (auth.uid() = owner) with check (auth.uid() = owner);

-- 3. SUPPLEMENT_INVENTORY ----------------------------------------------------
create table if not exists public.supplement_inventory (
  id              text primary key,
  owner           uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  remaining_days  int  not null,
  total_days      int  not null,
  tone            text not null default 'cyan',
  updated_at      timestamptz not null default now()
);
grant select, insert, update, delete on public.supplement_inventory to authenticated;
grant all on public.supplement_inventory to service_role;
alter table public.supplement_inventory enable row level security;
drop policy if exists "owner read inv"  on public.supplement_inventory;
create policy "owner read inv"  on public.supplement_inventory for select using (auth.uid() = owner);
drop policy if exists "owner write inv" on public.supplement_inventory;
create policy "owner write inv" on public.supplement_inventory for all
  using (auth.uid() = owner) with check (auth.uid() = owner);

-- 4. SUPPLEMENT_SCHEDULE -----------------------------------------------------
create table if not exists public.supplement_schedule (
  id     text primary key,
  owner  uuid not null references auth.users(id) on delete cascade,
  time   text not null,
  name   text not null,
  dose   text not null,
  note   text,
  tone   text not null default 'cyan',
  taken  boolean not null default false
);
grant select, insert, update, delete on public.supplement_schedule to authenticated;
grant all on public.supplement_schedule to service_role;
alter table public.supplement_schedule enable row level security;
drop policy if exists "owner read sched"  on public.supplement_schedule;
create policy "owner read sched"  on public.supplement_schedule for select using (auth.uid() = owner);
drop policy if exists "owner write sched" on public.supplement_schedule;
create policy "owner write sched" on public.supplement_schedule for all
  using (auth.uid() = owner) with check (auth.uid() = owner);
