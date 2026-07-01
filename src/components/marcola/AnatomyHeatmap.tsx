import { useMemo } from "react";
import bodyImg from "@/assets/anatomical-body.png";
import type { MuscleId } from "@/store/marcola";

/**
 * AnatomyHeatmap — pontos de calor VERMELHOS sobre os músculos do PNG anatômico.
 *
 * Coordenadas em pixels do PNG (704 × 1280). O SVG escala junto com a
 * imagem via viewBox + preserveAspectRatio="xMidYMid meet".
 */

const IMAGE_W = 704;
const IMAGE_H = 1280;

interface Props {
  data: Partial<Record<MuscleId, number>>;
  className?: string;
}

interface MusclePoint {
  id: string;
  muscle: MuscleId;
  label: string;
  cx: number;
  cy: number;
}

const MUSCLE_POINTS: MusclePoint[] = [
  // Cabeça / pescoço / trapézio
  { id: "p-neck",   muscle: "neck",       label: "Pescoço",     cx: 352, cy: 150 },
  { id: "p-traps",  muscle: "traps",      label: "Trapézio",    cx: 352, cy: 210 },

  // Ombros
  { id: "p-shL", muscle: "shoulders", label: "Deltoide E", cx: 245, cy: 285 },
  { id: "p-shR", muscle: "shoulders", label: "Deltoide D", cx: 459, cy: 285 },

  // Peito
  { id: "p-chestL", muscle: "chest", label: "Peitoral E", cx: 305, cy: 320 },
  { id: "p-chestR", muscle: "chest", label: "Peitoral D", cx: 399, cy: 320 },

  // Braços
  { id: "p-bicL", muscle: "biceps",  label: "Bíceps E",   cx: 212, cy: 400 },
  { id: "p-bicR", muscle: "biceps",  label: "Bíceps D",   cx: 492, cy: 400 },
  { id: "p-triL", muscle: "triceps", label: "Tríceps E",  cx: 182, cy: 405 },
  { id: "p-triR", muscle: "triceps", label: "Tríceps D",  cx: 522, cy: 405 },
  { id: "p-faL",  muscle: "forearms",label: "Antebraço E",cx: 180, cy: 550 },
  { id: "p-faR",  muscle: "forearms",label: "Antebraço D",cx: 524, cy: 550 },

  // Costas / lats
  { id: "p-latL", muscle: "lats", label: "Latíssimo E", cx: 260, cy: 450 },
  { id: "p-latR", muscle: "lats", label: "Latíssimo D", cx: 444, cy: 450 },

  // Core
  { id: "p-core", muscle: "core", label: "Core (abdômen)", cx: 352, cy: 495 },
  { id: "p-oblL", muscle: "obliques", label: "Oblíquo E", cx: 290, cy: 510 },
  { id: "p-oblR", muscle: "obliques", label: "Oblíquo D", cx: 414, cy: 510 },
  { id: "p-lb",   muscle: "lower-back", label: "Lombar", cx: 352, cy: 600 },

  // Glúteos
  { id: "p-glut", muscle: "glutes", label: "Glúteos", cx: 352, cy: 660 },

  // Pernas
  { id: "p-qL", muscle: "quads", label: "Quadríceps E", cx: 305, cy: 810 },
  { id: "p-qR", muscle: "quads", label: "Quadríceps D", cx: 399, cy: 810 },
  { id: "p-hL", muscle: "hamstrings", label: "Posterior E", cx: 305, cy: 870 },
  { id: "p-hR", muscle: "hamstrings", label: "Posterior D", cx: 399, cy: 870 },
  { id: "p-cL", muscle: "calves", label: "Panturrilha E", cx: 305, cy: 1075 },
  { id: "p-cR", muscle: "calves", label: "Panturrilha D", cx: 399, cy: 1075 },
];

/** Intensidade → raio + opacidade central. */
function heatFor(sets: number): { r: number; alpha: number } | null {
  if (sets <= 0) return null;
  if (sets <= 4) return { r: 46, alpha: 0.55 };
  if (sets <= 8) return { r: 60, alpha: 0.75 };
  return { r: 76, alpha: 0.92 };
}

export function AnatomyHeatmap({ data, className = "" }: Props) {
  const items = useMemo(
    () => MUSCLE_POINTS.map((p) => ({ ...p, sets: data[p.muscle] ?? 0 })),
    [data],
  );

  return (
    <div className={`relative ${className}`}>
      <div
        className="relative mx-auto w-full overflow-hidden rounded-xl border border-cyan/15 bg-[#070a12]"
        style={{ aspectRatio: `${IMAGE_W} / ${IMAGE_H}`, maxWidth: 420 }}
      >
        <img
          src={bodyImg}
          alt="Mapa anatômico"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-90"
          width={IMAGE_W}
          height={IMAGE_H}
          draggable={false}
        />

        <div className="anatomical-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden />

        <svg
          viewBox={`0 0 ${IMAGE_W} ${IMAGE_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <radialGradient id="heat-red" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ff3b3b" stopOpacity={1} />
              <stop offset="40%"  stopColor="#ff2020" stopOpacity={0.7} />
              <stop offset="75%"  stopColor="#c40000" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#000000" stopOpacity={0} />
            </radialGradient>
          </defs>

          {items.map((p) => {
            const heat = heatFor(p.sets);
            if (!heat) return null;
            return (
              <g key={p.id} style={{ transition: "opacity 500ms ease" }} opacity={heat.alpha}>
                {/* Halo externo mais amplo */}
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={heat.r * 1.35}
                  fill="url(#heat-red)"
                  opacity={0.55}
                  style={{ filter: "blur(6px)" }}
                />
                {/* Núcleo mais denso */}
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={heat.r}
                  fill="url(#heat-red)"
                  style={{ filter: "drop-shadow(0 0 14px rgba(255,50,50,0.85))" }}
                />
                <title>{`${p.label} · ${p.sets} sets/7d`}</title>
              </g>
            );
          })}
        </svg>

        <span className="anatomical-sweep pointer-events-none absolute inset-x-2 h-px" aria-hidden />
        <Corners />
      </div>

      <div className="mt-2 flex items-center justify-between px-1">
        <span className="font-mono-tactical text-[9px] tracking-[0.25em] text-muted-foreground">
          MAPA TÉRMICO · 7D · SETS REAIS
        </span>
        <div className="flex items-center gap-2">
          <LegendDot alpha={0.55} label="1-4" />
          <LegendDot alpha={0.75} label="5-8" />
          <LegendDot alpha={0.92} label=">8" />
        </div>
      </div>
    </div>
  );
}

function LegendDot({ alpha, label }: { alpha: number; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{
          background: `rgba(255,45,45,${alpha})`,
          boxShadow: `0 0 8px rgba(255,45,45,${alpha})`,
        }}
      />
      <span className="font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
        {label}
      </span>
    </span>
  );
}

function Corners() {
  const base = "absolute h-3 w-3 border-cyan/60";
  return (
    <>
      <span className={`${base} left-1.5 top-1.5 border-l border-t`} />
      <span className={`${base} right-1.5 top-1.5 border-r border-t`} />
      <span className={`${base} bottom-1.5 left-1.5 border-l border-b`} />
      <span className={`${base} bottom-1.5 right-1.5 border-r border-b`} />
    </>
  );
}
