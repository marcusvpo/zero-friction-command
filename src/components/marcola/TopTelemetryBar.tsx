import { Activity, Zap } from "lucide-react";

export function TopTelemetryBar() {
  const tickerItems = [
    "SPLIT: HYBRID ENGINE",
    "DAY 03 / 05",
    "PUSH PROTOCOL ACTIVE",
    "LAST SYNC 00:42 AGO",
    "INVENTORY: WHEY 18d // CREATINA 41d",
    "PR WATCH: BENCH PRESS 92.5kg",
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="pulse-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-matrix text-matrix" />
          <span className="font-mono-tactical truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            MARCOLA//PRIME
          </span>
          <span className="font-mono-tactical glow-cyan truncate text-[10px] uppercase tracking-[0.2em] text-cyan">
            · ONLINE
          </span>
        </div>
        <div className="font-mono-tactical flex shrink-0 items-center gap-3 text-[10px] uppercase tracking-widest">
          <span className="flex items-center gap-1 text-matrix glow-matrix">
            <Activity className="h-3 w-3" /> SYS 98%
          </span>
          <span className="flex items-center gap-1 text-amber glow-amber">
            <Zap className="h-3 w-3" /> FTG 32%
          </span>
        </div>
      </div>

      {/* Telemetry ticker */}
      <div className="relative overflow-hidden border-t border-border bg-surface/60">
        <div className="ticker-scroll flex w-max gap-8 py-1">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span
              key={i}
              className="font-mono-tactical whitespace-nowrap text-[10px] uppercase tracking-[0.25em] text-cyan-dim"
            >
              ◇ {t}
            </span>
          ))}
        </div>
      </div>

      {/* Sub-bar: operational status */}
      <div className="grid grid-cols-4 divide-x divide-border border-t border-border bg-background/50">
        {[
          { l: "DIA OP.", v: "03/05", c: "text-cyan" },
          { l: "PROTOCOLO", v: "PUSH·A", c: "text-foreground" },
          { l: "TONELAGEM", v: "12.4T", c: "text-matrix" },
          { l: "REST AVG", v: "92s", c: "text-amber" },
        ].map((cell) => (
          <div key={cell.l} className="px-2 py-1.5">
            <div className="font-mono-tactical text-[8px] uppercase tracking-widest text-muted-foreground">
              {cell.l}
            </div>
            <div className={`font-mono-tactical text-xs ${cell.c}`}>{cell.v}</div>
          </div>
        ))}
      </div>
    </header>
  );
}
