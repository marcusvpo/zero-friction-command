import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { memo, useEffect, useMemo, useState } from "react";
import {
  Check, ChevronLeft, ChevronRight, Minus, Plus, Timer, SkipForward,
  Pause, Play, Library as LibraryIcon, Flame, Trash2, Settings2, MoreVertical,
  TrendingUp, Sparkles, Square, ListChecks, X,
} from "lucide-react";
import { useMarcolaStore, type ExerciseSet, type OverloadSuggestion } from "@/store/marcola";
import { SessionSummaryModal } from "@/components/marcola/SessionSummaryModal";
import { SessionClock } from "@/components/marcola/SessionClock";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/workout")({
  head: () => ({
    meta: [
      { title: "Treino · Marcola Prime" },
      { name: "description", content: "Console de execução do treino." },
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
  const selectDay = useMarcolaStore((s) => s.selectDay);
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
  const syncActiveDayToToday = useMarcolaStore((s) => s.syncActiveDayToToday);

  useEffect(() => { syncActiveDayToToday(); }, [syncActiveDayToToday]);

  const day = routine.days.find((d) => d.id === active.dayId) ?? routine.days[0];
  const exercise = day.exercises[active.exerciseIndex];
  const currentSet: ExerciseSet | undefined = exercise?.sets[active.setIndex];

  const isPaused = active.pausedAt !== null;
  const isResting = rest.active;
  const hasSession = active.startedAt !== null && active.finishedAt === null;

  useEffect(() => {
    if (!rest.active || isPaused) return;
    const id = window.setInterval(tickRest, 1000);
    return () => window.clearInterval(id);
  }, [rest.active, isPaused, tickRest]);

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

  const [postSetRPE, setPostSetRPE] = useState(false);
  const [setConfigOpen, setSetConfigOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);

  const handleConfirm = async () => {
    if (!exercise || !currentSet) return;
    await completeSet();
    setPostSetRPE(true);
    window.setTimeout(() => setPostSetRPE(false), 3500);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(20);
  };

  const handleFinish = () => {
    finish();
    setMenuOpen(false);
    toast.success("Sessão finalizada");
  };

  const handleStart = () => {
    startWorkout(day.id);
    toast.success(`${day.name} iniciado`);
  };

  return (
    <main className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pt-3 pb-4">
      {/* ─────────── Top bar: day · clock · menu ─────────── */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => setDayPickerOpen(true)}
          disabled={hasSession}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-foreground hover:bg-white/5 disabled:opacity-60"
        >
          <span>{day.name}</span>
          <ChevronRight className="h-3.5 w-3.5 rotate-90 text-muted-foreground" />
        </button>

        {hasSession ? (
          <SessionClock
            startedAt={active.startedAt}
            finishedAt={active.finishedAt}
            pausedAt={active.pausedAt}
            totalPausedMs={active.totalPausedMs}
            isPaused={isPaused}
          />
        ) : (
          <span className="text-xs text-muted-foreground">Pronto</span>
        )}

        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
          className="grid h-9 w-9 place-items-center rounded-md text-foreground hover:bg-white/5"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!hasSession ? (
          /* ─────── PRE-SESSION ─────── */
          <motion.section
            key="pre"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex min-h-0 flex-1 flex-col items-center justify-center text-center"
          >
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{day.code}</div>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">{day.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {day.exercises.length} exercícios · {day.exercises.reduce((n, e) => n + e.sets.length, 0)} sets
            </p>

            <button
              onClick={handleStart}
              className="mt-8 flex min-h-[56px] w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold tracking-wide"
            >
              <Play className="h-4 w-4" fill="currentColor" /> INICIAR TREINO
            </button>

            <button
              onClick={() => setPlanOpen(true)}
              className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ListChecks className="h-3.5 w-3.5" /> Ver plano
            </button>
          </motion.section>
        ) : isResting ? (
          /* ─────── REST ─────── */
          <motion.section
            key="rest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-0 flex-1 flex-col items-center justify-center text-center"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-3.5 w-3.5" />
              <span className="text-xs uppercase tracking-widest">Descanso</span>
            </div>
            <div
              className="font-mono mt-4 font-semibold leading-none tracking-tight text-foreground"
              style={{ fontSize: "clamp(72px, 24vw, 128px)" }}
            >
              {mm}:{ss}
            </div>
            <div className="mt-3 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/5">
              <motion.div
                animate={{ width: `${restPct}%` }}
                transition={{ duration: 0.5, ease: "linear" }}
                className="h-full bg-primary"
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Próximo: {nextLabel(day, active)}</p>

            <div className="mt-8 flex w-full max-w-xs gap-2">
              <button
                onClick={() => startRest(rest.total + 15)}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-border text-sm text-foreground hover:bg-white/5"
              >
                <Plus className="h-4 w-4" /> 15s
              </button>
              <button
                onClick={() => { skipRest(); toast.message("Descanso pulado"); }}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
              >
                <SkipForward className="h-4 w-4" /> PULAR
              </button>
            </div>
          </motion.section>
        ) : exercise && currentSet ? (
          /* ─────── EXECUTION ─────── */
          <motion.section
            key={`ex-${exercise.id}-${active.setIndex}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* Exercise header */}
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {exercise.primary}{currentSet.isWarmup ? " · Warm-up" : ""}
              </div>
              <h2 className="mt-1 text-2xl font-semibold text-foreground">{exercise.name}</h2>
              <div className="mt-1 text-xs text-muted-foreground">
                Set {active.setIndex + 1} de {exercise.sets.length}
              </div>

              {/* Set dots */}
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {exercise.sets.map((s, i) => {
                  const isCur = i === active.setIndex;
                  return (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        s.completed ? "w-4 bg-foreground/80" :
                        isCur ? "w-6 bg-primary" :
                        "w-1.5 bg-white/15"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Overload suggestion (subtle chip) */}
            {suggestion && (
              <button
                onClick={() => {
                  const wDelta = Math.round((suggestion.weight - currentSet.weight) / 2.5);
                  const rDelta = suggestion.reps - currentSet.reps;
                  for (let i = 0; i < Math.abs(wDelta); i++) adjust("weight", wDelta > 0 ? 1 : -1);
                  for (let i = 0; i < Math.abs(rDelta); i++) adjust("reps", rDelta > 0 ? 1 : -1);
                }}
                className={`mx-auto mt-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
                  isSmartMatch
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {suggestion.deltaKg > 0 ? <TrendingUp className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                Meta: {suggestion.weight}kg × {suggestion.reps}
              </button>
            )}

            {/* Steppers */}
            <div className="mt-6 flex flex-col gap-3">
              <MinimalStepper label="Peso" unit="kg" value={currentSet.weight}
                onMinus={() => adjust("weight", -1)} onPlus={() => adjust("weight", +1)} />
              <MinimalStepper label="Reps" unit="" value={currentSet.reps}
                onMinus={() => adjust("reps", -1)} onPlus={() => adjust("reps", +1)} />
            </div>

            {/* Target line */}
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Alvo {currentSet.reps} × {currentSet.weight}kg · descanso {currentSet.restSeconds ?? exercise.restSeconds}s
              {exercise.targetRPE ? ` · RPE ${exercise.targetRPE}` : ""}
              <button onClick={() => setSetConfigOpen(true)} className="ml-2 inline-flex items-center hover:text-foreground" aria-label="Configurar set">
                <Settings2 className="h-3 w-3" />
              </button>
            </div>

            <div className="flex-1" />

            {/* CTA */}
            <button
              disabled={isPaused}
              onClick={handleConfirm}
              className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold tracking-wide disabled:opacity-50"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
              {isPaused ? "PAUSADO" : "CONFIRMAR SET"}
            </button>

            {/* Nav */}
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={prev}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </button>
              <button
                onClick={() => setPlanOpen(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ListChecks className="h-3.5 w-3.5" /> Plano
              </button>
              <button
                onClick={next}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Próximo <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.section>
        ) : (
          <motion.div key="done" className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Check className="mx-auto h-10 w-10 text-foreground/70" />
              <p className="mt-2 text-sm text-muted-foreground">Sessão concluída</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────── Post-set RPE prompt ─────── */}
      <AnimatePresence>
        {postSetRPE && exercise && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-[420px] rounded-xl border border-border bg-background/95 p-3 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-foreground">
                <Flame className="h-3.5 w-3.5" /> RPE
              </span>
              <button onClick={() => setPostSetRPE(false)} className="text-xs text-muted-foreground">Pular</button>
            </div>
            <div className="mt-2 flex gap-1.5">
              {[6,7,8,9,10].map((rpe) => (
                <button
                  key={rpe}
                  onClick={() => {
                    adjustRestForRPE(rpe);
                    setPostSetRPE(false);
                    toast.message(`RPE ${rpe}`);
                  }}
                  className="h-10 flex-1 rounded-md border border-border text-sm text-foreground hover:bg-white/5"
                >
                  {rpe}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────── Menu sheet ─────── */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Sessão">
        {hasSession && (
          <>
            {isPaused ? (
              <SheetRow icon={<Play className="h-4 w-4" />} label="Retomar" onClick={() => { resume(); setMenuOpen(false); }} />
            ) : (
              <SheetRow icon={<Pause className="h-4 w-4" />} label="Pausar" onClick={() => { pause(); setMenuOpen(false); }} />
            )}
            <SheetRow
              icon={<LibraryIcon className="h-4 w-4" />}
              label="Sugerir alternativa"
              onClick={() => {
                setMenuOpen(false);
                navigate({ to: "/library", search: { swap: exercise?.id ?? "", day: day.id, muscle: exercise?.primary ?? "" } as never });
              }}
            />
            <SheetRow icon={<ListChecks className="h-4 w-4" />} label="Ver plano completo" onClick={() => { setPlanOpen(true); setMenuOpen(false); }} />
            <SheetRow icon={<Square className="h-4 w-4" />} label="Finalizar sessão" onClick={handleFinish} />
            <SheetRow icon={<Trash2 className="h-4 w-4" />} label="Descartar sessão" tone="danger" onClick={() => { setDiscardOpen(true); setMenuOpen(false); }} />
          </>
        )}
        {!hasSession && (
          <>
            <SheetRow icon={<Play className="h-4 w-4" />} label="Iniciar treino" onClick={() => { setMenuOpen(false); handleStart(); }} />
            <SheetRow icon={<ListChecks className="h-4 w-4" />} label="Ver plano" onClick={() => { setPlanOpen(true); setMenuOpen(false); }} />
          </>
        )}
      </Sheet>

      {/* ─────── Day picker sheet ─────── */}
      <Sheet open={dayPickerOpen} onClose={() => setDayPickerOpen(false)} title="Escolher dia">
        {routine.days.map((d) => (
          <SheetRow
            key={d.id}
            icon={<span className="font-mono text-[10px] tracking-widest text-muted-foreground w-8">{d.code}</span>}
            label={d.name}
            active={d.id === active.dayId}
            onClick={() => { selectDay(d.id); setDayPickerOpen(false); }}
          />
        ))}
      </Sheet>

      {/* ─────── Plan sheet ─────── */}
      <Sheet open={planOpen} onClose={() => setPlanOpen(false)} title={`${day.name} · plano`}>
        <div className="max-h-[50vh] overflow-y-auto">
          {day.exercises.map((ex, i) => {
            const done = ex.sets.every((s) => s.completed);
            const isCur = i === active.exerciseIndex;
            const doneCount = ex.sets.filter((s) => s.completed).length;
            return (
              <button
                key={ex.id}
                onClick={() => { selectExercise(i); setPlanOpen(false); }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left ${
                  isCur ? "bg-primary/10 text-foreground" : "text-foreground/85 hover:bg-white/5"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="font-mono w-5 text-[11px] text-muted-foreground">{String(i+1).padStart(2,"0")}</span>
                  <span className="truncate text-sm">{ex.name}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {doneCount}/{ex.sets.length}{done && <span className="ml-1 text-foreground">✓</span>}
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>

      {/* ─────── Set config sheet ─────── */}
      <Sheet open={setConfigOpen && !!exercise && !!currentSet} onClose={() => setSetConfigOpen(false)} title={`Set ${active.setIndex + 1} · configuração`}>
        {exercise && currentSet && (
          <>
            <label className="flex items-center justify-between rounded-md px-3 py-2.5">
              <span className="text-sm text-foreground">Warm-up <span className="text-xs text-muted-foreground">(não conta volume)</span></span>
              <input
                type="checkbox"
                checked={!!currentSet.isWarmup}
                onChange={() => toggleWarmup(exercise.id, active.setIndex)}
                className="h-5 w-5"
              />
            </label>
            <div className="px-3 pt-2">
              <div className="text-xs text-muted-foreground">Descanso deste set</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[30, 45, 60, 90, 120, 180].map((s) => {
                  const isCur = (currentSet.restSeconds ?? exercise.restSeconds) === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSetRest(exercise.id, active.setIndex, s)}
                      className={`min-h-[40px] flex-1 rounded-md border text-sm ${isCur ? "border-primary text-primary" : "border-border text-foreground"}`}
                    >
                      {s}s
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setSetRest(exercise.id, active.setIndex, undefined)}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground"
              >
                ↺ padrão ({exercise.restSeconds}s)
              </button>
            </div>
          </>
        )}
      </Sheet>

      {/* ─────── Discard confirm ─────── */}
      <AnimatePresence>
        {discardOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
            onClick={() => setDiscardOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 text-center"
            >
              <Trash2 className="mx-auto h-6 w-6 text-muted-foreground" />
              <h3 className="mt-3 text-base font-semibold text-foreground">Descartar sessão?</h3>
              <p className="mt-1 text-sm text-muted-foreground">Sets marcados serão zerados. Nada será salvo.</p>
              <div className="mt-5 flex gap-2">
                <button onClick={() => setDiscardOpen(false)} className="min-h-[44px] flex-1 rounded-xl border border-border text-sm">Cancelar</button>
                <button
                  onClick={() => { discard(); setDiscardOpen(false); toast.message("Sessão descartada"); }}
                  className="min-h-[44px] flex-1 rounded-xl bg-destructive text-sm font-semibold text-destructive-foreground"
                >
                  Descartar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SessionSummaryModal summary={lastSummary} onClose={clearSummary} />
    </main>
  );
}

function nextLabel(day: { exercises: { name: string; sets: { completed: boolean }[] }[] }, active: { exerciseIndex: number; setIndex: number }) {
  const ex = day.exercises[active.exerciseIndex];
  if (!ex) return "—";
  const more = active.setIndex < ex.sets.length && !ex.sets[active.setIndex]?.completed;
  if (more) return `${ex.name} · Set ${active.setIndex + 1}`;
  const nxt = day.exercises[active.exerciseIndex + 1];
  return nxt ? `${nxt.name} · Set 1` : "Sessão completa";
}

const MinimalStepper = memo(function Stepper({
  label, unit, value, onMinus, onPlus,
}: { label: string; unit: string; value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
      <button
        onClick={onMinus}
        aria-label={`Diminuir ${label}`}
        className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.04] text-foreground active:bg-white/10"
      >
        <Minus className="h-5 w-5" />
      </button>
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="font-mono text-4xl font-semibold leading-none text-foreground">
          {value}
          {unit && <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>}
        </span>
      </div>
      <button
        onClick={onPlus}
        aria-label={`Aumentar ${label}`}
        className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.04] text-foreground active:bg-white/10"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
});

/* ─────────── Minimal bottom sheet ─────────── */
function Sheet({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-2xl border border-border bg-background p-2 pb-4 sm:rounded-2xl"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{title}</span>
              <button onClick={onClose} aria-label="Fechar" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SheetRow({
  icon, label, onClick, tone, active,
}: { icon: React.ReactNode; label: string; onClick: () => void; tone?: "danger"; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-md px-3 py-3 text-left text-sm hover:bg-white/5 ${
        tone === "danger" ? "text-destructive" : active ? "text-primary" : "text-foreground"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {active && <Check className="h-4 w-4" />}
    </button>
  );
}
