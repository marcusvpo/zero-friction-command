import type { Routine, MuscleId, WorkoutDay } from "@/store/marcola";
import type { WorkoutLogRow } from "@/lib/db";

export type InsightSeverity = "ok" | "warn" | "crit";

export interface Insight {
  severity: InsightSeverity;
  code: string;
  title: string;
  detail: string;
  action?: { label: string; to: string };
}

const PUSH: MuscleId[] = ["chest", "shoulders", "triceps"];
const PULL: MuscleId[] = ["lats", "traps", "biceps", "forearms"];
const COMPOUND_GROUPS: MuscleId[] = ["chest", "lats", "quads", "hamstrings"];

const LABELS: Record<MuscleId, string> = {
  chest: "Peito", shoulders: "Ombros", biceps: "Bíceps", triceps: "Tríceps",
  forearms: "Antebraço", core: "Core", obliques: "Oblíquos",
  quads: "Quadríceps", hamstrings: "Posterior", glutes: "Glúteo",
  calves: "Panturrilha", lats: "Costas (Lats)", traps: "Trapézio",
  "lower-back": "Lombar", neck: "Pescoço",
};

/**
 * Counts working sets per muscle group across the whole weekly routine.
 * Cardio (calves blocks from treadmill) are excluded heuristically by
 * skipping exercises whose only set has weight=0 AND reps>=15 minutes flag.
 */
function setsPerMuscle(days: WorkoutDay[]): Record<MuscleId, number> {
  const acc = {} as Record<MuscleId, number>;
  for (const day of days) {
    for (const ex of day.exercises) {
      const working = ex.sets.filter((s) => !s.isWarmup);
      if (working.length === 0) continue;
      // Skip cardio block (treadmill) — single set, weight=0, reps>=15 (minutes).
      if (ex.primary === "calves" && working.length === 1 && working[0].weight === 0 && working[0].reps >= 15) continue;
      acc[ex.primary] = (acc[ex.primary] ?? 0) + working.length;
      if (ex.secondary) {
        for (const m of ex.secondary) {
          // Secondary contributes half (rounded later)
          acc[m] = (acc[m] ?? 0) + working.length * 0.5;
        }
      }
    }
  }
  return acc;
}

function freqPerMuscle(days: WorkoutDay[]): Record<MuscleId, number> {
  const acc = {} as Record<MuscleId, number>;
  for (const day of days) {
    const seen = new Set<MuscleId>();
    for (const ex of day.exercises) {
      const working = ex.sets.filter((s) => !s.isWarmup);
      if (working.length === 0) continue;
      if (ex.primary === "calves" && working[0]?.weight === 0 && working[0]?.reps >= 15) continue;
      seen.add(ex.primary);
    }
    for (const m of seen) acc[m] = (acc[m] ?? 0) + 1;
  }
  return acc;
}

function sumGroup(volume: Record<MuscleId, number>, group: MuscleId[]): number {
  return group.reduce((sum, m) => sum + (volume[m] ?? 0), 0);
}

export function analyzeRoutine(
  routine: Routine,
  history: Record<string, WorkoutLogRow[]>,
): Insight[] {
  const insights: Insight[] = [];
  const volume = setsPerMuscle(routine.days);
  const freq = freqPerMuscle(routine.days);

  // 1. Volume per group (10-20 sweet spot)
  const CHECKED: MuscleId[] = ["chest", "lats", "shoulders", "biceps", "triceps", "quads", "hamstrings"];
  for (const m of CHECKED) {
    const sets = Math.round(volume[m] ?? 0);
    if (sets <= 0) {
      insights.push({
        severity: "warn",
        code: `vol-${m}-zero`,
        title: `${LABELS[m]} sem estímulo direto`,
        detail: "Grupo não recebe sets diretos na divisão atual.",
        action: { label: "Abrir Builder", to: "/builder" },
      });
      continue;
    }
    if (sets < 10) {
      insights.push({
        severity: "warn",
        code: `vol-${m}-low`,
        title: `${LABELS[m]}: volume baixo`,
        detail: `${sets} sets/semana — abaixo do mínimo recomendado (10).`,
        action: { label: "Abrir Builder", to: "/builder" },
      });
    } else if (sets > 28) {
      insights.push({
        severity: "crit",
        code: `vol-${m}-overreach`,
        title: `${LABELS[m]}: risco de overreaching`,
        detail: `${sets} sets/semana — bem acima da MRV (~22). Considere reduzir.`,
        action: { label: "Abrir Builder", to: "/builder" },
      });
    } else if (sets > 22) {
      insights.push({
        severity: "warn",
        code: `vol-${m}-high`,
        title: `${LABELS[m]}: volume alto`,
        detail: `${sets} sets/semana — acima da faixa ótima (10–20).`,
      });
    } else {
      insights.push({
        severity: "ok",
        code: `vol-${m}-ok`,
        title: `${LABELS[m]} dentro da faixa`,
        detail: `${sets} sets/semana — zona ótima de hipertrofia.`,
      });
    }
  }

  // 2. Frequency for compound groups
  for (const m of COMPOUND_GROUPS) {
    const f = freq[m] ?? 0;
    if (f === 0) continue;
    if (f < 2) {
      insights.push({
        severity: "warn",
        code: `freq-${m}`,
        title: `${LABELS[m]}: frequência 1×/semana`,
        detail: "Grupos grandes respondem melhor com 2× ou mais sessões semanais.",
        action: { label: "Abrir Builder", to: "/builder" },
      });
    }
  }

  // 3. Push:Pull ratio
  const pushVol = sumGroup(volume, PUSH);
  const pullVol = sumGroup(volume, PULL);
  if (pushVol > 0 && pullVol > 0) {
    const ratio = pushVol / pullVol;
    const dev = Math.abs(ratio - 1);
    if (dev > 0.3) {
      insights.push({
        severity: "warn",
        code: "ratio-push-pull",
        title: `Desequilíbrio Push:Pull`,
        detail: `${Math.round(pushVol)} push vs ${Math.round(pullVol)} pull (razão ${ratio.toFixed(2)}). Alvo: ~1.0.`,
        action: { label: "Abrir Builder", to: "/builder" },
      });
    } else {
      insights.push({
        severity: "ok",
        code: "ratio-push-pull-ok",
        title: "Push:Pull equilibrado",
        detail: `Razão ${ratio.toFixed(2)} — postura preservada.`,
      });
    }
  }

  // 4. Legs isolated (only one leg day, no quad/ham overlap elsewhere)
  const quadFreq = freq.quads ?? 0;
  const hamFreq = freq.hamstrings ?? 0;
  if (quadFreq <= 1 && hamFreq <= 1) {
    insights.push({
      severity: "warn",
      code: "legs-isolated",
      title: "Pernas treinadas 1×/semana",
      detail: "Para hipertrofia de quadríceps/posterior, 2× tende a render mais.",
      action: { label: "Abrir Builder", to: "/builder" },
    });
  }

  // 5. Stagnation: same top weight on 3+ consecutive sessions per exercise
  const stagnated: string[] = [];
  for (const day of routine.days) {
    for (const ex of day.exercises) {
      const logs = history[ex.id] ?? [];
      if (logs.length < 3) continue;
      // Group by date, take max weight
      const byDate = new Map<string, number>();
      for (const l of logs) {
        const d = l.performed_at.slice(0, 10);
        const cur = byDate.get(d) ?? 0;
        if (l.weight > cur) byDate.set(d, l.weight);
      }
      const last3 = [...byDate.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 3)
        .map(([, w]) => w);
      if (last3.length === 3 && last3[0] === last3[1] && last3[1] === last3[2] && last3[0] > 0) {
        stagnated.push(ex.name);
      }
    }
  }
  if (stagnated.length > 0) {
    insights.push({
      severity: "warn",
      code: "stagnation",
      title: `Estagnação detectada (${stagnated.length})`,
      detail: `${stagnated.slice(0, 3).join(" · ")}${stagnated.length > 3 ? "…" : ""}. Considere deload ou variação.`,
    });
  }

  // Sort: crit → warn → ok
  const rank: Record<InsightSeverity, number> = { crit: 0, warn: 1, ok: 2 };
  return insights.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function severityCounts(insights: Insight[]) {
  return insights.reduce(
    (acc, i) => ({ ...acc, [i.severity]: acc[i.severity] + 1 }),
    { ok: 0, warn: 0, crit: 0 } as Record<InsightSeverity, number>,
  );
}
