import { createFileRoute } from "@tanstack/react-router";
import { TopTelemetryBar } from "@/components/marcola/TopTelemetryBar";
import { BottomDock } from "@/components/marcola/BottomDock";
import { Dashboard } from "@/components/marcola/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marcola Prime · Command Center" },
      {
        name: "description",
        content: "Command center premium de orquestração de treinos e suplementação.",
      },
      { property: "og:title", content: "Marcola Prime · Command Center" },
      {
        property: "og:description",
        content: "Command center premium de orquestração de treinos e suplementação.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-transparent">
        {/* Subtle HUD corner markers (top only) */}
        <span className="hud-corner-tl" aria-hidden />
        <span className="hud-corner-tr" aria-hidden />

        <TopTelemetryBar />
        <Dashboard />
        <BottomDock />
      </div>
    </div>
  );
}
