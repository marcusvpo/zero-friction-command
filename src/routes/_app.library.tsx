import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import {
  ArrowLeft, Search, X, Plus, Repeat, Library as LibraryIcon, Star,
  Dumbbell, Cable, Cog, User as UserIcon, Activity, Zap,
} from "lucide-react";
import {
  EXERCISE_LIBRARY, EQUIPMENT_LABEL, MUSCLE_LABEL, TAG_LABEL,
  type Equipment, type LibraryExercise,
} from "@/lib/exercise-library";
import { useMarcolaStore, type MuscleId } from "@/store/marcola";
import { toast } from "sonner";

interface LibrarySearch {
  swap?: string;
  day?: string;
  muscle?: string;
}

export const Route = createFileRoute("/_app/library")({
  head: () => ({
    meta: [
      { title: "Biblioteca de Exercícios · Marcola Prime" },
      { name: "description", content: "Banco tático de exercícios com avaliação Gym Tok e troca inteligente." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): LibrarySearch => ({
    swap: typeof s.swap === "string" ? s.swap : undefined,
    day: typeof s.day === "string" ? s.day : undefined,
    muscle: typeof s.muscle === "string" ? s.muscle : undefined,
  }),
  component: LibraryPage,
});

const EQUIPMENTS: Equipment[] = ["barbell", "dumbbell", "machine", "smith", "cable", "bodyweight", "kettlebell", "cardio"];
const MUSCLES: MuscleId[] = [
  "chest","shoulders","biceps","triceps","forearms",
  "core","obliques","lats","traps","lower-back",
  "quads","hamstrings","glutes","calves","neck",
];

const equipmentIcon = (eq: Equipment) => {
  switch (eq) {
    case "barbell":
    case "dumbbell": return Dumbbell;
    case "cable": return Cable;
    case "machine":
    case "smith": return Cog;
    case "bodyweight": return UserIcon;
    case "kettlebell": return Zap;
    case "cardio": return Activity;
  }
};

const equipmentTone = (eq: Equipment): string => {
  switch (eq) {
    case "barbell": return "text-cyan ring-cyan/40";
    case "dumbbell": return "text-cyan ring-cyan/30";
    case "machine": return "text-matrix ring-matrix/30";
    case "smith": return "text-matrix ring-matrix/40";
    case "cable": return "text-amber ring-amber/30";
    case "bodyweight": return "text-foreground ring-white/15";
    case "kettlebell": return "text-amber ring-amber/40";
    case "cardio": return "text-rose-400 ring-rose-500/30";
  }
};

function LibraryPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_app/library" });
  const routine = useMarcolaStore((s) => s.routine);
  const swapExercise = useMarcolaStore((s) => s.swapExercise);
  const addLibraryExerciseToDay = useMarcolaStore((s) => s.addLibraryExerciseToDay);
  const saturatedMap = useMarcolaStore((s) => s.saturatedMap);
  const isSaturated = useMarcolaStore((s) => s.isSaturated);
  const markSaturated = useMarcolaStore((s) => s.markExerciseSaturated);
  const unmarkSaturated = useMarcolaStore((s) => s.unmarkSaturated);
  const ratingOverrides = useMarcolaStore((s) => s.ratingOverrides);

  const isSwapMode = !!search.swap && !!search.day;

  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleId | "all">(
    (search.muscle as MuscleId | undefined) ?? "all",
  );
  const [equipment, setEquipment] = useState<Equipment | "all">("all");
  const [hideSaturated, setHideSaturated] = useState(true);
  const [selected, setSelected] = useState<LibraryExercise | null>(null);

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY
      .filter((e) => {
        if (muscle !== "all" && e.primary !== muscle && !e.secondary.includes(muscle)) return false;
        if (equipment !== "all" && e.equipment !== equipment) return false;
        if (query && !e.name.toLowerCase().includes(query.toLowerCase())) return false;
        if (hideSaturated && isSaturated(e.id)) return false;
        return true;
      })
      .sort((a, b) => {
        const ra = ratingOverrides[a.id]?.stars ?? a.rating.stars;
        const rb = ratingOverrides[b.id]?.stars ?? b.rating.stars;
        return rb - ra;
      });
  }, [query, muscle, equipment, hideSaturated, isSaturated, ratingOverrides]);

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

  const saturatedCount = Object.keys(saturatedMap).length;

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
            {saturatedCount > 0 && <span className="ml-2 text-amber">· {saturatedCount} saturado(s)</span>}
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
      <div className="mb-1.5 flex gap-1 overflow-x-auto scrollbar-none">
        <Chip active={muscle === "all"} onClick={() => setMuscle("all")} tone="cyan">Geral</Chip>
        {MUSCLES.map((m) => (
          <Chip key={m} active={muscle === m} onClick={() => setMuscle(m)} tone="cyan">{MUSCLE_LABEL[m]}</Chip>
        ))}
      </div>

      {/* Toggle saturados */}
      <div className="mb-2 flex items-center justify-between font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
        <button onClick={() => setHideSaturated((v) => !v)} className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${hideSaturated ? "bg-emerald-400" : "bg-white/20"}`} />
          {hideSaturated ? "OCULTANDO SATURADOS" : "MOSTRANDO TODOS"}
        </button>
        <span>ORD: ★ DECRESCENTE</span>
      </div>

      {/* Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="grid h-40 place-items-center text-center text-sm text-muted-foreground">
            Nenhum exercício corresponde aos filtros.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pb-2">
            {filtered.map((lib) => {
              const Icon = equipmentIcon(lib.equipment);
              const tone = equipmentTone(lib.equipment);
              const stars = ratingOverrides[lib.id]?.stars ?? lib.rating.stars;
              const saturated = isSaturated(lib.id);
              return (
                <motion.button
                  key={lib.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelected(lib)}
                  className={`glass flex flex-col gap-1.5 overflow-hidden rounded-xl p-2.5 text-left ring-1 ${
                    saturated ? "ring-amber/30 opacity-70" : "ring-white/5 hover:ring-cyan/40"
                  }`}
                >
                  {/* topo: ícone + estrelas */}
                  <div className="flex items-start justify-between gap-1">
                    <div className={`glass grid h-9 w-9 place-items-center rounded-lg ring-1 ${tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <RatingStars stars={stars} />
                  </div>
                  {/* nome + equipamento */}
                  <div>
                    <div className="font-mono-tactical text-[8px] tracking-widest text-muted-foreground">
                      {EQUIPMENT_LABEL[lib.equipment].toUpperCase()}
                      {lib.machineName && ` · ${lib.machineName.toUpperCase()}`}
                    </div>
                    <div className="line-clamp-2 text-[12px] font-semibold leading-tight text-foreground">{lib.name}</div>
                  </div>
                  {/* músculos */}
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="rounded bg-cyan/15 px-1.5 py-0.5 font-mono-tactical text-[9px] tracking-widest text-cyan">
                      {MUSCLE_LABEL[lib.primary]}
                    </span>
                    {lib.secondary.slice(0, 2).map((m) => (
                      <span key={m} className="font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
                        {MUSCLE_LABEL[m]}
                      </span>
                    ))}
                  </div>
                  {/* dificuldade + status */}
                  <div className="flex items-center justify-between font-mono-tactical text-[9px] tracking-widest">
                    <span className="text-amber">{"●".repeat(lib.difficulty)}{"○".repeat(3 - lib.difficulty)}</span>
                    {saturated && <span className="text-amber">SATURADO</span>}
                  </div>
                </motion.button>
              );
            })}
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
              <DetailContent
                lib={selected}
                onClose={() => setSelected(null)}
                isSwapMode={isSwapMode}
                onSwap={() => handleSwap(selected)}
                onAdd={(dayId) => handleAdd(selected, dayId)}
                days={routine.days}
                isSaturated={isSaturated(selected.id)}
                onMarkSaturated={(weeks) => {
                  markSaturated(selected.id, weeks);
                  toast.success(`Saturado por ${weeks} semanas`);
                }}
                onUnmarkSaturated={() => {
                  unmarkSaturated(selected.id);
                  toast.message("Removido da lista de saturados");
                }}
                ratingOverride={ratingOverrides[selected.id]}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ───────────────────────── Detail Sheet ───────────────────────── */

interface DetailProps {
  lib: LibraryExercise;
  onClose: () => void;
  isSwapMode: boolean;
  onSwap: () => void;
  onAdd: (dayId: string) => void;
  days: { id: string; code: string; name: string }[];
  isSaturated: boolean;
  onMarkSaturated: (weeks: number) => void;
  onUnmarkSaturated: () => void;
  ratingOverride?: { stars: number; rationale: string; source: string; updatedAt: string };
}

function DetailContent({
  lib, onClose, isSwapMode, onSwap, onAdd, days,
  isSaturated, onMarkSaturated, onUnmarkSaturated, ratingOverride,
}: DetailProps) {
  const Icon = equipmentIcon(lib.equipment);
  const tone = equipmentTone(lib.equipment);
  const stars = ratingOverride?.stars ?? lib.rating.stars;
  const rationale = ratingOverride?.rationale ?? lib.rating.rationale;
  const source = ratingOverride?.source ?? lib.rating.source;

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-white/5 p-4">
        <div className={`glass grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono-tactical text-[9px] tracking-[0.3em] text-cyan">
            {EQUIPMENT_LABEL[lib.equipment].toUpperCase()}
            {lib.machineName && ` · ${lib.machineName.toUpperCase()}`}
          </div>
          <h2 className="truncate text-lg font-bold text-foreground">{lib.name}</h2>
          <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{lib.shortDescription}</p>
        </div>
        <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-foreground" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-4">
        {/* Rating */}
        <div className="glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RatingStars stars={stars} large />
              <span className="font-mono-tactical text-sm font-bold text-foreground">{stars.toFixed(1)}</span>
            </div>
            <span className="font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
              {source === "curated" ? "CURADO · GYM TOK" : "DEEP RESEARCH"}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{rationale}</p>
        </div>

        {/* Músculos atingidos */}
        <div className="mt-3">
          <div className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">MÚSCULOS</div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="rounded bg-cyan px-2 py-0.5 font-mono-tactical text-[10px] tracking-widest text-background">
              {MUSCLE_LABEL[lib.primary]} · PRIMÁRIO
            </span>
            {lib.secondary.map((m) => (
              <span key={m} className="rounded bg-white/[0.06] px-2 py-0.5 font-mono-tactical text-[10px] tracking-widest text-foreground/80">
                {MUSCLE_LABEL[m]}
              </span>
            ))}
          </div>
        </div>

        {/* Specs */}
        <div className="mt-3 grid grid-cols-3 gap-1.5 font-mono-tactical text-[9px] tracking-widest">
          <div className="glass rounded-md p-2 text-center">
            <div className="text-muted-foreground">DIFICULDADE</div>
            <div className="mt-0.5 text-amber">{"●".repeat(lib.difficulty)}{"○".repeat(3 - lib.difficulty)}</div>
          </div>
          <div className="glass rounded-md p-2 text-center">
            <div className="text-muted-foreground">DESCANSO</div>
            <div className="mt-0.5 text-cyan">{lib.defaultRestSeconds}s</div>
          </div>
          <div className="glass rounded-md p-2 text-center">
            <div className="text-muted-foreground">TEMPO</div>
            <div className="mt-0.5 text-matrix">{lib.defaultTempo}</div>
          </div>
        </div>

        {/* Tags */}
        {lib.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {lib.tags.map((t) => (
              <span key={t} className="rounded-full bg-white/[0.04] px-2 py-0.5 font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
                #{TAG_LABEL[t]}
              </span>
            ))}
          </div>
        )}

        {/* Instruções */}
        <div className="mt-3">
          <div className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">EXECUÇÃO</div>
          <ol className="mt-1.5 space-y-1.5 rounded-lg bg-white/[0.03] p-3 text-[12px] text-foreground/90">
            {lib.instructions.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono-tactical shrink-0 text-cyan">{String(i+1).padStart(2,"0")}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Cues */}
        {lib.cues.length > 0 && (
          <div className="mt-3">
            <div className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">CUES TÉCNICOS</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {lib.cues.map((c, i) => (
                <span key={i} className="rounded bg-matrix/10 px-2 py-1 text-[11px] text-matrix">→ {c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Saturação */}
        <div className="mt-4 rounded-xl border border-amber/20 bg-amber/5 p-3">
          <div className="flex items-center justify-between">
            <div className="font-mono-tactical text-[10px] tracking-widest text-amber">
              {isSaturated ? "MARCADO COMO SATURADO" : "ENJOOU? MARCAR SATURADO"}
            </div>
            {isSaturated && (
              <button onClick={onUnmarkSaturated} className="font-mono-tactical text-[10px] tracking-widest text-cyan">REMOVER</button>
            )}
          </div>
          {!isSaturated && (
            <div className="mt-2 flex gap-1.5">
              {[2, 4, 8].map((w) => (
                <button
                  key={w}
                  onClick={() => onMarkSaturated(w)}
                  className="glass flex-1 rounded-md py-2 font-mono-tactical text-[10px] tracking-widest text-foreground hover:text-amber"
                >
                  {w} sem
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-white/5 p-4">
        {isSwapMode ? (
          <button
            onClick={onSwap}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber via-cyan to-amber font-mono-tactical text-sm font-bold uppercase tracking-widest text-background"
            style={{ boxShadow: "0 0 24px rgba(0,240,255,0.45)" }}
          >
            <Repeat className="h-4 w-4" /> Substituir Atual
          </button>
        ) : (
          <>
            <div className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">ADICIONAR AO DIA</div>
            <div className="mt-1.5 grid grid-cols-5 gap-1">
              {days.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onAdd(d.id)}
                  className="glass flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg ring-1 ring-white/5 hover:ring-cyan/40"
                >
                  <Plus className="h-3.5 w-3.5 text-cyan" />
                  <span className="font-mono-tactical text-[9px] tracking-widest text-foreground">{d.code}</span>
                  <span className="font-mono-tactical text-[8px] tracking-widest text-muted-foreground truncate max-w-[44px]">{d.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function RatingStars({ stars, large = false }: { stars: number; large?: boolean }) {
  const full = Math.floor(stars);
  const half = stars - full >= 0.4 && stars - full < 0.9;
  const total = 5;
  const size = large ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < full;
        const isHalf = i === full && half;
        return (
          <Star
            key={i}
            className={`${size} ${filled || isHalf ? "text-amber" : "text-white/15"}`}
            fill={filled ? "currentColor" : isHalf ? "url(#half)" : "none"}
            strokeWidth={1.5}
          />
        );
      })}
    </div>
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
