import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  AlertTriangle, User, Ruler, Scale, Hexagon, Trophy, Pencil, Check, X, Trash2,
} from "lucide-react";
import { useMarcolaStore, type PRMedal, type MuscleId } from "@/store/marcola";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/operator")({
  head: () => ({
    meta: [
      { title: "Operator Profile · Marcola Prime" },
      { name: "description", content: "Perfil do operador: biométricos e medalhas táticas de PR." },
    ],
  }),
  component: OperatorProfile,
});

const MUSCLE_LABEL: Record<MuscleId, string> = {
  chest: "PEITO", shoulders: "OMBROS", biceps: "BÍCEPS", triceps: "TRÍCEPS",
  forearms: "ANTEBRAÇO", core: "CORE", obliques: "OBLÍQUOS", quads: "QUADRÍCEPS",
  hamstrings: "POSTERIOR", glutes: "GLÚTEO", calves: "PANTURRILHA", lats: "DORSAL",
  traps: "TRAPÉZIO", "lower-back": "LOMBAR", neck: "PESCOÇO",
};

function OperatorProfile() {
  const biometrics = useMarcolaStore((s) => s.biometrics);
  const routine = useMarcolaStore((s) => s.routine);
  const setBio = useMarcolaStore((s) => s.setBiometrics);
  const wipeData = useMarcolaStore((s) => s.wipeData);
  const [wiping, setWiping] = useState(false);

  const daysSince = useMemo(() => daysSinceWeightUpdate(biometrics.weightUpdatedAt), [biometrics.weightUpdatedAt]);
  const needsCalib = daysSince === null ? true : daysSince >= 7;
  const medals = useMemo(() => getPRMedalsFromRoutine(routine), [routine]);

  const handleWipe = async () => {
    setWiping(true);
    try {
      await wipeData();
      toast.success("Sistema zerado", { description: "Logs, históricos e sessão local removidos." });
    } catch {
      toast.error("Falha parcial", { description: "Dados locais limpos; verifique conexão para sincronizar." });
    } finally {
      setWiping(false);
    }
  };

  const [editing, setEditing] = useState(false);
  const [draftWeight, setDraftWeight] = useState<string>(biometrics.weightKg?.toString() ?? "");
  const [draftHeight, setDraftHeight] = useState<string>(biometrics.heightCm?.toString() ?? "");

  const handleSave = () => {
    const w = parseFloat(draftWeight.replace(",", "."));
    const h = parseFloat(draftHeight.replace(",", "."));
    const patch: { weightKg?: number; heightCm?: number } = {};
    if (!Number.isNaN(w) && w > 0) patch.weightKg = +w.toFixed(1);
    if (!Number.isNaN(h) && h > 0) patch.heightCm = Math.round(h);
    setBio(patch);
    setEditing(false);
    toast.success("Biométricos calibrados", {
      description: "Sistema operacional sincronizado.",
    });
  };

  const bmi =
    biometrics.weightKg && biometrics.heightCm
      ? +(biometrics.weightKg / Math.pow(biometrics.heightCm / 100, 2)).toFixed(1)
      : null;

  return (
    <main className="relative z-10 flex-1 space-y-4 px-4 pt-2 pb-28">
      {/* ─── Header ─── */}
      <header className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan/10 ring-1 ring-cyan/40">
          <User className="h-4 w-4 text-cyan" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Operator Profile</h1>
          <p className="font-mono-tactical text-[10px] tracking-[0.25em] text-muted-foreground">
            ID · MARCOLA-001 · STATUS ATIVO
          </p>
        </div>
      </header>

      {/* ─── Calibration Alert ─── */}
      {needsCalib && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl border border-amber/50 bg-amber/10 p-3"
          style={{ boxShadow: "0 0 22px rgba(255,179,0,0.35), inset 0 0 18px rgba(255,179,0,0.1)" }}
        >
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-x-0 top-0 h-px bg-amber"
          />
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            <div className="min-w-0">
              <div className="font-mono-tactical text-[10px] font-semibold tracking-[0.22em] text-amber">
                SYSTEM ALERT
              </div>
              <p className="mt-0.5 text-[12px] leading-snug text-foreground">
                OPERATOR WEIGHT CALIBRATION REQUIRED
              </p>
              <p className="font-mono-tactical mt-0.5 text-[9px] tracking-widest text-amber/70">
                {daysSince === null
                  ? "PESO NUNCA REGISTRADO"
                  : `ÚLTIMA LEITURA · ${daysSince}D ATRÁS`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Biometrics ─── */}
      <section className="glass-strong relative overflow-hidden rounded-2xl p-4">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono-tactical text-[10px] tracking-[0.25em] text-cyan">
            BIOMÉTRICOS · M1
          </span>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="font-mono-tactical flex items-center gap-1 text-[10px] tracking-widest text-muted-foreground hover:text-cyan"
            >
              <Pencil className="h-3 w-3" /> EDITAR
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => setEditing(false)}
                className="font-mono-tactical flex items-center gap-1 rounded-md px-2 py-1 text-[10px] tracking-widest text-muted-foreground hover:bg-white/5"
              >
                <X className="h-3 w-3" /> CANC
              </button>
              <button
                onClick={handleSave}
                className="font-mono-tactical flex items-center gap-1 rounded-md bg-cyan/20 px-2 py-1 text-[10px] tracking-widest text-cyan ring-1 ring-cyan/40"
              >
                <Check className="h-3 w-3" /> SALVAR
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <BioField
            icon={Scale}
            label="PESO"
            unit="kg"
            value={biometrics.weightKg}
            draft={draftWeight}
            onDraft={setDraftWeight}
            editing={editing}
          />
          <BioField
            icon={Ruler}
            label="ALTURA"
            unit="cm"
            value={biometrics.heightCm}
            draft={draftHeight}
            onDraft={setDraftHeight}
            editing={editing}
          />
        </div>

        {bmi !== null && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
            <span className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
              ÍNDICE BIOMÉTRICO · IMC
            </span>
            <span className="font-mono-tactical text-sm font-semibold text-cyan">{bmi}</span>
          </div>
        )}
      </section>

      {/* ─── PR Medals ─── */}
      <section className="glass-strong relative overflow-hidden rounded-2xl p-4">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-matrix/60 to-transparent" />
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-matrix" />
            <span className="font-mono-tactical text-[10px] tracking-[0.25em] text-matrix">
              MEDALHAS PR · ACHIEVEMENTS
            </span>
          </div>
          <span className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
            {String(medals.length).padStart(2, "0")} UNL
          </span>
        </div>

        {medals.length === 0 ? (
          <div className="rounded-lg bg-white/[0.02] p-6 text-center">
            <Hexagon className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="font-mono-tactical mt-2 text-[10px] tracking-widest text-muted-foreground">
              NENHUMA MEDALHA DESBLOQUEADA
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {medals.slice(0, 10).map((m, i) => (
              <Medal key={m.exerciseId} medal={m} rank={i} />
            ))}
          </div>
        )}
      </section>

      {/* ─── Danger zone: ZERAR SISTEMA ─── */}
      <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-3">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 shrink-0 text-rose-400" />
          <span className="font-mono-tactical text-[10px] tracking-[0.25em] text-rose-300">
            DANGER ZONE
          </span>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Apaga logs de sets, histórico e sessão ativa. Rotina, biométricos e suplementos são preservados.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={wiping}
              className="font-mono-tactical mt-3 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-rose-500/20 text-[11px] tracking-[0.22em] text-rose-300 ring-1 ring-rose-500/40 hover:bg-rose-500/30 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {wiping ? "ZERANDO…" : "ZERAR SISTEMA"}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Zerar todos os logs?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação apaga permanentemente: workout logs, PRs registrados, histórico de sessões e
                a fila offline. A rotina, biométricos e configurações de suplementos permanecem.
                Não pode ser desfeito.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleWipe}
                className="bg-rose-500 text-white hover:bg-rose-500/90"
              >
                Zerar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </main>
  );
}

function daysSinceWeightUpdate(weightUpdatedAt: string | null) {
  if (!weightUpdatedAt) return null;
  const updatedAt = new Date(weightUpdatedAt).getTime();
  if (Number.isNaN(updatedAt)) return null;
  return Math.floor((Date.now() - updatedAt) / 86_400_000);
}

function getPRMedalsFromRoutine(routine: ReturnType<typeof useMarcolaStore.getState>["routine"]) {
  const best = new Map<string, PRMedal>();
  for (const day of routine.days) {
    for (const ex of day.exercises) {
      let top: { weight: number; reps: number } = { weight: 0, reps: 0 };
      for (const st of ex.sets) {
        if (st.isWarmup) continue;
        if (st.weight > top.weight) top = { weight: st.weight, reps: st.reps };
      }
      if (top.weight <= 0) continue;
      const key = ex.libraryId ?? ex.id;
      const prev = best.get(key);
      if (!prev || top.weight > prev.weight) {
        best.set(key, {
          exerciseId: ex.id,
          exerciseName: ex.name,
          primary: ex.primary,
          weight: top.weight,
          reps: top.reps,
        });
      }
    }
  }
  return Array.from(best.values()).sort((a, b) => b.weight - a.weight);
}

function BioField({
  icon: Icon, label, unit, value, draft, onDraft, editing,
}: {
  icon: typeof Scale; label: string; unit: string;
  value: number | null; draft: string; onDraft: (v: string) => void; editing: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-cyan" />
        <span className="font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      {editing ? (
        <input
          inputMode="decimal"
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          placeholder="—"
          className="font-mono-tactical mt-1.5 w-full bg-transparent text-2xl font-semibold text-cyan outline-none placeholder:text-muted-foreground/30"
        />
      ) : (
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="font-mono-tactical text-2xl font-semibold text-foreground">
            {value ?? "—"}
          </span>
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
      )}
    </div>
  );
}

function Medal({ medal, rank }: { medal: PRMedal; rank: number }) {
  const isTop = rank < 3;
  const tone = isTop ? "text-matrix" : "text-cyan";
  const glow = isTop
    ? "0 0 18px rgba(57,255,20,0.45)"
    : "0 0 14px rgba(0,240,255,0.35)";
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className="relative flex flex-col items-center rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10"
      style={{ boxShadow: glow }}
    >
      <div className="relative">
        <Hexagon className={`h-12 w-12 ${tone}`} strokeWidth={1.25} fill="currentColor" fillOpacity={0.08} />
        <span className="absolute inset-0 grid place-items-center font-mono-tactical text-[10px] font-bold text-foreground">
          {medal.weight}
        </span>
      </div>
      <div className="mt-1.5 w-full text-center">
        <div className="font-mono-tactical truncate text-[9px] tracking-widest text-muted-foreground">
          {MUSCLE_LABEL[medal.primary]}
        </div>
        <div className="truncate text-[10px] font-medium leading-tight text-foreground">
          {medal.exerciseName}
        </div>
        <div className={`font-mono-tactical mt-0.5 text-[9px] tracking-widest ${tone}`}>
          {medal.weight}KG × {medal.reps}
        </div>
      </div>
    </motion.div>
  );
}
