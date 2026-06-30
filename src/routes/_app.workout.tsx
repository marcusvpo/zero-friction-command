import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Play, Square } from "lucide-react";
import { TopTelemetryBar } from "@/components/marcola/TopTelemetryBar";
import { BottomDock } from "@/components/marcola/BottomDock";
import { Panel } from "@/components/marcola/Panel";
import { RestTimer } from "@/components/marcola/RestTimer";
import { useMarcolaStore } from "@/store/marcola";
import { toast } from "sonner";

export const Route = createFileRoute("/workout")({
  head: () => ({
    meta: [
      { title: "Workout Console · Marcola Prime" },
      { name: "description", content: "Execução tática de treino com timer de descanso." },
    ],
  }),
  component: WorkoutConsole,
});

function WorkoutConsole() {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-transparent">
        <span className="hud-corner-tl" aria-hidden />
        <span className="hud-corner-tr" aria-hidden />
        <TopTelemetryBar />
        <ConsoleBody />
        <BottomDock />
      </div>
    </div>
  );
}

function ConsoleBody() {
  const routine = useMarcolaStore((s) => s.routine);
  const active = useMarcolaStore((s) => s.active);
  const setDay = useMarcolaStore((s) => s.startWorkout);
  const selectExercise = useMarcolaStore((s) => s.selectExercise);
  const completeSet = useMarcolaStore((s) => s.completeCurrentSet);
  const next = useMarcolaStore((s) => s.nextExercise);
  const prev = useMarcolaStore((s) => s.prevExercise);
  const finish = useMarcolaStore((s) => s.finishWorkout);

  const day =
    routine.days.find((d) => d.id === active.dayId) ?? routine.days[0];
  const exercise = day.exercises[active.exerciseIndex];

  return (
    <main className="relative z-10 flex-1 space-y-4 px-4 pt-2 pb-28">
      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto">
        {routine.days.map((d) => {
          const isActive = d.id === active.dayId;
          return (
            <button
              key={d.id}
              onClick={() => setDay(d.id)}
              className={`glass rounded-xl px-3 py-2 text-left transition-all ${
                isActive ? "ring-1 ring-cyan/60 shadow-glow-cyan" : ""
              }`}
            >
              <div className="font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
                {d.code}
              </div>
              <div className={`text-[11px] font-medium ${isActive ? "text-cyan" : "text-foreground"}`}>
                {d.name}
              </div>
            </button>
          );
        })}
      </div>

      <RestTimer />

      {/* Active exercise */}
      <Panel
        title={day.name}
        code={day.code}
        status="ACTIVE"
        action={
          <button
            onClick={() => { finish(); toast.success("Sessão finalizada"); }}
            className="font-mono-tactical text-[9px] tracking-widest text-rose-400 hover:text-rose-300"
          >
            <Square className="inline h-3 w-3" /> ENCERRAR
          </button>
        }
      >
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {day.focus}
        </div>

        {exercise && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-base font-medium text-foreground">{exercise.name}</div>
                <div className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
                  ALVO · {exercise.primary.toUpperCase()} · DESCANSO {exercise.restSeconds}s
                </div>
              </div>
              <div className="flex gap-1">
                <NavBtn onClick={prev}><ChevronLeft className="h-4 w-4" /></NavBtn>
                <NavBtn onClick={next}><ChevronRight className="h-4 w-4" /></NavBtn>
              </div>
            </div>

            <ul className="space-y-1.5">
              {exercise.sets.map((set, i) => {
                const isCurrent = i === active.setIndex && !set.completed;
                return (
                  <motion.li
                    key={i}
                    layout
                    className={`glass flex items-center justify-between rounded-xl px-3 py-2.5 ${
                      isCurrent ? "ring-1 ring-cyan/60" : ""
                    } ${set.completed ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono-tactical inline-grid h-6 w-6 place-items-center rounded-md bg-white/5 text-[10px] tracking-wider text-cyan">
                        S{i + 1}
                      </span>
                      <span className="font-mono-tactical text-sm text-foreground">
                        {set.reps} <span className="text-muted-foreground">×</span> {set.weight}
                        <span className="ml-0.5 text-[10px] text-muted-foreground">kg</span>
                      </span>
                    </div>
                    {set.completed ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                        <span className="font-mono-tactical text-[10px] tracking-widest">OK</span>
                      </span>
                    ) : isCurrent ? (
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          completeSet();
                          toast.success("Set registrado", { description: `Descanso ${exercise.restSeconds}s iniciado` });
                        }}
                        className="flex items-center gap-1 rounded-full bg-cyan px-3 py-1 text-background"
                      >
                        <Play className="h-3 w-3" />
                        <span className="font-mono-tactical text-[10px] tracking-widest">COMPLETAR</span>
                      </motion.button>
                    ) : (
                      <span className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
                        QUEUED
                      </span>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </div>
        )}
      </Panel>

      {/* Exercise list */}
      <Panel title="Plano da Sessão" code={`${day.exercises.length} EX`} status="OK">
        <ul className="space-y-1">
          {day.exercises.map((ex, i) => {
            const done = ex.sets.every((s) => s.completed);
            const isCur = i === active.exerciseIndex;
            return (
              <li key={ex.id}>
                <button
                  onClick={() => selectExercise(i)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors ${
                    isCur ? "bg-cyan/10 text-cyan" : "hover:bg-white/5 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tactical w-6 text-[10px] tracking-widest text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[12px]">{ex.name}</span>
                  </div>
                  <span className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
                    {ex.sets.filter((s) => s.completed).length}/{ex.sets.length}
                    {done && <span className="ml-1 text-emerald-400">✓</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>
    </main>
  );
}

function NavBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass grid h-8 w-8 place-items-center rounded-lg text-foreground hover:text-cyan"
    >
      {children}
    </button>
  );
}
