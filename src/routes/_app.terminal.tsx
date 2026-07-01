import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/_app/terminal")({
  head: () => ({
    meta: [
      { title: "Terminal · Marcola Prime" },
      { name: "description", content: "Terminal em desenvolvimento." },
    ],
  }),
  component: TerminalPlaceholder,
});

function TerminalPlaceholder() {
  return (
    <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
      <Construction className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
      <h1 className="mt-4 text-2xl font-semibold text-foreground">Terminal</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Esta tela ainda está aguardando desenvolvimento. Em breve.
      </p>
    </main>
  );
}
