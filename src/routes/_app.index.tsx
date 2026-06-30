import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/marcola/Dashboard";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Marcola Prime · Command Center" },
      { name: "description", content: "Command center premium de orquestração de treinos e suplementação." },
      { property: "og:title", content: "Marcola Prime · Command Center" },
      { property: "og:description", content: "Command center premium de orquestração de treinos e suplementação." },
    ],
  }),
  component: Dashboard,
});
