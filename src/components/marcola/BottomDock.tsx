import { LayoutDashboard, Dumbbell, Wrench, FlaskConical } from "lucide-react";
import { useState } from "react";

const items = [
  { id: "dashboard", label: "DASHBOARD", icon: LayoutDashboard },
  { id: "workout", label: "WORKOUT", icon: Dumbbell },
  { id: "builder", label: "BUILDER", icon: Wrench },
  { id: "logistics", label: "LOGISTICS", icon: FlaskConical },
];

export function BottomDock() {
  const [active, setActive] = useState("dashboard");
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-md">
      <div className="grid grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setActive(it.id)}
              className="group relative flex flex-col items-center gap-1 px-2 py-3 transition-colors"
            >
              {isActive && (
                <span className="absolute inset-x-3 top-0 h-px bg-cyan shadow-[0_0_8px_var(--cyan)]" />
              )}
              <Icon
                className={`h-5 w-5 transition-all ${
                  isActive
                    ? "text-cyan drop-shadow-[0_0_6px_var(--cyan)]"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span
                className={`font-mono-tactical text-[9px] tracking-[0.2em] ${
                  isActive ? "text-cyan glow-cyan" : "text-muted-foreground"
                }`}
              >
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
