import { useMemo } from "react";
import bodyImg from "@/assets/anatomical-body.png";
import type { MuscleId } from "@/store/marcola";

/**
 * AnatomyHeatmap — High-Fidelity Holographic Image Overlay.
 *
 * Architecture:
 *   1. `anatomical-body.png` is the foundational background of an
 *      aspect-ratio locked container.
 *   2. An absolutely positioned <svg viewBox="0 0 100 100" preserveAspectRatio="none">
 *      stretches over it so polygon coordinates are PERCENTAGES of the image.
 *   3. Each muscle <polygon> defaults to transparent and lights up as a
 *      translucent neon mask when its Zustand muscle-volume entry registers
 *      training load.
 *
 * 🔧 MANUAL TWEAK ZONE
 * The polygon coordinates below are approximate. To realign with your image,
 * edit the `points` values in the MUSCLE_PATHS array. Coordinates are in
 * percentages of the image (0..100 on x and y). Higher x → right, higher y → down.
 */

interface Props {
  data: Partial<Record<MuscleId, number>>;
  className?: string;
}

const CYAN = "0, 240, 255";    // rgb
const MATRIX = "57, 255, 20";  // rgb
const AMBER = "255, 176, 32";  // rgb

function rgbFor(v: number): string {
  if (v >= 0.66) return MATRIX;
  if (v >= 0.33) return AMBER;
  return CYAN;
}

interface MusclePath {
  id: string;
  muscle: MuscleId;
  label: string;
  /** SVG polygon points in image-percentage coordinates. */
  points: string;
}

/**
 * 🔧 MANUAL TWEAK ZONE — adjust `points` to match your specific PNG.
 * Coordinates are "x,y x,y x,y …" in percent (0..100). The viewBox is
 * 0 0 100 100 and the SVG stretches to the image, so % values translate
 * directly to pixels of the rendered image.
 */
const MUSCLE_PATHS: MusclePath[] = [
  // ────────── Upper body ──────────
  { id: "m-chest", muscle: "chest", label: "Peitoral",
    points: "38,20 50,18 62,20 64,28 50,32 36,28" },
  { id: "m-shoulder-l", muscle: "shoulders", label: "Deltoide E",
    points: "30,18 38,18 38,26 30,26" },
  { id: "m-shoulder-r", muscle: "shoulders", label: "Deltoide D",
    points: "62,18 70,18 70,26 62,26" },
  { id: "m-traps", muscle: "traps", label: "Trapézio",
    points: "42,12 58,12 60,18 40,18" },
  { id: "m-biceps-l", muscle: "biceps", label: "Bíceps E",
    points: "26,26 34,26 33,36 27,36" },
  { id: "m-biceps-r", muscle: "biceps", label: "Bíceps D",
    points: "66,26 74,26 73,36 67,36" },
  { id: "m-triceps-l", muscle: "triceps", label: "Tríceps E",
    points: "24,26 28,26 27,36 24,36" },
  { id: "m-triceps-r", muscle: "triceps", label: "Tríceps D",
    points: "72,26 76,26 76,36 73,36" },
  { id: "m-forearm-l", muscle: "forearms", label: "Antebraço E",
    points: "22,38 30,38 28,48 22,48" },
  { id: "m-forearm-r", muscle: "forearms", label: "Antebraço D",
    points: "70,38 78,38 78,48 72,48" },
  // ────────── Core ──────────
  { id: "m-core", muscle: "core", label: "Core / Abdômen",
    points: "44,32 56,32 56,46 44,46" },
  { id: "m-obliques-l", muscle: "obliques", label: "Oblíquo E",
    points: "38,34 44,34 44,46 38,44" },
  { id: "m-obliques-r", muscle: "obliques", label: "Oblíquo D",
    points: "56,34 62,34 62,44 56,46" },
  { id: "m-lats-l", muscle: "lats", label: "Latíssimo E",
    points: "34,28 40,34 40,44 32,42" },
  { id: "m-lats-r", muscle: "lats", label: "Latíssimo D",
    points: "60,34 66,28 68,42 60,44" },
  // ────────── Lower body ──────────
  { id: "m-glutes", muscle: "glutes", label: "Glúteos",
    points: "40,48 60,48 60,55 40,55" },
  { id: "m-quads-l", muscle: "quads", label: "Quadríceps E",
    points: "38,56 49,56 48,72 38,72" },
  { id: "m-quads-r", muscle: "quads", label: "Quadríceps D",
    points: "51,56 62,56 62,72 52,72" },
  { id: "m-hamstring-l", muscle: "hamstrings", label: "Posterior E",
    points: "38,60 48,60 48,74 38,74" },
  { id: "m-hamstring-r", muscle: "hamstrings", label: "Posterior D",
    points: "52,60 62,60 62,74 52,74" },
  { id: "m-calf-l", muscle: "calves", label: "Panturrilha E",
    points: "39,78 48,78 47,90 40,90" },
  { id: "m-calf-r", muscle: "calves", label: "Panturrilha D",
    points: "52,78 61,78 60,90 53,90" },
  { id: "m-lower-back", muscle: "lower-back", label: "Lombar",
    points: "44,44 56,44 56,50 44,50" },
  { id: "m-neck", muscle: "neck", label: "Pescoço",
    points: "46,10 54,10 54,14 46,14" },
];

export function AnatomyHeatmap({ data, className = "" }: Props) {
  const items = useMemo(
    () => MUSCLE_PATHS.map((p) => ({ ...p, value: data[p.muscle] ?? 0 })),
    [data],
  );

  return (
    <div className={`relative ${className}`}>
      {/* Aspect-ratio locked stage — image + svg overlay always perfectly aligned */}
      <div
        className="relative mx-auto w-full overflow-hidden rounded-xl border border-cyan/15 bg-[#070a12]"
        style={{ aspectRatio: "1 / 1.6", maxWidth: 420 }}
      >
        {/* Foundational image */}
        <img
          src={bodyImg}
          alt="Mapa anatômico de referência"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-90"
          draggable={false}
        />

        {/* Tactical scan grid */}
        <div className="anatomical-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden />

        {/* Holographic muscle overlay */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <filter id="muscle-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.9" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {items.map((p) => {
            const v = Math.min(1, Math.max(0, p.value));
            const rgb = rgbFor(v);
            const alpha = v <= 0.02 ? 0 : 0.18 + v * 0.55; // 0..0.73
            const stroke = v <= 0.02 ? 0 : 0.25 + v * 0.5;
            return (
              <polygon
                key={p.id}
                points={p.points}
                fill={`rgba(${rgb}, ${alpha})`}
                stroke={`rgba(${rgb}, ${stroke})`}
                strokeWidth="0.25"
                filter={v > 0.02 ? "url(#muscle-glow)" : undefined}
                style={{
                  transition: "fill 700ms ease, stroke 700ms ease",
                  filter:
                    v > 0.02
                      ? `drop-shadow(0 0 ${1.2 + v * 2.4}px rgba(${rgb}, ${0.6 + v * 0.4}))`
                      : "none",
                }}
              >
                <title>{`${p.label} · ${Math.round(v * 100)}%`}</title>
              </polygon>
            );
          })}
        </svg>

        {/* Scan sweep */}
        <span className="anatomical-sweep pointer-events-none absolute inset-x-2 h-px" aria-hidden />

        {/* HUD corner ticks */}
        <Corners />
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-between px-1">
        <span className="font-mono-tactical text-[9px] tracking-[0.25em] text-muted-foreground">
          MAPA HOLOGRÁFICO · 7D
        </span>
        <div className="flex items-center gap-2">
          <LegendDot rgb={CYAN} label="Idle" />
          <LegendDot rgb={AMBER} label="Carga" />
          <LegendDot rgb={MATRIX} label="Pico" />
        </div>
      </div>
    </div>
  );
}

function LegendDot({ rgb, label }: { rgb: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="inline-block h-2 w-2 rounded-sm"
        style={{ background: `rgb(${rgb})`, boxShadow: `0 0 6px rgba(${rgb}, 0.9)` }}
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
