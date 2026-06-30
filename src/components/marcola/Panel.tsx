import { ReactNode } from "react";

interface PanelProps {
  title: string;
  code?: string;
  status?: "OK" | "WARN" | "ACTIVE";
  children: ReactNode;
  className?: string;
}

const statusColor: Record<string, string> = {
  OK: "text-matrix glow-matrix",
  WARN: "text-amber glow-amber",
  ACTIVE: "text-cyan glow-cyan",
};

export function Panel({ title, code, status = "OK", children, className = "" }: PanelProps) {
  return (
    <section className={`panel panel-corners rounded-sm ${className}`}>
      <header className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono-tactical text-[10px] uppercase tracking-[0.25em] text-cyan glow-cyan truncate">
            {title}
          </span>
          {code && (
            <span className="font-mono-tactical text-[9px] uppercase tracking-widest text-muted-foreground">
              · {code}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-current ${statusColor[status]}`} />
          <span className={`font-mono-tactical text-[9px] tracking-widest ${statusColor[status]}`}>
            {status}
          </span>
        </div>
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}
