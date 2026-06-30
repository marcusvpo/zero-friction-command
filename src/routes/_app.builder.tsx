import { createFileRoute } from "@tanstack/react-router";
import { GripVertical, Plus, Trash2, Edit3, Save } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Panel } from "@/components/marcola/Panel";
import { useMarcolaStore } from "@/store/marcola";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/builder")({
  head: () => ({
    meta: [
      { title: "Tactical Routine Builder · Marcola Prime" },
      { name: "description", content: "Construa sua rotina de 5 dias com inteligência tática." },
    ],
  }),
  component: BuilderPage,
});

function BuilderPage() {
  const routine = useMarcolaStore((s) => s.routine);
  const muscleVolume = useMarcolaStore((s) => s.muscleVolume);
  const addExercise = useMarcolaStore((s) => s.addExerciseToDay);
  const removeExercise = useMarcolaStore((s) => s.removeExercise);
  const renameExercise = useMarcolaStore((s) => s.renameExercise);
  const persistRoutine = useMarcolaStore((s) => s.persistRoutine);
  const syncStatus = useMarcolaStore((s) => s.syncStatus);
  const [editing, setEditing] = useState<{ dayId: string; exerciseId: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const ok = await persistRoutine();
    setSaving(false);
    if (ok) toast.success("Rotina salva no banco");
    else toast.message("Salva localmente", { description: "Configure as credenciais Supabase para sincronizar." });
  };

  return (
    <main className="relative z-10 flex-1 space-y-4 px-4 pt-2 pb-28">
      <Panel
        title="Routine Builder" code={routine.split} status="ACTIVE"
        action={
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving}
            className="flex min-h-[36px] items-center gap-1 rounded-full bg-cyan/15 px-3 py-1 text-cyan ring-1 ring-cyan/40 disabled:opacity-60"
          >
            <Save className="h-3 w-3" />
            <span className="font-mono-tactical text-[10px] tracking-widest">
              {saving ? "SALVANDO…" : syncStatus === "ok" ? "SINCRONIZADO" : "SALVAR"}
            </span>
          </motion.button>
        }
      >
        <div className="space-y-2">
          {routine.days.map((day, i) => (
            <motion.article
              key={day.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass rounded-xl p-3"
            >
              <header className="mb-2 flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-mono-tactical text-[10px] tracking-widest text-cyan">{day.code}</span>
                  <span className="truncate text-sm font-medium text-foreground">{day.name}</span>
                </div>
              </header>
              <p className="font-mono-tactical mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                {day.focus}
              </p>
              <ul className="space-y-1">
                {day.exercises.map((ex) => {
                  const isEditing = editing?.dayId === day.id && editing.exerciseId === ex.id;
                  return (
                    <li
                      key={ex.id}
                      className="flex min-h-[44px] items-center justify-between gap-2 rounded-md px-2 py-1 text-[11px] hover:bg-white/5"
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={() => {
                            renameExercise(day.id, ex.id, draft.trim() || ex.name);
                            setEditing(null);
                            toast.success("Exercício atualizado");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            if (e.key === "Escape") setEditing(null);
                          }}
                          className="font-mono-tactical w-full bg-transparent text-[12px] text-cyan outline-none ring-1 ring-cyan/40 rounded px-2 py-1"
                        />
                      ) : (
                        <span className="min-w-0 flex-1 truncate text-foreground">{ex.name}</span>
                      )}
                      <span className="font-mono-tactical shrink-0 text-[10px] tracking-widest text-muted-foreground">
                        {ex.sets.length}×{ex.sets[0]?.reps ?? 0}
                      </span>
                      <div className="flex shrink-0 gap-0.5">
                        <IconAction onClick={() => { setEditing({ dayId: day.id, exerciseId: ex.id }); setDraft(ex.name); }}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </IconAction>
                        <IconAction onClick={() => { removeExercise(day.id, ex.id); toast.error(`${ex.name} removido`); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconAction>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { addExercise(day.id); toast.success(`Exercício adicionado em ${day.name}`); }}
                className="mt-2 flex min-h-[40px] w-full items-center justify-center gap-1 rounded-md border border-dashed border-cyan/30 py-2 text-cyan hover:bg-cyan/5"
              >
                <Plus className="h-3 w-3" />
                <span className="font-mono-tactical text-[10px] tracking-widest">ADICIONAR EXERCÍCIO</span>
              </motion.button>
            </motion.article>
          ))}
        </div>
      </Panel>

      <Panel title="Volume Semanal" code="alvo" status="OK">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {Object.entries(muscleVolume).slice(0, 8).map(([k, v]) => (
            <div key={k} className="glass flex min-h-[36px] items-center justify-between rounded-lg px-2.5 py-1.5">
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
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-cyan"
    >
      {children}
    </motion.button>
  );
}
