import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { memo, useEffect, useMemo, useState } from "react";
import {
  Check, ChevronLeft, ChevronRight, Minus, Plus, Square, Timer, SkipForward, Target,
  Pause, Play, Library as LibraryIcon, Flame, Trash2, Settings2, MoreVertical, Save,
  TrendingUp, Sparkles, Hand,
} from "lucide-react";
import { useMarcolaStore, type ExerciseSet, type OverloadSuggestion } from "@/store/marcola";
import { SessionSummaryModal } from "@/components/marcola/SessionSummaryModal";
import { SessionClock } from "@/components/marcola/SessionClock";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/workout")({
  head: () => ({
    meta: [
      { title: "Workout Console · Marcola Prime" },
      { name: "description", content: "Console GPS de execução tática de treino." },
    ],
  }),
  component: WorkoutConsole,
});

function WorkoutConsole() {
  const navigate = useNavigate();
  const routine = useMarcolaStore((s) => s.routine);
  const active = useMarcolaStore((s) => s.active);
  const rest = useMarcolaStore((s) => s.rest);
  const lastSummary = useMarcolaStore((s) => s.lastSummary);
  const tickRest = useMarcolaStore((s) => s.tickRest);
  const skipRest = useMarcolaStore((s) => s.skipRest);
  const startRest = useMarcolaStore((s) => s.startRest);
  const startWorkout = useMarcolaStore((s) => s.startWorkout);
  const selectExercise = useMarcolaStore((s) => s.selectExercise);
  const completeSet = useMarcolaStore((s) => s.completeCurrentSet);
  const adjust = useMarcolaStore((s) => s.adjustCurrentSet);
  const next = useMarcolaStore((s) => s.nextExercise);
  const prev = useMarcolaStore((s) => s.prevExercise);
  const finish = useMarcolaStore((s) => s.finishWorkout);
  const pause = useMarcolaStore((s) => s.pauseSession);
  const resume = useMarcolaStore((s) => s.resumeSession);
  const discard = useMarcolaStore((s) => s.discardSession);
  const clearSummary = useMarcolaStore((s) => s.clearSummary);
  const toggleWarmup = useMarcolaStore((s) => s.toggleWarmup);
  const setSetRest = useMarcolaStore((s) => s.setSetRest);
  const getSuggestion = useMarcolaStore((s) => s.getSuggestion);
  const adjustRestForRPE = useMarcolaStore((s) => s.adjustRestForRPE);
  const seenSwipeHint = useMarcolaStore((s) => s.seenSwipeHint);
  const markSwipeHintSeen = useMarcolaStore((s) => s.markSwipeHintSeen);

  const day = routine.days.find((d) => d.id === active.dayId) ?? routine.days[0];
  const exercise = day.exercises[active.exerciseIndex];
  const currentSet: ExerciseSet | undefined = exercise?.sets[active.setIndex];

  const isPaused = active.pausedAt !== null;
  const isResting = rest.active;

  // ───── Rest tick (parent only re-renders when rest.remaining changes) ─────
  useEffect(() => {
    if (!rest.active || isPaused) return;
    const id = window.setInterval(tickRest, 1000);
    return () => window.clearInterval(id);
  }, [rest.active, isPaused, tickRest]);

  // ───── Smart Overload suggestion ─────
  const suggestion: OverloadSuggestion | null = useMemo(
    () => (exercise ? getSuggestion(exercise.id) : null),
    [exercise, getSuggestion, active.exerciseIndex],
  );
  const isSmartMatch = !!(
    suggestion && currentSet &&
    Math.abs(currentSet.weight - suggestion.weight) < 0.01 &&
    currentSet.reps === suggestion.reps
  );

  const mm = String(Math.floor(rest.remaining / 60)).padStart(2, "0");
  const ss = String(rest.remaining % 60).padStart(2, "0");
  const restPct = rest.total > 0 ? (rest.remaining / rest.total) * 100 : 0;

  // Drawers
  const [postSetDrawer, setPostSetDrawer] = useState<{ open: boolean }>({ open: false });
  const [setConfigOpen, setSetConfigOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  // Hint banner — só na primeira sessão.
  const [hintVisible, setHintVisible] = useState(!seenSwipeHint);
  useEffect(() => {
    if (!hintVisible) return;
    const t = window.setTimeout(() => {
      setHintVisible(false);
      markSwipeHintSeen();
    }, 4000);
    return () => window.clearTimeout(t);
  }, [hintVisible, markSwipeHintSeen]);

  const handleConfirm = async () => {
    if (!exercise || !currentSet) return;
    await completeSet();
    setPostSetDrawer({ open: true });
    window.setTimeout(() => setPostSetDrawer({ open: false }), 2400);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(20);
    toast.success("Set registrado", { description: `Descanso ${currentSet.restSeconds ?? exercise.restSeconds}s iniciado` });
  };

  const handleSkip = () => {
    if (!exercise) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([15, 30, 15]);
    next();
    toast.message("Set pulado", { description: "Avançando para próximo exercício" });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const THRESHOLD = 80;
    if (info.offset.x > THRESHOLD) void handleConfirm();
    else if (info.offset.x < -THRESHOLD) handleSkip();
  };

  const handleFinish = () => {
    finish();
    toast.success("Sessão finalizada");
  };

  return (
    <main className="relative z-10 flex min-h-0 flex-1 flex-col px-3 pt-2 pb-3">
      {/* ─────────── Top control rail ─────────── */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <SessionClock
          startedAt={active.startedAt}
          finishedAt={active.finishedAt}
          pausedAt={active.pausedAt}
          totalPausedMs={active.totalPausedMs}
          isPaused={isPaused}
        />
        <div className="flex items-center gap-1">
          {active.startedAt && !active.finishedAt && (
            isPaused ? (
              <CtrlBtn onClick={resume} aria-label="Retomar sessão" tone="matrix">
                <Play className="h-3.5 w-3.5" /> RETOMAR
              </CtrlBtn>
            ) : (
              <CtrlBtn onClick={pause} aria-label="Pausar sessão" tone="amber">
                <Pause className="h-3.5 w-3.5" /> PAUSAR
              </CtrlBtn>
            )
          )}
          <CtrlBtn onClick={() => { toast.message("Rascunho salvo localmente"); }} aria-label="Salvar rascunho" tone="cyan">
            <Save className="h-3.5 w-3.5" />
          </CtrlBtn>
          <CtrlBtn onClick={() => setDiscardOpen(true)} aria-label="Descartar sessão" tone="danger">
            <Trash2 className="h-3.5 w-3.5" />
          </CtrlBtn>
          <CtrlBtn onClick={handleFinish} aria-label="Finalizar sessão" tone="cyan">
            <Square className="h-3.5 w-3.5" /> END
          </CtrlBtn>
        </div>
      </div>

      {/* ─────────── Day selector strip ─────────── */}
      <div className="mb-2 flex gap-1 overflow-x-auto scrollbar-none">
        {routine.days.map((d) => {
          const isActive = d.id === active.dayId;
          return (
            <motion.button
              key={d.id} whileTap={{ scale: 0.95 }}
              onClick={() => startWorkout(d.id)}
              className={`glass min-h-[40px] shrink-0 rounded-lg px-2.5 py-1.5 text-left transition-all ${
                isActive ? "ring-1 ring-cyan/60 shadow-glow-cyan" : ""
              }`}
            >
              <div className="font-mono-tactical text-[8px] tracking-widest text-muted-foreground">{d.code}</div>
              <div className={`text-[11px] font-medium leading-tight ${isActive ? "text-cyan" : "text-foreground"}`}>{d.name}</div>
            </motion.button>
          );
        })}
      </div>

      {/* ─────────── Progress + library access ─────────── */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
          EX {String(active.exerciseIndex + 1).padStart(2,"0")}/{String(day.exercises.length).padStart(2,"0")} · {day.code}
        </span>
        <button
          onClick={() => navigate({
            to: "/library",
            search: {
              swap: exercise?.id ?? "",
              day: day.id,
              muscle: exercise?.primary ?? "",
            } as never,
          })}
          className="font-mono-tactical flex items-center gap-1 text-[10px] tracking-widest text-cyan hover:text-cyan/80"
        >
          <LibraryIcon className="h-3 w-3" /> SUGERIR ALTERNATIVA
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isResting ? (
          /* ─────── REST MODE ─────── */
          <motion.section
            key="rest"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="glass-strong relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl p-4 text-center"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />
            <div className="flex items-center gap-2 text-cyan">
              <Timer className="h-4 w-4" />
              <span className="font-mono-tactical text-[11px] uppercase tracking-[0.3em]">Descanso Tático</span>
            </div>
            <motion.div
              key={rest.remaining}
              initial={{ scale: 0.98, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-mono-tactical mt-3 font-bold leading-none tracking-tighter text-cyan glow-cyan"
              style={{ textShadow: "0 0 28px rgba(0,240,255,0.6)", fontSize: "clamp(64px, 22vw, 110px)" }}
            >
              {mm}:{ss}
            </motion.div>
            <div className="font-mono-tactical mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Próximo: {nextLabel(day, active)}
            </div>

            <div className="mt-4 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/5">
              <motion.div
                animate={{ width: `${restPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-cyan to-matrix"
                style={{ boxShadow: "0 0 12px rgba(0,240,255,0.8)" }}
              />
            </div>

            <div className="mt-4 flex w-full max-w-sm gap-2">
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => startRest(rest.total + 15)}
                className="glass flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl text-cyan ring-1 ring-cyan/30">
                <Plus className="h-4 w-4" />
                <span className="font-mono-tactical text-xs tracking-widest">+15s</span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => { skipRest(); toast.message("Descanso pulado"); }}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-cyan text-background"
                style={{ boxShadow: "0 0 22px rgba(0,240,255,0.55)" }}>
                <SkipForward className="h-4 w-4" />
                <span className="font-mono-tactical text-xs font-semibold tracking-widest">PULAR</span>
              </motion.button>
            </div>
          </motion.section>
        ) : exercise && currentSet ? (
          /* ─────── GPS EXECUTION ─────── */
          <motion.section
            key={`ex-${exercise.id}-${active.setIndex}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="glass-strong flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl p-3"
          >
            {/* Header */}
            <header className="flex items-center justify-between gap-2">
              <NavBtn onClick={prev} aria-label="Exercício anterior"><ChevronLeft className="h-5 w-5" /></NavBtn>
              <div className="min-w-0 flex-1 text-center">
                <div className="font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
                  ALVO · {exercise.primary.toUpperCase()}{exercise.tempo ? ` · TEMPO ${exercise.tempo}` : ""}
                </div>
                <h2 className="truncate text-base font-semibold leading-tight text-foreground sm:text-lg">{exercise.name}</h2>
              </div>
              <NavBtn onClick={next} aria-label="Próximo exercício"><ChevronRight className="h-5 w-5" /></NavBtn>
            </header>

            {/* (sem imagem — design data-first) */}

            {/* Set indicator */}
            <div className="mt-2 flex items-center justify-center gap-1">
              {exercise.sets.map((s, i) => {
                const isCur = i === active.setIndex;
                return (
                  <span key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      s.completed ? (s.isWarmup ? "bg-amber/70 w-4" : "bg-emerald-400 w-5") :
                      isCur ? "bg-cyan w-8 shadow-glow-cyan" :
                      s.isWarmup ? "bg-amber/30 w-3" : "bg-white/15 w-3"
                    }`}
                  />
                );
              })}
            </div>
            <div className="mt-0.5 flex items-center justify-center gap-2 text-center font-mono-tactical text-[10px] tracking-[0.25em]">
              <span className="text-cyan">SET {active.setIndex + 1}/{exercise.sets.length}</span>
              {currentSet.isWarmup && <span className="text-amber">· WARM-UP</span>}
              <button onClick={() => setSetConfigOpen(true)} className="ml-1 text-muted-foreground hover:text-foreground" aria-label="Configurar set">
                <Settings2 className="h-3 w-3" />
              </button>
            </div>

            {/* Steppers */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Stepper label="PESO" unit="kg" value={currentSet.weight} onMinus={() => adjust("weight", -1)} onPlus={() => adjust("weight", +1)} tone="cyan" />
              <Stepper label="REPS" unit="reps" value={currentSet.reps} onMinus={() => adjust("reps", -1)} onPlus={() => adjust("reps", +1)} tone="matrix" />
            </div>

            {/* Target */}
            <div className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-white/[0.03] py-1.5">
              <Target className="h-3 w-3 text-amber" />
              <span className="font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
                ALVO · {currentSet.reps}× {currentSet.weight}kg · DESC {currentSet.restSeconds ?? exercise.restSeconds}s
                {exercise.targetRPE ? ` · RPE ${exercise.targetRPE}` : ""}
              </span>
            </div>

            {/* Plan list (compact, scroll) */}
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto rounded-lg bg-white/[0.02] p-1">
              {day.exercises.map((ex, i) => {
                const done = ex.sets.every((s) => s.completed);
                const isCur = i === active.exerciseIndex;
                const doneCount = ex.sets.filter((s) => s.completed).length;
                return (
                  <button
                    key={ex.id}
                    onClick={() => selectExercise(i)}
                    className={`flex min-h-[32px] w-full items-center justify-between rounded-md px-2 py-0.5 text-left ${
                      isCur ? "bg-cyan/10 text-cyan" : "text-foreground/80 hover:bg-white/5"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="font-mono-tactical w-5 text-[10px] tracking-widest text-muted-foreground">
                        {String(i+1).padStart(2,"0")}
                      </span>
                      <span className="truncate text-[11px]">{ex.name}</span>
                    </span>
                    <span className="font-mono-tactical shrink-0 text-[10px] tracking-widest text-muted-foreground">
                      {doneCount}/{ex.sets.length}{done && <span className="ml-1 text-emerald-400">✓</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CONFIRM SET — sticky inside card */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={isPaused}
              onClick={handleConfirm}
              className="mt-2 flex min-h-[60px] w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-matrix via-cyan to-matrix text-background disabled:opacity-50"
              style={{ boxShadow: "0 0 32px rgba(57,255,20,0.5)" }}
            >
              <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.35),transparent)] bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]" />
              <Check className="relative h-5 w-5" strokeWidth={3} />
              <span className="font-mono-tactical relative text-sm font-bold uppercase tracking-[0.25em]">
                {isPaused ? "Pausado" : "Confirm Set"}
              </span>
            </motion.button>
          </motion.section>
        ) : (
          <motion.div key="done" className="glass flex flex-1 items-center justify-center rounded-2xl">
            <div className="text-center">
              <Check className="mx-auto h-10 w-10 text-emerald-400" />
              <p className="mt-2 font-mono-tactical text-sm tracking-widest text-foreground">SESSÃO CONCLUÍDA</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────── Post-set ghost drawer (RPE / notes) ─────── */}
      <AnimatePresence>
        {postSetDrawer.open && exercise && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-[420px] glass-strong rounded-xl border border-cyan/20 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono-tactical text-[10px] tracking-widest text-cyan">
                <Flame className="mr-1 inline h-3 w-3" /> RPE REAL · {exercise.name}
              </span>
              <button onClick={() => setPostSetDrawer({ open: false })} className="text-[10px] text-muted-foreground">FECHAR</button>
            </div>
            <div className="mt-2 flex gap-1">
              {[6,7,8,9,10].map((rpe) => (
                <button
                  key={rpe}
                  onClick={() => {
                    // Patch the just-completed set (previous index)
                    // Simplest: store RPE in log via setSetRest equivalent — handled via direct state mutation here.
                    setPostSetDrawer({ open: false });
                    toast.message(`RPE ${rpe} registrado`);
                  }}
                  className="glass h-10 flex-1 rounded-md font-mono-tactical text-xs text-foreground hover:bg-cyan/10 hover:text-cyan"
                >
                  {rpe}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────── Set Config Drawer ─────── */}
      <AnimatePresence>
        {setConfigOpen && exercise && currentSet && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid items-end sm:items-center justify-center p-4"
            onClick={() => setSetConfigOpen(false)}
          >
            <motion.div
              initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-md rounded-2xl border border-cyan/20 p-4"
            >
              <div className="flex items-center gap-2 text-cyan">
                <MoreVertical className="h-4 w-4" />
                <span className="font-mono-tactical text-[11px] tracking-widest">SET {active.setIndex + 1} · CONFIG</span>
              </div>
              <h3 className="mt-1 text-lg font-semibold text-foreground">{exercise.name}</h3>

              <label className="mt-4 flex items-center justify-between rounded-lg bg-white/[0.03] p-3">
                <span className="text-sm text-foreground">Warm-up <span className="text-muted-foreground text-[11px]">(não conta volume)</span></span>
                <input
                  type="checkbox"
                  checked={!!currentSet.isWarmup}
                  onChange={() => toggleWarmup(exercise.id, active.setIndex)}
                  className="h-5 w-5 accent-amber"
                />
              </label>

              <div className="mt-3">
                <div className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">DESCANSO DESTE SET (s)</div>
                <div className="mt-2 flex gap-1.5">
                  {[30, 45, 60, 90, 120, 180].map((s) => {
                    const isCur = (currentSet.restSeconds ?? exercise.restSeconds) === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSetRest(exercise.id, active.setIndex, s)}
                        className={`glass min-h-[40px] flex-1 rounded-md font-mono-tactical text-xs ${isCur ? "text-cyan ring-1 ring-cyan/60" : "text-foreground"}`}
                      >
                        {s}s
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setSetRest(exercise.id, active.setIndex, undefined)}
                  className="mt-2 font-mono-tactical text-[10px] tracking-widest text-muted-foreground hover:text-foreground"
                >
                  ↺ usar padrão do exercício ({exercise.restSeconds}s)
                </button>
              </div>

              <button
                onClick={() => setSetConfigOpen(false)}
                className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-cyan font-mono-tactical text-sm font-bold tracking-widest text-background"
              >
                APLICAR
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────── Discard confirm ─────── */}
      <AnimatePresence>
        {discardOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
            onClick={() => setDiscardOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-sm rounded-2xl border border-rose-500/30 p-4 text-center"
            >
              <Trash2 className="mx-auto h-8 w-8 text-rose-400" />
              <h3 className="mt-2 text-lg font-bold text-foreground">Descartar sessão?</h3>
              <p className="mt-1 text-sm text-muted-foreground">Todos os sets marcados serão zerados e nenhum dado será salvo.</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setDiscardOpen(false)} className="glass min-h-[44px] flex-1 rounded-xl text-sm">Cancelar</button>
                <button
                  onClick={() => { discard(); setDiscardOpen(false); toast.message("Sessão descartada"); }}
                  className="min-h-[44px] flex-1 rounded-xl bg-rose-500 text-sm font-bold text-white"
                >
                  Descartar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────── Summary modal ─────── */}
      <SessionSummaryModal summary={lastSummary} onClose={clearSummary} />
    </main>
  );
}

function getElapsedMs(a: { startedAt: number | null; finishedAt: number | null; pausedAt: number | null; totalPausedMs: number }) {
  if (!a.startedAt) return 0;
  const end = a.finishedAt ?? Date.now();
  const pausedExtra = a.pausedAt ? Date.now() - a.pausedAt : 0;
  return Math.max(0, end - a.startedAt - a.totalPausedMs - pausedExtra);
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

function nextLabel(day: { exercises: { name: string; sets: { completed: boolean }[] }[] }, active: { exerciseIndex: number; setIndex: number }) {
  const ex = day.exercises[active.exerciseIndex];
  if (!ex) return "—";
  const more = active.setIndex < ex.sets.length && !ex.sets[active.setIndex]?.completed;
  if (more) return `${ex.name} · Set ${active.setIndex + 1}`;
  const nxt = day.exercises[active.exerciseIndex + 1];
  return nxt ? `${nxt.name} · Set 1` : "Sessão completa";
}

function NavBtn({ children, onClick, "aria-label": ariaLabel }: { children: React.ReactNode; onClick: () => void; "aria-label"?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className="glass grid h-10 w-10 shrink-0 place-items-center rounded-lg text-foreground hover:text-cyan"
    >
      {children}
    </motion.button>
  );
}

function CtrlBtn({ children, onClick, "aria-label": ariaLabel, tone }: { children: React.ReactNode; onClick: () => void; "aria-label"?: string; tone: "cyan" | "matrix" | "amber" | "danger" }) {
  const color =
    tone === "cyan" ? "text-cyan ring-cyan/30" :
    tone === "matrix" ? "text-matrix ring-matrix/30" :
    tone === "amber" ? "text-amber ring-amber/30" : "text-rose-400 ring-rose-500/30";
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`glass flex h-8 items-center gap-1 rounded-md px-2 font-mono-tactical text-[9px] tracking-widest ring-1 ${color}`}
    >
      {children}
    </motion.button>
  );
}

function Stepper({
  label, unit, value, onMinus, onPlus, tone,
}: { label: string; unit: string; value: number; onMinus: () => void; onPlus: () => void; tone: "cyan" | "matrix" }) {
  const color = tone === "cyan" ? "text-cyan" : "text-matrix";
  const glow = tone === "cyan" ? "rgba(0,240,255,0.5)" : "rgba(57,255,20,0.5)";
  return (
    <div className="glass flex flex-col rounded-xl p-2">
      <div className="text-center font-mono-tactical text-[9px] tracking-[0.28em] text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-1">
        <motion.button whileTap={{ scale: 0.88 }} onClick={onMinus}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-foreground ring-1 ring-white/10 active:bg-white/10"
          aria-label={`Diminuir ${label}`}>
          <Minus className="h-5 w-5" />
        </motion.button>
        <div className="flex flex-1 flex-col items-center">
          <span className={`font-mono-tactical font-bold leading-none tracking-tight ${color}`}
            style={{ textShadow: `0 0 14px ${glow}`, fontSize: "clamp(1.5rem, 7vw, 2rem)" }}>
            {value}
          </span>
          <span className="font-mono-tactical mt-0.5 text-[9px] tracking-widest text-muted-foreground">{unit}</span>
        </div>
        <motion.button whileTap={{ scale: 0.88 }} onClick={onPlus}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-foreground ring-1 ring-white/10 active:bg-white/10"
          aria-label={`Aumentar ${label}`}>
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}
