import { Dumbbell, Layers, CloudOff } from "lucide-react";
import { useEffect, useState } from "react";
import { subscribeQueue } from "@/lib/sync-queue";
import { useMarcolaStore } from "@/store/marcola";

/**
 * TopTelemetryBar — telemetria REAL derivada do store.
 * Sem placeholders (BPM/KCAL removidos — não há sensor integrado).
 */
export function TopTelemetryBar() {
  const [pending, setPending] = useState(0);
  // Re-render leve: getSessionTelemetry é selector estável quando active/log/lastSummary não mudam.
  const telemetry = useMarcolaStore((s) => s.getSessionTelemetry());

  useEffect(() => subscribeQueue(setPending), []);

  const volLabel = telemetry.isLive ? "VOL · SESSÃO" : "VOL · ÚLTIMO";
  const setsLabel = telemetry.isLive ? "SETS · LIVE" : "SETS · ÚLTIMO";

  return (
    <header className="sticky top-0 z-30 px-4 pt-6 pb-4">
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
              {telemetry.isLive ? "SESSÃO · LIVE" : "SISTEMA · ONLINE"}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Telemetry
            icon={Dumbbell}
            value={telemetry.volumeKg > 0 ? telemetry.volumeKg.toLocaleString("pt-BR") : "—"}
            unit="KG"
            label={volLabel}
            tone={telemetry.isLive ? "text-matrix" : "text-cyan"}
          />
          <Telemetry
            icon={Layers}
            value={telemetry.sets > 0 ? String(telemetry.sets) : "—"}
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
