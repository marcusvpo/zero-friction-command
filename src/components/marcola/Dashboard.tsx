import { Panel } from "./Panel";
import { TonnageChart, VolumeChart, FatigueChart } from "./Charts";
import { SupplementTimeline } from "./SupplementTimeline";
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
          <AnatomicalHeatmap />
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

/* Mock anatomical heatmap — SVG silhouette w/ glowing muscle zones */
function AnatomicalHeatmap() {
  const zones: { d: string; intensity: number }[] = [
    { d: "M70 55 q15 -6 30 0 v18 q-15 8 -30 0 z", intensity: 0.85 }, // chest
    { d: "M62 78 q10 -4 16 2 v22 q-10 4 -16 -2 z", intensity: 0.55 }, // l-abs
    { d: "M92 78 q10 -4 16 2 v22 q-10 4 -16 -2 z", intensity: 0.55 }, // r-abs
    { d: "M52 58 q-6 -2 -10 6 v18 q6 4 12 0 z", intensity: 0.75 }, // l-shoulder
    { d: "M128 58 q6 -2 10 6 v18 q-6 4 -12 0 z", intensity: 0.75 }, // r-shoulder
    { d: "M44 82 q-4 8 -2 26 q6 2 10 -4 v-22 z", intensity: 0.6 }, // l-bicep
    { d: "M136 82 q4 8 2 26 q-6 2 -10 -4 v-22 z", intensity: 0.6 }, // r-bicep
    { d: "M64 110 q12 -4 24 4 v34 q-12 6 -24 0 z", intensity: 0.95 }, // l-quad
    { d: "M92 110 q12 -4 24 4 v34 q-12 6 -24 0 z", intensity: 0.95 }, // r-quad
  ];
  return (
    <div className="flex items-center justify-center py-2">
      <svg viewBox="0 0 180 220" className="h-48 w-auto">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Silhouette */}
        <g stroke="oklch(0.55 0.12 210)" strokeWidth="0.8" fill="oklch(0.18 0.02 260)" opacity="0.9">
          <circle cx="90" cy="30" r="16" />
          <path d="M70 48 h40 v8 q0 6 -8 8 h-24 q-8 -2 -8 -8 z" />
          <path d="M52 56 q-12 4 -14 24 q-2 16 6 32 q4 -2 6 -8 v-30 q4 -10 14 -12 z" />
          <path d="M128 56 q12 4 14 24 q2 16 -6 32 q-4 -2 -6 -8 v-30 q-4 -10 -14 -12 z" />
          <path d="M62 72 h56 v40 q-8 6 -28 6 q-20 0 -28 -6 z" />
          <path d="M64 116 q-4 30 0 60 q6 4 14 2 q4 -30 8 -60 z" />
          <path d="M116 116 q4 30 0 60 q-6 4 -14 2 q-4 -30 -8 -60 z" />
          <path d="M68 178 q-4 18 -2 36 q6 2 10 0 q2 -18 4 -34 z" />
          <path d="M112 178 q4 18 2 36 q-6 2 -10 0 q-2 -18 -4 -34 z" />
        </g>
        {/* Heat zones */}
        {zones.map((z, i) => (
          <path
            key={i}
            d={z.d}
            fill="#00F0FF"
            opacity={z.intensity * 0.85}
            filter="url(#glow)"
          />
        ))}
        {/* Crosshair grid */}
        <g stroke="oklch(0.55 0.12 210)" strokeWidth="0.3" opacity="0.4">
          <line x1="0" y1="110" x2="180" y2="110" strokeDasharray="2 4" />
          <line x1="90" y1="0" x2="90" y2="220" strokeDasharray="2 4" />
        </g>
        {/* Labels */}
        <g fontFamily="JetBrains Mono, monospace" fontSize="6" fill="oklch(0.62 0.02 240)" letterSpacing="1">
          <text x="2" y="10">FRONT · 7d</text>
          <text x="140" y="216">SETS/MG</text>
        </g>
      </svg>
    </div>
  );
}
