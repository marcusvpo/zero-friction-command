import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  saveRoutine,
  fetchRoutine,
  fetchRecentLogs,
  fetchInventory,
  fetchSchedule,
  setSupplementTaken,
  fetchWeeklyVolume as fetchWeeklyVolumeRemote,
  type WorkoutLogRow,
} from "@/lib/db";
import { isSupabaseEnabled, supabase, getOwnerId } from "@/lib/supabase";
import { getLibraryExercise } from "@/lib/exercise-library";
import { enqueueWorkoutLog } from "@/lib/sync-queue";

/* ─────────────────────────────── Types ─────────────────────────────── */

export type MuscleId =
  | "chest" | "shoulders" | "biceps" | "triceps" | "forearms"
  | "core" | "obliques" | "quads" | "hamstrings" | "glutes"
  | "calves" | "lats" | "traps" | "lower-back" | "neck";

export type Tone = "cyan" | "matrix" | "amber" | "danger";

export interface ExerciseSet {
  reps: number;
  weight: number;
  rpe?: number;
  completed: boolean;
  /** Marks warm-up set: excluded from tonelagem & weekly volume. */
  isWarmup?: boolean;
  /** Per-set rest override (fallback: exercise.restSeconds). */
  restSeconds?: number;
  notes?: string;
}
export interface Exercise {
  id: string; name: string; primary: MuscleId; secondary?: MuscleId[];
  sets: ExerciseSet[]; restSeconds: number;
  tempo?: string; targetRPE?: number; notes?: string;
  /** Optional pointer to the library entry this exercise came from. */
  libraryId?: string;
}
export interface WorkoutDay {
  id: string; code: string; name: string; focus: string; exercises: Exercise[];
}
export interface Routine {
  name: string; split: "PPL" | "UPPER/LOWER" | "BRO" | "FULL"; days: WorkoutDay[];
}
export interface SupplementSlot {
  id: string; time: string; name: string; dose: string; note?: string; tone: Tone; taken: boolean;
}
export interface InventoryItem {
  id: string; name: string; remaining: number; total: number; tone: Tone;
}
export interface ActiveWorkout {
  dayId: string | null; exerciseIndex: number; setIndex: number;
  startedAt: number | null; finishedAt: number | null;
  /** When set, session is paused. Resume() adds (now - pausedAt) to totalPausedMs. */
  pausedAt: number | null;
  totalPausedMs: number;
  log: { exerciseId: string; setIndex: number; weight: number; reps: number; ts: number; isWarmup?: boolean }[];
}
export interface RestTimer { active: boolean; remaining: number; total: number; }
export type WeekdayMap = Record<number, string | null>;

export interface SessionSummary {
  durationMs: number;
  tonnageKg: number;
  setsCompleted: number;
  warmupSets: number;
  prs: { exerciseId: string; exerciseName: string; weight: number; reps: number }[];
}

/** Persistido por libraryId. Quando hiddenUntil > now → saturado. */
export interface SaturationEntry { hiddenUntil: number; markedAt: number; weeks: number }
export interface RatingOverride {
  stars: number; rationale: string; source: "deep-research"; updatedAt: string;
}

export interface Biometrics {
  weightKg: number | null;
  heightCm: number | null;
  weightUpdatedAt: string | null; // ISO
}

export interface PRMedal {
  exerciseId: string;
  exerciseName: string;
  primary: MuscleId;
  weight: number;
  reps: number;
}

export interface OverloadSuggestion {
  weight: number;
  reps: number;
  deltaKg: number;
  reason: "first-time" | "increase-load" | "increase-reps" | "hold";
  label: string;
}

export interface SessionTelemetry {
  volumeKg: number;
  sets: number;
  isLive: boolean;
}


const COMPOUND_MUSCLES = new Set<MuscleId>([
  "chest", "quads", "lats", "glutes", "hamstrings", "lower-back",
]);

export const WEEKDAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
export const WEEKDAY_LONG  = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

/* ───────────────────── Seed Data (PPL×2 + LEGS — Operador) ───────────────────── */

const mkSet = (reps = 10, weight = 0): ExerciseSet => ({ reps, weight, completed: false });
const mkSets3 = (reps = 10, weight = 0): ExerciseSet[] => [mkSet(reps, weight), mkSet(reps, weight), mkSet(reps, weight)];

// Bloco de esteira reaproveitável (15min · 6.5 km/h · 3-6% inclinação).
const cardioExercise = (idSuffix: string): Exercise => ({
  id: `cardio-${idSuffix}`,
  name: "Esteira Caminhada Inclinada",
  primary: "calves",
  secondary: ["glutes", "hamstrings", "quads"],
  restSeconds: 0,
  tempo: "constante",
  libraryId: "lib-esteira-caminhada-inclinada",
  // Único "set" representando o bloco — peso=0, reps=15 (minutos).
  sets: [{ reps: 15, weight: 0, completed: false }],
  notes: "15min · 6.5 km/h · inclinação 3→6%",
});

const pushExercises = (suffix: string): Exercise[] => [
  { id: `px-${suffix}-1`, name: "Supino Reto Máquina (Anilhas)", primary: "chest", secondary: ["shoulders","triceps"], restSeconds: 90, tempo: "2-1-2-0", libraryId: "lib-supino-maquina", sets: mkSets3(10, 0) },
  { id: `px-${suffix}-2`, name: "Fly Máquina (Peck Deck)", primary: "chest", restSeconds: 75, tempo: "2-1-2-1", libraryId: "lib-voador-peck-deck", sets: mkSets3(10, 0) },
  { id: `px-${suffix}-3`, name: "Supino Inclinado Halter", primary: "chest", secondary: ["shoulders"], restSeconds: 90, tempo: "3-1-1-0", libraryId: "lib-supino-inclinado-halter", sets: mkSets3(10, 0) },
  { id: `px-${suffix}-4`, name: "Wide Chest Press Máquina", primary: "chest", secondary: ["shoulders","triceps"], restSeconds: 90, tempo: "2-1-2-0", libraryId: "lib-wide-chest-press-maquina", sets: mkSets3(10, 0) },
  { id: `px-${suffix}-5`, name: "Desenvolvimento Máquina", primary: "shoulders", secondary: ["triceps"], restSeconds: 90, tempo: "2-1-1-0", libraryId: "lib-desenvolvimento-maquina", sets: mkSets3(10, 0) },
  { id: `px-${suffix}-6`, name: "Tríceps Corda Polia", primary: "triceps", restSeconds: 60, tempo: "2-1-2-0", libraryId: "lib-triceps-corda", sets: mkSets3(10, 0) },
  { id: `px-${suffix}-7`, name: "Tríceps Francês Polia (Corda)", primary: "triceps", restSeconds: 60, tempo: "3-1-1-0", libraryId: "lib-triceps-overhead-corda", sets: mkSets3(10, 0) },
  { id: `px-${suffix}-8`, name: "Tríceps Press Máquina", primary: "triceps", restSeconds: 60, tempo: "2-1-2-0", libraryId: "lib-triceps-press-maquina", sets: mkSets3(10, 0) },
];

const pullExercises = (suffix: string): Exercise[] => [
  { id: `pl-${suffix}-1`, name: "Lat Pulldown Aberta (Wide)", primary: "lats", secondary: ["biceps"], restSeconds: 90, tempo: "2-1-2-0", libraryId: "lib-pulldown", sets: mkSets3(10, 0) },
  { id: `pl-${suffix}-2`, name: "Remada Máquina (Seated Row)", primary: "lats", secondary: ["traps","biceps"], restSeconds: 90, tempo: "2-1-2-0", libraryId: "lib-remada-sentada-maquina", sets: mkSets3(10, 0) },
  { id: `pl-${suffix}-3`, name: "Lat Pulldown Pegada Fechada", primary: "lats", secondary: ["biceps"], restSeconds: 90, tempo: "2-1-2-0", libraryId: "lib-pulldown-neutro", sets: mkSets3(10, 0) },
  { id: `pl-${suffix}-4`, name: "Pulldown Corda Polia (Braço Reto)", primary: "lats", restSeconds: 60, tempo: "2-1-2-0", libraryId: "lib-pulldown-straight-arm", sets: mkSets3(10, 0) },
  { id: `pl-${suffix}-5`, name: "Rosca Corda Polia", primary: "biceps", secondary: ["forearms"], restSeconds: 60, tempo: "2-1-2-0", libraryId: "lib-rosca-corda-polia", sets: mkSets3(10, 0) },
  { id: `pl-${suffix}-6`, name: "Rosca Scott", primary: "biceps", restSeconds: 75, tempo: "2-1-2-0", libraryId: "lib-rosca-scott", sets: mkSets3(10, 0) },
  { id: `pl-${suffix}-7`, name: "Rosca Inversa Barra Polia", primary: "forearms", secondary: ["biceps"], restSeconds: 60, tempo: "2-1-2-0", libraryId: "lib-rosca-w-invertida-polia", sets: mkSets3(10, 0) },
];

const legsExercises = (): Exercise[] => [
  { id: "lg-1", name: "Cadeira Extensora", primary: "quads", restSeconds: 75, tempo: "2-1-2-1", libraryId: "lib-cadeira-extensora", sets: mkSets3(10, 0) },
  { id: "lg-2", name: "Mesa Flexora", primary: "hamstrings", secondary: ["glutes"], restSeconds: 75, tempo: "2-1-2-1", libraryId: "lib-mesa-flexora", sets: mkSets3(10, 0) },
  { id: "lg-3", name: "Seated Leg Press", primary: "quads", secondary: ["glutes","hamstrings"], restSeconds: 120, tempo: "2-1-2-0", libraryId: "lib-leg-press-45", sets: mkSets3(10, 0) },
  { id: "lg-4", name: "Hack Squat (Agachamento Smith)", primary: "quads", secondary: ["glutes","hamstrings"], restSeconds: 120, tempo: "3-1-1-0", libraryId: "lib-hack-squat", sets: mkSets3(10, 0), notes: "Anotado como hack squat — confirmar com operador se for ombros" },
  { id: "lg-5", name: "Elevação Lateral", primary: "shoulders", restSeconds: 60, tempo: "2-0-2-1", libraryId: "lib-elevacao-lateral", sets: mkSets3(10, 0) },
  { id: "lg-6", name: "Remada Alta Polia Baixa", primary: "shoulders", secondary: ["traps","biceps"], restSeconds: 75, tempo: "2-1-1-0", libraryId: "lib-remada-alta-polia", sets: mkSets3(10, 0) },
];

const absExercises = (suffix: string): Exercise[] => [
  { id: `abs-${suffix}-1`, name: "Abdominal Cabo Ajoelhado", primary: "core", restSeconds: 45, tempo: "2-1-2-0", libraryId: "lib-cable-crunch", sets: mkSets3(15, 0) },
  { id: `abs-${suffix}-2`, name: "Prancha Abdominal", primary: "core", secondary: ["obliques"], restSeconds: 45, tempo: "isométrico", libraryId: "lib-prancha-abdominal", sets: [mkSet(45, 0), mkSet(45, 0), mkSet(60, 0)] },
  { id: `abs-${suffix}-3`, name: "Russian Twist", primary: "obliques", secondary: ["core"], restSeconds: 45, tempo: "1-0-1-0", libraryId: "lib-russian-twist", sets: mkSets3(15, 0) },
];

const seedRoutine: Routine = {
  name: "Operador · PPL×2 + Legs", split: "PPL",
  days: [
    {
      id: "d-push-a", code: "PSH-A", name: "PUSH · Segunda",
      focus: "Peito · Ombros · Tríceps + Esteira",
      exercises: [...pushExercises("a"), cardioExercise("push-a")],
    },
    {
      id: "d-pull-a", code: "PUL-A", name: "PULL + ABS · Terça",
      focus: "Costas · Bíceps · Antebraço · Abdômen + Esteira",
      exercises: [...pullExercises("a"), ...absExercises("a"), cardioExercise("pull-a")],
    },
    {
      id: "d-legs", code: "LEGS", name: "LEGS · Quarta",
      focus: "Quadríceps · Posterior · Glúteo · Ombros + Esteira",
      exercises: [...legsExercises(), cardioExercise("legs")],
    },
    {
      id: "d-push-b", code: "PSH-B", name: "PUSH + ABS · Quinta",
      focus: "Peito · Ombros · Tríceps · Abdômen + Esteira",
      exercises: [...pushExercises("b"), ...absExercises("b"), cardioExercise("push-b")],
    },
    {
      id: "d-pull-b", code: "PUL-B", name: "PULL · Sexta",
      focus: "Costas · Bíceps · Antebraço + Esteira",
      exercises: [...pullExercises("b"), cardioExercise("pull-b")],
    },
  ],
};

const seedSchedule: SupplementSlot[] = [
  { id: "s1", time: "08:00", name: "Creatina Monohidratada", dose: "5g", note: "Micronizada", tone: "cyan", taken: false },
  { id: "s2", time: "18:30", name: "Whey Protein", dose: "30g + 250ml H₂O", tone: "matrix", taken: false },
];

const seedInventory: InventoryItem[] = [
  { id: "i1", name: "WHEY",     remaining: 30, total: 30, tone: "matrix" },
  { id: "i2", name: "CREATINA", remaining: 60, total: 60, tone: "cyan" },
];

const ZERO_MUSCLE_VOLUME: Record<MuscleId, number> = {
  chest: 0, shoulders: 0, biceps: 0, triceps: 0, forearms: 0,
  core: 0, obliques: 0, quads: 0, hamstrings: 0, glutes: 0,
  calves: 0, lats: 0, traps: 0, "lower-back": 0, neck: 0,
};

// SEG=push-a, TER=pull-a, QUA=legs, QUI=push-b, SEX=pull-b, SAB/DOM off
const seedWeekdayMap: WeekdayMap = {
  0: null, 1: "d-push-a", 2: "d-pull-a", 3: "d-legs",
  4: "d-push-b", 5: "d-pull-b", 6: null,
};

const emptyActive: ActiveWorkout = {
  dayId: "d1", exerciseIndex: 0, setIndex: 0,
  startedAt: null, finishedAt: null, pausedAt: null, totalPausedMs: 0, log: [],
};

/* ─────────────────────────────── Store ─────────────────────────────── */

interface State {
  routine: Routine;
  weekdayMap: WeekdayMap;
  active: ActiveWorkout;
  rest: RestTimer;
  schedule: SupplementSlot[];
  inventory: InventoryItem[];
  muscleVolume: Record<MuscleId, number>;
  weeklyVolume: Record<MuscleId, number>;
  syncStatus: "idle" | "syncing" | "ok" | "offline" | "error";
  lastSyncedAt: number | null;
  lastWeekTonnage: number;
  lastSummary: SessionSummary | null;
  saturatedMap: Record<string, SaturationEntry>;
  ratingOverrides: Record<string, RatingOverride>;
  biometrics: Biometrics;
  history: Record<string, WorkoutLogRow[]>;
  seenSwipeHint: boolean;

  /* selectors */
  getActiveDay: () => WorkoutDay | null;
  getActiveExercise: () => Exercise | null;
  getTodayDay: () => WorkoutDay | null;
  getTonnage7d: () => number;
  getPRWatch: () => number;
  getAvgRest: () => number;
  getElapsedMs: () => number;
  isPaused: () => boolean;
  hasActiveSession: () => boolean;
  getSessionTelemetry: () => SessionTelemetry;

  /* lifecycle */
  wipeData: () => Promise<void>;

  /* cloud */
  hydrateFromCloud: () => Promise<void>;
  fetchTodayWorkout: () => Promise<WorkoutDay | null>;
  fetchWeeklyVolume: () => Promise<Record<MuscleId, number>>;
  logCompletedSet: (exerciseId: string, weight: number, reps: number, rpe?: number) => Promise<boolean>;
  persistRoutine: () => Promise<boolean>;

  /* routine editing */
  addExerciseToDay: (dayId: string) => void;
  addLibraryExerciseToDay: (dayId: string, libraryId: string) => void;
  swapExercise: (dayId: string, exerciseId: string, libraryId: string) => void;
  removeExercise: (dayId: string, exerciseId: string) => void;
  renameExercise: (dayId: string, exerciseId: string, name: string) => void;
  updateExercise: (dayId: string, exerciseId: string, patch: Partial<Exercise>) => void;
  setSplit: (split: Routine["split"]) => void;
  assignWeekday: (weekday: number, dayId: string | null) => void;

  /* session control */
  startWorkout: (dayId: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  discardSession: () => void;
  finishWorkout: () => SessionSummary;
  clearSummary: () => void;

  /* set execution */
  completeCurrentSet: (overrides?: { reps?: number; weight?: number; rpe?: number; notes?: string }) => Promise<void>;
  nextExercise: () => void;
  prevExercise: () => void;
  selectExercise: (i: number) => void;
  adjustCurrentSet: (field: "reps" | "weight", delta: number) => void;
  toggleWarmup: (exerciseId: string, setIndex: number) => void;
  setSetRest: (exerciseId: string, setIndex: number, seconds: number | undefined) => void;

  startRest: (seconds: number) => void;
  tickRest: () => void;
  skipRest: () => void;

  toggleSupplement: (id: string) => Promise<void>;
  bumpMuscleVolume: (muscle: MuscleId, amount: number) => void;

  /* saturation + ratings */
  isSaturated: (libraryId: string) => boolean;
  markExerciseSaturated: (libraryId: string, weeks: number) => void;
  unmarkSaturated: (libraryId: string) => void;
  setRatingOverride: (libraryId: string, override: RatingOverride) => void;

  /* operator profile */
  setBiometrics: (patch: Partial<Pick<Biometrics, "weightKg" | "heightCm">>) => void;
  daysSinceWeightUpdate: () => number | null;
  needsWeightCalibration: () => boolean;
  getPRMedals: () => PRMedal[];

  /* smart overload + ux */
  loadHistory: () => Promise<void>;
  getSuggestion: (exerciseId: string) => OverloadSuggestion | null;
  adjustRestForRPE: (rpe: number) => void;
  markSwipeHintSeen: () => void;
}

export const useMarcolaStore = create<State>()(
  persist(
    (set, get) => ({
      routine: seedRoutine,
      weekdayMap: seedWeekdayMap,
      active: emptyActive,
      rest: { active: false, remaining: 0, total: 0 },
      schedule: seedSchedule,
      inventory: seedInventory,
      muscleVolume: { ...ZERO_MUSCLE_VOLUME },
      weeklyVolume: {} as Record<MuscleId, number>,
      syncStatus: isSupabaseEnabled ? "idle" : "offline",
      lastSyncedAt: null,
      lastWeekTonnage: 0,
      lastSummary: null,
      saturatedMap: {},
      ratingOverrides: {},
      biometrics: { weightKg: 76, heightCm: 178, weightUpdatedAt: new Date().toISOString() },
      history: {},
      seenSwipeHint: false,

      getActiveDay: () => {
        const { routine, active } = get();
        return routine.days.find((d) => d.id === active.dayId) ?? null;
      },
      getActiveExercise: () => {
        const day = get().getActiveDay();
        if (!day) return null;
        return day.exercises[get().active.exerciseIndex] ?? null;
      },
      getTodayDay: () => {
        const { routine, weekdayMap } = get();
        const dow = new Date().getDay();
        const id = weekdayMap[dow];
        return id ? routine.days.find((d) => d.id === id) ?? null : null;
      },
      getTonnage7d: () => {
        const r = get().routine; let total = 0;
        for (const day of r.days) for (const ex of day.exercises) for (const s of ex.sets) {
          if (s.isWarmup) continue;
          total += s.reps * s.weight;
        }
        return Math.round(total / 100) / 10;
      },
      getPRWatch: () => {
        const r = get().routine; let count = 0;
        for (const day of r.days) for (const ex of day.exercises) {
          const top = ex.sets.reduce((a, b) => (b.weight > a ? b.weight : a), 0);
          if (top >= 90) count++;
        }
        return Math.min(99, count);
      },
      getAvgRest: () => {
        const r = get().routine; let sum = 0; let n = 0;
        for (const day of r.days) for (const ex of day.exercises) { sum += ex.restSeconds; n++; }
        return n ? Math.round(sum / n) : 0;
      },
      getElapsedMs: () => {
        const a = get().active;
        if (!a.startedAt) return 0;
        const end = a.finishedAt ?? Date.now();
        const pausedExtra = a.pausedAt ? Date.now() - a.pausedAt : 0;
        return Math.max(0, end - a.startedAt - a.totalPausedMs - pausedExtra);
      },
      isPaused: () => get().active.pausedAt !== null,
      hasActiveSession: () => {
        const a = get().active;
        return a.startedAt !== null && a.finishedAt === null;
      },

      getSessionTelemetry: () => {
        const { active, routine, lastSummary } = get();
        const isLive = active.startedAt !== null && active.finishedAt === null;
        if (isLive) {
          let vol = 0, sets = 0;
          for (const entry of active.log) {
            if (entry.isWarmup) continue;
            vol += entry.reps * entry.weight;
            sets += 1;
          }
          return { volumeKg: Math.round(vol), sets, isLive: true };
        }
        if (lastSummary) {
          return { volumeKg: lastSummary.tonnageKg, sets: lastSummary.setsCompleted, isLive: false };
        }
        // Fallback: last completed sets na rotina (carregadas via hydrate).
        let vol = 0, sets = 0;
        for (const day of routine.days) for (const ex of day.exercises) for (const s of ex.sets) {
          if (s.completed && !s.isWarmup) { vol += s.reps * s.weight; sets += 1; }
        }
        return { volumeKg: Math.round(vol), sets, isLive: false };
      },

      wipeData: async () => {
        // Limpa estado local + fila offline; preserva rotina/biométricos/suplementos.
        if (typeof window !== "undefined") {
          try { window.localStorage.removeItem("marcola-sync-queue-v1"); } catch { /* ignore */ }
        }
        set((s) => ({
          active: { ...emptyActive, dayId: s.routine.days[0]?.id ?? null },
          rest: { active: false, remaining: 0, total: 0 },
          lastSummary: null,
          muscleVolume: { ...ZERO_MUSCLE_VOLUME },
          weeklyVolume: {} as Record<MuscleId, number>,
          history: {},
          routine: {
            ...s.routine,
            days: s.routine.days.map((d) => ({
              ...d,
              exercises: d.exercises.map((e) => ({
                ...e,
                sets: e.sets.map((st) => ({ ...st, completed: false })),
              })),
            })),
          },
        }));
        // Remoto (Supabase) — best effort.
        if (isSupabaseEnabled && supabase) {
          const owner = await getOwnerId();
          if (owner) {
            await supabase.from("workout_logs").delete().eq("owner", owner);
            await supabase.from("pr_achievements").delete().eq("owner", owner);
          }
        }
      },


      /* ──────────── Cloud hydration ──────────── */

      hydrateFromCloud: async () => {
        if (!isSupabaseEnabled) { set({ syncStatus: "offline" }); return; }
        set({ syncStatus: "syncing" });
        try {
          const [routine, inventory, schedule] = await Promise.all([
            fetchRoutine(), fetchInventory(), fetchSchedule(),
          ]);
          set((s) => ({
            routine: routine ?? s.routine,
            inventory: inventory ?? s.inventory,
            schedule: schedule ?? s.schedule,
            syncStatus: "ok",
            lastSyncedAt: Date.now(),
          }));
        } catch {
          set({ syncStatus: "error" });
        }
      },

      persistRoutine: async () => {
        const ok = await saveRoutine(get().routine);
        if (ok) set({ syncStatus: "ok", lastSyncedAt: Date.now() });
        return ok;
      },

      fetchTodayWorkout: async () => {
        const s = get();
        if (isSupabaseEnabled && !s.lastSyncedAt) await s.hydrateFromCloud();
        return get().getTodayDay();
      },

      fetchWeeklyVolume: async () => {
        const vol = await fetchWeeklyVolumeRemote();
        set({ weeklyVolume: vol });
        return vol;
      },

      logCompletedSet: async (exerciseId, weight, reps, rpe) => {
        const s = get();
        let ex: Exercise | undefined;
        for (const d of s.routine.days) {
          const found = d.exercises.find((e) => e.id === exerciseId);
          if (found) { ex = found; break; }
        }
        if (!ex) return false;
        set((st) => ({
          weeklyVolume: { ...st.weeklyVolume, [ex!.primary]: (st.weeklyVolume[ex!.primary] ?? 0) + 1 },
        }));
        enqueueWorkoutLog({
          exercise_id: ex.id, exercise_name: ex.name, primary_muscle: ex.primary,
          set_index: 0, reps, weight, rpe: rpe ?? null, performed_at: new Date().toISOString(),
        });
        return true;
      },

      /* ──────────── Routine editing ──────────── */

      addExerciseToDay: (dayId) => set((s) => ({
        routine: {
          ...s.routine,
          days: s.routine.days.map((d) => d.id !== dayId ? d : {
            ...d,
            exercises: [...d.exercises, {
              id: `ex-${Date.now()}`, name: "Novo Exercício", primary: "chest",
              restSeconds: 90, sets: [mkSet(10, 0), mkSet(10, 0), mkSet(10, 0)],
            }],
          }),
        },
      })),

      addLibraryExerciseToDay: (dayId, libraryId) => {
        const lib = getLibraryExercise(libraryId);
        if (!lib) return;
        set((s) => ({
          routine: {
            ...s.routine,
            days: s.routine.days.map((d) => d.id !== dayId ? d : {
              ...d,
              exercises: [...d.exercises, {
                id: `ex-${Date.now()}`,
                name: lib.name,
                primary: lib.primary,
                secondary: lib.secondary,
                restSeconds: lib.defaultRestSeconds,
                tempo: lib.defaultTempo,
                libraryId: lib.id,
                sets: [mkSet(10, 0), mkSet(10, 0), mkSet(10, 0)],
              }],
            }),
          },
        }));
      },

      swapExercise: (dayId, exerciseId, libraryId) => {
        const lib = getLibraryExercise(libraryId);
        if (!lib) return;
        set((s) => ({
          routine: {
            ...s.routine,
            days: s.routine.days.map((d) => d.id !== dayId ? d : {
              ...d,
              exercises: d.exercises.map((e) => e.id !== exerciseId ? e : {
                ...e,
                name: lib.name,
                primary: lib.primary,
                secondary: lib.secondary,
                restSeconds: lib.defaultRestSeconds,
                tempo: lib.defaultTempo,
                libraryId: lib.id,
                
              }),
            }),
          },
        }));
      },

      removeExercise: (dayId, exerciseId) => set((s) => ({
        routine: {
          ...s.routine,
          days: s.routine.days.map((d) => d.id !== dayId ? d : {
            ...d, exercises: d.exercises.filter((e) => e.id !== exerciseId),
          }),
        },
      })),

      renameExercise: (dayId, exerciseId, name) => set((s) => ({
        routine: {
          ...s.routine,
          days: s.routine.days.map((d) => d.id !== dayId ? d : {
            ...d, exercises: d.exercises.map((e) => e.id === exerciseId ? { ...e, name } : e),
          }),
        },
      })),

      updateExercise: (dayId, exerciseId, patch) => set((s) => ({
        routine: {
          ...s.routine,
          days: s.routine.days.map((d) => d.id !== dayId ? d : {
            ...d, exercises: d.exercises.map((e) => e.id === exerciseId ? { ...e, ...patch } : e),
          }),
        },
      })),

      setSplit: (split) => set((s) => ({ routine: { ...s.routine, split } })),

      assignWeekday: (weekday, dayId) => set((s) => ({ weekdayMap: { ...s.weekdayMap, [weekday]: dayId } })),

      adjustCurrentSet: (field, delta) => set((s) => {
        const day = s.getActiveDay(); if (!day) return s;
        const exIdx = s.active.exerciseIndex;
        const setIdx = s.active.setIndex;
        const ex = day.exercises[exIdx]; if (!ex) return s;
        const current = ex.sets[setIdx]; if (!current) return s;
        const step = field === "weight" ? 2.5 : 1;
        const nextVal = Math.max(0, +(current[field] + delta * step).toFixed(2));
        const newDays = s.routine.days.map((d) => d.id !== day.id ? d : {
          ...d, exercises: d.exercises.map((e, i) => i !== exIdx ? e : {
            ...e, sets: e.sets.map((st, j) => j !== setIdx ? st : { ...st, [field]: nextVal }),
          }),
        });
        return { routine: { ...s.routine, days: newDays } };
      }),

      toggleWarmup: (exerciseId, setIndex) => set((s) => ({
        routine: {
          ...s.routine,
          days: s.routine.days.map((d) => ({
            ...d,
            exercises: d.exercises.map((e) => e.id !== exerciseId ? e : {
              ...e, sets: e.sets.map((st, j) => j !== setIndex ? st : { ...st, isWarmup: !st.isWarmup }),
            }),
          })),
        },
      })),

      setSetRest: (exerciseId, setIndex, seconds) => set((s) => ({
        routine: {
          ...s.routine,
          days: s.routine.days.map((d) => ({
            ...d,
            exercises: d.exercises.map((e) => e.id !== exerciseId ? e : {
              ...e, sets: e.sets.map((st, j) => j !== setIndex ? st : { ...st, restSeconds: seconds }),
            }),
          })),
        },
      })),

      /* ──────────── Session control ──────────── */

      startWorkout: (dayId) => set({
        active: { dayId, exerciseIndex: 0, setIndex: 0, startedAt: Date.now(), finishedAt: null, pausedAt: null, totalPausedMs: 0, log: [] },
        rest: { active: false, remaining: 0, total: 0 },
        lastSummary: null,
      }),

      pauseSession: () => set((s) => s.active.pausedAt ? s : ({ active: { ...s.active, pausedAt: Date.now() } })),

      resumeSession: () => set((s) => {
        if (!s.active.pausedAt) return s;
        const extra = Date.now() - s.active.pausedAt;
        return { active: { ...s.active, pausedAt: null, totalPausedMs: s.active.totalPausedMs + extra } };
      }),

      discardSession: () => set((s) => ({
        active: { ...emptyActive, dayId: s.active.dayId },
        rest: { active: false, remaining: 0, total: 0 },
        lastSummary: null,
        // Clear completed flags on all sets of the discarded day.
        routine: {
          ...s.routine,
          days: s.routine.days.map((d) => d.id !== s.active.dayId ? d : {
            ...d,
            exercises: d.exercises.map((e) => ({
              ...e, sets: e.sets.map((st) => ({ ...st, completed: false })),
            })),
          }),
        },
      })),

      finishWorkout: () => {
        const s = get();
        // Auto-resume if paused so totalPausedMs is finalized.
        if (s.active.pausedAt) {
          const extra = Date.now() - s.active.pausedAt;
          set((st) => ({ active: { ...st.active, pausedAt: null, totalPausedMs: st.active.totalPausedMs + extra } }));
        }
        const day = s.getActiveDay();
        const startedAt = s.active.startedAt ?? Date.now();
        const finishedAt = Date.now();
        const totalPausedMs = get().active.totalPausedMs;
        const durationMs = Math.max(0, finishedAt - startedAt - totalPausedMs);

        let tonnage = 0;
        let setsCompleted = 0;
        let warmupSets = 0;
        const prs: SessionSummary["prs"] = [];

        if (day) {
          for (const ex of day.exercises) {
            const topThisSession = ex.sets
              .filter((st) => st.completed && !st.isWarmup)
              .reduce((max, st) => (st.weight > max.weight ? { weight: st.weight, reps: st.reps } : max), { weight: 0, reps: 0 });
            for (const st of ex.sets) {
              if (!st.completed) continue;
              if (st.isWarmup) { warmupSets++; continue; }
              setsCompleted++;
              tonnage += st.reps * st.weight;
            }
            // Naive PR: any working set ≥ previous logged max for this exercise.
            // (Without history we flag the top set of the session.)
            if (topThisSession.weight > 0) {
              prs.push({ exerciseId: ex.id, exerciseName: ex.name, weight: topThisSession.weight, reps: topThisSession.reps });
            }
          }
        }

        const summary: SessionSummary = {
          durationMs, tonnageKg: Math.round(tonnage), setsCompleted, warmupSets, prs,
        };

        set({
          active: { ...get().active, finishedAt, pausedAt: null },
          rest: { active: false, remaining: 0, total: 0 },
          lastSummary: summary,
        });

        return summary;
      },

      clearSummary: () => set({ lastSummary: null }),

      /* ──────────── Set execution ──────────── */

      completeCurrentSet: async (overrides) => {
        const s = get();
        if (s.active.pausedAt) return; // bloqueado em pausa
        const day = s.getActiveDay(); if (!day) return;
        const exIdx = s.active.exerciseIndex;
        const setIdx = s.active.setIndex;
        const ex = day.exercises[exIdx]; if (!ex) return;
        const current = ex.sets[setIdx]; if (!current) return;

        // Auto-start the session if user dives straight in.
        if (!s.active.startedAt) {
          set({ active: { ...s.active, startedAt: Date.now() } });
        }

        const updatedSet: ExerciseSet = {
          ...current, completed: true,
          reps: overrides?.reps ?? current.reps,
          weight: overrides?.weight ?? current.weight,
          rpe: overrides?.rpe ?? current.rpe,
          notes: overrides?.notes ?? current.notes,
        };
        const newExercises = day.exercises.map((e, i) =>
          i === exIdx ? { ...e, sets: e.sets.map((st, j) => j === setIdx ? updatedSet : st) } : e,
        );
        const newDays = s.routine.days.map((d) => d.id === day.id ? { ...d, exercises: newExercises } : d);

        const moreSets = setIdx + 1 < ex.sets.length;
        const moreExercises = exIdx + 1 < day.exercises.length;
        const restSec = current.restSeconds ?? ex.restSeconds;

        const vol = { ...s.muscleVolume };
        const newWeekly = { ...s.weeklyVolume };
        if (!updatedSet.isWarmup) {
          const work = (updatedSet.reps * updatedSet.weight) / 5000;
          vol[ex.primary] = Math.min(1, (vol[ex.primary] ?? 0) + work);
          ex.secondary?.forEach((m) => { vol[m] = Math.min(1, (vol[m] ?? 0) + work * 0.4); });
          newWeekly[ex.primary] = (newWeekly[ex.primary] ?? 0) + 1;
        }

        set({
          routine: { ...s.routine, days: newDays },
          muscleVolume: vol,
          weeklyVolume: newWeekly,
          active: {
            ...get().active,
            setIndex: moreSets ? setIdx + 1 : 0,
            exerciseIndex: moreSets ? exIdx : moreExercises ? exIdx + 1 : exIdx,
            log: [...s.active.log, { exerciseId: ex.id, setIndex: setIdx, weight: updatedSet.weight, reps: updatedSet.reps, ts: Date.now(), isWarmup: updatedSet.isWarmup }],
          },
          rest: { active: true, remaining: restSec, total: restSec },
        });

        if (!updatedSet.isWarmup) {
          enqueueWorkoutLog({
            exercise_id: ex.id, exercise_name: ex.name, primary_muscle: ex.primary,
            set_index: setIdx, reps: updatedSet.reps, weight: updatedSet.weight,
            rpe: updatedSet.rpe ?? null, performed_at: new Date().toISOString(),
          });
        }
      },

      nextExercise: () => set((s) => {
        const day = s.getActiveDay(); if (!day) return s;
        const next = Math.min(day.exercises.length - 1, s.active.exerciseIndex + 1);
        return { active: { ...s.active, exerciseIndex: next, setIndex: 0 } };
      }),
      prevExercise: () => set((s) => ({ active: { ...s.active, exerciseIndex: Math.max(0, s.active.exerciseIndex - 1), setIndex: 0 } })),
      selectExercise: (i) => set((s) => ({ active: { ...s.active, exerciseIndex: i, setIndex: 0 } })),

      startRest: (seconds) => set({ rest: { active: true, remaining: seconds, total: seconds } }),
      tickRest: () => set((s) => {
        if (!s.rest.active) return s;
        const next = s.rest.remaining - 1;
        if (next <= 0) return { rest: { active: false, remaining: 0, total: s.rest.total } };
        return { rest: { ...s.rest, remaining: next } };
      }),
      skipRest: () => set({ rest: { active: false, remaining: 0, total: 0 } }),

      toggleSupplement: async (id) => {
        const before = get().schedule.find((x) => x.id === id);
        set((s) => ({ schedule: s.schedule.map((x) => x.id === id ? { ...x, taken: !x.taken } : x) }));
        if (before) void setSupplementTaken(id, !before.taken);
      },

      bumpMuscleVolume: (muscle, amount) =>
        set((s) => ({ muscleVolume: { ...s.muscleVolume, [muscle]: Math.min(1, (s.muscleVolume[muscle] ?? 0) + amount) } })),

      /* ──────────── Saturation & rating overrides ──────────── */

      isSaturated: (libraryId) => {
        const entry = get().saturatedMap[libraryId];
        return !!entry && entry.hiddenUntil > Date.now();
      },

      markExerciseSaturated: (libraryId, weeks) => set((s) => ({
        saturatedMap: {
          ...s.saturatedMap,
          [libraryId]: {
            hiddenUntil: Date.now() + weeks * 7 * 24 * 60 * 60 * 1000,
            markedAt: Date.now(),
            weeks,
          },
        },
      })),

      unmarkSaturated: (libraryId) => set((s) => {
        const next = { ...s.saturatedMap };
        delete next[libraryId];
        return { saturatedMap: next };
      }),

      setRatingOverride: (libraryId, override) => set((s) => ({
        ratingOverrides: { ...s.ratingOverrides, [libraryId]: override },
      })),

      /* ──────────── Operator Profile ──────────── */

      setBiometrics: (patch) => set((s) => {
        const next: Biometrics = { ...s.biometrics };
        if (patch.weightKg !== undefined) {
          next.weightKg = patch.weightKg;
          next.weightUpdatedAt = new Date().toISOString();
        }
        if (patch.heightCm !== undefined) next.heightCm = patch.heightCm;
        return { biometrics: next };
      }),

      daysSinceWeightUpdate: () => {
        const ts = get().biometrics.weightUpdatedAt;
        if (!ts) return null;
        return Math.floor((Date.now() - new Date(ts).getTime()) / 86_400_000);
      },

      needsWeightCalibration: () => {
        const d = get().daysSinceWeightUpdate();
        return d === null ? true : d >= 7;
      },

      getPRMedals: () => {
        const { routine } = get();
        const best = new Map<string, PRMedal>();
        for (const day of routine.days) {
          for (const ex of day.exercises) {
            let top: { weight: number; reps: number } = { weight: 0, reps: 0 };
            for (const st of ex.sets) {
              if (st.isWarmup) continue;
              if (st.weight > top.weight) top = { weight: st.weight, reps: st.reps };
            }
            if (top.weight <= 0) continue;
            const key = ex.libraryId ?? ex.id;
            const prev = best.get(key);
            if (!prev || top.weight > prev.weight) {
              best.set(key, {
                exerciseId: ex.id,
                exerciseName: ex.name,
                primary: ex.primary,
                weight: top.weight,
                reps: top.reps,
              });
            }
          }
        }
        return Array.from(best.values()).sort((a, b) => b.weight - a.weight);
      },

      /* ──────────── Smart Overload + UX ──────────── */

      loadHistory: async () => {
        const logs = await fetchRecentLogs(200);
        if (!logs.length) return;
        const grouped: Record<string, WorkoutLogRow[]> = {};
        for (const row of logs) {
          (grouped[row.exercise_id] ??= []).push(row);
        }
        // pushWorkoutLog returns newest-first; ensure sort.
        for (const k of Object.keys(grouped)) {
          grouped[k].sort((a, b) => b.performed_at.localeCompare(a.performed_at));
        }
        set({ history: grouped });
      },

      getSuggestion: (exerciseId) => {
        const { history, routine } = get();
        let ex: Exercise | undefined;
        for (const d of routine.days) {
          const f = d.exercises.find((e) => e.id === exerciseId);
          if (f) { ex = f; break; }
        }
        if (!ex) return null;
        const target = ex.sets.find((s) => !s.isWarmup) ?? ex.sets[0];
        if (!target) return null;

        const logs = history[exerciseId] ?? [];
        if (logs.length === 0) {
          return {
            weight: target.weight,
            reps: target.reps,
            deltaKg: 0,
            reason: "first-time",
            label: "plano base",
          };
        }

        // Group by ISO date → top working set per session.
        const byDate = new Map<string, { weight: number; reps: number }>();
        for (const l of logs) {
          const d = l.performed_at.slice(0, 10);
          const top = byDate.get(d);
          if (!top || l.weight > top.weight) byDate.set(d, { weight: l.weight, reps: l.reps });
        }
        const sessions = [...byDate.entries()]
          .sort((a, b) => b[0].localeCompare(a[0]))
          .slice(0, 2)
          .map(([, v]) => v);
        const last = sessions[0];

        const inc = COMPOUND_MUSCLES.has(ex.primary) ? 2.5 : 1.25;
        const hitTarget = sessions.length >= 2 && sessions.every((s) => s.reps >= target.reps);

        if (hitTarget) {
          return {
            weight: +(last.weight + inc).toFixed(2),
            reps: target.reps,
            deltaKg: inc,
            reason: "increase-load",
            label: `+${inc}kg vs última`,
          };
        }
        if (last.reps < target.reps) {
          return {
            weight: last.weight,
            reps: last.reps + 1,
            deltaKg: 0,
            reason: "increase-reps",
            label: "+1 rep vs última",
          };
        }
        return {
          weight: last.weight,
          reps: target.reps,
          deltaKg: 0,
          reason: "hold",
          label: "manter carga",
        };
      },

      adjustRestForRPE: (rpe) => set((s) => {
        if (!s.rest.active) return s;
        let delta = 0;
        if (rpe <= 7) delta = -15;
        else if (rpe === 9) delta = 30;
        else if (rpe >= 10) delta = 60;
        if (delta === 0) return s;
        const newTotal = Math.max(30, s.rest.total + delta);
        const newRem = Math.max(5, s.rest.remaining + delta);
        return { rest: { active: true, remaining: newRem, total: newTotal } };
      }),

      markSwipeHintSeen: () => set({ seenSwipeHint: true }),
    }),
    {
      name: "marcola-prime-store-v3",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : (undefined as never))),
      partialize: (s) => ({
        routine: s.routine,
        weekdayMap: s.weekdayMap,
        schedule: s.schedule,
        inventory: s.inventory,
        muscleVolume: s.muscleVolume,
        active: s.active,
        saturatedMap: s.saturatedMap,
        ratingOverrides: s.ratingOverrides,
        biometrics: s.biometrics,
        seenSwipeHint: s.seenSwipeHint,
      }),
    },
  ),
);
