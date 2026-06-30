import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, AlertOctagon, ArrowRight, Activity } from "lucide-react";
import { useMarcolaStore } from "@/store/marcola";
import { analyzeRoutine, severityCounts, type Insight, type InsightSeverity } from "@/lib/coach-intel";
import { Panel } from "./Panel";

const SEVERITY_META: Record<InsightSeverity, { icon: typeof ShieldCheck; color: string; bg: string; ring: string; label: string }> = {
  ok:   { icon: ShieldCheck,    color: "text-matrix",     bg: "bg-matrix/5",  ring: "ring-matrix/20", label: "OK" },
  warn: { icon: AlertTriangle,  color: "text-amber",      bg: "bg-amber/5",   ring: "ring-amber/25",  label: "WARN" },
  crit: { icon: AlertOctagon,   color: "text-rose-400",   bg: "bg-rose-500/5", ring: "ring-rose-500/25", label: "CRIT" },
};

export function CoachIntel() {
  const routine = useMarcolaStore((s) => s.routine);
  const history = useMarcolaStore((s) => s.history);
  const [expanded, setExpanded] = useState(false);

  const insights = useMemo(() => analyzeRoutine(routine, history), [routine, history]);
  const counts = useMemo(() => severityCounts(insights), [insights]);

  const visible = expanded ? insights : insights.slice(0, 6);

  return (
    <Panel title="Coach Intel" code="M6" status={counts.crit > 0 ? "ALERT" : counts.warn > 0 ? "REVIEW" : "OK"}>
      <div className="space-y-3">
        <header className="flex items-center justify-between gap-2 font-mono-tactical text-[10px] tracking-widest">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-3 w-3 text-cyan" />
            <span>DIAGNÓSTICO DE DIVISÃO · VOLUME · HISTÓRICO</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge tone="matrix" value={counts.ok} label="OK" />
            <Badge tone="amber"  value={counts.warn} label="WRN" />
            <Badge tone="rose"   value={counts.crit} label="CRT" />
          </div>
        </header>

        {insights.length === 0 ? (
          <div className="rounded-xl bg-white/[0.03] p-4 text-center text-[12px] text-muted-foreground">
            Sem diagnósticos disponíveis.
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map((ins) => (
              <InsightCard key={ins.code} insight={ins} />
            ))}
          </ul>
        )}

        {insights.length > 6 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="font-mono-tactical w-full rounded-lg border border-white/10 bg-white/[0.02] py-2 text-[10px] uppercase tracking-widest text-cyan hover:bg-cyan/10"
          >
            {expanded ? "Recolher" : `Ver todos (${insights.length})`}
          </button>
        )}
      </div>
    </Panel>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const meta = SEVERITY_META[insight.severity];
  const Icon = meta.icon;
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className={`flex items-start gap-3 rounded-xl p-3 ring-1 ${meta.bg} ${meta.ring}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.color}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-mono-tactical text-[9px] tracking-widest ${meta.color}`}>{meta.label}</span>
          <h4 className="truncate text-[13px] font-semibold text-foreground">{insight.title}</h4>
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{insight.detail}</p>
        {insight.action && (
          <Link
            to={insight.action.to}
            className="font-mono-tactical mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-cyan hover:text-cyan/80"
          >
            {insight.action.label} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </motion.li>
  );
}

function Badge({ tone, value, label }: { tone: "matrix" | "amber" | "rose"; value: number; label: string }) {
  const color = tone === "matrix" ? "text-matrix" : tone === "amber" ? "text-amber" : "text-rose-400";
  return (
    <span className={`flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 ${color}`}>
      <span className="font-mono-tactical text-[11px] font-bold">{value}</span>
      <span className="text-[8px] tracking-widest opacity-70">{label}</span>
    </span>
  );
}
