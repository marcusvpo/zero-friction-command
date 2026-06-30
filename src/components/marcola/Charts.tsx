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
} from "recharts";

const tonnageData = [
  { d: "SEG", t: 11.2 },
  { d: "TER", t: 12.8 },
  { d: "QUA", t: 10.4 },
  { d: "QUI", t: 13.6 },
  { d: "SEX", t: 9.2 },
];

const volumeData = [
  { m: "PEITO", v: 18 },
  { m: "COSTAS", v: 22 },
  { m: "PERNAS", v: 26 },
  { m: "OMBROS", v: 14 },
  { m: "BRAÇO", v: 16 },
  { m: "CORE", v: 9 },
];

const fatigueData = [
  { d: "SEG", f: 12 },
  { d: "TER", f: 24 },
  { d: "QUA", f: 38 },
  { d: "QUI", f: 56 },
  { d: "SEX", f: 71 },
];

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

export function TonnageChart() {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer>
        <LineChart data={tonnageData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="ton" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="100%" stopColor="#39FF14" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="oklch(0.25 0.02 260)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="d" tick={axisStyle} axisLine={{ stroke: "oklch(0.3 0.02 260)" }} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#00F0FF", strokeOpacity: 0.3 }} />
          <Line
            type="monotone"
            dataKey="t"
            stroke="url(#ton)"
            strokeWidth={2}
            dot={{ r: 3, fill: "#00F0FF", stroke: "#00F0FF" }}
            activeDot={{ r: 5, fill: "#00F0FF", stroke: "#000", strokeWidth: 2 }}
            style={{ filter: "drop-shadow(0 0 4px #00F0FF)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

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

export function FatigueChart() {
  return (
    <div className="h-32 w-full">
      <ResponsiveContainer>
        <LineChart data={fatigueData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="oklch(0.25 0.02 260)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="d" tick={axisStyle} axisLine={{ stroke: "oklch(0.3 0.02 260)" }} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={32} domain={[0, 100]} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#FFB300", strokeOpacity: 0.3 }} />
          <Line
            type="monotone"
            dataKey="f"
            stroke="#FFB300"
            strokeWidth={2}
            dot={{ r: 3, fill: "#FFB300" }}
            style={{ filter: "drop-shadow(0 0 4px #FFB300)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
