import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/marcola/Dashboard";

export const Route = createFileRoute("/_app/intel")({
  head: () => ({
    meta: [
      { title: "Intel · Marcola Prime" },
      { name: "description", content: "Telemetria pós-treino, heatmap anatômico e séries históricas." },
    ],
  }),
  component: Dashboard,
});
