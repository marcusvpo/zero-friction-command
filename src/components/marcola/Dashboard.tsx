import { Panel } from "./Panel";
import { TonnageChart, VolumeChart, FatigueChart } from "./Charts";
import { SupplementTimeline } from "./SupplementTimeline";
import { AnatomicalBody } from "./AnatomicalBody";
import { Flame, Crosshair, Timer } from "lucide-react";

export function Dashboard() {
  return (
    <main className="relative z-10 flex-1 space-y-3 px-3 py-4">
      {/* Hero KPI strip */}
      <section className="grid grid-cols-3 gap-2">
        <KpiCard label="TONELAGEM" value="12.4" unit="T" icon={Flame} tone="cyan" delta="+8.2%" />
        <KpiCard label="PR WATCH" value="03" unit="ALV" icon={Crosshair} tone="matrix" delta="ARMADO" />
        <KpiCard label="REST AVG" value="92" unit="s" icon={Timer} tone="amber" delta="-4s" />
      </section>

      {/* Tonnage */}
      <Panel title="TONELAGEM · 7d" code="M4.2" status="ACTIVE">
        <TonnageChart />
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <span className="font-mono-tactical text-[9px] uppercase tracking-widest text-muted-foreground">
            Σ TOTAL · SEMANA
          </span>
          <span className="font-mono-tactical glow-cyan text-sm text-cyan">57.200 kg</span>
        </div>
      </Panel>

      {/* Heatmap + Volume */}
      <div className="grid grid-cols-1 gap-3">
        <Panel title="MAPA ANATÔMICO" code="M4.1" status="ACTIVE">
          <AnatomicalBody />
        </Panel>

        <Panel title="VOLUME · GRUPO" code="SETS/7d" status="OK">
          <VolumeChart />
        </Panel>
      </div>

      {/* Fatigue */}
      <Panel title="ÍNDICE DE FADIGA" code="M4.4" status="WARN">
        <FatigueChart />
        <div className="mt-2 grid grid-cols-5 gap-1 border-t border-border pt-2">
          {["SEG", "TER", "QUA", "QUI", "SEX"].map((d, i) => {
            const levels = [12, 24, 38, 56, 71];
            const f = levels[i];
            const tone = f < 30 ? "matrix" : f < 60 ? "cyan" : "amber";
            return (
              <div key={d} className="text-center">
                <div className={`font-mono-tactical text-[9px] tracking-widest text-${tone} glow-${tone}`}>
                  {f}%
                </div>
                <div className="font-mono-tactical text-[8px] tracking-widest text-muted-foreground">
                  {d}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Supplement Logistics */}
      <Panel title="LOGÍSTICA · SUPLEMENTAÇÃO" code="M5" status="OK">
        <SupplementTimeline />
      </Panel>

      <footer className="pt-2 pb-1 text-center">
        <span className="font-mono-tactical text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
          MARCOLA PRIME · v1.0 · PHASE 1 SHELL
        </span>
      </footer>
    </main>
  );
}

function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  tone,
  delta,
}: {
  label: string;
  value: string;
  unit: string;
  icon: typeof Flame;
  tone: "cyan" | "matrix" | "amber";
  delta: string;
}) {
  const toneText = {
    cyan: "text-cyan glow-cyan",
    matrix: "text-matrix glow-matrix",
    amber: "text-amber glow-amber",
  }[tone];
  return (
    <div className="panel panel-corners rounded-sm p-2">
      <div className="flex items-center justify-between">
        <span className="font-mono-tactical text-[9px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-3 w-3 ${toneText}`} />
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={`font-mono-tactical text-xl leading-none ${toneText}`}>{value}</span>
        <span className="font-mono-tactical text-[10px] text-muted-foreground">{unit}</span>
      </div>
      <div className={`font-mono-tactical mt-0.5 text-[9px] tracking-widest ${toneText}`}>
        ▲ {delta}
      </div>
    </div>
  );
}

