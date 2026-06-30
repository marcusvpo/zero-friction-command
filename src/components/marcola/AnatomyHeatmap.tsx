import { useMemo } from "react";
import type { MuscleId } from "@/store/marcola";

/**
 * AnatomyHeatmap — Cybernetic anatomical heatmap (front + back).
 * Every major muscle group is a distinct <path id="muscle-..."> whose
 * fill/opacity is computed from `data[muscle]` (0..1).
 *
 * Colors:
 *   0.0       → #0B0F19 (Charcoal — untrained)
 *   0.0-0.6   → #00F0FF (Telemetry Cyan — light to medium fatigue)
 *   0.6-1.0   → #39FF14 (Matrix Green — high volume / accumulated fatigue)
 */
interface Props {
  data: Partial<Record<MuscleId, number>>;
  className?: string;
}

const CHARCOAL = "#0B0F19";
const CYAN = "#00F0FF";
const MATRIX = "#39FF14";

function intensityFor(v: number): { fill: string; opacity: number; glow: string } {
  if (v <= 0.02) return { fill: CHARCOAL, opacity: 1, glow: "transparent" };
  if (v < 0.6) {
    const op = 0.25 + v * 0.9; // 0.25..0.79
    return { fill: CYAN, opacity: Math.min(1, op), glow: CYAN };
  }
  const op = 0.55 + (v - 0.6) * 1.1; // 0.55..1.0
  return { fill: MATRIX, opacity: Math.min(1, op), glow: MATRIX };
}

interface PathDef { id: string; muscle: MuscleId; d: string; label: string; }

// FRONT view paths (viewBox 0 0 200 420)
const FRONT_BASE = "M100 14 c-12 0 -20 9 -20 22 c0 9 4 16 9 20 l-2 8 c-12 2 -22 6 -28 14 c-6 8 -8 18 -8 28 l0 18 c0 8 -3 16 -10 22 l-14 14 c-6 6 -10 14 -10 22 l0 30 c0 8 4 14 10 18 l4 4 l-4 14 l4 6 l-3 12 l-2 18 c0 14 4 28 10 42 l8 24 c4 10 6 22 6 32 l0 36 c0 6 -1 12 -3 18 l-4 16 c-1 4 -1 8 0 11 l16 0 c2 0 3 -1 3 -3 l1 -12 c1 -6 3 -12 5 -18 l8 -28 c2 -8 4 -16 4 -24 l1 -34 c0 -6 1 -12 3 -18 l4 -12 l4 12 c2 6 3 12 3 18 l1 34 c0 8 2 16 4 24 l8 28 c2 6 4 12 5 18 l1 12 c0 2 1 3 3 3 l16 0 c1 -3 1 -7 0 -11 l-4 -16 c-2 -6 -3 -12 -3 -18 l0 -36 c0 -10 2 -22 6 -32 l8 -24 c6 -14 10 -28 10 -42 l-2 -18 l-3 -12 l4 -6 l-4 -14 l4 -4 c6 -4 10 -10 10 -18 l0 -30 c0 -8 -4 -16 -10 -22 l-14 -14 c-7 -6 -10 -14 -10 -22 l0 -18 c0 -10 -2 -20 -8 -28 c-6 -8 -16 -12 -28 -14 l-2 -8 c5 -4 9 -11 9 -20 c0 -13 -8 -22 -20 -22 z";

const FRONT_PATHS: PathDef[] = [
  // Neck
  { id: "muscle-neck", muscle: "neck", label: "Pescoço",
    d: "M91 55 q9 6 18 0 l-2 9 q-7 4 -14 0 z" },
  // Trapezius (front cap)
  { id: "muscle-traps-front", muscle: "traps", label: "Trapézio",
    d: "M75 64 q25 -8 50 0 q-6 8 -12 10 q-13 4 -26 0 q-6 -2 -12 -10 z" },
  // Deltoids
  { id: "muscle-shoulder-l", muscle: "shoulders", label: "Deltoide E",
    d: "M58 78 q-12 4 -14 22 q-2 14 6 22 q10 -2 14 -14 q4 -16 -6 -30 z" },
  { id: "muscle-shoulder-r", muscle: "shoulders", label: "Deltoide D",
    d: "M142 78 q12 4 14 22 q2 14 -6 22 q-10 -2 -14 -14 q-4 -16 6 -30 z" },
  // Chest (single path, two pecs)
  { id: "muscle-chest", muscle: "chest", label: "Peitoral",
    d: "M75 88 q12 -4 23 -2 q4 1 4 5 l0 30 q0 6 -5 8 q-12 4 -22 -2 q-6 -4 -7 -12 q-2 -14 7 -27 z M125 88 q-12 -4 -23 -2 q-4 1 -4 5 l0 30 q0 6 5 8 q12 4 22 -2 q6 -4 7 -12 q2 -14 -7 -27 z" },
  // Biceps
  { id: "muscle-biceps-l", muscle: "biceps", label: "Bíceps E",
    d: "M46 118 q-8 12 -8 30 q0 14 6 26 q8 -2 12 -10 q4 -16 2 -34 q-1 -8 -12 -12 z" },
  { id: "muscle-biceps-r", muscle: "biceps", label: "Bíceps D",
    d: "M154 118 q8 12 8 30 q0 14 -6 26 q-8 -2 -12 -10 q-4 -16 -2 -34 q1 -8 12 -12 z" },
  // Forearms
  { id: "muscle-forearm-l", muscle: "forearms", label: "Antebraço E",
    d: "M38 176 q-4 22 0 44 q2 10 8 14 q6 -4 8 -14 q4 -20 2 -42 q-8 -4 -18 -2 z" },
  { id: "muscle-forearm-r", muscle: "forearms", label: "Antebraço D",
    d: "M162 176 q4 22 0 44 q-2 10 -8 14 q-6 -4 -8 -14 q-4 -20 -2 -42 q8 -4 18 -2 z" },
  // Core / Rectus abdominis (segmented look using single path)
  { id: "muscle-core", muscle: "core", label: "Core / Abdômen",
    d: "M88 130 l24 0 q4 0 4 4 l0 56 q0 4 -4 4 l-24 0 q-4 0 -4 -4 l0 -56 q0 -4 4 -4 z" },
  // Obliques
  { id: "muscle-obliques-l", muscle: "obliques", label: "Oblíquo E",
    d: "M72 138 q10 -2 14 4 l0 50 q-2 6 -10 6 q-10 -2 -12 -14 q-2 -22 8 -46 z" },
  { id: "muscle-obliques-r", muscle: "obliques", label: "Oblíquo D",
    d: "M128 138 q-10 -2 -14 4 l0 50 q2 6 10 6 q10 -2 12 -14 q2 -22 -8 -46 z" },
  // Quads
  { id: "muscle-quads-l", muscle: "quads", label: "Quadríceps E",
    d: "M76 222 q-10 26 -10 56 q0 22 6 38 q12 -4 16 -22 q6 -32 4 -68 q-1 -6 -16 -4 z" },
  { id: "muscle-quads-r", muscle: "quads", label: "Quadríceps D",
    d: "M124 222 q10 26 10 56 q0 22 -6 38 q-12 -4 -16 -22 q-6 -32 -4 -68 q1 -6 16 -4 z" },
  // Calves (front tibialis)
  { id: "muscle-calf-l", muscle: "calves", label: "Panturrilha E",
    d: "M72 328 q-4 24 0 50 q2 10 8 12 q6 -4 8 -14 q4 -24 2 -48 q-8 -4 -18 0 z" },
  { id: "muscle-calf-r", muscle: "calves", label: "Panturrilha D",
    d: "M128 328 q4 24 0 50 q-2 10 -8 12 q-6 -4 -8 -14 q-4 -24 -2 -48 q8 -4 18 0 z" },
];

// BACK view (mirror torso, includes lats/traps/triceps/glutes/hams)
const BACK_PATHS: PathDef[] = [
  { id: "muscle-traps", muscle: "traps", label: "Trapézio",
    d: "M75 62 q25 -8 50 0 l-4 32 q-2 4 -6 4 l-30 0 q-4 0 -6 -4 z" },
  { id: "muscle-rear-delt-l", muscle: "shoulders", label: "Deltoide Post. E",
    d: "M58 78 q-12 4 -14 22 q-2 14 6 22 q10 -2 14 -14 q4 -16 -6 -30 z" },
  { id: "muscle-rear-delt-r", muscle: "shoulders", label: "Deltoide Post. D",
    d: "M142 78 q12 4 14 22 q2 14 -6 22 q-10 -2 -14 -14 q-4 -16 6 -30 z" },
  { id: "muscle-lats-l", muscle: "lats", label: "Latíssimo E",
    d: "M72 100 q-12 12 -12 36 q0 22 14 38 q12 -6 14 -22 l0 -42 q0 -10 -16 -10 z" },
  { id: "muscle-lats-r", muscle: "lats", label: "Latíssimo D",
    d: "M128 100 q12 12 12 36 q0 22 -14 38 q-12 -6 -14 -22 l0 -42 q0 -10 16 -10 z" },
  { id: "muscle-lower-back", muscle: "lower-back", label: "Lombar",
    d: "M90 178 l20 0 q4 0 4 4 l0 30 q0 4 -4 4 l-20 0 q-4 0 -4 -4 l0 -30 q0 -4 4 -4 z" },
  { id: "muscle-triceps-l", muscle: "triceps", label: "Tríceps E",
    d: "M46 118 q-8 12 -8 30 q0 14 6 26 q8 -2 12 -10 q4 -16 2 -34 q-1 -8 -12 -12 z" },
  { id: "muscle-triceps-r", muscle: "triceps", label: "Tríceps D",
    d: "M154 118 q8 12 8 30 q0 14 -6 26 q-8 -2 -12 -10 q-4 -16 -2 -34 q1 -8 12 -12 z" },
  { id: "muscle-forearm-back-l", muscle: "forearms", label: "Antebraço E",
    d: "M38 176 q-4 22 0 44 q2 10 8 14 q6 -4 8 -14 q4 -20 2 -42 q-8 -4 -18 -2 z" },
  { id: "muscle-forearm-back-r", muscle: "forearms", label: "Antebraço D",
    d: "M162 176 q4 22 0 44 q-2 10 -8 14 q-6 -4 -8 -14 q-4 -20 -2 -42 q8 -4 18 -2 z" },
  { id: "muscle-glutes", muscle: "glutes", label: "Glúteos",
    d: "M76 218 q-6 12 -4 28 q2 12 14 14 q14 2 14 -10 l0 -22 q0 -10 -8 -12 q-10 -2 -16 2 z M124 218 q6 12 4 28 q-2 12 -14 14 q-14 2 -14 -10 l0 -22 q0 -10 8 -12 q10 -2 16 2 z" },
  { id: "muscle-hamstring-l", muscle: "hamstrings", label: "Posterior E",
    d: "M76 262 q-10 24 -10 50 q0 18 6 30 q12 -4 16 -20 q6 -28 4 -58 q-1 -6 -16 -2 z" },
  { id: "muscle-hamstring-r", muscle: "hamstrings", label: "Posterior D",
    d: "M124 262 q10 24 10 50 q0 18 -6 30 q-12 -4 -16 -20 q-6 -28 -4 -58 q1 -6 16 -2 z" },
  { id: "muscle-calf-back-l", muscle: "calves", label: "Panturrilha E",
    d: "M72 328 q-4 24 0 50 q2 10 8 12 q6 -4 8 -14 q4 -24 2 -48 q-8 -4 -18 0 z" },
  { id: "muscle-calf-back-r", muscle: "calves", label: "Panturrilha D",
    d: "M128 328 q4 24 0 50 q-2 10 -8 12 q-6 -4 -8 -14 q-4 -24 -2 -48 q8 -4 18 0 z" },
];

function BodyView({
  paths, data, label,
}: { paths: PathDef[]; data: Props["data"]; label: string }) {
  const items = useMemo(
    () =>
      paths.map((p) => {
        const v = data[p.muscle] ?? 0;
        const { fill, opacity, glow } = intensityFor(v);
        return { ...p, fill, opacity, glow, value: v };
      }),
    [paths, data],
  );

  return (
    <div className="relative flex-1">
      <div className="absolute inset-0 anatomical-grid opacity-40" aria-hidden />
      <svg
        viewBox="0 0 200 420"
        className="relative h-full w-full"
        role="img"
        aria-label={`Mapa anatômico ${label}`}
      >
        <defs>
          <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Silhouette base */}
        <path
          d={FRONT_BASE}
          fill={CHARCOAL}
          stroke="rgba(0,240,255,0.28)"
          strokeWidth="0.8"
        />

        {/* Muscle paths */}
        {items.map((p) => (
          <path
            key={p.id}
            id={p.id}
            d={p.d}
            fill={p.fill}
            fillOpacity={p.opacity}
            stroke={p.glow}
            strokeOpacity={p.value > 0.02 ? 0.55 : 0.2}
            strokeWidth="0.6"
            style={{
              filter:
                p.value > 0.02
                  ? `drop-shadow(0 0 ${2 + p.value * 4}px ${p.glow})`
                  : "none",
              transition: "fill-opacity 600ms ease, filter 600ms ease",
            }}
          >
            <title>{`${p.label} · ${Math.round(p.value * 100)}%`}</title>
          </path>
        ))}

        {/* HUD targeting reticle */}
        <g stroke="rgba(0,240,255,0.35)" strokeWidth="0.4" fill="none">
          <line x1="100" y1="0" x2="100" y2="420" strokeDasharray="2 6" />
        </g>

        {/* Label */}
        <text
          x="100" y="412"
          textAnchor="middle"
          fill="rgba(0,240,255,0.7)"
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
          letterSpacing="0.3em"
        >
          {label}
        </text>
      </svg>

      {/* Scan-line sweep */}
      <span
        className="anatomical-sweep pointer-events-none absolute left-2 right-2 h-px"
        aria-hidden
      />
    </div>
  );
}

export function AnatomyHeatmap({ data, className = "" }: Props) {
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-stretch gap-2 rounded-xl border border-cyan/15 bg-background/40 p-2">
        <BodyView paths={FRONT_PATHS} data={data} label="ANT" />
        <span className="w-px self-stretch bg-gradient-to-b from-transparent via-cyan/30 to-transparent" />
        <BodyView paths={BACK_PATHS} data={data} label="POST" />
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-between px-1">
        <span className="font-mono-tactical text-[9px] tracking-[0.25em] text-muted-foreground">
          VOLUME · 7D
        </span>
        <div className="flex items-center gap-2">
          <LegendDot color={CHARCOAL} label="Idle" />
          <LegendDot color={CYAN} label="Carga" />
          <LegendDot color={MATRIX} label="Saturado" />
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="inline-block h-2 w-2 rounded-sm"
        style={{ background: color, boxShadow: color !== CHARCOAL ? `0 0 6px ${color}` : "none" }}
      />
      <span className="font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
        {label}
      </span>
    </span>
  );
}
