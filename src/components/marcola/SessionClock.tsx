import { memo, useEffect, useState } from "react";

interface Props {
  startedAt: number | null;
  finishedAt: number | null;
  pausedAt: number | null;
  totalPausedMs: number;
  isPaused: boolean;
}

function format(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/**
 * SessionClock — isolado em componente próprio para que o tick de 1s
 * não dispare re-render do WorkoutConsole inteiro. Memo'd nas props.
 */
export const SessionClock = memo(function SessionClock({
  startedAt, finishedAt, pausedAt, totalPausedMs, isPaused,
}: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!startedAt || finishedAt || isPaused) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt, isPaused]);

  const elapsed = !startedAt
    ? 0
    : Math.max(
        0,
        (finishedAt ?? Date.now()) - startedAt - totalPausedMs - (pausedAt ? Date.now() - pausedAt : 0),
      );

  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${isPaused ? "bg-amber animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
      <span className="font-mono-tactical text-[10px] tracking-[0.25em] text-muted-foreground">
        {isPaused ? "PAUSADO" : "ATIVO"} · {format(elapsed)}
      </span>
    </div>
  );
});
