import { Activity, Flame } from "lucide-react";

export function TopTelemetryBar() {
  return (
    <header className="sticky top-0 z-30 px-4 pt-6 pb-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="pulse-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 text-emerald-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan glow-cyan">
              Marcola Prime
            </span>
          </div>
          <span className="font-mono-tactical text-[10px] tracking-[0.18em] text-muted-foreground/80">
            SESSÃO · 00:42:15
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Telemetry icon={Activity} value="142" unit="BPM" label="FREQ" tone="text-rose-400" />
          <Telemetry icon={Flame} value="842" unit="KCAL" label="QUEIMA" tone="text-amber" />
        </div>
      </div>
    </header>
  );
}

function Telemetry({
  icon: Icon,
  value,
  unit,
  label,
  tone,
}: {
  icon: typeof Activity;
  value: string;
  unit: string;
  label: string;
  tone: string;
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
