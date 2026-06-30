import { Drawer } from "vaul";
import { motion } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { useState } from "react";
import { Zap, Dumbbell, Pill, Flame, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useMarcolaStore } from "@/store/marcola";

const ACTIONS = [
  { id: "set",   label: "LOG SET",    icon: Dumbbell, tone: "cyan"   as const, to: "/workout" },
  { id: "supp",  label: "SUPLEMENTO", icon: Pill,     tone: "matrix" as const, to: "/logistics" },
  { id: "burn",  label: "QUEIMA",     icon: Flame,    tone: "amber"  as const, to: null },
  { id: "pr",    label: "MARCAR PR",  icon: Zap,      tone: "cyan"   as const, to: null },
];

const TONE: Record<string, string> = {
  cyan: "text-cyan glow-cyan border-cyan/40",
  matrix: "text-matrix glow-matrix border-matrix/40",
  amber: "text-amber glow-amber border-amber/40",
};

/* Public trigger version (kept for Dashboard's "Registro rápido" pill) */
export function QuickLogDrawer() {
  const [open, setOpen] = useState(false);
  const [swipeHint, setSwipeHint] = useState(0);

  const bind = useDrag(
    ({ swipe: [sx], movement: [mx], down }) => {
      if (down) setSwipeHint(mx); else setSwipeHint(0);
      if (sx !== 0) setOpen(true);
    },
    { axis: "x", filterTaps: true },
  );

  return (
    <>
      <button
        {...bind()}
        onClick={() => setOpen(true)}
        className="glass group relative flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left touch-none select-none transition-transform active:scale-[0.98]"
        aria-label="Abrir registro rápido"
        style={{ transform: `translateX(${Math.max(-12, Math.min(12, swipeHint / 8))}px)` }}
      >
        <div className="flex items-center gap-2.5">
          <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-cyan text-cyan" />
          <span className="text-[11px] font-medium tracking-wide text-foreground">
            Registro rápido
          </span>
        </div>
        <span className="font-mono-tactical text-[9px] tracking-[0.2em] text-muted-foreground">
          tap · swipe →
        </span>
      </button>
      <QuickLogSheet open={open} onOpenChange={setOpen} />
    </>
  );
}

/* Controlled sheet — used by the bottom dock FAB */
export function QuickLogSheet({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const completeSet = useMarcolaStore((s) => s.completeCurrentSet);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-1/2 z-50 mx-auto flex w-full max-w-[440px] -translate-x-1/2 flex-col rounded-t-3xl glass-strong shadow-glow-cyan focus:outline-none">
          <Drawer.Title className="sr-only">Registro rápido</Drawer.Title>
          <Drawer.Description className="sr-only">
            Selecione uma ação para registrar rapidamente.
          </Drawer.Description>
          <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-cyan/40" />

          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="font-mono-tactical text-[10px] tracking-[0.3em] text-cyan glow-cyan">
              REGISTRO RÁPIDO · M0
            </span>
            <button
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-cyan"
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-2 gap-2 p-3"
          >
            {ACTIONS.map((a) => (
              <motion.button
                key={a.id}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  if (a.id === "set") {
                    completeSet();
                    toast.success("Set registrado");
                    navigate({ to: "/workout" });
                  } else if (a.to) {
                    navigate({ to: a.to });
                    toast.success(`${a.label} acionado`);
                  } else {
                    toast.success(`${a.label} registrado`, {
                      description: new Date().toLocaleTimeString("pt-BR"),
                    });
                  }
                  onOpenChange(false);
                }}
                className={`glass flex flex-col items-start gap-2 rounded-xl border p-3 ${TONE[a.tone]}`}
              >
                <a.icon className="h-4 w-4" />
                <span className="font-mono-tactical text-[10px] tracking-[0.25em]">{a.label}</span>
                <span className="font-mono-tactical text-[8px] tracking-widest text-muted-foreground">
                  EXEC · ENTER
                </span>
              </motion.button>
            ))}
          </motion.div>

          <div className="border-t border-border px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] py-2">
            <span className="font-mono-tactical text-[9px] tracking-widest text-muted-foreground">
              ↑ ARRASTE P/ FECHAR · SWIPE TO DISMISS
            </span>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
