import bodyImg from "@/assets/anatomical-body.png";

type Zone = {
  id: string;
  label: string;
  x: number; // % from left
  y: number; // % from top
  size: number; // px diameter at base
  intensity: number; // 0..1
};

const ZONES: Zone[] = [
  { id: "chest",    label: "PEITORAL",  x: 50, y: 23, size: 110, intensity: 0.95 },
  { id: "delt-l",   label: "OMBRO E",   x: 32, y: 21, size: 60,  intensity: 0.72 },
  { id: "delt-r",   label: "OMBRO D",   x: 68, y: 21, size: 60,  intensity: 0.72 },
  { id: "bi-l",     label: "BÍCEPS E",  x: 25, y: 32, size: 55,  intensity: 0.58 },
  { id: "bi-r",     label: "BÍCEPS D",  x: 75, y: 32, size: 55,  intensity: 0.58 },
  { id: "abs",      label: "CORE",      x: 50, y: 36, size: 75,  intensity: 0.45 },
  { id: "fore-l",   label: "ANTEBRAÇO", x: 22, y: 43, size: 45,  intensity: 0.30 },
  { id: "fore-r",   label: "ANTEBRAÇO", x: 78, y: 43, size: 45,  intensity: 0.30 },
  { id: "quad-l",   label: "QUAD E",    x: 42, y: 58, size: 85,  intensity: 0.88 },
  { id: "quad-r",   label: "QUAD D",    x: 58, y: 58, size: 85,  intensity: 0.88 },
  { id: "calf-l",   label: "POST E",    x: 43, y: 80, size: 50,  intensity: 0.40 },
  { id: "calf-r",   label: "POST D",    x: 57, y: 80, size: 50,  intensity: 0.40 },
];

function toneFor(i: number): { color: string; glow: string } {
  if (i >= 0.75) return { color: "#FF3B3B", glow: "rgba(255,59,59,0.55)" };
  if (i >= 0.5)  return { color: "#FFB300", glow: "rgba(255,179,0,0.55)" };
  if (i >= 0.3)  return { color: "#00F0FF", glow: "rgba(0,240,255,0.55)" };
  return { color: "#39FF14", glow: "rgba(57,255,20,0.45)" };
}

export function AnatomicalBody() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* HUD frame markers */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {/* corner brackets */}
        <CornerBrackets />
        {/* scanline */}
        <div className="absolute inset-0 anatomical-scanlines opacity-40" />
        {/* sweep */}
        <div className="absolute inset-x-0 h-[2px] anatomical-sweep" />
      </div>

      {/* Header strip */}
      <div className="relative z-10 flex items-center justify-between border-b border-cyan/30 bg-cyan/5 px-2 py-1">
        <span className="font-mono-tactical text-[8px] tracking-[0.25em] text-cyan glow-cyan">
          SUBJ · M4.1 · FRONTAL
        </span>
        <span className="font-mono-tactical text-[8px] tracking-[0.25em] text-muted-foreground">
          THERMAL · 7d
        </span>
      </div>

      <div className="relative mx-auto aspect-[704/1280] w-full max-w-[280px]">
        {/* Background grid */}
        <div className="absolute inset-0 anatomical-grid opacity-30" />

        {/* Body image */}
        <img
          src={bodyImg}
          alt="Mapa anatômico — vista frontal do sistema muscular"
          width={704}
          height={1280}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain mix-blend-screen brightness-110 contrast-110"
          draggable={false}
        />

        {/* Heatmap overlays */}
        <div className="absolute inset-0">
          {ZONES.map((z) => {
            const t = toneFor(z.intensity);
            const sz = z.size * z.intensity + 28;
            return (
              <div
                key={z.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${z.x}%`,
                  top: `${z.y}%`,
                  width: sz,
                  height: sz,
                  background: `radial-gradient(circle, ${t.glow} 0%, ${t.glow.replace("0.55", "0.25").replace("0.45", "0.2")} 35%, transparent 70%)`,
                  filter: "blur(2px)",
                  mixBlendMode: "screen",
                }}
              />
            );
          })}

          {/* Targeting reticles for hottest zones */}
          {ZONES.filter((z) => z.intensity >= 0.75).map((z) => {
            const t = toneFor(z.intensity);
            return (
              <div
                key={`r-${z.id}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${z.x}%`, top: `${z.y}%` }}
              >
                <svg width="48" height="48" viewBox="0 0 48 48" style={{ color: t.color }}>
                  <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.9" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="2 3" opacity="0.7" />
                  <line x1="24" y1="2" x2="24" y2="10" stroke="currentColor" strokeWidth="0.8" />
                  <line x1="24" y1="38" x2="24" y2="46" stroke="currentColor" strokeWidth="0.8" />
                  <line x1="2" y1="24" x2="10" y2="24" stroke="currentColor" strokeWidth="0.8" />
                  <line x1="38" y1="24" x2="46" y2="24" stroke="currentColor" strokeWidth="0.8" />
                </svg>
              </div>
            );
          })}
        </div>

        {/* Lateral telemetry labels */}
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden flex-col justify-around py-4 pl-1 sm:flex">
          {["C7", "T4", "L1", "L5"].map((v) => (
            <span key={v} className="font-mono-tactical text-[8px] tracking-widest text-cyan/60">
              {v}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden flex-col justify-around py-4 pr-1 text-right sm:flex">
          {["+92%", "+78%", "+45%", "+30%"].map((v) => (
            <span key={v} className="font-mono-tactical text-[8px] tracking-widest text-amber/70">
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="relative z-10 grid grid-cols-4 gap-1 border-t border-border bg-background/60 px-2 py-1.5">
        {[
          { c: "#39FF14", l: "REST" },
          { c: "#00F0FF", l: "ATIV" },
          { c: "#FFB300", l: "PICO" },
          { c: "#FF3B3B", l: "CRÍT" },
        ].map((x) => (
          <div key={x.l} className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: x.c, boxShadow: `0 0 6px ${x.c}` }}
            />
            <span className="font-mono-tactical text-[8px] tracking-widest text-muted-foreground">
              {x.l}
            </span>
          </div>
        ))}
      </div>

      {/* Top recruited list */}
      <div className="relative z-10 mt-2 space-y-1">
        {[
          { l: "QUADRÍCEPS", v: 88, t: "#FF3B3B" },
          { l: "PEITORAL",   v: 95, t: "#FF3B3B" },
          { l: "OMBROS",     v: 72, t: "#FFB300" },
          { l: "CORE",       v: 45, t: "#00F0FF" },
        ].map((m) => (
          <div key={m.l} className="flex items-center gap-2">
            <span className="font-mono-tactical w-20 text-[9px] tracking-widest text-muted-foreground">
              {m.l}
            </span>
            <div className="relative h-1 flex-1 overflow-hidden rounded-sm bg-border/40">
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${m.v}%`,
                  background: `linear-gradient(90deg, transparent, ${m.t})`,
                  boxShadow: `0 0 8px ${m.t}`,
                }}
              />
            </div>
            <span
              className="font-mono-tactical w-8 text-right text-[9px] tracking-widest"
              style={{ color: m.t, textShadow: `0 0 6px ${m.t}` }}
            >
              {m.v}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CornerBrackets() {
  const base = "absolute h-3 w-3 border-cyan";
  return (
    <>
      <span className={`${base} left-0 top-0 border-l border-t`} />
      <span className={`${base} right-0 top-0 border-r border-t`} />
      <span className={`${base} bottom-0 left-0 border-b border-l`} />
      <span className={`${base} bottom-0 right-0 border-b border-r`} />
    </>
  );
}
