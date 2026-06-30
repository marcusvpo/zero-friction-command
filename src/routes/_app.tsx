import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { TopTelemetryBar } from "@/components/marcola/TopTelemetryBar";
import { BottomDock } from "@/components/marcola/BottomDock";
import { PageTransition } from "@/components/marcola/PageTransition";
import { useMarcolaStore } from "@/store/marcola";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const hydrate = useMarcolaStore((s) => s.hydrateFromCloud);

  useEffect(() => { void hydrate(); }, [hydrate]);

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-transparent">
        <span className="hud-corner-tl" aria-hidden />
        <span className="hud-corner-tr" aria-hidden />
        <TopTelemetryBar />
        <PageTransition>
          <Outlet />
        </PageTransition>
        <BottomDock />
      </div>
    </div>
  );
}
