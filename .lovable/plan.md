
# Phase 6 — Workout 360º + Exercise Library

## 1. Desligar DEBUG_MODE do heatmap
- `src/components/marcola/AnatomyHeatmap.tsx`: flip `DEBUG_MODE = false`. Remover stroke vermelho residual.

## 2. /workout — enquadramento e UX

Problema atual: o botão fixo `CONFIRM SET` (bottom-24) sobrepõe a lista de exercícios em viewports curtos; o dock inferior + alturas fixas estouram em telas pequenas; o "ENCERRAR" some quando o cartão de set é muito alto.

Mudanças em `src/routes/_app.workout.tsx`:
- Trocar layout principal por flex column com `h-[100dvh] overflow-hidden` e seções com `min-h-0` + `overflow-auto` apenas onde necessário (lista de exercícios).
- Mover o CTA `CONFIRM SET` para dentro do cartão (não mais `fixed`), garantindo que nunca colida com o BottomDock; sticky-bottom dentro do cartão com safe-area-inset-bottom.
- Day-selector strip vira `grid grid-cols-5` em ≥sm e scroll horizontal só em mobile estreito.
- Stepper: reduzir altura mínima para caber em 667px de altura; fonte do valor em `clamp(2rem, 8vw, 3rem)`.
- Lista de exercícios compacta com altura máxima dinâmica `max-h-[min(40vh,18rem)]`.
- Novo header tático com cronômetro total de sessão + status (ATIVO / PAUSADO).

Novos controles de sessão (botões no header da tela):
- **Pausar / Retomar**: pausa cronômetro total e bloqueia CONFIRM SET. Adiciona `pausedAt` e `totalPausedMs` em `ActiveWorkout`.
- **Salvar rascunho**: persiste `active` no Supabase (tabela `workout_drafts`, 1 por usuário). Ao abrir /workout, oferece "Continuar sessão de X min atrás".
- **Descartar**: confirm dialog destrutivo, limpa `active` + draft.
- **Finalizar com resumo**: modal com tonelagem total, PRs batidos (peso > maior peso anterior do exercício), duração líquida (descontando pausas), sets completos. Salva sessão fechada em `workout_sessions`.

## 3. Cadastro de set/exercício — campos novos

`Exercise` (em `src/store/marcola.ts`) ganha:
- `tempo?: string` (ex: "3-1-1-0")
- `targetRPE?: number`
- `notes?: string` (já existe)

`ExerciseSet` ganha:
- `isWarmup?: boolean` (não conta tonelagem nem volume semanal)
- `restSeconds?: number` (override por set; cai pro `exercise.restSeconds` quando vazio)
- `notes?: string`
- `rpe?: number` (já existe — agora captado no CONFIRM SET)

UI:
- Drawer "Configurar set" (long-press no stepper ou ícone ⋮): edita rest, marca warm-up, RPE alvo.
- Após CONFIRM SET, drawer rápido opcional para RPE real (1–10) + nota; auto-dispensa em 2s se ignorado.
- Builder (`/builder`): editor de exercício com tempo, RPE alvo, descanso, sets warm-up.

## 4. Biblioteca de Exercícios

### Dados
Novo arquivo `src/lib/exercise-library.ts` com ~30 exercícios canônicos cobrindo os 5 dias do split atual + clássicos por grupo. Cada item:
```ts
{ id, name, primary: MuscleId, secondary[], equipment: "barbell"|"dumbbell"|"cable"|"machine"|"bodyweight",
  difficulty: 1|2|3, instructions: string[], imageUrl: string }
```

### Imagens (IA, estilo neon anatômico)
Gerar ~30 imagens 1024×1024 via `imagegen--generate_image` (premium para legibilidade do gesto), prompt-base consistente: silhueta humana wireframe ciano sobre fundo preto, halteres/barras em neon verde matrix, traços táticos, sem texto. Upload para CDN via `lovable-assets create`, salvar pointers em `src/assets/library/<id>.png.asset.json`. Importar no array.

### Tela `/library` (`src/routes/_app.library.tsx`)
- Grid 2 col mobile / 4 col desktop.
- Filtros chip: grupo muscular (15 botões), equipamento (5 chips), busca por nome.
- Card: imagem + nome + músculo primário + chips de secundários.
- Tap → bottom-sheet com imagem grande, instruções passo-a-passo, e dois CTAs:
  - **Adicionar ao dia →** picker D1/D2/D3/D4/D5 → cria Exercise com `restSeconds`, `tempo` padrão do template, 3 sets default.
  - **Substituir exercício atual** (só visível se vier de /workout via state) → swap mantendo histórico de sets.

### Integração com /workout
- Botão "Trocar exercício" no header do cartão → navega para /library com `?swap=<exerciseId>&day=<dayId>`.
- Botão "+ Adicionar" no fim da lista de exercícios do dia → /library.

## 5. Persistência Supabase

Migrações novas (após aprovação do plano):
- `workout_drafts` (owner uuid PK, payload jsonb, updated_at) — RLS por owner.
- `workout_sessions` (id, owner, day_id, started_at, finished_at, total_paused_ms, tonnage_kg, prs jsonb, sets_completed int) — RLS por owner.
- Não é preciso tabela para a biblioteca: dados estáticos no bundle.

Store (`src/store/marcola.ts`):
- `pauseSession()`, `resumeSession()`, `saveDraft()`, `loadDraft()`, `discardSession()`, `finishWorkoutWithSummary(): SummaryStats`.
- `getElapsedMs()`: `now - startedAt - totalPausedMs - (pausedAt? now-pausedAt:0)`.
- `swapExercise(dayId, exerciseId, fromLibraryId)`.
- `addLibraryExerciseToDay(dayId, libraryId)`.

## Arquivos tocados
- `src/components/marcola/AnatomyHeatmap.tsx` (debug off)
- `src/routes/_app.workout.tsx` (relayout + controles + drawers)
- `src/routes/_app.library.tsx` (novo)
- `src/routes/_app.builder.tsx` (campos extras)
- `src/components/marcola/SetConfigDrawer.tsx` (novo)
- `src/components/marcola/SessionSummaryModal.tsx` (novo)
- `src/components/marcola/BottomDock.tsx` (link Library)
- `src/store/marcola.ts` (state machine + drafts + summary)
- `src/lib/exercise-library.ts` (novo)
- `src/lib/db.ts` (drafts + sessions)
- `src/assets/library/*.png.asset.json` (~30 pointers)
- `supabase/marcola_schema.sql` (drafts + sessions + grants + RLS)

## Ordem de execução
1. Migração Supabase (drafts + sessions).
2. Store: novos campos + actions + cronômetro pausável.
3. Tipos `Exercise`/`ExerciseSet` estendidos sem quebrar seeds.
4. /workout relayout + controles de sessão + summary modal.
5. SetConfigDrawer + captura de RPE real.
6. Biblioteca: gerar imagens IA (lote), upload assets, dados, tela /library, integração swap/add.
7. Builder: campos extras (tempo, warm-up, RPE alvo).
8. DEBUG_MODE = false.

## Confirmações necessárias antes de implementar
- OK gerar ~30 imagens em modo **premium** (~30 créditos)? Posso reduzir pra 15 cobrindo só os exercícios do split atual + 5 extras por grupo se preferir economia.
- OK criar tabelas `workout_drafts` e `workout_sessions` no Supabase existente (mesmo schema/usuário)?
