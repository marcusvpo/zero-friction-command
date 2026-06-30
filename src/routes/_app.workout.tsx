import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { Check, ChevronLeft, ChevronRight, Minus, Plus, Square, Timer, SkipForward, Target } from "lucide-react";
import { useMarcolaStore } from "@/store/marcola";
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
  const routine = useMarcolaStore((s) => s.routine);
  const active = useMarcolaStore((s) => s.active);
  const rest = useMarcolaStore((s) => s.rest);
  const tickRest = useMarcolaStore((s) => s.tickRest);
  const skipRest = useMarcolaStore((s) => s.skipRest);
  const startRest = useMarcolaStore((s) => s.startRest);
  const setDay = useMarcolaStore((s) => s.startWorkout);
  const selectExercise = useMarcolaStore((s) => s.selectExercise);
  const completeSet = useMarcolaStore((s) => s.completeCurrentSet);
  const adjust = useMarcolaStore((s) => s.adjustCurrentSet);
  const next = useMarcolaStore((s) => s.nextExercise);
  const prev = useMarcolaStore((s) => s.prevExercise);
  const finish = useMarcolaStore((s) => s.finishWorkout);

  const day = routine.days.find((d) => d.id === active.dayId) ?? routine.days[0];
  const exercise = day.exercises[active.exerciseIndex];
  const currentSet = exercise?.sets[active.setIndex];

  // Rest tick
  useEffect(() => {
    if (!rest.active) return;
    const id = window.setInterval(tickRest, 1000);
    return () => window.clearInterval(id);
  }, [rest.active, tickRest]);

  const isResting = rest.active;
  const mm = String(Math.floor(rest.remaining / 60)).padStart(2, "0");
  const ss = String(rest.remaining % 60).padStart(2, "0");
  const restPct = rest.total > 0 ? (rest.remaining / rest.total) * 100 : 0;

  return (
    <main className="relative z-10 flex min-h-[calc(100dvh-9rem)] flex-1 flex-col px-4 pt-2 pb-32">
      {/* Day selector strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {routine.days.map((d) => {
          const isActive = d.id === active.dayId;
          return (
            <motion.button
              key={d.id} whileTap={{ scale: 0.95 }}
              onClick={() => setDay(d.id)}
              className={`glass min-h-[44px] shrink-0 rounded-xl px-3 py-2 text-left transition-all ${
                isActive ? "ring-1 ring-cyan/60 shadow-glow-cyan" : ""
              }`}
            >
              <div className="font-mono-tactical text-[9px] tracking-widest text-muted-foreground">{d.code}</div>
              <div className={`text-[11px] font-medium ${isActive ? "text-cyan" : "text-foreground"}`}>{d.name}</div>
            </motion.button>
          );
        })}
      </div>

      {/* Progress: exercise i of N */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
          EX {String(active.exerciseIndex + 1).padStart(2,"0")}/{String(day.exercises.length).padStart(2,"0")} · {day.code}
        </span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { finish(); toast.success("Sessão finalizada"); }}
          className="font-mono-tactical flex items-center gap-1 text-[10px] tracking-widest text-rose-400 hover:text-rose-300"
        >
          <Square className="h-3 w-3" /> ENCERRAR
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {isResting ? (
          /* ─────────── REST MODE — full takeover ─────────── */
          <motion.section
            key="rest"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="glass-strong relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl p-6 text-center"
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
              className="font-mono-tactical mt-4 text-[120px] font-bold leading-none tracking-tighter text-cyan glow-cyan"
              style={{ textShadow: "0 0 32px rgba(0,240,255,0.6)" }}
            >
              {mm}:{ss}
            </motion.div>
            <div className="font-mono-tactical mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              Próximo: {nextLabel(day, active)}
            </div>

            {/* Progress ring (linear) */}
            <div className="mt-6 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/5">
              <motion.div
                animate={{ width: `${restPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-cyan to-matrix"
                style={{ boxShadow: "0 0 12px rgba(0,240,255,0.8)" }}
              />
            </div>

            <div className="mt-6 flex w-full max-w-sm gap-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => startRest(rest.total + 15)}
                className="glass flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl text-cyan ring-1 ring-cyan/30"
              >
                <Plus className="h-4 w-4" />
                <span className="font-mono-tactical text-xs tracking-widest">+15s</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => { skipRest(); toast.message("Descanso pulado"); }}
                className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-cyan text-background"
                style={{ boxShadow: "0 0 24px rgba(0,240,255,0.55)" }}
              >
                <SkipForward className="h-4 w-4" />
                <span className="font-mono-tactical text-xs font-semibold tracking-widest">PULAR · PRÓXIMO</span>
              </motion.button>
            </div>
          </motion.section>
        ) : exercise && currentSet ? (
          /* ─────────── GPS EXECUTION MODE ─────────── */
          <motion.section
            key={`ex-${exercise.id}-${active.setIndex}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="glass-strong flex flex-1 flex-col overflow-hidden rounded-2xl p-4"
          >
            {/* Header: current exercise + nav arrows */}
            <header className="flex items-center justify-between gap-2">
              <NavBtn onClick={prev} aria-label="Exercício anterior"><ChevronLeft className="h-5 w-5" /></NavBtn>
              <div className="min-w-0 flex-1 text-center">
                <div className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
                  ALVO · {exercise.primary.toUpperCase()}
                </div>
                <h2 className="truncate text-xl font-semibold leading-tight text-foreground">{exercise.name}</h2>
              </div>
              <NavBtn onClick={next} aria-label="Próximo exercício"><ChevronRight className="h-5 w-5" /></NavBtn>
            </header>

            {/* Set indicator */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {exercise.sets.map((s, i) => {
                const isCur = i === active.setIndex;
                return (
                  <span key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      s.completed ? "bg-emerald-400 w-6" :
                      isCur ? "bg-cyan w-10 shadow-glow-cyan" : "bg-white/15 w-4"
                    }`}
                  />
                );
              })}
            </div>
            <div className="mt-1 text-center font-mono-tactical text-[11px] tracking-[0.3em] text-cyan">
              SET {active.setIndex + 1} <span className="text-muted-foreground">DE</span> {exercise.sets.length}
            </div>

            {/* Steppers */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stepper
                label="PESO" unit="kg"
                value={currentSet.weight}
                onMinus={() => adjust("weight", -1)}
                onPlus={() => adjust("weight", +1)}
                tone="cyan"
              />
              <Stepper
                label="REPS" unit="reps"
                value={currentSet.reps}
                onMinus={() => adjust("reps", -1)}
                onPlus={() => adjust("reps", +1)}
                tone="matrix"
              />
            </div>

            {/* Target line */}
            <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-white/[0.03] py-2">
              <Target className="h-3 w-3 text-amber" />
              <span className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
                ALVO SEMANA ANTERIOR · {currentSet.reps}× {currentSet.weight}kg · DESC {exercise.restSeconds}s
              </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Plan list (compact) */}
            <div className="mt-4 max-h-32 overflow-y-auto rounded-lg bg-white/[0.02] p-1.5">
              {day.exercises.map((ex, i) => {
                const done = ex.sets.every((s) => s.completed);
                const isCur = i === active.exerciseIndex;
                return (
                  <button
                    key={ex.id}
                    onClick={() => selectExercise(i)}
                    className={`flex min-h-[36px] w-full items-center justify-between rounded-md px-2 py-1 text-left ${
                      isCur ? "bg-cyan/10 text-cyan" : "text-foreground/80 hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="font-mono-tactical w-5 text-[10px] tracking-widest text-muted-foreground">
                        {String(i+1).padStart(2,"0")}
                      </span>
                      <span className="truncate text-[11px]">{ex.name}</span>
                    </span>
                    <span className="font-mono-tactical shrink-0 text-[10px] tracking-widest text-muted-foreground">
                      {ex.sets.filter(s => s.completed).length}/{ex.sets.length}
                      {done && <span className="ml-1 text-emerald-400">✓</span>}
                    </span>
                  </button>
                );
              })}
            </div>
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

      {/* ─────── Fixed CONFIRM SET button ─────── */}
      {!isResting && exercise && currentSet && (
        <motion.button
          initial={{ y: 80 }} animate={{ y: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            await completeSet();
            toast.success("Set registrado", { description: `Descanso ${exercise.restSeconds}s iniciado` });
          }}
          className="fixed inset-x-4 bottom-24 z-30 flex min-h-[72px] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-matrix via-cyan to-matrix text-background"
          style={{ boxShadow: "0 0 40px rgba(57,255,20,0.55), 0 8px 32px rgba(0,0,0,0.6)" }}
        >
          <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.35),transparent)] bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]" />
          <Check className="relative h-6 w-6" strokeWidth={3} />
          <span className="font-mono-tactical relative text-base font-bold uppercase tracking-[0.25em]">
            Confirm Set
          </span>
        </motion.button>
      )}
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

function NavBtn({ children, onClick, ...rest }: { children: React.ReactNode; onClick: () => void } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="glass grid h-12 w-12 shrink-0 place-items-center rounded-xl text-foreground hover:text-cyan"
      {...rest}
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
    <div className="glass flex flex-col rounded-2xl p-2.5">
      <div className="text-center font-mono-tactical text-[9px] tracking-[0.28em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-center justify-between gap-1">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onMinus}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-foreground ring-1 ring-white/10 active:bg-white/10"
          aria-label={`Diminuir ${label}`}
        >
          <Minus className="h-6 w-6" />
        </motion.button>
        <div className="flex flex-1 flex-col items-center">
          <span className={`font-mono-tactical text-3xl font-bold leading-none tracking-tight ${color}`}
            style={{ textShadow: `0 0 14px ${glow}` }}>
            {value}
          </span>
          <span className="font-mono-tactical mt-0.5 text-[9px] tracking-widest text-muted-foreground">{unit}</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onPlus}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-foreground ring-1 ring-white/10 active:bg-white/10"
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  );
}
