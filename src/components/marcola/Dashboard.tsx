import { Panel } from "./Panel";
import { DeltaChart6w, VolumeChart } from "./Charts";
import { CoachIntel } from "./CoachIntel";
import { SupplementTimeline } from "./SupplementTimeline";
import { AnatomyHeatmap } from "./AnatomyHeatmap";
import { QuickLogDrawer } from "./QuickLogDrawer";
import { RestTimer } from "./RestTimer";
import { Flame, Crosshair, Timer, Play, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMarcolaStore, WEEKDAY_LABELS, WEEKDAY_LONG } from "@/store/marcola";

export function Dashboard() {
  const tonnage = useMarcolaStore((s) => s.getTonnage7d());
  const pr = useMarcolaStore((s) => s.getPRWatch());
  const avgRest = useMarcolaStore((s) => s.getAvgRest());
  const weeklyVolume = useMarcolaStore((s) => s.weeklyVolume);
  const fetchWeekly = useMarcolaStore((s) => s.fetchWeeklyVolume);
  const todayDay = useMarcolaStore((s) => s.getTodayDay());
  const lastWeekTonnage = useMarcolaStore((s) => s.lastWeekTonnage);
  const startWorkout = useMarcolaStore((s) => s.startWorkout);
  const weekdayMap = useMarcolaStore((s) => s.weekdayMap);
  const routine = useMarcolaStore((s) => s.routine);

  // Pull real workout volume from Supabase on mount; the heatmap re-renders
  // automatically as completeCurrentSet bumps it optimistically.
  useEffect(() => { void fetchWeekly(); }, [fetchWeekly]);

  const dow = new Date().getDay();
  const todayLabel = WEEKDAY_LONG[dow];

  // Estimate today's tonnage target as last_week * 1.02
  const targetTonnage = +(lastWeekTonnage * 1.02).toFixed(1);

  return (
    <main className="relative z-10 flex-1 space-y-4 px-4 pt-2 pb-28">
      <QuickLogDrawer />
      <RestTimer />

      {/* ─────────── TODAY'S FOCUS — Hero ─────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="glass-strong relative overflow-hidden rounded-2xl p-4"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-cyan" />
            <span className="font-mono-tactical text-[10px] uppercase tracking-[0.25em] text-cyan">
              OPERAÇÃO DE HOJE
            </span>
          </div>
          <span className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
            {todayLabel.toUpperCase()}
          </span>
        </header>

        {todayDay ? (
          <>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
                  {todayDay.code} · DIA DE OPERAÇÃO
                </div>
                <h2 className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-foreground">
                  {todayDay.name} <span className="text-cyan">DAY</span>
                </h2>
                <p className="truncate text-[11px] text-muted-foreground">{todayDay.focus}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">EX</div>
                <div className="font-mono-tactical text-xl font-semibold text-cyan">
                  {String(todayDay.exercises.length).padStart(2, "0")}
                </div>
              </div>
            </div>

            {/* Comparison vs last week */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <MicroStat label="Semana passada" value={`${lastWeekTonnage.toFixed(1)}k kg`} tone="text-muted-foreground" />
              <MicroStat label="Alvo hoje (+2%)" value={`${targetTonnage.toFixed(1)}k kg`} tone="text-cyan" />
              <MicroStat label="Δ" value="+2.0%" tone="text-emerald-400" icon={TrendingUp} />
            </div>

            {/* Massive primary CTA */}
            <Link to="/workout" onClick={() => startWorkout(todayDay.id)} className="mt-4 block">
              <motion.div
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -1 }}
                className="group relative flex min-h-[72px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan/90 via-cyan to-matrix/90 text-background"
                style={{ boxShadow: "0 0 40px rgba(0,240,255,0.55), inset 0 0 30px rgba(57,255,20,0.25)" }}
              >
                <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.35),transparent)] bg-[length:200%_100%] animate-[shimmer_3.5s_linear_infinite]" />
                <Play className="relative h-5 w-5" fill="currentColor" />
                <span className="font-mono-tactical relative text-sm font-bold uppercase tracking-[0.22em]">
                  Initialize Today's Workout
                </span>
                <ArrowRight className="relative h-4 w-4" />
              </motion.div>
            </Link>
          </>
        ) : (
          <div className="mt-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Dia de Descanso</h2>
            <p className="text-[11px] text-muted-foreground">
              Nenhuma operação atribuída para {todayLabel}. Configure no Routine Builder.
            </p>
            <Link to="/builder" className="mt-3 inline-flex">
              <motion.span
                whileTap={{ scale: 0.96 }}
                className="glass flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-cyan ring-1 ring-cyan/40"
              >
                <span className="font-mono-tactical text-[10px] tracking-widest">ABRIR BUILDER</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </motion.span>
            </Link>
          </div>
        )}

        {/* Mini week map */}
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
            const id = weekdayMap[wd];
            const day = routine.days.find((d) => d.id === id);
            const isToday = wd === dow;
            return (
              <div
                key={wd}
                className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 text-center ${
                  isToday ? "bg-cyan/15 ring-1 ring-cyan/50" : "bg-white/[0.03]"
                }`}
              >
                <span className={`font-mono-tactical text-[9px] tracking-widest ${isToday ? "text-cyan" : "text-muted-foreground"}`}>
                  {WEEKDAY_LABELS[wd]}
                </span>
                <span className={`font-mono-tactical text-[10px] font-semibold ${
                  day ? (isToday ? "text-foreground" : "text-foreground/80") : "text-muted-foreground/40"
                }`}>
                  {day ? day.code : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ─────────── KPI strip ─────────── */}
      <motion.section
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-3 gap-2.5"
      >
        <KpiCard label="Tonelagem" value={tonnage.toFixed(1)} unit="t" icon={Flame} tone="cyan" delta="+8.2%" />
        <KpiCard label="PR Watch" value={String(pr).padStart(2, "0")} unit="alv" icon={Crosshair} tone="emerald" delta="armado" />
        <KpiCard label="Rest Avg" value={String(avgRest)} unit="s" icon={Timer} tone="amber" delta="−4s" />
      </motion.section>

      {/* ─────────── Secondary widgets ─────────── */}
      <Panel title="Tonelagem · Δ 6 semanas" code="M4.2" status="ACTIVE">
        <DeltaChart6w />
      </Panel>

      <CoachIntel />

      <Panel title="Mapa Anatômico Holográfico" code="M4.1" status="ACTIVE">
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

function MicroStat({
  label, value, tone, icon: Icon,
}: { label: string; value: string; tone: string; icon?: typeof TrendingUp }) {
  return (
    <div className="glass rounded-lg px-2 py-1.5">
      <div className="font-mono-tactical text-[8px] uppercase tracking-widest text-muted-foreground/80">{label}</div>
      <div className={`mt-0.5 flex items-center gap-1 font-mono-tactical text-[11px] font-semibold ${tone}`}>
        {Icon && <Icon className="h-3 w-3" />}
        {value}
      </div>
    </div>
  );
}

const TONE_MAP = {
  cyan:    { text: "text-cyan",        icon: "text-cyan" },
  emerald: { text: "text-emerald-400", icon: "text-emerald-400" },
  amber:   { text: "text-amber",       icon: "text-amber" },
} as const;

function KpiCard({
  label, value, unit, icon: Icon, tone, delta,
}: {
  label: string; value: string; unit: string;
  icon: typeof Flame; tone: keyof typeof TONE_MAP; delta: string;
}) {
  const t = TONE_MAP[tone];
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
        <span className="font-mono-tactical text-xl font-semibold leading-none tracking-tight text-foreground">{value}</span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
      <div className={`mt-1.5 font-mono-tactical text-[10px] tracking-tight ${t.text}`}>{delta}</div>
    </motion.div>
  );
}
