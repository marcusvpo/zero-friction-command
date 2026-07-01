import { createFileRoute } from "@tanstack/react-router";
import { GripVertical, Plus, Trash2, Edit3, Save, Calendar } from "lucide-react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { useState } from "react";
import { Panel } from "@/components/marcola/Panel";
import { useMarcolaStore, WEEKDAY_LABELS, WEEKDAY_LONG, type Routine } from "@/store/marcola";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/builder")({
  head: () => ({
    meta: [
      { title: "Tactical Routine Builder · Marcola Prime" },
      { name: "description", content: "Construa sua rotina semanal com inteligência tática." },
    ],
  }),
  component: BuilderPage,
});

const SPLITS: { id: Routine["split"]; label: string; desc: string }[] = [
  { id: "PPL",         label: "PPL",        desc: "Push · Pull · Legs" },
  { id: "UPPER/LOWER", label: "U/L",        desc: "Upper · Lower" },
  { id: "BRO",         label: "BRO",        desc: "1 grupo por dia" },
  { id: "FULL",        label: "HYBRID",     desc: "Full body híbrido" },
];

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun

function BuilderPage() {
  const routine = useMarcolaStore((s) => s.routine);
  const weekdayMap = useMarcolaStore((s) => s.weekdayMap);
  const setSplit = useMarcolaStore((s) => s.setSplit);
  const assignWeekday = useMarcolaStore((s) => s.assignWeekday);
  const addExercise = useMarcolaStore((s) => s.addExerciseToDay);
  const removeExercise = useMarcolaStore((s) => s.removeExercise);
  const renameExercise = useMarcolaStore((s) => s.renameExercise);
  const persistRoutine = useMarcolaStore((s) => s.persistRoutine);
  const syncStatus = useMarcolaStore((s) => s.syncStatus);

  const [editing, setEditing] = useState<{ dayId: string; exerciseId: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(routine.days[0]?.id ?? null);

  const handleSave = async () => {
    setSaving(true);
    const ok = await persistRoutine();
    setSaving(false);
    if (ok) toast.success("Rotina sincronizada");
    else toast.message("Salva localmente", { description: "Configure as credenciais para sincronizar." });
  };

  return (
    <main className="relative z-10 flex-1 space-y-4 px-4 pt-2 pb-28">
      {/* ─────── Split selector ─────── */}
      <Panel
        title="Split Tático" code={routine.split} status="ACTIVE"
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
        <div className="grid grid-cols-4 gap-1.5">
          {SPLITS.map((s) => {
            const sel = s.id === routine.split;
            return (
              <motion.button
                key={s.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => { setSplit(s.id); toast.success(`Split: ${s.label}`); }}
                className={`glass min-h-[56px] rounded-xl px-2 py-2 text-left transition-all ${
                  sel ? "ring-1 ring-cyan/60 shadow-glow-cyan" : ""
                }`}
              >
                <div className={`font-mono-tactical text-[11px] font-semibold tracking-wider ${sel ? "text-cyan" : "text-foreground"}`}>
                  {s.label}
                </div>
                <div className="font-mono-tactical mt-0.5 text-[8px] uppercase tracking-widest text-muted-foreground">
                  {s.desc}
                </div>
              </motion.button>
            );
          })}
        </div>
      </Panel>

      {/* ─────── Weekly mapping grid ─────── */}
      <Panel title="Mapa Semanal" code="SEG–DOM" status="ACTIVE">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span className="font-mono-tactical tracking-widest">ATRIBUA OPERAÇÃO POR DIA</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAY_ORDER.map((wd) => {
            const id = weekdayMap[wd];
            const day = routine.days.find((d) => d.id === id);
            return (
              <div key={wd} className="glass flex flex-col items-stretch rounded-lg p-1.5">
                <div className="text-center font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
                  {WEEKDAY_LABELS[wd]}
                </div>
                <select
                  value={id ?? ""}
                  onChange={(e) => assignWeekday(wd, e.target.value || null)}
                  className="mt-1 w-full appearance-none rounded-md bg-white/[0.04] px-1 py-1 text-center font-mono-tactical text-[10px] font-semibold text-cyan outline-none ring-1 ring-cyan/20 focus:ring-cyan/60"
                  aria-label={`Operação para ${WEEKDAY_LONG[wd]}`}
                >
                  <option value="">—</option>
                  {routine.days.map((d) => (
                    <option key={d.id} value={d.id} className="bg-background">
                      {d.code} · {d.name}
                    </option>
                  ))}
                </select>
                <div className="mt-1 truncate text-center text-[9px] text-muted-foreground/70">
                  {day ? day.focus.split("·")[0]?.trim() : "Rest"}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ─────── Day editor ─────── */}
      <Panel title="Operações" code={`${routine.days.length} DIAS`} status="OK">
        <div className="space-y-2">
          {routine.days.map((day, i) => {
            const open = expandedDay === day.id;
            const usedOn = WEEKDAY_ORDER.filter((wd) => weekdayMap[wd] === day.id)
              .map((wd) => WEEKDAY_LABELS[wd]);
            return (
              <motion.article
                key={day.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-xl p-3"
              >
                <button
                  onClick={() => setExpandedDay(open ? null : day.id)}
                  className="flex w-full items-center justify-between gap-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-mono-tactical text-[10px] tracking-widest text-cyan">{day.code}</span>
                    <span className="truncate text-sm font-medium text-foreground">{day.name}</span>
                  </div>
                  <span className="font-mono-tactical shrink-0 text-[9px] tracking-widest text-muted-foreground">
                    {usedOn.length ? usedOn.join(" · ") : "—"}
                  </span>
                </button>

                {open && (
                  <>
                    <p className="font-mono-tactical mb-2 mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {day.focus}
                    </p>
                    <ul className="space-y-1">
                      {day.exercises.map((ex) => {
                        const isEditing = editing?.dayId === day.id && editing.exerciseId === ex.id;
                        return (
                          <li key={ex.id}
                            className="flex min-h-[44px] items-center justify-between gap-2 rounded-md px-2 py-1 text-[11px] hover:bg-white/5">
                            {isEditing ? (
                              <input
                                autoFocus value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onBlur={() => {
                                  renameExercise(day.id, ex.id, draft.trim() || ex.name);
                                  setEditing(null); toast.success("Exercício atualizado");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                  if (e.key === "Escape") setEditing(null);
                                }}
                                className="font-mono-tactical w-full rounded bg-transparent px-2 py-1 text-[12px] text-cyan outline-none ring-1 ring-cyan/40"
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
                  </>
                )}
              </motion.article>
            );
          })}
        </div>
      </Panel>
    </main>
  );
}

function IconAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-cyan"
    >
      {children}
    </motion.button>
  );
}
