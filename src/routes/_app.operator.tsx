import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  AlertTriangle, User, Ruler, Scale, Hexagon, Trophy, Pencil, Check, X,
} from "lucide-react";
import { useMarcolaStore, type PRMedal, type MuscleId } from "@/store/marcola";
import { toast } from "sonner";

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
  const setBio = useMarcolaStore((s) => s.setBiometrics);
  const needsCalib = useMarcolaStore((s) => s.needsWeightCalibration());
  const daysSince = useMarcolaStore((s) => s.daysSinceWeightUpdate());
  const medals = useMarcolaStore((s) => s.getPRMedals());

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
    </main>
  );
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
