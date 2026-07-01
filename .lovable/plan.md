# Revitalização da tela /workout

## 1. Bug — trocar dia inicia cronômetro automaticamente

**Causa:** o strip de dias chama `startWorkout(d.id)` no `onClick`, e `startWorkout` seta `startedAt: Date.now()`, disparando o cronômetro imediatamente.

**Correção:**
- Nova ação no store: `selectDay(dayId)` — só troca `active.dayId`, reseta `exerciseIndex/setIndex` para 0, **sem** mexer em `startedAt`.
- `startWorkout` passa a ser usado **apenas** pelo botão explícito "INICIAR SESSÃO".
- Se o usuário clicar num dia enquanto uma sessão ativa está rodando em outro dia, mostrar confirm ("Descartar sessão atual?") antes de trocar.
- `syncActiveDayToToday` também usa `selectDay` (não deve auto-iniciar).

## 2. Redesign minimalista de /workout

Reduzir densidade visual. Menos chips, menos glow, menos "tactical HUD". Preservar 100% das funcionalidades atuais (steppers, warm-up, RPE, suggestion, swap library, rest timer, swipe, drawers).

### Nova hierarquia da tela (top → bottom)

```
┌─────────────────────────────────┐
│ [Legs ▾]         00:12:34  ⋯    │  ← Day picker (dropdown) + clock + menu
├─────────────────────────────────┤
│ Agachamento Livre               │  ← Nome grande, tipografia limpa
│ Quadríceps · Set 2 de 4         │  ← Metadata sutil
│ ●●○○                            │  ← Progresso dos sets
├─────────────────────────────────┤
│                                 │
│    ─  100 kg  +                 │  ← Steppers grandes, sem "chrome"
│    ─   8 reps +                 │
│                                 │
│    Meta: 100kg × 8  ·  90s      │  ← Uma linha só, cinza
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │      ✓  CONFIRMAR SET     │  │  ← CTA único, primário, full-width
│  └───────────────────────────┘  │
│    ‹ anterior      próximo ›    │  ← Nav discreta
└─────────────────────────────────┘
```

### Mudanças concretas

**Top rail (linha única):**
- Dia vira um `<select>`/dropdown compacto no canto esquerdo (não um strip horizontal ocupando linha inteira).
- Cronômetro centralizado, tipografia mono discreta.
- Menu `⋯` (kebab) à direita agrupa: Pausar/Retomar, Salvar rascunho, Sugerir alternativa, Descartar, Finalizar. Elimina a fileira atual de 5+ botões coloridos.

**Se sessão não iniciada:**
- Tela mostra card central com "Pronto para Legs?" + botão único `INICIAR SESSÃO`. Sem steppers, sem timer rodando.

**Card do exercício:**
- Remove background `glass-strong`, ring cyan, corner brackets HUD, banner de swipe hint permanente.
- Nome do exercício em `text-2xl font-semibold` (não `text-base`).
- Metadata (`ALVO · QUADRÍCEPS · TEMPO 3-0-1-0`) vira uma linha `text-xs text-muted-foreground`.
- Dots de progresso: bolinhas simples 6px, sem glow/shadow.
- Swipe continua funcionando, mas hint aparece **1x só** e some em 3s (já existe, manter).

**Steppers:**
- `MemoStepper` reescrito: `−` grande à esquerda, valor central em `text-4xl font-mono`, `+` grande à direita. Sem borda/ring/glow. Botões circulares 44×44 (touch target).
- Duas linhas empilhadas (peso em cima, reps embaixo) em vez de grid 2-col — mais legível durante treino.

**Meta/target:**
- Uma única linha de texto discreto abaixo dos steppers, sem ícone Target nem background.

**CTA:**
- Botão `CONFIRMAR SET` full-width, altura 56px, `bg-primary text-primary-foreground`, texto em maiúsculas discretas. Único botão colorido da tela.
- Setas `anterior/próximo` como texto/ícones ghost abaixo do CTA.

**Rest mode:**
- Manter tela cheia mas simplificar: timer grande, uma barra de progresso fina, dois botões (`+15s` ghost, `PULAR` primário). Remover corner accents e glow duplo.

**Plan list (lista de exercícios do dia):**
- Mover para dentro do menu `⋯` ou um drawer "Ver plano completo" — não fica visível o tempo todo. Libera espaço para foco.

**Drawers/modais preservados:**
- `SessionSummaryModal`, `discardOpen` confirm, `setConfigOpen` (config de warm-up/rest do set) — todos mantidos, apenas re-estilizados para o mesmo padrão minimalista (sem glass-strong, ring cyan).

### Tokens visuais

- Usar apenas tokens semânticos existentes (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`).
- Remover uso direto de `text-cyan`, `bg-matrix`, `glow-cyan`, `shadow-glow-cyan`, `font-mono-tactical` na tela `/workout`. Tokens continuam disponíveis para outras telas (Intel/Operator).
- Fonte mono só para números do timer e steppers.

## Escopo

- `src/store/marcola.ts` — adicionar `selectDay`; ajustar `syncActiveDayToToday`.
- `src/routes/_app.workout.tsx` — reescrever layout conforme acima; manter todas as ações do store.
- `src/components/marcola/SessionSummaryModal.tsx` e drawers inline — leve retoque para bater com novo estilo.

Nenhuma mudança em lógica de negócio (cálculo de PR, suggestion engine, sync queue, Supabase). Apenas UI + a correção do `selectDay`.

## Perguntas antes de implementar

1. O botão "Sugerir alternativa" (swap via /library) — mover para o menu `⋯` está OK, ou prefere manter visível o tempo todo?
2. O banner "Smart Overload · META" — manter visível acima dos steppers (recomendado para overload progressivo) ou também esconder no menu?
