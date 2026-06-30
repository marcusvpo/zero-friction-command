import { create } from "zustand";

/* ─────────────────────────────── Types ─────────────────────────────── */

export type MuscleId =
  | "chest"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core"
  | "obliques"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "lats"
  | "traps"
  | "lower-back"
  | "neck";

export type Tone = "cyan" | "matrix" | "amber" | "danger";

export interface ExerciseSet {
  reps: number;
  weight: number; // kg
  rpe?: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  primary: MuscleId;
  secondary?: MuscleId[];
  sets: ExerciseSet[];
  restSeconds: number;
  tempo?: string;
  notes?: string;
}

export interface WorkoutDay {
  id: string;
  code: string; // D1..D5
  name: string;
  focus: string;
  exercises: Exercise[];
}

export interface Routine {
  name: string;
  split: "PPL" | "UPPER/LOWER" | "BRO" | "FULL";
  days: WorkoutDay[];
}

export interface SupplementSlot {
  id: string;
  time: string;
  name: string;
  dose: string;
  note?: string;
  tone: Tone;
  taken: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  remaining: number; // days
  total: number;
  tone: Tone;
}

export interface ActiveWorkout {
  dayId: string | null;
  exerciseIndex: number;
  setIndex: number;
  startedAt: number | null;
  finishedAt: number | null;
  log: { exerciseId: string; setIndex: number; weight: number; reps: number; ts: number }[];
}

export interface RestTimer {
  active: boolean;
  remaining: number;
  total: number;
}

/* ───────────────────────── Seed Data (5-day split) ───────────────────────── */

const mkSet = (reps = 8, weight = 0): ExerciseSet => ({ reps, weight, completed: false });

const seedRoutine: Routine = {
  name: "Marcola Prime · 5-Split",
  split: "BRO",
  days: [
    {
      id: "d1", code: "D1", name: "PUSH", focus: "Peito · Ombros · Tríceps",
      exercises: [
        { id: "e1", name: "Supino Reto Barra", primary: "chest", secondary: ["shoulders", "triceps"], restSeconds: 120, sets: [mkSet(8, 100), mkSet(8, 100), mkSet(6, 110), mkSet(6, 110)] },
        { id: "e2", name: "Supino Inclinado Halter", primary: "chest", secondary: ["shoulders"], restSeconds: 90, sets: [mkSet(10, 32), mkSet(10, 32), mkSet(8, 34)] },
        { id: "e3", name: "Desenvolvimento Militar", primary: "shoulders", secondary: ["triceps"], restSeconds: 90, sets: [mkSet(8, 50), mkSet(8, 50), mkSet(6, 55)] },
        { id: "e4", name: "Elevação Lateral", primary: "shoulders", restSeconds: 60, sets: [mkSet(12, 14), mkSet(12, 14), mkSet(10, 16)] },
        { id: "e5", name: "Tríceps Corda", primary: "triceps", restSeconds: 60, sets: [mkSet(12, 28), mkSet(12, 28), mkSet(10, 32)] },
      ],
    },
    {
      id: "d2", code: "D2", name: "PULL", focus: "Costas · Bíceps · Antebraço",
      exercises: [
        { id: "p1", name: "Barra Fixa Pronada", primary: "lats", secondary: ["biceps"], restSeconds: 120, sets: [mkSet(8, 0), mkSet(8, 0), mkSet(6, 10)] },
        { id: "p2", name: "Remada Curvada", primary: "lats", secondary: ["traps", "biceps"], restSeconds: 120, sets: [mkSet(8, 80), mkSet(8, 80), mkSet(6, 90)] },
        { id: "p3", name: "Puxada Frontal", primary: "lats", restSeconds: 90, sets: [mkSet(10, 70), mkSet(10, 70), mkSet(8, 75)] },
        { id: "p4", name: "Rosca Direta Barra W", primary: "biceps", restSeconds: 75, sets: [mkSet(10, 30), mkSet(10, 30), mkSet(8, 32)] },
        { id: "p5", name: "Martelo", primary: "biceps", secondary: ["forearms"], restSeconds: 60, sets: [mkSet(12, 18), mkSet(12, 18)] },
      ],
    },
    {
      id: "d3", code: "D3", name: "LEGS", focus: "Quadríceps · Posterior · Glúteo",
      exercises: [
        { id: "l1", name: "Agachamento Livre", primary: "quads", secondary: ["glutes", "core", "lower-back"], restSeconds: 180, sets: [mkSet(8, 120), mkSet(8, 120), mkSet(6, 140), mkSet(6, 140)] },
        { id: "l2", name: "Leg Press 45°", primary: "quads", secondary: ["glutes"], restSeconds: 120, sets: [mkSet(12, 240), mkSet(12, 240), mkSet(10, 280)] },
        { id: "l3", name: "Stiff", primary: "hamstrings", secondary: ["glutes", "lower-back"], restSeconds: 120, sets: [mkSet(10, 90), mkSet(10, 90), mkSet(8, 100)] },
        { id: "l4", name: "Cadeira Flexora", primary: "hamstrings", restSeconds: 75, sets: [mkSet(12, 60), mkSet(12, 60)] },
        { id: "l5", name: "Panturrilha em Pé", primary: "calves", restSeconds: 60, sets: [mkSet(15, 120), mkSet(15, 120), mkSet(12, 140)] },
      ],
    },
    {
      id: "d4", code: "D4", name: "UPPER", focus: "Torso completo · Densidade",
      exercises: [
        { id: "u1", name: "Supino Inclinado Barra", primary: "chest", secondary: ["shoulders", "triceps"], restSeconds: 120, sets: [mkSet(8, 90), mkSet(8, 90), mkSet(6, 100)] },
        { id: "u2", name: "Remada Cavalinho", primary: "lats", secondary: ["traps"], restSeconds: 120, sets: [mkSet(10, 70), mkSet(10, 70), mkSet(8, 80)] },
        { id: "u3", name: "Arnold Press", primary: "shoulders", restSeconds: 90, sets: [mkSet(10, 22), mkSet(10, 22)] },
        { id: "u4", name: "Face Pull", primary: "shoulders", secondary: ["traps"], restSeconds: 60, sets: [mkSet(15, 24), mkSet(15, 24)] },
        { id: "u5", name: "Abdominal Cabo", primary: "core", restSeconds: 60, sets: [mkSet(15, 30), mkSet(15, 30), mkSet(12, 35)] },
      ],
    },
    {
      id: "d5", code: "D5", name: "ARMS · CORE", focus: "Braços · Core · Mobilidade",
      exercises: [
        { id: "a1", name: "Rosca Scott", primary: "biceps", restSeconds: 75, sets: [mkSet(10, 25), mkSet(10, 25), mkSet(8, 28)] },
        { id: "a2", name: "Tríceps Francês", primary: "triceps", restSeconds: 75, sets: [mkSet(10, 24), mkSet(10, 24), mkSet(8, 26)] },
        { id: "a3", name: "Rosca Inversa", primary: "forearms", secondary: ["biceps"], restSeconds: 60, sets: [mkSet(12, 18), mkSet(12, 18)] },
        { id: "a4", name: "Mergulho Banco", primary: "triceps", restSeconds: 60, sets: [mkSet(12, 0), mkSet(12, 0)] },
        { id: "a5", name: "Prancha Lastreada", primary: "core", secondary: ["obliques"], restSeconds: 45, sets: [mkSet(60, 10), mkSet(60, 10), mkSet(45, 15)] },
      ],
    },
  ],
};

const seedSchedule: SupplementSlot[] = [
  { id: "s1", time: "08:00", name: "Creatina Monohidratada", dose: "5g", note: "Micronizada", tone: "cyan", taken: true },
  { id: "s2", time: "12:30", name: "Multivitamínico", dose: "1 cápsula", tone: "cyan", taken: true },
  { id: "s3", time: "18:30", name: "Whey 3W · Morango c/ Ninho", dose: "30g + 250ml H₂O", tone: "matrix", taken: false },
  { id: "s4", time: "22:00", name: "Magnésio Glicinato", dose: "300mg", tone: "cyan", taken: false },
];

const seedInventory: InventoryItem[] = [
  { id: "i1", name: "WHEY 3W", remaining: 18, total: 30, tone: "matrix" },
  { id: "i2", name: "CREATINA", remaining: 41, total: 60, tone: "cyan" },
  { id: "i3", name: "MULTIVIT", remaining: 4, total: 30, tone: "amber" },
];

const seedMuscleVolume: Record<MuscleId, number> = {
  chest: 0.72, shoulders: 0.58, biceps: 0.41, triceps: 0.52, forearms: 0.22,
  core: 0.35, obliques: 0.18, quads: 0.85, hamstrings: 0.61, glutes: 0.55,
  calves: 0.44, lats: 0.78, traps: 0.46, "lower-back": 0.31, neck: 0.0,
};

/* ─────────────────────────────── Store ─────────────────────────────── */

interface State {
  routine: Routine;
  active: ActiveWorkout;
  rest: RestTimer;
  schedule: SupplementSlot[];
  inventory: InventoryItem[];
  muscleVolume: Record<MuscleId, number>;

  /* selectors */
  getActiveDay: () => WorkoutDay | null;
  getActiveExercise: () => Exercise | null;
  getTonnage7d: () => number;
  getPRWatch: () => number;
  getAvgRest: () => number;

  /* actions */
  startWorkout: (dayId: string) => void;
  finishWorkout: () => void;
  completeCurrentSet: (overrides?: { reps?: number; weight?: number; rpe?: number }) => void;
  nextExercise: () => void;
  prevExercise: () => void;
  selectExercise: (i: number) => void;
  startRest: (seconds: number) => void;
  tickRest: () => void;
  skipRest: () => void;
  toggleSupplement: (id: string) => void;
  bumpMuscleVolume: (muscle: MuscleId, amount: number) => void;
}

export const useMarcolaStore = create<State>((set, get) => ({
  routine: seedRoutine,
  active: { dayId: "d1", exerciseIndex: 0, setIndex: 0, startedAt: null, finishedAt: null, log: [] },
  rest: { active: false, remaining: 0, total: 0 },
  schedule: seedSchedule,
  inventory: seedInventory,
  muscleVolume: seedMuscleVolume,

  getActiveDay: () => {
    const { routine, active } = get();
    return routine.days.find((d) => d.id === active.dayId) ?? null;
  },
  getActiveExercise: () => {
    const day = get().getActiveDay();
    if (!day) return null;
    return day.exercises[get().active.exerciseIndex] ?? null;
  },
  getTonnage7d: () => {
    const r = get().routine;
    let total = 0;
    for (const day of r.days) {
      for (const ex of day.exercises) {
        for (const s of ex.sets) total += s.reps * s.weight;
      }
    }
    return Math.round(total / 100) / 10; // tons
  },
  getPRWatch: () => {
    const r = get().routine;
    let count = 0;
    for (const day of r.days) {
      for (const ex of day.exercises) {
        const top = ex.sets.reduce((a, b) => (b.weight > a ? b.weight : a), 0);
        if (top >= 90) count++;
      }
    }
    return Math.min(99, count);
  },
  getAvgRest: () => {
    const r = get().routine;
    let sum = 0; let n = 0;
    for (const day of r.days) {
      for (const ex of day.exercises) { sum += ex.restSeconds; n++; }
    }
    return n ? Math.round(sum / n) : 0;
  },

  startWorkout: (dayId) =>
    set({
      active: { dayId, exerciseIndex: 0, setIndex: 0, startedAt: Date.now(), finishedAt: null, log: [] },
      rest: { active: false, remaining: 0, total: 0 },
    }),

  finishWorkout: () =>
    set((s) => ({ active: { ...s.active, finishedAt: Date.now() }, rest: { active: false, remaining: 0, total: 0 } })),

  completeCurrentSet: (overrides) => {
    const s = get();
    const day = s.getActiveDay();
    if (!day) return;
    const exIdx = s.active.exerciseIndex;
    const setIdx = s.active.setIndex;
    const ex = day.exercises[exIdx];
    if (!ex) return;
    const current = ex.sets[setIdx];
    if (!current) return;
    const updatedSet: ExerciseSet = {
      ...current,
      completed: true,
      reps: overrides?.reps ?? current.reps,
      weight: overrides?.weight ?? current.weight,
      rpe: overrides?.rpe ?? current.rpe,
    };
    const newExercises = day.exercises.map((e, i) =>
      i === exIdx ? { ...e, sets: e.sets.map((st, j) => (j === setIdx ? updatedSet : st)) } : e,
    );
    const newDays = s.routine.days.map((d) => (d.id === day.id ? { ...d, exercises: newExercises } : d));

    const moreSets = setIdx + 1 < ex.sets.length;
    const moreExercises = exIdx + 1 < day.exercises.length;

    // bump muscle volume
    const vol = { ...s.muscleVolume };
    const work = (updatedSet.reps * updatedSet.weight) / 5000; // normalized
    vol[ex.primary] = Math.min(1, (vol[ex.primary] ?? 0) + work);
    ex.secondary?.forEach((m) => { vol[m] = Math.min(1, (vol[m] ?? 0) + work * 0.4); });

    set({
      routine: { ...s.routine, days: newDays },
      muscleVolume: vol,
      active: {
        ...s.active,
        setIndex: moreSets ? setIdx + 1 : 0,
        exerciseIndex: moreSets ? exIdx : moreExercises ? exIdx + 1 : exIdx,
        log: [...s.active.log, { exerciseId: ex.id, setIndex: setIdx, weight: updatedSet.weight, reps: updatedSet.reps, ts: Date.now() }],
      },
      rest: { active: true, remaining: ex.restSeconds, total: ex.restSeconds },
    });
  },

  nextExercise: () =>
    set((s) => {
      const day = s.getActiveDay();
      if (!day) return s;
      const next = Math.min(day.exercises.length - 1, s.active.exerciseIndex + 1);
      return { active: { ...s.active, exerciseIndex: next, setIndex: 0 } };
    }),

  prevExercise: () =>
    set((s) => ({ active: { ...s.active, exerciseIndex: Math.max(0, s.active.exerciseIndex - 1), setIndex: 0 } })),

  selectExercise: (i) => set((s) => ({ active: { ...s.active, exerciseIndex: i, setIndex: 0 } })),

  startRest: (seconds) => set({ rest: { active: true, remaining: seconds, total: seconds } }),

  tickRest: () =>
    set((s) => {
      if (!s.rest.active) return s;
      const next = s.rest.remaining - 1;
      if (next <= 0) return { rest: { active: false, remaining: 0, total: s.rest.total } };
      return { rest: { ...s.rest, remaining: next } };
    }),

  skipRest: () => set({ rest: { active: false, remaining: 0, total: 0 } }),

  toggleSupplement: (id) =>
    set((s) => ({ schedule: s.schedule.map((x) => (x.id === id ? { ...x, taken: !x.taken } : x)) })),

  bumpMuscleVolume: (muscle, amount) =>
    set((s) => ({ muscleVolume: { ...s.muscleVolume, [muscle]: Math.min(1, (s.muscleVolume[muscle] ?? 0) + amount) } })),
}));
