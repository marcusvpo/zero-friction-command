-- ───────────────────── MARCOLA PRIME · Phase 6 Schema ─────────────────────
-- Run this on your Supabase project AFTER marcola_schema.sql.

create extension if not exists "pgcrypto";

-- 1. OPERATOR_BIOMETRICS -----------------------------------------------------
-- Histórico de leituras biométricas (peso/altura) por operador.
-- A "leitura atual" é o registro mais recente (order by recorded_at desc).
create table if not exists public.operator_biometrics (
  id            uuid primary key default gen_random_uuid(),
  owner         uuid not null references auth.users(id) on delete cascade,
  weight_kg     numeric(5,2),
  height_cm     numeric(5,1),
  body_fat_pct  numeric(4,1),
  notes         text,
  recorded_at   timestamptz not null default now()
);
create index if not exists operator_biometrics_owner_ts
  on public.operator_biometrics(owner, recorded_at desc);
grant select, insert, update, delete on public.operator_biometrics to authenticated;
grant all on public.operator_biometrics to service_role;
alter table public.operator_biometrics enable row level security;
drop policy if exists "owner read bio"  on public.operator_biometrics;
create policy "owner read bio"  on public.operator_biometrics for select using (auth.uid() = owner);
drop policy if exists "owner write bio" on public.operator_biometrics;
create policy "owner write bio" on public.operator_biometrics for all
  using (auth.uid() = owner) with check (auth.uid() = owner);

-- 2. PR_ACHIEVEMENTS ---------------------------------------------------------
-- Medalhas táticas: maior peso já levantado por exercício (por owner).
-- Pode ser populado por trigger sobre workout_logs ou recalculado client-side.
create table if not exists public.pr_achievements (
  id              uuid primary key default gen_random_uuid(),
  owner           uuid not null references auth.users(id) on delete cascade,
  exercise_id     text not null,
  exercise_name   text not null,
  primary_muscle  text not null,
  weight          numeric not null,
  reps            int    not null,
  achieved_at     timestamptz not null default now(),
  unique (owner, exercise_id)
);
create index if not exists pr_achievements_owner_weight
  on public.pr_achievements(owner, weight desc);
grant select, insert, update, delete on public.pr_achievements to authenticated;
grant all on public.pr_achievements to service_role;
alter table public.pr_achievements enable row level security;
drop policy if exists "owner read prs"  on public.pr_achievements;
create policy "owner read prs"  on public.pr_achievements for select using (auth.uid() = owner);
drop policy if exists "owner write prs" on public.pr_achievements;
create policy "owner write prs" on public.pr_achievements for all
  using (auth.uid() = owner) with check (auth.uid() = owner);

-- 3. Helper view: latest biometric per owner ---------------------------------
create or replace view public.operator_biometrics_latest as
select distinct on (owner)
  owner, weight_kg, height_cm, body_fat_pct, recorded_at
from public.operator_biometrics
order by owner, recorded_at desc;
grant select on public.operator_biometrics_latest to authenticated;
grant select on public.operator_biometrics_latest to service_role;

-- 4. Auto-PR trigger (opcional) ----------------------------------------------
-- Atualiza pr_achievements sempre que um workout_logs insere peso superior.
create or replace function public.upsert_pr_from_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pr_achievements
    (owner, exercise_id, exercise_name, primary_muscle, weight, reps, achieved_at)
  values
    (new.owner, new.exercise_id, new.exercise_name, new.primary_muscle,
     new.weight, new.reps, new.performed_at)
  on conflict (owner, exercise_id) do update
    set weight = excluded.weight,
        reps = excluded.reps,
        exercise_name = excluded.exercise_name,
        primary_muscle = excluded.primary_muscle,
        achieved_at = excluded.achieved_at
    where excluded.weight > pr_achievements.weight;
  return new;
end;
$$;

drop trigger if exists trg_upsert_pr on public.workout_logs;
create trigger trg_upsert_pr
after insert on public.workout_logs
for each row execute function public.upsert_pr_from_log();
