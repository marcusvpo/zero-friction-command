import { Activity, BarChart3, Wrench, UserCog, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useRouterState } from "@tanstack/react-router";

const items = [
  { id: "terminal", to: "/terminal", label: "Terminal", icon: Activity },
  { id: "intel",    to: "/intel",    label: "Intel",    icon: BarChart3 },
  { id: "builder",  to: "/builder",  label: "Builder",  icon: Wrench },
  { id: "operator", to: "/operator", label: "Operator", icon: UserCog },
] as const;

export function BottomDock() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const workoutActive = isActive("/workout");

  return (
    <nav className="pointer-events-none sticky bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
      <div className="relative mx-auto flex max-w-[420px] items-center justify-around rounded-full glass-strong px-3 py-2.5 shadow-[0_18px_50px_-15px_rgba(0,0,0,0.6)] pointer-events-auto">
        {items.slice(0, 2).map((it) => (
          <DockLink key={it.id} item={it} active={isActive(it.to)} />
        ))}

        <Link
          to="/workout"
          aria-label="Treino"
          aria-current={workoutActive ? "page" : undefined}
          className="relative -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-cyan text-background shadow-[0_0_24px_color-mix(in_oklab,var(--cyan)_55%,transparent)] ring-4 ring-background"
        >
          <motion.span whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.04 }} className="grid place-items-center">
            <Dumbbell className="h-6 w-6" strokeWidth={2.25} />
          </motion.span>
        </Link>

        {items.slice(2).map((it) => (
          <DockLink key={it.id} item={it} active={isActive(it.to)} />
        ))}
      </div>
    </nav>
  );
}

function DockLink({
  item, active,
}: {
  item: { id: string; to: string; label: string; icon: typeof Dumbbell };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className="group relative flex h-11 w-14 flex-col items-center justify-center gap-0.5"
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
    >
      <motion.span whileTap={{ scale: 0.85 }} className="grid place-items-center">
        <Icon
          className={`h-[18px] w-[18px] transition-colors ${
            active ? "text-cyan" : "text-muted-foreground group-hover:text-foreground"
          }`}
          strokeWidth={active ? 2.25 : 1.75}
        />
      </motion.span>
      <span className={`font-mono-tactical text-[8px] tracking-[0.15em] ${active ? "text-cyan" : "text-muted-foreground/70"}`}>
        {item.label.toUpperCase()}
      </span>
      {active && (
        <motion.span
          layoutId="dock-active-dot"
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="absolute -bottom-1 h-1 w-1 rounded-full bg-cyan shadow-[0_0_8px_var(--cyan)]"
        />
      )}
    </Link>
  );
}
