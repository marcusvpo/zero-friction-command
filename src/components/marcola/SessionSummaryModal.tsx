import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Clock, Dumbbell, Flame, X } from "lucide-react";
import type { SessionSummary, SessionScore } from "@/store/marcola";

interface Props {
  summary: SessionSummary | null;
  onClose: () => void;
}

export function SessionSummaryModal({ summary, onClose }: Props) {
  return (
    <AnimatePresence>
      {summary && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative w-full max-w-sm overflow-hidden rounded-2xl border border-cyan/20 p-5"
            style={{ boxShadow: "0 0 60px rgba(0,240,255,0.25)" }}
          >
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan to-transparent" />
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-matrix">
              <Trophy className="h-5 w-5" />
              <span className="font-mono-tactical text-[11px] tracking-[0.3em] uppercase">Sessão Concluída</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-foreground">Missão Cumprida</h2>

            {/* ──────────── Score ring + components ──────────── */}
            <ScoreBlock score={summary.score} />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard icon={Clock}    label="Duração"    value={formatDuration(summary.durationMs)} tone="cyan" />
              <StatCard icon={Dumbbell} label="Tonelagem"  value={`${(summary.tonnageKg/1000).toFixed(2)} t`} tone="matrix" />
              <StatCard icon={Flame}    label="Sets úteis" value={String(summary.setsCompleted)} tone="amber" />
              <StatCard icon={Trophy}   label="Top sets"   value={String(summary.prs.length)} tone="cyan" />
            </div>

            {summary.warmupSets > 0 && (
              <div className="mt-2 text-center font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
                + {summary.warmupSets} sets de aquecimento (não contam)
              </div>
            )}

            {summary.prs.length > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto rounded-xl bg-white/[0.03] p-2">
                <div className="mb-1.5 font-mono-tactical text-[10px] tracking-widest text-cyan">PICOS DA SESSÃO</div>
                <ul className="space-y-1">
                  {summary.prs.map((pr) => (
                    <li key={pr.exerciseId} className="flex items-center justify-between gap-2 rounded-md bg-white/[0.02] px-2 py-1.5">
                      <span className="truncate text-[12px] text-foreground">{pr.exerciseName}</span>
                      <span className="font-mono-tactical shrink-0 text-[11px] text-matrix">
                        {pr.reps}× {pr.weight}kg
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-matrix via-cyan to-matrix font-mono-tactical text-sm font-bold uppercase tracking-[0.25em] text-background"
              style={{ boxShadow: "0 0 28px rgba(57,255,20,0.45)" }}
            >
              Fechar Relatório
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof Trophy; label: string; value: string; tone: "cyan" | "matrix" | "amber" }) {
  const color = tone === "cyan" ? "text-cyan" : tone === "matrix" ? "text-matrix" : "text-amber";
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="font-mono-tactical text-[9px] tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className={`mt-1 font-mono-tactical text-xl font-bold leading-none ${color}`}>{value}</div>
    </div>
  );
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m`;
  return `${m}:${String(sec).padStart(2,"0")}`;
}

function scoreTone(v: number): { stroke: string; text: string } {
  if (v >= 85) return { stroke: "#39FF14", text: "text-matrix" };
  if (v >= 60) return { stroke: "#00F0FF", text: "text-cyan" };
  return { stroke: "#FFB300", text: "text-amber" };
}

function ScoreBlock({ score }: { score: SessionScore }) {
  const tone = scoreTone(score.total);
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - score.total / 100);

  return (
    <div className="mt-4 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
      <div className="flex items-center gap-4">
        {/* Ring */}
        <div className="relative h-[96px] w-[96px] shrink-0">
          <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
            <circle cx="48" cy="48" r={radius} stroke="oklch(0.25 0.02 260)" strokeWidth="6" fill="none" />
            <circle
              cx="48" cy="48" r={radius}
              stroke={tone.stroke} strokeWidth="6" fill="none"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ filter: `drop-shadow(0 0 6px ${tone.stroke})`, transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center leading-none">
              <div className={`font-mono-tactical text-2xl font-bold ${tone.text}`}>{score.total}</div>
              <div className="font-mono-tactical text-[8px] tracking-widest text-muted-foreground">SCORE</div>
            </div>
          </div>
        </div>
        {/* Components */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <ScoreBar label="Execução"  value={score.execution} />
          <ScoreBar label="Sobrecarga" value={score.overload} />
          <ScoreBar label="Volume"    value={score.volume} />
          <ScoreBar label="Densidade" value={score.density} />
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const tone = scoreTone(value);
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between font-mono-tactical text-[9px] tracking-widest">
        <span className="text-muted-foreground">{label.toUpperCase()}</span>
        <span className={tone.text}>{value}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${Math.max(2, value)}%`, background: tone.stroke, boxShadow: `0 0 6px ${tone.stroke}` }}
        />
      </div>
    </div>
  );
}
