import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, X, Plus, Repeat, Library as LibraryIcon } from "lucide-react";
import { EXERCISE_LIBRARY, EQUIPMENT_LABEL, MUSCLE_LABEL, type Equipment, type LibraryExercise } from "@/lib/exercise-library";
import { useMarcolaStore, type MuscleId } from "@/store/marcola";
import { toast } from "sonner";

interface LibrarySearch {
  swap?: string;
  day?: string;
}

export const Route = createFileRoute("/_app/library")({
  head: () => ({
    meta: [
      { title: "Biblioteca de Exercícios · Marcola Prime" },
      { name: "description", content: "Banco tático de exercícios com execução exata." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): LibrarySearch => ({
    swap: typeof s.swap === "string" ? s.swap : undefined,
    day: typeof s.day === "string" ? s.day : undefined,
  }),
  component: LibraryPage,
});

const EQUIPMENTS: Equipment[] = ["barbell", "dumbbell", "cable", "machine", "bodyweight"];
const MUSCLES: MuscleId[] = [
  "chest","shoulders","biceps","triceps","forearms",
  "core","obliques","lats","traps","lower-back",
  "quads","hamstrings","glutes","calves","neck",
];

function LibraryPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_app/library" });
  const routine = useMarcolaStore((s) => s.routine);
  const swapExercise = useMarcolaStore((s) => s.swapExercise);
  const addLibraryExerciseToDay = useMarcolaStore((s) => s.addLibraryExerciseToDay);

  const isSwapMode = !!search.swap && !!search.day;

  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleId | "all">("all");
  const [equipment, setEquipment] = useState<Equipment | "all">("all");
  const [selected, setSelected] = useState<LibraryExercise | null>(null);

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter((e) => {
      if (muscle !== "all" && e.primary !== muscle && !e.secondary.includes(muscle)) return false;
      if (equipment !== "all" && e.equipment !== equipment) return false;
      if (query && !e.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query, muscle, equipment]);

  const handleAdd = (lib: LibraryExercise, dayId: string) => {
    addLibraryExerciseToDay(dayId, lib.id);
    toast.success("Exercício adicionado", { description: `${lib.name} → ${routine.days.find(d => d.id === dayId)?.name}` });
    setSelected(null);
    navigate({ to: "/workout" });
  };

  const handleSwap = (lib: LibraryExercise) => {
    if (!search.swap || !search.day) return;
    swapExercise(search.day, search.swap, lib.id);
    toast.success("Exercício substituído", { description: lib.name });
    setSelected(null);
    navigate({ to: "/workout" });
  };

  return (
    <main className="relative z-10 flex min-h-0 flex-1 flex-col px-3 pt-2 pb-3">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <button onClick={() => navigate({ to: "/workout" })} className="glass grid h-9 w-9 place-items-center rounded-lg" aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-mono-tactical text-[9px] tracking-[0.3em] text-cyan">
            <LibraryIcon className="mr-1 inline h-3 w-3" /> ARSENAL · {filtered.length}/{EXERCISE_LIBRARY.length}
          </div>
          <h1 className="truncate text-base font-bold text-foreground">
            {isSwapMode ? "Substituir Exercício" : "Biblioteca de Exercícios"}
          </h1>
        </div>
      </div>

      {/* Search */}
      <div className="glass mb-2 flex items-center gap-2 rounded-lg px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar exercício…"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Limpar busca">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Equipment chips */}
      <div className="mb-1.5 flex gap-1 overflow-x-auto scrollbar-none">
        <Chip active={equipment === "all"} onClick={() => setEquipment("all")}>Todos</Chip>
        {EQUIPMENTS.map((eq) => (
          <Chip key={eq} active={equipment === eq} onClick={() => setEquipment(eq)}>{EQUIPMENT_LABEL[eq]}</Chip>
        ))}
      </div>

      {/* Muscle chips */}
      <div className="mb-2 flex gap-1 overflow-x-auto scrollbar-none">
        <Chip active={muscle === "all"} onClick={() => setMuscle("all")} tone="cyan">Geral</Chip>
        {MUSCLES.map((m) => (
          <Chip key={m} active={muscle === m} onClick={() => setMuscle(m)} tone="cyan">{MUSCLE_LABEL[m]}</Chip>
        ))}
      </div>

      {/* Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="grid h-40 place-items-center text-center text-sm text-muted-foreground">
            Nenhum exercício corresponde aos filtros.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pb-2">
            {filtered.map((lib) => (
              <motion.button
                key={lib.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(lib)}
                className="glass flex flex-col overflow-hidden rounded-xl text-left ring-1 ring-white/5 hover:ring-cyan/40"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-black">
                  <img src={lib.image} alt={lib.name} loading="lazy" width={512} height={512} className="h-full w-full object-contain" />
                  <span className="font-mono-tactical absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[8px] tracking-widest text-cyan">
                    {EQUIPMENT_LABEL[lib.equipment].toUpperCase()}
                  </span>
                </div>
                <div className="p-2">
                  <div className="font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
                    {MUSCLE_LABEL[lib.primary].toUpperCase()}
                  </div>
                  <div className="line-clamp-2 text-[12px] font-semibold leading-tight text-foreground">{lib.name}</div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Detail sheet */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-3"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-md overflow-hidden rounded-2xl border border-cyan/20"
            >
              <div className="relative aspect-square w-full bg-black">
                <img src={selected.image} alt={selected.name} className="h-full w-full object-contain" width={1024} height={1024} />
                <button
                  onClick={() => setSelected(null)}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-foreground"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <div className="font-mono-tactical text-[10px] tracking-[0.3em] text-cyan">
                  {MUSCLE_LABEL[selected.primary].toUpperCase()} · {EQUIPMENT_LABEL[selected.equipment].toUpperCase()}
                </div>
                <h2 className="mt-0.5 text-lg font-bold text-foreground">{selected.name}</h2>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selected.secondary.map((m) => (
                    <span key={m} className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
                      {MUSCLE_LABEL[m]}
                    </span>
                  ))}
                  <span className="rounded bg-amber/15 px-1.5 py-0.5 font-mono-tactical text-[9px] tracking-widest text-amber">
                    {"●".repeat(selected.difficulty)}
                  </span>
                  <span className="rounded bg-cyan/10 px-1.5 py-0.5 font-mono-tactical text-[9px] tracking-widest text-cyan">
                    {selected.defaultRestSeconds}s desc
                  </span>
                  <span className="rounded bg-matrix/10 px-1.5 py-0.5 font-mono-tactical text-[9px] tracking-widest text-matrix">
                    tempo {selected.defaultTempo}
                  </span>
                </div>

                <ol className="mt-3 max-h-44 space-y-1.5 overflow-y-auto rounded-lg bg-white/[0.03] p-3 text-[12px] text-foreground/90">
                  {selected.instructions.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-mono-tactical shrink-0 text-cyan">{String(i+1).padStart(2,"0")}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                {isSwapMode ? (
                  <button
                    onClick={() => handleSwap(selected)}
                    className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber via-cyan to-amber font-mono-tactical text-sm font-bold uppercase tracking-widest text-background"
                    style={{ boxShadow: "0 0 24px rgba(0,240,255,0.45)" }}
                  >
                    <Repeat className="h-4 w-4" /> Substituir Atual
                  </button>
                ) : (
                  <div className="mt-4">
                    <div className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">ADICIONAR AO DIA</div>
                    <div className="mt-1.5 grid grid-cols-5 gap-1">
                      {routine.days.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => handleAdd(selected, d.id)}
                          className="glass flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg ring-1 ring-white/5 hover:ring-cyan/40"
                        >
                          <Plus className="h-3.5 w-3.5 text-cyan" />
                          <span className="font-mono-tactical text-[9px] tracking-widest text-foreground">{d.code}</span>
                          <span className="font-mono-tactical text-[8px] tracking-widest text-muted-foreground truncate max-w-[44px]">{d.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Chip({ children, active, onClick, tone = "default" }: { children: React.ReactNode; active: boolean; onClick: () => void; tone?: "default" | "cyan" }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[32px] shrink-0 rounded-full px-3 py-1 font-mono-tactical text-[10px] tracking-widest transition-all ${
        active
          ? tone === "cyan"
            ? "bg-cyan text-background shadow-glow-cyan"
            : "bg-foreground text-background"
          : "glass text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
