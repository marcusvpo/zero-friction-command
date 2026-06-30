import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, SkipForward, Plus } from "lucide-react";
import { useMarcolaStore } from "@/store/marcola";

export function RestTimer() {
  const rest = useMarcolaStore((s) => s.rest);
  const tick = useMarcolaStore((s) => s.tickRest);
  const skip = useMarcolaStore((s) => s.skipRest);
  const startRest = useMarcolaStore((s) => s.startRest);

  useEffect(() => {
    if (!rest.active) return;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [rest.active, tick]);

  const pct = rest.total > 0 ? (rest.remaining / rest.total) * 100 : 0;
  const mm = String(Math.floor(rest.remaining / 60)).padStart(2, "0");
  const ss = String(rest.remaining % 60).padStart(2, "0");

  return (
    <AnimatePresence>
      {rest.active && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="glass-strong relative overflow-hidden rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-cyan" />
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Descanso Tático
              </span>
            </div>
            <span className="font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
              {rest.total}s alvo
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between">
            <span className="font-mono-tactical text-5xl font-semibold leading-none tracking-tight text-cyan glow-cyan">
              {mm}:{ss}
            </span>
            <div className="flex items-center gap-1.5">
              <IconBtn onClick={() => startRest(rest.total + 15)} label="+15s">
                <Plus className="h-3.5 w-3.5" />
                <span className="font-mono-tactical text-[10px]">15</span>
              </IconBtn>
              <IconBtn onClick={skip} label="Pular">
                <SkipForward className="h-3.5 w-3.5" />
              </IconBtn>
            </div>
          </div>

          {/* Linear progress */}
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-cyan to-matrix"
              style={{ boxShadow: "0 0 12px var(--cyan)" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IconBtn({
  onClick, children, label,
}: { onClick: () => void; children: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-cyan transition-transform active:scale-95"
    >
      {children}
    </button>
  );
}
