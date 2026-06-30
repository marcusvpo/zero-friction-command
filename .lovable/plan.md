## Fase 7 — Fricção Zero (Terminal)

Foco exclusivo no momento do treino. Score/Delta/Fadiga e PWA completo ficam pra Fase 8/9.

### 1. Smart Overload (sugestão de progressão)

**Comportamento**
- Ao abrir um exercício no Terminal, o sistema calcula `suggestedWeight` e `suggestedReps` e mostra acima do stepper:
  > `META · 82kg × 8` *(+2.5kg vs última)*
- Botão CONFIRM SET fica **verde matrix pulsante** quando os valores atuais batem com a meta. Basta um toque.
- Se o usuário ajustar manualmente, o "match" some e o botão volta ao gradiente padrão.

**Fonte dos dados (híbrida)**
- Boot do Terminal: tenta `fetchRecentLogs(limit=200)` do Supabase (já existe em `src/lib/db.ts`). Cacheia no Zustand (`history: Record<exerciseId, LogRow[]>`).
- Se offline ou sem dados remotos: cai pra `routine.days[*].exercises[*].sets` (último peso salvo na rotina).
- Algoritmo:
  - Pega top set não-warmup das **últimas 2 sessões** desse `exercise_id`.
  - Se reps alcançadas ≥ alvo nas 2 sessões → sugere `+2.5kg` (compostos: chest/quads/lats/glutes/hamstrings) ou `+1.25kg` (isolados).
  - Se reps abaixo do alvo → mantém peso, sugere `+1 rep`.
  - Primeira vez (sem histórico) → usa o valor já planejado na rotina, sem badge.

**Selector novo no store**
- `getSuggestion(exerciseId) → { weight, reps, deltaKg, reason }`
- `loadHistory()` chamado uma vez no mount do Terminal.

### 2. Swipes complementares no card de execução

**Gestos** (via Framer Motion `drag="x"` + threshold)
- Swipe direita ≥ 80px → `completeCurrentSet()` (mesma ação do botão).
- Swipe esquerda ≥ 80px → skip set (avança setIndex sem logar, marca `skipped: true` no log).
- Haptic feedback via `navigator.vibrate(20)` quando disponível.
- Indicadores laterais (✓ verde / ⤼ amber) aparecem com opacity proporcional ao drag, igual Tinder.
- Botão CONFIRM SET **permanece** no rodapé do card — gestos são atalho, não substituto.

**Discovery**
- Primeira visita ao Terminal: mini-hint 2s no topo do card: *"DESLIZE → CONFIRMAR · ← PULAR"*. Persiste flag `seenSwipeHint` no localStorage.

### 3. Rest Timer adaptativo por RPE

**Regra**
- Quando usuário registra RPE no post-set drawer:
  - RPE ≤ 7 → reduz rest em 15s (mínimo 30s).
  - RPE 8 → mantém base do exercício.
  - RPE 9 → +30s.
  - RPE 10 → +60s.
- Toast informativo: *"Rest ajustado: 90s → 120s (RPE alto detectado)"*.
- Implementação: ajusta `rest.remaining` e `rest.total` em tempo real ao salvar RPE.

**Sem dependência de hardware** — só RPE manual. Frequência cardíaca fica pra fase futura quando integrarmos Health Connect / Apple Health.

### 4. Write-queue offline (camada base, sem Service Worker)

**Objetivo**
- Confirmar set funciona instantaneamente mesmo sem rede. Nada trava esperando Supabase.

**Implementação**
- Novo arquivo `src/lib/sync-queue.ts`:
  - Fila persistida em `localStorage` (`marcola-sync-queue`): `Array<{ id, type: "workout_log", payload, attempts, ts }>`.
  - `enqueue(item)` — adiciona e dispara flush.
  - `flush()` — itera fila, tenta `pushWorkoutLog`; em sucesso remove; em falha incrementa `attempts` (max 5, depois descarta com toast warning).
  - Auto-flush em: `window.online` event, mount do app, e a cada 30s se houver itens.
- Modifica `completeCurrentSet` em `marcola.ts`: troca `void pushWorkoutLog(...)` direto por `void enqueue({ type: "workout_log", payload })`.
- Badge sutil no `TopTelemetryBar`: quando `queue.length > 0` mostra `↑ N pendentes` em amber.

**Sem PWA / Service Worker nesta fase.** Funciona enquanto a aba estiver aberta — cobre 95% do caso de academia (pessoa entra logada, treina, sai). PWA completo + background sync fica pra Fase 9 quando o app estiver maduro.

### 5. Otimização de re-renders (escopo focado)

Só nas hot paths do Terminal pra não inflar o PR:
- `RestTimer` extraído como componente isolado com `React.memo`, recebendo só `remaining`/`total` via props. Hoje o tick re-renderiza o `WorkoutConsole` inteiro.
- Stepper PESO/REPS isolado com `memo` — só re-renderiza quando o valor muda.
- Selector ticker da sessão (`elapsedLabel`) movido pra um componente filho `<SessionElapsedClock />` que tem seu próprio `setInterval`. Hoje o `useState(n => n+1)` força re-render de tudo.

### Mudanças nos arquivos

```text
src/lib/sync-queue.ts                    NEW
src/store/marcola.ts                     +getSuggestion +loadHistory +history +adjustRestForRPE
src/routes/_app.workout.tsx              swipe gestures, suggestion badge, smart-match CTA
src/components/marcola/SessionClock.tsx  NEW (memo)
src/components/marcola/RestTimerCard.tsx NEW (memo, extraído)
src/components/marcola/Stepper.tsx       NEW (memo, extraído)
src/components/marcola/TopTelemetryBar.tsx  +badge fila pendente
```

### Fora de escopo (próximas fases)

- **Fase 8 — Visão de Comando**: Score 0-100, gráfico de Delta semanal, alerta de Fadiga Sistêmica preditiva.
- **Fase 9 — Hardening**: PWA + Service Worker + background sync, geração automática de `Database` types do Supabase, memo profundo no Dashboard/Intel.

### Riscos

- Drag horizontal pode conflitar com scroll vertical do plan list — uso `drag="x"` com `dragDirectionLock` e threshold alto (80px) pra mitigar.
- Smart Overload depende de `exercise_id` consistente entre sessões. Já está consistente no seed; risco baixo.
- Fila offline pode ficar grande se usuário ficar muitos dias sem rede — cap em 500 itens com FIFO.
