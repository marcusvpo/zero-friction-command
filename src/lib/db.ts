import { supabase, isSupabaseEnabled, getOwnerId } from "./supabase";
import type {
  Routine,
  InventoryItem,
  SupplementSlot,
  MuscleId,
} from "@/store/marcola";

/**
 * Repository — all reads/writes against Supabase. Functions are safe to call
 * when Supabase is not configured (they short-circuit with `null` / empty data
 * and the store falls back to its local seed + persisted state).
 */

export interface WorkoutLogRow {
  exercise_id: string;
  exercise_name: string;
  primary_muscle: MuscleId;
  set_index: number;
  reps: number;
  weight: number;
  rpe: number | null;
  performed_at: string;
}

/* ────────────────────────────── Routines ────────────────────────────── */

export async function saveRoutine(routine: Routine): Promise<boolean> {
  if (!isSupabaseEnabled || !supabase) return false;
  const owner = await getOwnerId();
  if (!owner) return false;

  const { error } = await supabase
    .from("routines")
    .upsert(
      {
        owner,
        name: routine.name,
        split: routine.split,
        days: routine.days,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner,name" },
    );
  return !error;
}

export async function fetchRoutine(): Promise<Routine | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const owner = await getOwnerId();
  if (!owner) return null;

  const { data, error } = await supabase
    .from("routines")
    .select("name, split, days")
    .eq("owner", owner)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return { name: data.name, split: data.split, days: data.days } as Routine;
}

/* ────────────────────────────── Workout logs ────────────────────────────── */

export async function pushWorkoutLog(row: WorkoutLogRow): Promise<boolean> {
  if (!isSupabaseEnabled || !supabase) return false;
  const owner = await getOwnerId();
  if (!owner) return false;

  const { error } = await supabase.from("workout_logs").insert({ owner, ...row });
  return !error;
}

export async function fetchRecentLogs(limit = 50): Promise<WorkoutLogRow[]> {
  if (!isSupabaseEnabled || !supabase) return [];
  const owner = await getOwnerId();
  if (!owner) return [];

  const { data, error } = await supabase
    .from("workout_logs")
    .select("exercise_id, exercise_name, primary_muscle, set_index, reps, weight, rpe, performed_at")
    .eq("owner", owner)
    .order("performed_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as WorkoutLogRow[];
}

/* ────────────────────────────── Supplement inventory ────────────────────────────── */

export async function fetchInventory(): Promise<InventoryItem[] | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const owner = await getOwnerId();
  if (!owner) return null;

  const { data, error } = await supabase
    .from("supplement_inventory")
    .select("id, name, remaining_days, total_days, tone")
    .eq("owner", owner)
    .order("name");

  if (error || !data) return null;
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    remaining: r.remaining_days,
    total: r.total_days,
    tone: r.tone,
  })) as InventoryItem[];
}

export async function upsertInventory(items: InventoryItem[]): Promise<boolean> {
  if (!isSupabaseEnabled || !supabase) return false;
  const owner = await getOwnerId();
  if (!owner) return false;

  const rows = items.map((i) => ({
    id: i.id,
    owner,
    name: i.name,
    remaining_days: i.remaining,
    total_days: i.total,
    tone: i.tone,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("supplement_inventory").upsert(rows);
  return !error;
}

/* ────────────────────────────── Supplement schedule ────────────────────────────── */

export async function fetchSchedule(): Promise<SupplementSlot[] | null> {
  if (!isSupabaseEnabled || !supabase) return null;
  const owner = await getOwnerId();
  if (!owner) return null;

  const { data, error } = await supabase
    .from("supplement_schedule")
    .select("id, time, name, dose, note, tone, taken")
    .eq("owner", owner)
    .order("time");

  if (error || !data) return null;
  return data as SupplementSlot[];
}

export async function setSupplementTaken(id: string, taken: boolean): Promise<boolean> {
  if (!isSupabaseEnabled || !supabase) return false;
  const owner = await getOwnerId();
  if (!owner) return false;

  const { error } = await supabase
    .from("supplement_schedule")
    .update({ taken })
    .eq("id", id)
    .eq("owner", owner);
  return !error;
}
