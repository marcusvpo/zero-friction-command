import { createFileRoute } from "@tanstack/react-router";
import { Check, Pill, AlertTriangle, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Panel } from "@/components/marcola/Panel";
import { useMarcolaStore } from "@/store/marcola";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/logistics")({
  head: () => ({
    meta: [
      { title: "Supplement Logistics · Marcola Prime" },
      { name: "description", content: "Terminal logístico de suplementação." },
    ],
  }),
  component: LogisticsPage,
});

const toneClass: Record<string, string> = {
  cyan:   "text-cyan border-cyan/40 bg-cyan/5",
  matrix: "text-matrix border-matrix/40 bg-matrix/5",
  amber:  "text-amber border-amber/40 bg-amber/5",
  danger: "text-rose-400 border-rose-400/40 bg-rose-400/5",
};

function LogisticsPage() {
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
              <motion.div
                key={inv.id}
                whileTap={{ scale: 0.98 }}
                className={`rounded-xl border p-2 ${toneClass[inv.tone]}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-tactical text-[8px] tracking-widest opacity-80">{inv.name}</span>
                  {low && <AlertTriangle className="h-3 w-3 text-amber" />}
                </div>
                <div className="font-mono-tactical mt-1 text-xl font-semibold leading-none">
                  {inv.remaining}<span className="ml-1 text-[10px] opacity-60">d</span>
                </div>
                <div className="mt-2 h-0.5 w-full bg-background/80">
                  <div className="h-full bg-current" style={{ width: `${pct}%`, boxShadow: "0 0 6px currentColor" }} />
                </div>
                {low && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toast.success(`Pedido de reposição de ${inv.name} criado`)}
                    className="font-mono-tactical mt-1.5 flex min-h-[32px] w-full items-center justify-center gap-1 rounded-md border border-current/40 py-1 text-[9px] tracking-widest"
                  >
                    <ShoppingCart className="h-2.5 w-2.5" /> REPOR
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Cronograma do Dia" code="M5.1" status="ACTIVE">
        <ul className="space-y-2">
          {schedule.map((s, i) => (
            <motion.li
              key={s.id}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`glass flex min-h-[56px] items-center justify-between rounded-xl px-3 py-2.5 ${s.taken ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={async () => {
                    await toggle(s.id);
                    toast.success(s.taken ? `${s.name} desmarcado` : `${s.name} tomado`);
                  }}
                  aria-label={s.taken ? "Desmarcar" : "Marcar como tomado"}
                  className={`grid h-11 w-11 place-items-center rounded-full border ${toneClass[s.tone]}`}
                >
                  {s.taken ? <Check className="h-4 w-4" /> : <Pill className="h-4 w-4" />}
                </motion.button>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`font-mono-tactical text-xs ${toneClass[s.tone].split(" ")[0]}`}>{s.time}</span>
                    <span className="text-[12px] text-foreground">{s.name}</span>
                  </div>
                  {s.note && (
                    <span className="font-mono-tactical text-[9px] uppercase tracking-widest text-muted-foreground">
                      {s.note}
                    </span>
                  )}
                </div>
              </div>
              <span className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">{s.dose}</span>
            </motion.li>
          ))}
        </ul>
      </Panel>
    </main>
  );
}
