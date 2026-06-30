import { createFileRoute } from "@tanstack/react-router";
import { TopTelemetryBar } from "@/components/marcola/TopTelemetryBar";
import { BottomDock } from "@/components/marcola/BottomDock";
import { Dashboard } from "@/components/marcola/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MARCOLA PRIME · Command Center" },
      { name: "description", content: "Terminal tático de orquestração de treinos e suplementação — Jarvis Command Center." },
      { property: "og:title", content: "MARCOLA PRIME · Command Center" },
      { property: "og:description", content: "Terminal tático de orquestração de treinos e suplementação." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen w-full bg-background">
      {/* Mobile terminal frame — fixed width on desktop */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col border-x border-border bg-background shadow-[0_0_60px_-10px_oklch(0.55_0.12_210/0.4)]">
        <TopTelemetryBar />
        <Dashboard />
        <BottomDock />
      </div>
    </div>
  );
}
