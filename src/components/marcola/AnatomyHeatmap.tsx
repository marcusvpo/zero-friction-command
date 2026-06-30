import { useMemo } from "react";
import bodyImg from "@/assets/anatomical-body.png";
import type { MuscleId } from "@/store/marcola";

/**
 * AnatomyHeatmap — High-Fidelity Holographic Image Overlay (Phase 5).
 *
 * ── Alignment Contract ──────────────────────────────────────────────────
 *   • `anatomical-body.png` intrinsic size: 704 × 1280 (aspect ≈ 0.55).
 *   • The wrapper holds `aspect-ratio: 704 / 1280` so the image NEVER stretches.
 *   • <img> uses `object-contain` (letterbox if container ever differs).
 *   • <svg> uses `viewBox="0 0 704 1280"` + `preserveAspectRatio="xMidYMid meet"`,
 *     i.e. it scales identically to the image. A coordinate (X:352, Y:640)
 *     in the SVG always lands on pixel (352,640) of the PNG, regardless of
 *     viewport size.
 *
 * ── Data Binding ────────────────────────────────────────────────────────
 *   The `data` prop is `Record<MuscleId, weeklySets>` (raw set counts from
 *   `fetchWeeklyVolume()` over the trailing 7 days). Fill/opacity are
 *   computed via discrete thresholds (per phase-5 spec):
 *      sets === 0   → transparent
 *      1..4         → rgba(0,240,255,0.25)
 *      5..8         → rgba(0,240,255,0.55)
 *      >8           → rgba(0,240,255,0.80)
 *
 * ── DEBUG MODE ──────────────────────────────────────────────────────────
 *   Flip `DEBUG_MODE = true` to render every mask as a bright-red outline so
 *   you can SEE where the polygons sit vs. the underlying anatomy and
 *   fine-tune the coordinates in MUSCLE_PATHS below.
 */

const IMAGE_W = 704;
const IMAGE_H = 1280;
const DEBUG_MODE = true; // ← FLIP TO false IN PRODUCTION

interface Props {
  /** Completed sets per primary muscle over the trailing 7 days. */
  data: Partial<Record<MuscleId, number>>;
  className?: string;
}

interface MusclePath {
  id: string;
  muscle: MuscleId;
  label: string;
  /**
   * Polygon points in IMAGE PIXELS (0..704 x, 0..1280 y).
   * Format: "x,y x,y x,y …".
   */
  points: string;
}

// ────────────────────────────────────────────────────────────────────────
// TODO: Developer, adjust these exact coordinates to perfectly align the
// glowing masks over the muscles on the image. Use DEBUG_MODE = true to
// preview the red outlines, then tweak X/Y in 704×1280 pixel space.
// ────────────────────────────────────────────────────────────────────────
const MUSCLE_PATHS: MusclePath[] = [
  // Upper body — front view
  { id: "m-neck",        muscle: "neck",        label: "Pescoço",
    points: "324,128 380,128 380,179 324,179" },
  { id: "m-traps",       muscle: "traps",       label: "Trapézio",
    points: "296,154 408,154 422,230 282,230" },
  { id: "m-shoulder-l",  muscle: "shoulders",   label: "Deltoide E",
    points: "211,230 268,230 268,333 211,333" },
  { id: "m-shoulder-r",  muscle: "shoulders",   label: "Deltoide D",
    points: "436,230 493,230 493,333 436,333" },
  { id: "m-chest",       muscle: "chest",       label: "Peitoral",
    points: "268,256 352,230 436,256 451,358 352,410 253,358" },
  { id: "m-biceps-l",    muscle: "biceps",      label: "Bíceps E",
    points: "183,333 239,333 232,461 190,461" },
  { id: "m-biceps-r",    muscle: "biceps",      label: "Bíceps D",
    points: "465,333 521,333 514,461 472,461" },
  { id: "m-triceps-l",   muscle: "triceps",     label: "Tríceps E",
    points: "169,333 197,333 190,461 169,461" },
  { id: "m-triceps-r",   muscle: "triceps",     label: "Tríceps D",
    points: "507,333 535,333 535,461 514,461" },
  { id: "m-forearm-l",   muscle: "forearms",    label: "Antebraço E",
    points: "155,486 211,486 197,614 155,614" },
  { id: "m-forearm-r",   muscle: "forearms",    label: "Antebraço D",
    points: "493,486 549,486 549,614 507,614" },

  // Core
  { id: "m-lats-l",      muscle: "lats",        label: "Latíssimo E",
    points: "239,358 282,435 282,563 225,538" },
  { id: "m-lats-r",      muscle: "lats",        label: "Latíssimo D",
    points: "422,435 465,358 479,538 422,563" },
  { id: "m-obliques-l",  muscle: "obliques",    label: "Oblíquo E",
    points: "268,435 310,435 310,589 268,563" },
  { id: "m-obliques-r",  muscle: "obliques",    label: "Oblíquo D",
    points: "394,435 436,435 436,563 394,589" },
  { id: "m-core",        muscle: "core",        label: "Core",
    points: "310,410 394,410 394,589 310,589" },
  { id: "m-lower-back",  muscle: "lower-back",  label: "Lombar",
    points: "310,563 394,563 394,640 310,640" },

  // Lower body
  { id: "m-glutes",      muscle: "glutes",      label: "Glúteos",
    points: "282,614 422,614 422,704 282,704" },
  { id: "m-quads-l",     muscle: "quads",       label: "Quadríceps E",
    points: "268,717 345,717 338,922 268,922" },
  { id: "m-quads-r",     muscle: "quads",       label: "Quadríceps D",
    points: "359,717 436,717 436,922 366,922" },
  { id: "m-hamstring-l", muscle: "hamstrings",  label: "Posterior E",
    points: "268,768 345,768 338,947 268,947" },
  { id: "m-hamstring-r", muscle: "hamstrings",  label: "Posterior D",
    points: "359,768 436,768 436,947 366,947" },
  { id: "m-calf-l",      muscle: "calves",      label: "Panturrilha E",
    points: "275,998 338,998 331,1152 282,1152" },
  { id: "m-calf-r",      muscle: "calves",      label: "Panturrilha D",
    points: "366,998 429,998 422,1152 373,1152" },
];

/** Threshold → fill/opacity mapping per Phase-5 spec. */
function paintFor(weeklySets: number): { fill: string; stroke: string; glow: number } {
  if (weeklySets <= 0) return { fill: "transparent", stroke: "transparent", glow: 0 };
  if (weeklySets <= 4) return { fill: "rgba(0,240,255,0.25)", stroke: "rgba(0,240,255,0.55)", glow: 4 };
  if (weeklySets <= 8) return { fill: "rgba(0,240,255,0.55)", stroke: "rgba(0,240,255,0.85)", glow: 8 };
  return { fill: "rgba(0,240,255,0.80)", stroke: "rgba(57,255,20,1)", glow: 14 };
}

export function AnatomyHeatmap({ data, className = "" }: Props) {
  const items = useMemo(
    () => MUSCLE_PATHS.map((p) => ({ ...p, sets: data[p.muscle] ?? 0 })),
    [data],
  );

  return (
    <div className={`relative ${className}`}>
      {/* Aspect-ratio locked stage — image + svg always identically scaled */}
      <div
        className="relative mx-auto w-full overflow-hidden rounded-xl border border-cyan/15 bg-[#070a12]"
        style={{ aspectRatio: `${IMAGE_W} / ${IMAGE_H}`, maxWidth: 420 }}
      >
        {/* Foundational image — absolutely positioned, object-contain */}
        <img
          src={bodyImg}
          alt="Mapa anatômico de referência"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-90"
          width={IMAGE_W}
          height={IMAGE_H}
          draggable={false}
        />

        {/* Tactical scan grid */}
        <div className="anatomical-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden />

        {/* Holographic muscle overlay — exact pixel viewBox */}
        <svg
          viewBox={`0 0 ${IMAGE_W} ${IMAGE_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <filter id="muscle-glow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {items.map((p) => {
            if (DEBUG_MODE) {
              return (
                <polygon
                  key={p.id}
                  points={p.points}
                  fill="rgba(255,0,0,0.08)"
                  stroke="red"
                  strokeWidth={2}
                >
                  <title>{`${p.label} · ${p.sets} sets/7d`}</title>
                </polygon>
              );
            }
            const { fill, stroke, glow } = paintFor(p.sets);
            return (
              <polygon
                key={p.id}
                points={p.points}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.5}
                filter={p.sets > 0 ? "url(#muscle-glow)" : undefined}
                style={{
                  transition: "fill 700ms ease, stroke 700ms ease",
                  filter:
                    p.sets > 0
                      ? `drop-shadow(0 0 ${glow}px rgba(0,240,255,0.75))`
                      : "none",
                }}
              >
                <title>{`${p.label} · ${p.sets} sets/7d`}</title>
              </polygon>
            );
          })}
        </svg>

        {/* Scan sweep */}
        <span className="anatomical-sweep pointer-events-none absolute inset-x-2 h-px" aria-hidden />

        {/* HUD corner ticks */}
        <Corners />

        {DEBUG_MODE && (
          <div className="absolute right-1.5 top-1.5 rounded bg-red-500/90 px-1.5 py-0.5 font-mono-tactical text-[9px] tracking-widest text-white">
            DEBUG · ALINHAR
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-between px-1">
        <span className="font-mono-tactical text-[9px] tracking-[0.25em] text-muted-foreground">
          MAPA HOLOGRÁFICO · 7D · SETS REAIS
        </span>
        <div className="flex items-center gap-2">
          <LegendDot alpha={0.25} label="1-4" />
          <LegendDot alpha={0.55} label="5-8" />
          <LegendDot alpha={0.80} label=">8" />
        </div>
      </div>
    </div>
  );
}

function LegendDot({ alpha, label }: { alpha: number; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="inline-block h-2 w-2 rounded-sm"
        style={{
          background: `rgba(0,240,255,${alpha})`,
          boxShadow: `0 0 6px rgba(0,240,255,${alpha})`,
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
