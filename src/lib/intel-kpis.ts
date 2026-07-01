import type { WorkoutLogRow } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface IntelKpi {
  value: number;      // absolute (rounded)
  deltaPct: number;   // vs previous 7d window (0 if no prev data)
  hasData: boolean;
}

interface Kpis {
  tonnageT: IntelKpi;      // toneladas
  prCount: IntelKpi;       // # exercises hitting a new top-weight in window
  avgRestS: IntelKpi;      // seconds
}

/**
 * Compute /intel KPIs from real workout_logs history.
 * Windows: [now-7d..now] vs [now-14d..now-7d].
 */
export function computeIntelKpis(history: Record<string, WorkoutLogRow[]>): Kpis {
  const now = Date.now();
  const w0 = now - 7 * DAY_MS;
  const w1 = now - 14 * DAY_MS;

  const cur = collect(history, w0, now);
  const prev = collect(history, w1, w0);
  // Historical baseline for PR detection: everything before the current window.
  const historical = maxByExerciseBefore(history, w0);

  const tonnageCurT = cur.tonnage / 1000;
  const tonnagePrevT = prev.tonnage / 1000;

  const prCur = countPRs(history, w0, now, historical);
  // For "delta" of PR count: PRs achieved in the previous window relative to their own past.
  const historicalPrev = maxByExerciseBefore(history, w1);
  const prPrev = countPRs(history, w1, w0, historicalPrev);

  return {
    tonnageT: {
      value: +tonnageCurT.toFixed(2),
      deltaPct: pctDelta(tonnageCurT, tonnagePrevT),
      hasData: cur.tonnage > 0,
    },
    prCount: {
      value: prCur,
      deltaPct: pctDelta(prCur, prPrev),
      hasData: cur.setCount > 0,
    },
    avgRestS: {
      value: Math.round(cur.avgRest),
      deltaPct: pctDelta(cur.avgRest, prev.avgRest),
      hasData: cur.restSamples > 0,
    },
  };
}

interface WindowAgg {
  tonnage: number;
  setCount: number;
  avgRest: number;
  restSamples: number;
}

function collect(history: Record<string, WorkoutLogRow[]>, from: number, to: number): WindowAgg {
  let tonnage = 0;
  let setCount = 0;
  let restSum = 0;
  let restSamples = 0;
  for (const logs of Object.values(history)) {
    // Sort ascending by timestamp to compute rest gaps.
    const inWindow = logs
      .filter((l) => {
        const t = new Date(l.performed_at).getTime();
        return t >= from && t < to;
      })
      .sort((a, b) => a.performed_at.localeCompare(b.performed_at));
    for (let i = 0; i < inWindow.length; i++) {
      const l = inWindow[i];
      tonnage += l.reps * l.weight;
      setCount++;
      if (i > 0) {
        const gap = (new Date(l.performed_at).getTime() - new Date(inWindow[i - 1].performed_at).getTime()) / 1000;
        // Only count as rest if gap is 15s..600s (else it's between exercises/sessions).
        if (gap >= 15 && gap <= 600) {
          restSum += gap;
          restSamples++;
        }
      }
    }
  }
  return {
    tonnage,
    setCount,
    avgRest: restSamples > 0 ? restSum / restSamples : 0,
    restSamples,
  };
}

function maxByExerciseBefore(
  history: Record<string, WorkoutLogRow[]>,
  before: number,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const [exId, logs] of Object.entries(history)) {
    let top = 0;
    for (const l of logs) {
      const t = new Date(l.performed_at).getTime();
      if (t < before && l.weight > top) top = l.weight;
    }
    if (top > 0) out.set(exId, top);
  }
  return out;
}

function countPRs(
  history: Record<string, WorkoutLogRow[]>,
  from: number,
  to: number,
  baseline: Map<string, number>,
): number {
  let count = 0;
  for (const [exId, logs] of Object.entries(history)) {
    const prev = baseline.get(exId) ?? 0;
    let hit = false;
    for (const l of logs) {
      const t = new Date(l.performed_at).getTime();
      if (t >= from && t < to && l.weight > prev) {
        hit = true;
        break;
      }
    }
    if (hit) count++;
  }
  return count;
}

function pctDelta(cur: number, prev: number): number {
  if (prev <= 0) return 0;
  return +(((cur - prev) / prev) * 100).toFixed(1);
}

/** Group weekly muscle sets into 6 display buckets (PEITO/COSTAS/PERNAS/OMBROS/BRAÇO/CORE). */
export function groupWeeklyVolume(weekly: Partial<Record<string, number>>): { m: string; v: number }[] {
  const get = (k: string) => weekly[k] ?? 0;
  return [
    { m: "PEITO",  v: get("chest") },
    { m: "COSTAS", v: get("lats") + get("traps") + get("lower-back") },
    { m: "PERNAS", v: get("quads") + get("hamstrings") + get("glutes") + get("calves") },
    { m: "OMBROS", v: get("shoulders") },
    { m: "BRAÇO",  v: get("biceps") + get("triceps") + get("forearms") },
    { m: "CORE",   v: get("core") + get("obliques") },
  ];
}
