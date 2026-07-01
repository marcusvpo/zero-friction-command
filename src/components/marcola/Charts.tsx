import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  ComposedChart,
} from "recharts";
import { useMemo } from "react";
import { useMarcolaStore } from "@/store/marcola";
import { groupWeeklyVolume } from "@/lib/intel-kpis";

const axisStyle = {
  fontSize: 9,
  fontFamily: "JetBrains Mono, monospace",
  fill: "oklch(0.62 0.02 240)",
  letterSpacing: "0.1em",
};

const tooltipStyle = {
  background: "oklch(0.12 0.02 260)",
  border: "1px solid oklch(0.55 0.12 210)",
  borderRadius: 2,
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 10,
  padding: "4px 8px",
};

/**
 * DeltaChart6w — Real 6-week tonnage trend with delta % line.
 * Bars = absolute tonnage (kg); Line = Δ% vs previous week.
 */
export function DeltaChart6w() {
  // Subscribe to raw history and recompute — the store selector rebuilds new
  // object literals every call, which defeats shallow-eq and causes an infinite
  // re-render loop when read via useShallow.
  const history = useMarcolaStore((s) => s.history);
  const compute = useMarcolaStore((s) => s.getWeeklyTonnage6w);
  const weeks = useMemo(() => compute(), [compute, history]);
  const hasData = weeks.some((w) => w.tonnageKg > 0);

  if (!hasData) {
    return (
      <div className="grid h-40 w-full place-items-center rounded-lg bg-white/[0.02] text-center">
        <div>
          <div className="font-mono-tactical text-[10px] tracking-widest text-muted-foreground">
            SEM DADOS HISTÓRICOS
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground/70">
            Conclua uma sessão para iniciar o tracking de tonelagem.
          </div>
        </div>
      </div>
    );
  }

  const data = weeks.map((w) => ({
    week: w.week,
    tonnageT: +(w.tonnageKg / 1000).toFixed(2),
    deltaPct: w.deltaPct,
  }));

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="bar-ton" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="oklch(0.25 0.02 260)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="week" tick={axisStyle} axisLine={{ stroke: "oklch(0.3 0.02 260)" }} tickLine={false} />
          <YAxis yAxisId="ton" tick={axisStyle} axisLine={false} tickLine={false} width={32} />
          <YAxis yAxisId="delta" orientation="right" tick={axisStyle} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "rgba(0,240,255,0.06)" }}
            formatter={(value: number, name: string) => {
              if (name === "tonnageT") return [`${value.toFixed(2)} t`, "Tonelagem"];
              if (name === "deltaPct") return [`${value > 0 ? "+" : ""}${value.toFixed(1)}%`, "Δ vs semana ant."];
              return [value, name];
            }}
          />
          <Bar
            yAxisId="ton"
            dataKey="tonnageT"
            fill="url(#bar-ton)"
            radius={[2, 2, 0, 0]}
            style={{ filter: "drop-shadow(0 0 3px #00F0FF)" }}
          />
          <Line
            yAxisId="delta"
            type="monotone"
            dataKey="deltaPct"
            stroke="#39FF14"
            strokeWidth={2}
            dot={{ r: 3, fill: "#39FF14" }}
            style={{ filter: "drop-shadow(0 0 4px #39FF14)" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Backwards-compatible alias — used to be the mocked 7-day chart. */
export const TonnageChart = DeltaChart6w;

export function VolumeChart() {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer>
        <BarChart data={volumeData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="oklch(0.25 0.02 260)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="m" tick={{ ...axisStyle, fontSize: 8 }} axisLine={{ stroke: "oklch(0.3 0.02 260)" }} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,240,255,0.05)" }} />
          <Bar dataKey="v" fill="#00F0FF" radius={[1, 1, 0, 0]} style={{ filter: "drop-shadow(0 0 3px #00F0FF)" }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
