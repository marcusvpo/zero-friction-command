# Phase 5: Marcola Prime — Persistence, State Machine, Heatmap, PWA

## 1. Supabase Persistence (Zustand binding)
- Refactor `src/store/marcola.ts` to remove mock arrays and expose async actions backed by the existing `src/lib/supabase.ts` client:
  - `fetchTodayWorkout()` — reads today's routine + exercises for `auth.uid()`.
  - `logCompletedSet(exerciseId, weight, reps)` — optimistic update of local `completedSets`, then `insert` into `workout_logs`; rollback + toast on error.
  - `fetchWeeklyVolume()` — aggregates sets per muscle group from `workout_logs` for the trailing 7 days, returns `Record<MuscleKey, number>`.
- Subscribe `WorkoutConsole` and `AnatomyHeatmap` to these slices via selectors so the UI re-renders instantly on optimistic writes.

## 2. Zero-Friction Workout State Machine (`WorkoutConsole.tsx`)
- Single-exercise, single-set view driven by a reducer with states: `ACTIVE_SET → SAVING → RESTING → NEXT_SET | NEXT_EXERCISE | WORKOUT_COMPLETE`.
- Large `+ / −` steppers for weight (±2.5 kg) and reps (±1); no keyboard input required.
- `CONFIRM SET` flow: dispatch `SAVING` → call `logCompletedSet` → on success switch to `<RestTimer />`; on timer end or skip → auto-increment set index, or advance to next exercise when all sets are done, or finalize the workout.

## 3. Heatmap Alignment & Data Binding (`AnatomyHeatmap.tsx`)
- Wrap image + SVG in a `position: relative` container with locked `aspect-ratio` matching `anatomical-body.png` intrinsic size; both layers `position: absolute; inset: 0; width/height: 100%`.
- `<img>` uses `object-fit: contain`; `<svg>` uses matching `viewBox="0 0 <W> <H>"` and `preserveAspectRatio="xMidYMid meet"`.
- Extract all muscle polygons/paths into a top-of-file `MUSCLE_PATHS` config with a TODO comment for coordinate tweaking.
- Add `DEBUG_MODE = true` flag that renders all masks with `stroke: red; stroke-width: 2; fill: transparent` so misalignment is visible.
- Bind `fill` / `opacity` to `fetchWeeklyVolume()` output: 0 sets → transparent; 1–4 → low-opacity cyan; 5–8 → medium; >8 → `rgba(0,240,255,0.8)`.

## 4. PWA Initialization
- Add `vite-plugin-pwa` (installable, no offline caching beyond defaults — per project no-SW guidance, but user explicitly requested PWA so we ship a guarded `autoUpdate` SW with the standard preview/iframe registration guard wrapper).
- `manifest.webmanifest` with name "Marcola Prime", `display: standalone`, theme/background colors matching the dark UI, and icon set under `public/`.
- Link manifest + theme-color + apple-touch-icon in `index.html` (or `__root.tsx` head if TanStack).

## Open questions before I build
1. **Intrinsic pixel size of `public/anatomical-body.png`?** Needed for the SVG `viewBox`. I'll inspect the file on disk; if it's missing or low-res, I'll flag it.
2. **Muscle coordinate source.** Current `MUSCLE_PATHS` will be best-effort placeholders aligned with the existing image; you'll fine-tune via the DEBUG_MODE overlay. Confirm that's acceptable.
3. **PWA icons.** OK to generate a simple cyan-on-black "M" icon set (192/512/maskable) with the image tool, or do you want to supply art?

I'll proceed with the build once you confirm — especially on the PWA icon question.