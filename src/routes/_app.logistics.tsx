import { createFileRoute } from "@tanstack/react-router";
import { Check, Pill, AlertTriangle, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { TopTelemetryBar } from "@/components/marcola/TopTelemetryBar";
import { BottomDock } from "@/components/marcola/BottomDock";
import { Panel } from "@/components/marcola/Panel";
import { useMarcolaStore } from "@/store/marcola";
import { toast } from "sonner";

export const Route = createFileRoute("/logistics")({
  head: () => ({
    meta: [
      { title: "Supplement Logistics · Marcola Prime" },
      { name: "description", content: "Terminal logístico de suplementação." },
    ],
  }),
  component: LogisticsPage,
});

function LogisticsPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col">
        <span className="hud-corner-tl" aria-hidden />
        <span className="hud-corner-tr" aria-hidden />
        <TopTelemetryBar />
        <Body />
        <BottomDock />
      </div>
    </div>
  );
}

const toneClass: Record<string, string> = {
  cyan: "text-cyan border-cyan/40 bg-cyan/5",
  matrix: "text-matrix border-matrix/40 bg-matrix/5",
  amber: "text-amber border-amber/40 bg-amber/5",
  danger: "text-rose-400 border-rose-400/40 bg-rose-400/5",
};

function Body() {
  const schedule = useMarcolaStore((s) => s.schedule);
  const inventory = useMarcolaStore((s) => s.inventory);
  const toggle = useMarcolaStore((s) => s.toggleSupplement);

  return (
    <main className="relative z-10 flex-1 space-y-4 px-4 pt-2 pb-28">
      <Panel title="Inventário" code="d restantes" status="WARN">
        <div className="grid grid-cols-3 gap-2">
          {inventory.map((inv) => {
            const pct = Math.min(100, (inv.remaining / inv.total) * 100);
            const low = inv.remaining <= 5;
            return (
              <div key={inv.id} className={`rounded-xl border p-2 ${toneClass[inv.tone]}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono-tactical text-[8px] tracking-widest opacity-80">
                    {inv.name}
                  </span>
                  {low && <AlertTriangle className="h-3 w-3 text-amber" />}
                </div>
                <div className="font-mono-tactical mt-1 text-xl font-semibold leading-none">
                  {inv.remaining}
                  <span className="ml-1 text-[10px] opacity-60">d</span>
                </div>
                <div className="mt-2 h-0.5 w-full bg-background/80">
                  <div
                    className="h-full bg-current"
                    style={{ width: `${pct}%`, boxShadow: "0 0 6px currentColor" }}
                  />
                </div>
                {low && (
                  <button
                    onClick={() => toast.success(`Pedido de reposição de ${inv.name} criado`)}
                    className="font-mono-tactical mt-1.5 flex w-full items-center justify-center gap-1 rounded-md border border-current/40 py-1 text-[9px] tracking-widest"
                  >
                    <ShoppingCart className="h-2.5 w-2.5" /> REPOR
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Cronograma do Dia" code="M5.1" status="ACTIVE">
        <ul className="space-y-2">
          {schedule.map((s, i) => (
            <motion.li
              key={s.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`glass flex items-center justify-between rounded-xl px-3 py-2.5 ${
                s.taken ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    toggle(s.id);
                    toast.success(s.taken ? `${s.name} desmarcado` : `${s.name} tomado`);
                  }}
                  aria-label={s.taken ? "Desmarcar" : "Marcar como tomado"}
                  className={`grid h-7 w-7 place-items-center rounded-full border ${toneClass[s.tone]}`}
                >
                  {s.taken ? <Check className="h-3.5 w-3.5" /> : <Pill className="h-3.5 w-3.5" />}
                </button>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`font-mono-tactical text-xs ${toneClass[s.tone].split(" ")[0]}`}>
                      {s.time}
                    </span>
                    <span className="text-[12px] text-foreground">{s.name}</span>
                  </div>
                  {s.note && (
                    <span className="font-mono-tactical text-[9px] uppercase tracking-widest text-muted-foreground">
                      {s.note}
                    </span>
                  )}
                </div>
              </div>
              <span className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
                {s.dose}
              </span>
            </motion.li>
          ))}
        </ul>
      </Panel>
    </main>
  );
}
