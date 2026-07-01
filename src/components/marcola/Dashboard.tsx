import { Panel } from "./Panel";
import { DeltaChart6w, VolumeChart } from "./Charts";
import { CoachIntel } from "./CoachIntel";
import { SupplementTimeline } from "./SupplementTimeline";
import { AnatomyHeatmap } from "./AnatomyHeatmap";
import { QuickLogDrawer } from "./QuickLogDrawer";
import { RestTimer } from "./RestTimer";
import { Flame, Crosshair, Timer, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useMarcolaStore } from "@/store/marcola";
import { computeIntelKpis, type IntelKpi } from "@/lib/intel-kpis";

export function Dashboard() {
  const weeklyVolume = useMarcolaStore((s) => s.weeklyVolume);
  const fetchWeekly = useMarcolaStore((s) => s.fetchWeeklyVolume);
  const history = useMarcolaStore((s) => s.history);

  useEffect(() => { void fetchWeekly(); }, [fetchWeekly]);

  const kpis = useMemo(() => computeIntelKpis(history), [history]);

  return (
    <main className="relative z-10 flex-1 space-y-4 px-4 pt-2 pb-28">
      <QuickLogDrawer />
      <RestTimer />

      {/* KPI strip — 100% real */}
      <motion.section
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-3 gap-2.5"
      >
        <KpiCard label="Tonelagem" unit="t"   icon={Flame}     tone="cyan"    kpi={kpis.tonnageT} decimals={2} />
        <KpiCard label="PRs 7d"    unit="alv" icon={Crosshair} tone="emerald" kpi={kpis.prCount}  decimals={0} />
        <KpiCard label="Rest Avg"  unit="s"   icon={Timer}     tone="amber"   kpi={kpis.avgRestS} decimals={0} />
      </motion.section>

      <Panel title="Tonelagem · Δ 6 semanas" code="M4.2" status="ACTIVE">
        <DeltaChart6w />
      </Panel>

      <CoachIntel />

      <Panel title="Mapa Anatômico · Térmico" code="M4.1" status="ACTIVE">
        <AnatomyHeatmap data={weeklyVolume} />
      </Panel>

      <Panel title="Volume por Grupo" code="sets/7d" status="OK">
        <VolumeChart />
      </Panel>

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
  cyan:    { text: "text-cyan",        icon: "text-cyan" },
  emerald: { text: "text-emerald-400", icon: "text-emerald-400" },
  amber:   { text: "text-amber",       icon: "text-amber" },
} as const;

function KpiCard({
  label, unit, icon: Icon, tone, kpi, decimals,
}: {
  label: string; unit: string;
  icon: typeof Flame; tone: keyof typeof TONE_MAP;
  kpi: IntelKpi; decimals: number;
}) {
  const t = TONE_MAP[tone];
  const display = kpi.hasData ? kpi.value.toFixed(decimals) : "—";
  const positive = kpi.deltaPct > 0;
  const negative = kpi.deltaPct < 0;
  const DeltaIcon = positive ? TrendingUp : negative ? TrendingDown : Minus;
  const deltaColor = positive ? "text-emerald-400" : negative ? "text-rose-400" : "text-muted-foreground";
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 22 } } }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      className="glass min-h-[88px] rounded-2xl p-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${t.icon}`} />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`font-mono-tactical text-xl font-semibold leading-none tracking-tight ${kpi.hasData ? "text-foreground" : "text-muted-foreground"}`}>
          {display}
        </span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
      {kpi.hasData ? (
        <div className={`mt-1.5 flex items-center gap-1 font-mono-tactical text-[10px] ${deltaColor}`}>
          <DeltaIcon className="h-3 w-3" />
          {kpi.deltaPct === 0 ? "estável" : `${positive ? "+" : ""}${kpi.deltaPct.toFixed(1)}%`}
        </div>
      ) : (
        <div className={`mt-1.5 font-mono-tactical text-[10px] ${t.text} opacity-60`}>
          sem dados
        </div>
      )}
    </motion.div>
  );
}
