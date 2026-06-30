import { LayoutDashboard, Dumbbell, Wrench, FlaskConical, Plus } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const items = [
  { id: "dashboard", label: "Painel",     icon: LayoutDashboard },
  { id: "workout",   label: "Treino",     icon: Dumbbell },
  { id: "builder",   label: "Builder",    icon: Wrench },
  { id: "logistics", label: "Logística",  icon: FlaskConical },
];

interface Props {
  onQuickAction?: () => void;
}

export function BottomDock({ onQuickAction }: Props) {
  const [active, setActive] = useState("dashboard");
  return (
    <nav className="pointer-events-none sticky bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
      <div className="relative mx-auto flex max-w-[420px] items-center justify-around rounded-full glass-strong px-3 py-2.5 shadow-[0_18px_50px_-15px_rgba(0,0,0,0.6)] pointer-events-auto">
        {items.slice(0, 2).map((it) => (
          <DockButton key={it.id} item={it} active={active === it.id} onSelect={setActive} />
        ))}

        {/* Center FAB */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onQuickAction}
          aria-label="Registro rápido"
          className="relative -mt-7 flex h-12 w-12 items-center justify-center rounded-full bg-cyan text-background shadow-[0_0_24px_color-mix(in_oklab,var(--cyan)_55%,transparent)] ring-4 ring-background"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </motion.button>

        {items.slice(2).map((it) => (
          <DockButton key={it.id} item={it} active={active === it.id} onSelect={setActive} />
        ))}
      </div>
    </nav>
  );
}

function DockButton({
  item,
  active,
  onSelect,
}: {
  item: { id: string; label: string; icon: typeof Plus };
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onSelect(item.id)}
      className="group relative flex h-10 w-10 items-center justify-center"
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={`h-[18px] w-[18px] transition-colors ${
          active ? "text-cyan" : "text-muted-foreground group-hover:text-foreground"
        }`}
        strokeWidth={active ? 2.25 : 1.75}
      />
      {active && (
        <motion.span
          layoutId="dock-active-dot"
          className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-cyan shadow-[0_0_8px_var(--cyan)]"
        />
      )}
    </button>
  );
}
