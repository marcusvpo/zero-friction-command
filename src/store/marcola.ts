import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  saveRoutine,
  fetchRoutine,
  pushWorkoutLog,
  fetchInventory,
  fetchSchedule,
  setSupplementTaken,
  fetchWeeklyVolume as fetchWeeklyVolumeRemote,
} from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase";
import { getLibraryExercise } from "@/lib/exercise-library";

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

export const WEEKDAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
export const WEEKDAY_LONG  = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

/* ───────────────────────── Seed Data (5-day split) ───────────────────────── */

const mkSet = (reps = 8, weight = 0): ExerciseSet => ({ reps, weight, completed: false });

const seedRoutine: Routine = {
  name: "Marcola Prime · 5-Split", split: "BRO",
  days: [
    { id: "d1", code: "D1", name: "PUSH", focus: "Peito · Ombros · Tríceps",
      exercises: [
        { id: "e1", name: "Supino Reto Barra", primary: "chest", secondary: ["shoulders","triceps"], restSeconds: 120, tempo: "3-1-1-0", libraryId: "lib-supino-reto", sets: [mkSet(8,100),mkSet(8,100),mkSet(6,110),mkSet(6,110)] },
        { id: "e2", name: "Supino Inclinado Halter", primary: "chest", secondary: ["shoulders"], restSeconds: 90, tempo: "3-1-1-0", libraryId: "lib-supino-inclinado-halter", sets: [mkSet(10,32),mkSet(10,32),mkSet(8,34)] },
        { id: "e3", name: "Desenvolvimento Militar", primary: "shoulders", secondary: ["triceps"], restSeconds: 90, tempo: "2-1-1-0", libraryId: "lib-desenvolvimento", sets: [mkSet(8,50),mkSet(8,50),mkSet(6,55)] },
        { id: "e4", name: "Elevação Lateral", primary: "shoulders", restSeconds: 60, tempo: "2-0-2-1", libraryId: "lib-elevacao-lateral", sets: [mkSet(12,14),mkSet(12,14),mkSet(10,16)] },
        { id: "e5", name: "Tríceps Corda", primary: "triceps", restSeconds: 60, tempo: "2-1-2-0", libraryId: "lib-triceps-corda", sets: [mkSet(12,28),mkSet(12,28),mkSet(10,32)] },
      ] },
    { id: "d2", code: "D2", name: "PULL", focus: "Costas · Bíceps · Antebraço",
      exercises: [
        { id: "p1", name: "Barra Fixa Pronada", primary: "lats", secondary: ["biceps"], restSeconds: 120, tempo: "2-0-3-1", libraryId: "lib-barra-fixa", sets: [mkSet(8,0),mkSet(8,0),mkSet(6,10)] },
        { id: "p2", name: "Remada Curvada", primary: "lats", secondary: ["traps","biceps"], restSeconds: 120, tempo: "2-1-2-0", libraryId: "lib-remada-curvada", sets: [mkSet(8,80),mkSet(8,80),mkSet(6,90)] },
        { id: "p3", name: "Puxada Frontal", primary: "lats", restSeconds: 90, sets: [mkSet(10,70),mkSet(10,70),mkSet(8,75)] },
        { id: "p4", name: "Rosca Direta Barra W", primary: "biceps", restSeconds: 75, tempo: "2-1-2-0", libraryId: "lib-rosca-direta", sets: [mkSet(10,30),mkSet(10,30),mkSet(8,32)] },
        { id: "p5", name: "Martelo", primary: "biceps", secondary: ["forearms"], restSeconds: 60, sets: [mkSet(12,18),mkSet(12,18)] },
      ] },
    { id: "d3", code: "D3", name: "LEGS", focus: "Quadríceps · Posterior · Glúteo",
      exercises: [
        { id: "l1", name: "Agachamento Livre", primary: "quads", secondary: ["glutes","core","lower-back"], restSeconds: 180, tempo: "3-1-1-0", libraryId: "lib-agachamento", sets: [mkSet(8,120),mkSet(8,120),mkSet(6,140),mkSet(6,140)] },
        { id: "l2", name: "Leg Press 45°", primary: "quads", secondary: ["glutes"], restSeconds: 120, tempo: "2-1-2-0", libraryId: "lib-leg-press", sets: [mkSet(12,240),mkSet(12,240),mkSet(10,280)] },
        { id: "l3", name: "Stiff", primary: "hamstrings", secondary: ["glutes","lower-back"], restSeconds: 120, tempo: "3-1-1-0", libraryId: "lib-stiff", sets: [mkSet(10,90),mkSet(10,90),mkSet(8,100)] },
        { id: "l4", name: "Cadeira Flexora", primary: "hamstrings", restSeconds: 75, sets: [mkSet(12,60),mkSet(12,60)] },
        { id: "l5", name: "Panturrilha em Pé", primary: "calves", restSeconds: 60, tempo: "2-1-3-1", libraryId: "lib-panturrilha", sets: [mkSet(15,120),mkSet(15,120),mkSet(12,140)] },
      ] },
    { id: "d4", code: "D4", name: "UPPER", focus: "Torso completo · Densidade",
      exercises: [
        { id: "u1", name: "Supino Inclinado Barra", primary: "chest", secondary: ["shoulders","triceps"], restSeconds: 120, sets: [mkSet(8,90),mkSet(8,90),mkSet(6,100)] },
        { id: "u2", name: "Remada Cavalinho", primary: "lats", secondary: ["traps"], restSeconds: 120, sets: [mkSet(10,70),mkSet(10,70),mkSet(8,80)] },
        { id: "u3", name: "Arnold Press", primary: "shoulders", restSeconds: 90, sets: [mkSet(10,22),mkSet(10,22)] },
        { id: "u4", name: "Face Pull", primary: "shoulders", secondary: ["traps"], restSeconds: 60, sets: [mkSet(15,24),mkSet(15,24)] },
        { id: "u5", name: "Abdominal Cabo", primary: "core", restSeconds: 60, sets: [mkSet(15,30),mkSet(15,30),mkSet(12,35)] },
      ] },
    { id: "d5", code: "D5", name: "ARMS · CORE", focus: "Braços · Core · Mobilidade",
      exercises: [
        { id: "a1", name: "Rosca Scott", primary: "biceps", restSeconds: 75, sets: [mkSet(10,25),mkSet(10,25),mkSet(8,28)] },
        { id: "a2", name: "Tríceps Francês", primary: "triceps", restSeconds: 75, sets: [mkSet(10,24),mkSet(10,24),mkSet(8,26)] },
        { id: "a3", name: "Rosca Inversa", primary: "forearms", secondary: ["biceps"], restSeconds: 60, sets: [mkSet(12,18),mkSet(12,18)] },
        { id: "a4", name: "Mergulho Banco", primary: "triceps", restSeconds: 60, sets: [mkSet(12,0),mkSet(12,0)] },
        { id: "a5", name: "Prancha Lastreada", primary: "core", secondary: ["obliques"], restSeconds: 45, sets: [mkSet(60,10),mkSet(60,10),mkSet(45,15)] },
      ] },
  ],
};

const seedSchedule: SupplementSlot[] = [
  { id: "s1", time: "08:00", name: "Creatina Monohidratada", dose: "5g", note: "Micronizada", tone: "cyan", taken: true },
  { id: "s2", time: "12:30", name: "Multivitamínico", dose: "1 cápsula", tone: "cyan", taken: true },
  { id: "s3", time: "18:30", name: "Whey 3W · Morango c/ Ninho", dose: "30g + 250ml H₂O", tone: "matrix", taken: false },
  { id: "s4", time: "22:00", name: "Magnésio Glicinato", dose: "300mg", tone: "cyan", taken: false },
];

const seedInventory: InventoryItem[] = [
  { id: "i1", name: "WHEY 3W",  remaining: 18, total: 30, tone: "matrix" },
  { id: "i2", name: "CREATINA", remaining: 41, total: 60, tone: "cyan" },
  { id: "i3", name: "MULTIVIT", remaining: 4,  total: 30, tone: "amber" },
];

const seedMuscleVolume: Record<MuscleId, number> = {
  chest: 0.72, shoulders: 0.58, biceps: 0.41, triceps: 0.52, forearms: 0.22,
  core: 0.35, obliques: 0.18, quads: 0.85, hamstrings: 0.61, glutes: 0.55,
  calves: 0.44, lats: 0.78, traps: 0.46, "lower-back": 0.31, neck: 0.0,
};

const seedWeekdayMap: WeekdayMap = { 0: null, 1: "d1", 2: "d2", 3: "d3", 4: "d4", 5: "d5", 6: null };

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
      muscleVolume: seedMuscleVolume,
      weeklyVolume: {} as Record<MuscleId, number>,
      syncStatus: isSupabaseEnabled ? "idle" : "offline",
      lastSyncedAt: null,
      lastWeekTonnage: 12.5,
      lastSummary: null,
      saturatedMap: {},
      ratingOverrides: {},
      biometrics: { weightKg: null, heightCm: null, weightUpdatedAt: null },

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
        const ok = await pushWorkoutLog({
          exercise_id: ex.id, exercise_name: ex.name, primary_muscle: ex.primary,
          set_index: 0, reps, weight, rpe: rpe ?? null, performed_at: new Date().toISOString(),
        });
        if (!ok) {
          set((st) => ({
            weeklyVolume: { ...st.weeklyVolume, [ex!.primary]: Math.max(0, (st.weeklyVolume[ex!.primary] ?? 1) - 1) },
          }));
        }
        return ok;
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
          void pushWorkoutLog({
            exercise_id: ex.id, exercise_name: ex.name, primary_muscle: ex.primary,
            set_index: setIdx, reps: updatedSet.reps, weight: updatedSet.weight,
            rpe: updatedSet.rpe ?? null, performed_at: new Date().toISOString(),
          }).then((ok) => {
            if (!ok) {
              set((st) => ({
                weeklyVolume: { ...st.weeklyVolume, [ex.primary]: Math.max(0, (st.weeklyVolume[ex.primary] ?? 1) - 1) },
              }));
            }
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
    }),
    {
      name: "marcola-prime-store-v2",
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
      }),
    },
  ),
);
