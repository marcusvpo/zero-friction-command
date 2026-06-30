import { createFileRoute } from "@tanstack/react-router";
import { GripVertical, Plus, Trash2, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import { TopTelemetryBar } from "@/components/marcola/TopTelemetryBar";
import { BottomDock } from "@/components/marcola/BottomDock";
import { Panel } from "@/components/marcola/Panel";
import { useMarcolaStore } from "@/store/marcola";
import { toast } from "sonner";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "Tactical Routine Builder · Marcola Prime" },
      { name: "description", content: "Construa sua rotina de 5 dias com inteligência tática." },
    ],
  }),
  component: BuilderPage,
});

function BuilderPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col">
        <span className="hud-corner-tl" aria-hidden />
        <span className="hud-corner-tr" aria-hidden />
        <TopTelemetryBar />
        <Body />
        <BottomDock />
      </div>
    </div>
  );
}

function Body() {
  const routine = useMarcolaStore((s) => s.routine);

  return (
    <main className="relative z-10 flex-1 space-y-4 px-4 pt-2 pb-28">
      <Panel
        title="Routine Builder"
        code={routine.split}
        status="ACTIVE"
        action={
          <button
            onClick={() => toast.message("Auto-balance executado", { description: "Volume redistribuído entre os 5 dias" })}
            className="font-mono-tactical text-[9px] tracking-widest text-cyan hover:text-cyan/80"
          >
            AUTO · BALANCE
          </button>
        }
      >
        <div className="space-y-2">
          {routine.days.map((day, i) => (
            <motion.article
              key={day.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-3"
            >
              <header className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono-tactical text-[10px] tracking-widest text-cyan">
                    {day.code}
                  </span>
                  <span className="text-sm font-medium text-foreground">{day.name}</span>
                </div>
                <div className="flex gap-1">
                  <IconAction onClick={() => toast.info(`Editar ${day.name}`)}>
                    <Edit3 className="h-3.5 w-3.5" />
                  </IconAction>
                  <IconAction onClick={() => toast.error(`${day.name} removido`)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconAction>
                </div>
              </header>
              <p className="font-mono-tactical mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                {day.focus}
              </p>
              <ul className="space-y-1">
                {day.exercises.map((ex) => (
                  <li
                    key={ex.id}
                    className="flex items-center justify-between rounded-md px-2 py-1 text-[11px] hover:bg-white/5"
                  >
                    <span className="truncate text-foreground">{ex.name}</span>
                    <span className="font-mono-tactical shrink-0 text-[10px] tracking-widest text-muted-foreground">
                      {ex.sets.length}×{ex.sets[0]?.reps ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => toast.success(`Exercício adicionado em ${day.name}`)}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-cyan/30 py-1.5 text-cyan hover:bg-cyan/5"
              >
                <Plus className="h-3 w-3" />
                <span className="font-mono-tactical text-[10px] tracking-widest">ADICIONAR EXERCÍCIO</span>
              </button>
            </motion.article>
          ))}
        </div>
      </Panel>

      <Panel title="Volume Semanal" code="alvo" status="OK">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {Object.entries(useMarcolaStore.getState().muscleVolume).slice(0, 8).map(([k, v]) => (
            <div key={k} className="glass flex items-center justify-between rounded-lg px-2.5 py-1.5">
              <span className="capitalize text-foreground">{k}</span>
              <span className="font-mono-tactical text-cyan">{Math.round(v * 100)}%</span>
            </div>
          ))}
        </div>
      </Panel>
    </main>
  );
}

function IconAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-cyan"
    >
      {children}
    </button>
  );
}
