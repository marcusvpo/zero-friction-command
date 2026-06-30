import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Marcola Prime — Supabase client.
 * Reads the user-provided VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY.
 * When credentials are absent, exports a `null` client and `isSupabaseEnabled = false`
 * so the app falls back to local-only persistence (Zustand + localStorage).
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

export const isSupabaseEnabled = Boolean(url && key);

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/* ─────────────────────────── Table definitions (DDL) ───────────────────────────
 * Run the SQL in `supabase/marcola_schema.sql` on the project before first sync.
 * Tables:
 *   - routines          (id, owner, name, split, days jsonb, updated_at)
 *   - workout_logs      (id, owner, exercise_id, exercise_name, primary_muscle,
 *                        set_index, reps, weight, rpe, performed_at)
 *   - supplement_inventory (id, owner, name, remaining_days, total_days, tone, updated_at)
 *   - supplement_schedule  (id, owner, time, name, dose, note, tone, taken)
 * All tables use RLS scoped to auth.uid() = owner.
 * ─────────────────────────────────────────────────────────────────────────────── */

export async function getOwnerId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
