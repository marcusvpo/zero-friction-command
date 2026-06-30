
# Phase 8 — Calibração Real do Operador

Quatro frentes em paralelo: substituir telemetria fake por dados reais, zerar a base, blindar UI mobile, e plantar sua rotina real (PPL×2 + Legs quarta + abdômen ter/qui + esteira diária).

---

## 1. Telemetria real no TopTelemetryBar

Hoje mostra `142 BPM` e `842 KCAL` hardcoded — placeholder visual de Phase 1. Substituir por dois indicadores **derivados de dados reais** já no store:

- **VOL · kg** — volume total da sessão ativa (Σ reps × peso de todos os sets confirmados hoje). Quando não há treino ativo, mostra volume da última sessão (label `VOL · 24H`).
- **SETS · N** — número de sets confirmados hoje (ou na última sessão).
- Quando há fila de sync pendente, o badge âmbar `↑ N pendentes` continua aparecendo no lugar do "SISTEMA · ONLINE" (já existe).

Remove BPM/KCAL completamente — não temos sensor nem integração de wearable. Adicionar isso seria mentir para o operador.

Novo seletor no store: `getSessionTelemetry()` → `{ volumeKg, sets, isLive }`.

---

## 2. Wipe controlado dos dados de teste

Adicionar ação **"ZERAR SISTEMA"** em `/operator` (botão discreto no rodapé do card de biométricos, com `AlertDialog` de confirmação dupla):

- Limpa Zustand persist: `workout_logs`, `history cache`, `currentSession`, `PR medals`, `seenSwipeHint`, fila de sync.
- Mantém: rotina, biométricos, supplements.
- No Supabase (se autenticado): `delete from workout_logs where owner = auth.uid()` + `delete from pr_achievements where owner = auth.uid()`.

Variante "factory reset" (limpa tudo incluindo rotina/biométricos) fica explicitamente de fora — pediria outro botão e mais confirmação.

---

## 3. Mobile polish (auditoria visual)

Varredura nas telas críticas (`/`, `/workout`, `/library`, `/intel`, `/operator`, `/logistics`, `/builder`) aplicando o padrão obrigatório do design system:

- Headers com texto + widget → `grid grid-cols-[minmax(0,1fr)_auto]` no mobile, `min-w-0` em containers de texto, `shrink-0` em ícones, `truncate` em títulos.
- `TopTelemetryBar`: ajustar para não estourar quando `pending > 9` ou label longo (encolher gap, `font-mono-tactical text-[10px]` já está OK, falta `min-w-0`).
- `BottomDock`: garantir 5 ícones com toque ≥44px e safe-area inset (`pb-[env(safe-area-inset-bottom)]`).
- `WorkoutConsole` (Terminal): card de exercício com swipe não pode disparar scroll horizontal — confinar `overflow-x-hidden` no wrapper. Stepper PESO/REPS lado a lado precisa `grid-cols-2 gap-2` consistente.
- `Operator` PR Medals: grid de 2 colunas em mobile já existe — validar truncate nos nomes longos.
- `Intel` charts: forçar `ResponsiveContainer` com `aspect` em vez de altura fixa que estoura no 360px.

Sem mudanças de layout/funcionalidade, só alinhamento + responsividade.

---

## 4. Calibração do operador + rotina real

### 4.1 Biométricos
Seed inicial via store: `weightKg: 76`, `heightCm: 178`. Aplicado uma única vez se ambos forem `null` após o wipe (não sobrescreve edições futuras).

### 4.2 Rotina PPL×2 + Legs
Substituir rotina default em `src/lib/exercise-library.ts` / `marcola.ts` pela sua atual. Split semanal:

```text
SEG  PUSH A
TER  PULL A   + ABS
QUA  LEGS
QUI  PUSH B   + ABS
SEX  PULL B
SAB  off / cardio
DOM  off
```

(PUSH A/B e PULL A/B são a mesma lista de exercícios — a variação fica para o Smart Overload sugerir progressão a cada repetição da sessão.)

**Esteira 15min · 6.5 km/h · 3–6% inclinação** entra como bloco fixo no final de **todos os treinos** (componente `CardioBlock` no fim do WorkoutConsole, não conta como exercício de série).

**Abdômen** entra como bloco opcional no fim de TER e QUI (3 exercícios curtos, default a definir; deixo placeholder `Prancha / Crunch cabo / Russian twist` com 3×10 e botão "trocar" via library).

### 4.3 Exercícios por dia (todos 3×8–10)

**PUSH** (7):
1. Supino reto máquina sentado (anilhas)
2. Fly máquina (peck deck)
3. Supino inclinado halteres
4. Wide chest press máquina
5. Desenvolvimento máquina (ombros)
6. Tríceps corda polia
7. Tríceps francês polia
8. Tríceps press (tríceps testa máquina / supino fechado — confirmar variante na 1ª sessão)

**PULL** (7):
1. Lat pulldown pegada aberta
2. Remada máquina (seated row)
3. Lat pulldown pegada fechada
4. Pulldown corda (face-pull alto / straight-arm — confirmar)
5. Rosca corda polia
6. Rosca scott
7. Rosca barra W pegada invertida polia

**LEGS** (6):
1. Cadeira extensora
2. Mesa flexora
3. Leg press sentado (seated leg press)
4. Desenvolvimento (entendido como **agachamento Smith / hack** — confirmar; se for ombros, sinalize)
5. Elevação lateral (cabos / halteres)
6. Remada alta polia baixa

> **Ponto que preciso confirmar antes de codar (1 pergunta no fim do plano):** o "desenvolvimento" no Leg day é exercício de **perna** (hack squat / agachamento Smith) ou é mesmo **ombros** acoplado no leg? Já anotei como hack squat por padrão.

Todos exercícios precisam existir em `exercise-library.ts` com `primaryMuscle` correto — alguns já estão (extensora, flexora, leg press, lat pulldown, remada, supino reto/inclinado, fly, elevação lateral, tríceps corda, rosca scott). Os que faltam serão adicionados com ícone+músculo (padrão definido na Phase 5: sem foto, só Lucide + heatmap).

### 4.4 Volumes e crítica futura
Smart Overload da Phase 7 já cuida de progressão. A **crítica de volume / nova divisão** (você pediu ajuda) fica para Phase 9 como um módulo "Coach Intel" em `/intel` — analisa sets/semana por grupo muscular vs MEV/MAV e sugere ajustes. Fora de escopo desta fase para não atrasar a calibração.

---

## Arquivos afetados

- `src/store/marcola.ts` — `getSessionTelemetry`, `wipeData`, seed biométrico, nova `defaultRoutine` PPL×2.
- `src/lib/exercise-library.ts` — adicionar exercícios faltantes (wide chest press, tríceps francês polia, tríceps press, pulldown corda, rosca W invertida polia, hack squat, seated leg press).
- `src/components/marcola/TopTelemetryBar.tsx` — trocar BPM/KCAL por VOL/SETS reais.
- `src/components/marcola/CardioBlock.tsx` *(novo)* — bloco 15min esteira no fim de cada treino.
- `src/components/marcola/AbsBlock.tsx` *(novo)* — bloco abdômen ter/qui.
- `src/routes/_app.workout.tsx` — montar CardioBlock + AbsBlock condicionais; overflow-x-hidden no card de swipe.
- `src/routes/_app.operator.tsx` — botão "ZERAR SISTEMA" com AlertDialog.
- `src/routes/_app.index.tsx`, `_app.intel.tsx`, `_app.library.tsx`, `_app.logistics.tsx`, `_app.builder.tsx` — auditoria mobile (grid/min-w-0/truncate/shrink-0).
- `src/components/marcola/BottomDock.tsx` — safe-area inset.

Nada toca Supabase schema (Phase 6 já cobriu). Wipe usa `delete` direto via client.

---

## Fora de escopo desta fase
- Score 0–100 pós-treino
- Delta chart 6 semanas
- Coach Intel (crítica de divisão/volume)
- PWA / Service Worker
- Integração de wearable real para BPM/KCAL

---

## Pergunta antes de implementar

Só uma: no **Leg day**, o "desenvolvimento" é **hack squat / agachamento Smith** (perna) ou é mesmo **desenvolvimento de ombros** que você intercala no leg? Default que vou usar se você não responder: **hack squat**.
