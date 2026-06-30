import { LayoutDashboard, Dumbbell, Wrench, FlaskConical, Plus } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useRouterState } from "@tanstack/react-router";
import { QuickLogSheet } from "./QuickLogDrawer";

const items = [
  { id: "dashboard", to: "/",          label: "Painel",    icon: LayoutDashboard },
  { id: "workout",   to: "/workout",   label: "Treino",    icon: Dumbbell },
  { id: "builder",   to: "/builder",   label: "Builder",   icon: Wrench },
  { id: "logistics", to: "/logistics", label: "Logística", icon: FlaskConical },
] as const;

export function BottomDock() {
  const [quickOpen, setQuickOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <>
      <QuickLogSheet open={quickOpen} onOpenChange={setQuickOpen} />
      <nav className="pointer-events-none sticky bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
        <div className="relative mx-auto flex max-w-[420px] items-center justify-around rounded-full glass-strong px-3 py-2.5 shadow-[0_18px_50px_-15px_rgba(0,0,0,0.6)] pointer-events-auto">
          {items.slice(0, 2).map((it) => (
            <DockLink key={it.id} item={it} active={isActive(it.to)} />
          ))}

          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.04 }}
            onClick={() => setQuickOpen(true)}
            aria-label="Registro rápido"
            className="relative -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-cyan text-background shadow-[0_0_24px_color-mix(in_oklab,var(--cyan)_55%,transparent)] ring-4 ring-background"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </motion.button>

          {items.slice(2).map((it) => (
            <DockLink key={it.id} item={it} active={isActive(it.to)} />
          ))}
        </div>
      </nav>
    </>
  );
}

function DockLink({
  item, active,
}: {
  item: { id: string; to: string; label: string; icon: typeof Plus };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className="group relative flex h-11 w-11 items-center justify-center"
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
    >
      <motion.span whileTap={{ scale: 0.85 }} className="grid place-items-center">
        <Icon
          className={`h-[20px] w-[20px] transition-colors ${
            active ? "text-cyan" : "text-muted-foreground group-hover:text-foreground"
          }`}
          strokeWidth={active ? 2.25 : 1.75}
        />
      </motion.span>
      {active && (
        <motion.span
          layoutId="dock-active-dot"
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-cyan shadow-[0_0_8px_var(--cyan)]"
        />
      )}
    </Link>
  );
}
