
## Escopo

Cinco correções pontuais na camada de UI/estado — sem novas features nem mudanças de schema.

---

### 1) Navbar fixa: background + separação visual

Arquivo: `src/components/marcola/TopTelemetryBar.tsx`

- Adicionar backdrop à `<header>`: `bg-background/70 backdrop-blur-md` + borda inferior `border-b border-white/5` para dar profundidade e evitar sobreposição visual dos textos abaixo.
- Manter `sticky top-0 z-30`. O conteúdo abaixo já respeita padding do `_app` layout; sem alterações estruturais.

### 2) /intel usando 100% dados reais

Arquivos: `src/components/marcola/Dashboard.tsx`, `src/store/marcola.ts`, `src/components/marcola/Charts.tsx`

- **KPI Tonelagem**: `getTonnage7d()` hoje soma a rotina (placeholder). Reescrever para somar `history` (logs reais dos últimos 7 dias) com `weight * reps` excluindo warm-ups. Se `history` estiver vazio → mostrar `—`.
- **KPI PR Watch**: `getPRWatch()` hoje varre rotina. Substituir por contagem de PRs em `pr_achievements` (via novo selector `getPRCount()` alimentado por um fetch no hydrate) ou, mais simples: derivar de `history` — nº de exercícios com peso máximo histórico batido nos últimos 7 dias. Escolha: derivar de `history` para evitar mais uma round-trip. Vazio → `—`.
- **KPI Rest Avg**: `getAvgRest()` hoje é média da config da rotina. Trocar por média real de descanso entre sets do `history` recente (diferença de timestamps entre sets consecutivos do mesmo exercício, clampada a ≤600s). Vazio → `—`.
- **KpiCard delta**: hoje é hardcoded `"+8.2%"`, `"armado"`, `"−4s"`. Passar a calcular deltas reais vs. janela de 7d anterior (mesma lógica acima em outra janela). Vazio → esconder o delta.
- **VolumeChart**: hoje usa `volumeData` mock. Reescrever para consumir `weeklyVolume` (sets/7d por músculo — já real) e agrupar por região (PEITO/COSTAS/PERNAS/OMBROS/BRAÇOS/CORE).
- **DeltaChart6w**: já é real, sem mudanças.

### 3) Remover "OPERAÇÃO DE HOJE" de /intel

Arquivo: `src/components/marcola/Dashboard.tsx`

- Excluir a `motion.section` hero (linhas ~44-152 aprox.) — inclusive o mini week map. A CTA de iniciar treino permanece apenas em `/workout`.
- Manter KPI strip + Delta chart + CoachIntel + Heatmap + Volume + Supplement.
- Remover imports órfãos (`Calendar`, `Play`, `ArrowRight`, `TrendingUp`, `Link`, `WEEKDAY_LABELS`, `WEEKDAY_LONG`, `startWorkout`, `weekdayMap`, `todayDay`, `lastWeekTonnage`, `targetTonnage`) e o helper `MicroStat` se não usado.

### 4) Mapa anatômico com pontos de calor vermelhos sobre os músculos

Arquivo: `src/components/marcola/AnatomyHeatmap.tsx`

Substituir polígonos por **pontos de calor radiais vermelhos** posicionados no centro de cada músculo (mais visual, menos dependente de traçar polígonos precisos).

- Trocar `MUSCLE_PATHS` (polygons) por `MUSCLE_POINTS`: `{ id, muscle, label, cx, cy, r }` em pixels do 704×1280.
- Renderizar cada ponto como `<circle>` com `fill="url(#heat-red)"` (radialGradient de `rgba(255,60,60,α)` no centro → transparente na borda).
- Intensidade (α e raio) escala com `sets` via `paintFor()`:
  - `0` → não renderiza
  - `1-4` → α=0.45, r=42
  - `5-8` → α=0.7, r=58
  - `>8` → α=0.9, r=74
- Aplicar `filter: drop-shadow(0 0 12px rgba(255,60,60,0.8))` para brilho.
- Atualizar `defs` (novo `radialGradient id="heat-red"`) e remover o `filter#muscle-glow` ciano.
- Atualizar `LegendDot` para vermelho.

Pontos aproximados (704×1280, frente do corpo — mesma referência que a PNG usa):
```
chest      cx≈352 cy≈320
shoulders  cx≈240 cy≈280  e  cx≈464 cy≈280
biceps     cx≈210 cy≈400  e  cx≈494 cy≈400
triceps    cx≈182 cy≈400  e  cx≈522 cy≈400
forearms   cx≈180 cy≈550  e  cx≈524 cy≈550
core       cx≈352 cy≈500
obliques   cx≈290 cy≈500  e  cx≈414 cy≈500
lats       cx≈260 cy≈470  e  cx≈444 cy≈470
traps      cx≈352 cy≈200
neck       cx≈352 cy≈150
lower-back cx≈352 cy≈600
glutes     cx≈352 cy≈660
quads      cx≈305 cy≈820  e  cx≈399 cy≈820
hamstrings cx≈305 cy≈850  e  cx≈399 cy≈850
calves     cx≈305 cy≈1080 e  cx≈399 cy≈1080
```
(Coordenadas serão ajustadas em build baseado no PNG real.)

### 5) /workout sincronizando com o dia atual

Arquivos: `src/routes/_app.workout.tsx`, `src/store/marcola.ts`

Problema: `active.dayId` é persistido em `localStorage` como `"d-push-a"` (seed) e nunca é atualizado para o dia da semana atual. Hoje (quarta) deveria mostrar `d-legs`.

- Adicionar effect em `WorkoutConsole`: se **não há sessão ativa** (`!active.startedAt`), sincronizar `active.dayId` com `weekdayMap[new Date().getDay()]` (ou primeiro dia da rotina como fallback) na montagem.
- Implementação: novo método na store `syncActiveDayToToday()` que faz set apenas se `active.startedAt === null && active.finishedAt === null`.
- Chamar no `useEffect` inicial do WorkoutConsole.
- Não mexe em sessões em andamento (usuário pode estar treinando algo diferente do prescrito para hoje).

---

## Notas técnicas

- Todas as leituras da store continuam via selectors primitivos (já corrigimos o bug de re-render infinito anteriormente); novos selectors derivados usam `useMemo` no componente com `history` como dependência.
- Nenhuma migração SQL necessária — tudo é derivado de `workout_logs` / `pr_achievements` já existentes.
- Sem alteração no bottom dock nem rotas.
