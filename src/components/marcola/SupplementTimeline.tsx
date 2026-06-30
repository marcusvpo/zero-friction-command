import { Pill, Beaker, Droplet, AlertTriangle } from "lucide-react";

interface Slot {
  time: string;
  name: string;
  dose: string;
  note?: string;
  icon: typeof Pill;
  tone: "cyan" | "matrix" | "amber";
}

const slots: Slot[] = [
  { time: "08:00", name: "Creatina Monohidratada", dose: "5g", note: "Micronizada", icon: Beaker, tone: "cyan" },
  { time: "12:30", name: "Multivitamínico", dose: "1 cápsula", icon: Pill, tone: "cyan" },
  { time: "18:30", name: "Whey 3W · Morango c/ Ninho", dose: "30g + 250ml H₂O", icon: Droplet, tone: "matrix" },
  { time: "22:00", name: "Magnésio Glicinato", dose: "300mg", icon: Pill, tone: "cyan" },
];

const inventory = [
  { name: "WHEY 3W", remaining: 18, total: 30, tone: "matrix" as const },
  { name: "CREATINA", remaining: 41, total: 60, tone: "cyan" as const },
  { name: "MULTIVIT", remaining: 4, total: 30, tone: "amber" as const },
];

const toneClass = {
  cyan: "text-cyan border-cyan/30 bg-cyan/5",
  matrix: "text-matrix border-matrix/30 bg-matrix/5",
  amber: "text-amber border-amber/30 bg-amber/5",
};

const glowClass = {
  cyan: "glow-cyan",
  matrix: "glow-matrix",
  amber: "glow-amber",
};

export function SupplementTimeline() {
  return (
    <div className="space-y-4">
      {/* Inventory lifespan */}
      <div className="grid grid-cols-3 gap-2">
        {inventory.map((inv) => {
          const pct = Math.min(100, (inv.remaining / inv.total) * 100);
          const low = inv.remaining <= 5;
          return (
            <div
              key={inv.name}
              className={`rounded-sm border p-2 ${toneClass[inv.tone]}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono-tactical text-[8px] tracking-widest opacity-80">
                  {inv.name}
                </span>
                {low && <AlertTriangle className="h-3 w-3 text-amber" />}
              </div>
              <div className={`font-mono-tactical text-lg leading-none ${glowClass[inv.tone]}`}>
                {inv.remaining}
                <span className="ml-1 text-[10px] opacity-60">d</span>
              </div>
              <div className="mt-1 h-0.5 w-full bg-background/80">
                <div
                  className="h-full bg-current"
                  style={{ width: `${pct}%`, boxShadow: "0 0 6px currentColor" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="relative pl-7">
        <span className="absolute left-[14px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan/40 via-cyan/20 to-transparent" />
        <ul className="space-y-3">
          {slots.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.time + s.name} className="relative">
                <span
                  className={`absolute -left-[26px] top-1.5 grid h-6 w-6 place-items-center rounded-sm border bg-background ${toneClass[s.tone]}`}
                >
                  <Icon className="h-3 w-3" />
                </span>
                <div className="flex items-center justify-between gap-2 border-l border-border pl-3">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className={`font-mono-tactical text-xs ${toneClass[s.tone].split(" ")[0]} ${glowClass[s.tone]}`}>
                        {s.time}
                      </span>
                      <span className="truncate text-xs text-foreground">{s.name}</span>
                    </div>
                    {s.note && (
                      <span className="font-mono-tactical text-[9px] uppercase tracking-widest text-muted-foreground">
                        {s.note}
                      </span>
                    )}
                  </div>
                  <span className="font-mono-tactical shrink-0 text-[10px] tracking-widest text-muted-foreground">
                    {s.dose}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
