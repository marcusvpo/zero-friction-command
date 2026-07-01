import { Dumbbell, Layers, CloudOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { subscribeQueue } from "@/lib/sync-queue";
import { useMarcolaStore } from "@/store/marcola";

/**
 * TopTelemetryBar — telemetria REAL derivada do store.
 */
export function TopTelemetryBar() {
  const [pending, setPending] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Subscribe to raw state (stable refs) and derive telemetry via useMemo.
  // Selecting `s.getSessionTelemetry().*` returns a fresh object each call →
  // triggers React's "getSnapshot should be cached" + infinite update loop.
  const active = useMarcolaStore((s) => s.active);
  const lastSummary = useMarcolaStore((s) => s.lastSummary);
  const routine = useMarcolaStore((s) => s.routine);

  const { volumeKg, sets, isLive } = useMemo(() => {
    const live = active.startedAt !== null && active.finishedAt === null;
    if (live) {
      let vol = 0, s = 0;
      for (const e of active.log) {
        if (e.isWarmup) continue;
        vol += e.reps * e.weight; s += 1;
      }
      return { volumeKg: Math.round(vol), sets: s, isLive: true };
    }
    if (lastSummary) {
      return { volumeKg: lastSummary.tonnageKg, sets: lastSummary.setsCompleted, isLive: false };
    }
    let vol = 0, s = 0;
    for (const day of routine.days) for (const ex of day.exercises) for (const st of ex.sets) {
      if (st.completed && !st.isWarmup) { vol += st.reps * st.weight; s += 1; }
    }
    return { volumeKg: Math.round(vol), sets: s, isLive: false };
  }, [active, lastSummary, routine]);

  useEffect(() => {
    setMounted(true);
    return subscribeQueue(setPending);
  }, []);

  // Avoid SSR/client hydration mismatch: neutral labels until mounted.
  const showLive = mounted && isLive;
  const volLabel = showLive ? "VOL · SESSÃO" : "VOL · ÚLTIMO";
  const setsLabel = showLive ? "SETS · LIVE" : "SETS · ÚLTIMO";

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-background/70 px-4 pt-6 pb-4 backdrop-blur-xl">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="pulse-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 text-emerald-400" />
            <span className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan glow-cyan">
              Marcola Prime
            </span>
          </div>
          {pending > 0 ? (
            <span className="font-mono-tactical flex items-center gap-1 text-[10px] tracking-[0.18em] text-amber">
              <CloudOff className="h-3 w-3 shrink-0" />
              ↑ {pending} pendente{pending > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="font-mono-tactical truncate text-[10px] tracking-[0.18em] text-muted-foreground/80">
              {showLive ? "SESSÃO · LIVE" : "SISTEMA · ONLINE"}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Telemetry
            icon={Dumbbell}
            value={volumeKg > 0 ? volumeKg.toLocaleString("pt-BR") : "—"}
            unit="KG"
            label={volLabel}
            tone={showLive ? "text-matrix" : "text-cyan"}
          />
          <Telemetry
            icon={Layers}
            value={sets > 0 ? String(sets) : "—"}
            unit="N"
            label={setsLabel}
            tone="text-amber"
          />
        </div>
      </div>
    </header>
  );
}

function Telemetry({
  icon: Icon, value, unit, label, tone,
}: {
  icon: typeof Dumbbell; value: string; unit: string; label: string; tone: string;
}) {
  return (
    <div className="flex flex-col items-end">
      <div className={`flex items-center gap-1 ${tone}`}>
        <Icon className="h-3 w-3" />
        <span className="font-mono-tactical text-[11px] font-medium tracking-tight">
          {value}
          <span className="ml-0.5 text-[9px] text-muted-foreground">{unit}</span>
        </span>
      </div>
      <span className="font-mono-tactical text-[8px] tracking-[0.2em] text-muted-foreground/70">
        {label}
      </span>
    </div>
  );
}
