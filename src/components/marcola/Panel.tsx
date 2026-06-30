import { ReactNode } from "react";

interface PanelProps {
  title: string;
  code?: string;
  status?: "OK" | "WARN" | "ACTIVE";
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

const statusTone: Record<string, string> = {
  OK:     "text-emerald-400",
  WARN:   "text-amber",
  ACTIVE: "text-cyan",
};

const statusLabel: Record<string, string> = {
  OK: "OK",
  WARN: "ATENÇÃO",
  ACTIVE: "ATIVO",
};

export function Panel({
  title,
  code,
  status = "OK",
  children,
  className = "",
  action,
}: PanelProps) {
  return (
    <section className={`glass rounded-2xl ${className}`}>
      <header className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </h3>
          {code && (
            <span className="font-mono-tactical shrink-0 text-[9px] tracking-widest text-muted-foreground/60">
              {code}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {action}
          <span
            className={`pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-current ${statusTone[status]}`}
          />
          <span className={`font-mono-tactical text-[9px] tracking-[0.2em] ${statusTone[status]}`}>
            {statusLabel[status]}
          </span>
        </div>
      </header>
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}
