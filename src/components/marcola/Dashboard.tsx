import { Panel } from "./Panel";
import { TonnageChart, VolumeChart, FatigueChart } from "./Charts";
import { SupplementTimeline } from "./SupplementTimeline";
import { AnatomicalBody } from "./AnatomicalBody";
import { QuickLogDrawer } from "./QuickLogDrawer";
import { Flame, Crosshair, Timer, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export function Dashboard() {
  return (
    <main className="relative z-10 flex-1 space-y-4 px-4 pt-2 pb-28">
      {/* Quick log launcher */}
      <QuickLogDrawer />

      {/* Hero KPI strip */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}
        className="grid grid-cols-3 gap-2.5"
      >
        <KpiCard label="Tonelagem" value="12.4" unit="t" icon={Flame} tone="cyan" delta="+8.2%" />
        <KpiCard label="PR Watch" value="03" unit="alv" icon={Crosshair} tone="emerald" delta="armado" />
        <KpiCard label="Rest Avg" value="92" unit="s" icon={Timer} tone="amber" delta="−4s" />
      </motion.section>

      {/* Tonnage */}
      <Panel title="Tonelagem · 7d" code="M4.2" status="ACTIVE">
        <TonnageChart />
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Σ Semana
          </span>
          <span className="flex items-center gap-1.5 text-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono-tactical text-sm font-medium">57.200 kg</span>
          </span>
        </div>
      </Panel>

      {/* Body + Volume */}
      <Panel title="Mapa Anatômico" code="M4.1" status="ACTIVE">
        <AnatomicalBody />
      </Panel>

      <Panel title="Volume por Grupo" code="sets/7d" status="OK">
        <VolumeChart />
      </Panel>

      {/* Fatigue */}
      <Panel title="Índice de Fadiga" code="M4.4" status="WARN">
        <FatigueChart />
        <div className="mt-3 grid grid-cols-5 gap-1.5 border-t border-border/60 pt-3">
          {["SEG", "TER", "QUA", "QUI", "SEX"].map((d, i) => {
            const levels = [12, 24, 38, 56, 71];
            const f = levels[i];
            const tone =
              f < 30 ? "text-emerald-400" : f < 60 ? "text-cyan" : "text-amber";
            return (
              <div key={d} className="text-center">
                <div className={`font-mono-tactical text-[11px] font-medium tracking-tight ${tone}`}>
                  {f}%
                </div>
                <div className="mt-0.5 font-mono-tactical text-[9px] tracking-widest text-muted-foreground/70">
                  {d}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Supplement Logistics */}
      <Panel title="Logística · Suplementação" code="M5" status="OK">
        <SupplementTimeline />
      </Panel>

      <footer className="pt-2 text-center">
        <span className="font-mono-tactical text-[9px] uppercase tracking-[0.28em] text-muted-foreground/60">
          marcola prime · v1.0
        </span>
      </footer>
    </main>
  );
}

const TONE_MAP = {
  cyan:    { text: "text-cyan",          ring: "ring-cyan/20",          icon: "text-cyan" },
  emerald: { text: "text-emerald-400",   ring: "ring-emerald-400/20",   icon: "text-emerald-400" },
  amber:   { text: "text-amber",         ring: "ring-amber/20",         icon: "text-amber" },
} as const;

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
  tone: keyof typeof TONE_MAP;
  delta: string;
}) {
  const t = TONE_MAP[tone];
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 22 } },
      }}
      whileHover={{ y: -2 }}
      className="glass rounded-2xl p-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-3.5 w-3.5 ${t.icon}`} />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-mono-tactical text-xl font-semibold leading-none tracking-tight text-foreground">
          {value}
        </span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
      <div className={`mt-1.5 font-mono-tactical text-[10px] tracking-tight ${t.text}`}>
        {delta}
      </div>
    </motion.div>
  );
}
