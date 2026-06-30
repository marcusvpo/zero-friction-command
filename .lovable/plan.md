# Phase 9 — Inteligência Pós-Treino

Três entregas + correção rápida da rotina de LEGS.

## 0. Correção: LEGS · "desenvolvimento" = ombro na máquina

No seed da rotina (`src/store/marcola.ts`), o exercício `desenvolvimento` no dia LEGS está apontando para *Hack Squat*. Reapontar para **Desenvolvimento de Ombros na Máquina** (`primary: "shoulders"`, library `lib-desenvolvimento-maquina`). Sem mexer no resto da divisão.

---

## 1. Score 0–100 pós-treino

Score exibido no `SessionSummaryModal` ao finalizar a sessão, composto por 4 componentes ponderados (transparentes, sem caixa-preta):

```text
SCORE = 0.40·Execução + 0.25·Sobrecarga + 0.20·Volume + 0.15·Densidade
```

- **Execução (0–100):** `setsCompletos / setsPlanejados` do dia ativo.
- **Sobrecarga (0–100):** % de exercícios em que o top set ≥ sugestão do `getSuggestion()` (peso×reps). Sem histórico → 50 (neutro).
- **Volume (0–100):** tonelagem da sessão vs média das últimas 4 sessões do mesmo dia (`history` agrupado). 100% da média = 80 pts; +20% = 100; −20% = 60. Sem baseline → 70.
- **Densidade (0–100):** tonelagem/minuto líquido vs descanso médio. Rest avg ≤ alvo (90s) = 100; cada +30s acima = −10.

**Implementação:**
- Estender `SessionSummary` com `score: { total, execution, overload, volume, density }`.
- Calcular dentro de `finishWorkout()` antes de `set({ lastSummary })`.
- `SessionSummaryModal`: novo bloco no topo — anel circular grande com `total`, e 4 micro-barras nomeadas (execução/sobrecarga/volume/densidade). Cor: ≥85 matrix, 60–84 cyan, <60 amber.

---

## 2. Delta Chart · 6 semanas

Substituir o `TonnageChart` mockado por gráfico real de tonelagem semanal nas últimas 6 semanas (página `/intel`).

**Dados:**
- Novo seletor `getWeeklyTonnage6w()` no store — agrupa `history` (todos os exercícios) por ISO-week, soma `reps×weight` de sets não-warmup, devolve `Array<{ week: "W-5"..."W0", tonnageKg, deltaPct }>`.
- Carrega via `loadHistory()` (já existe; chamada no boot `_app.tsx`). Se `history` vazio, mostra estado vazio "Sem dados ainda — complete 1 sessão".

**UI (`src/components/marcola/Charts.tsx`):**
- Renomear para `DeltaChart6w` (manter export `TonnageChart` como alias temporário se usado em Dashboard).
- `ComposedChart` recharts: barras cyan = tonelagem absoluta; linha matrix = Δ% vs semana anterior; tooltip mostra "12.4 t · +6.2%".
- Eixo X: rótulos "W-5..W0"; semana atual destacada com borda matrix.
- Substitui blocos hardcoded `tonnageData`/`fatigueData`.

---

## 3. Coach Intel · Crítica de Divisão/Volume

Novo painel no `/intel` (acima do heatmap) com diagnóstico automático da rotina + histórico recente.

**Engine (`src/lib/coach-intel.ts`):**
- Função pura `analyzeRoutine(routine, history)` → `Array<Insight>`, onde `Insight = { severity: "ok"|"warn"|"crit", code, title, detail, action? }`.
- Regras MVP (baseadas em literatura de hipertrofia, faixa 10–20 sets/grupo/semana):
  1. **Volume semanal por grupo** (sets diretos planejados): `<10` = `warn` "abaixo do mínimo"; `10–20` = `ok`; `>22` = `warn` "risco de overreaching"; `>28` = `crit`.
  2. **Frequência por grupo:** grupos compostos (peito/costas/pernas) treinados <2×/semana → `warn`.
  3. **Razão push:pull:** desvio >30% do equilíbrio 1:1 → `warn` "desequilíbrio postural".
  4. **Dia LEGS isolado** (sem repetição): `warn` "1×/semana subótimo para pernas".
  5. **Frescor:** se `history` mostra mesma carga ≥3 sessões consecutivas no mesmo exercício → `warn` "estagnação detectada · considere deload ou variação".
  6. **Densidade abdômen/cardio:** se rotina tem 0 abs e usuário marcou abs ter/qui → `ok` informativo de cumprimento.
- Sem chamadas LLM; tudo local e determinístico.

**UI (`src/components/marcola/CoachIntel.tsx`):**
- Painel "COACH INTEL · M6" com:
  - Cabeçalho compacto: contagem por severidade (`3 OK · 2 WARN · 0 CRIT`).
  - Lista de cards (max 6 visíveis, "Ver todos" expande). Cada card: ícone severidade, título, detalhe 1 linha, optional ação ("Abrir Builder", link para `/builder`).
- Inserir no `Dashboard` (rota `/intel`) entre KPI strip e Heatmap.

---

## Arquivos a tocar

- `src/store/marcola.ts` — fix LEGS seed; estender `SessionSummary`; calcular score em `finishWorkout`; novo seletor `getWeeklyTonnage6w()`.
- `src/components/marcola/SessionSummaryModal.tsx` — bloco de score (anel + barras).
- `src/components/marcola/Charts.tsx` — novo `DeltaChart6w` real; manter exports usados.
- `src/components/marcola/Dashboard.tsx` — trocar `TonnageChart` por `DeltaChart6w` e plugar `CoachIntel`.
- `src/lib/coach-intel.ts` — novo (regras puras).
- `src/components/marcola/CoachIntel.tsx` — novo (UI).

**Sem mudanças de schema Supabase.** Tudo derivado de `history` (já populado por `loadHistory`) + `routine`.

## Fora do escopo

- Persistir score histórico em tabela própria (pode vir em Phase 10 se quiser série temporal de score).
- IA generativa para o coach.
- Notificação push de critical insights.
