## Objetivo

Reformular a Biblioteca de Exercícios: visual data-first (sem fotos), ~120 exercícios variados por equipamento, sistema de rating 5★ "Gym Tok" curado + deep research sob demanda, e fluxo robusto de "trocar exercício saturado" no `/workout`.

---

## 1. Limpeza de Imagens

- Deletar `src/assets/library/*.jpg` (12 arquivos gerados anteriormente).
- Remover todos os `import xxx from "@/assets/library/..."` de `src/lib/exercise-library.ts`.
- Remover prop `image` do tipo `LibraryExercise` e qualquer `<img>` em `src/routes/_app.library.tsx`.

## 2. Novo Visual da Biblioteca (sem fotos)

Cada card de exercício passa a exibir:

```text
┌─────────────────────────────┐
│ [ícone equipamento]   ★4.6 │
│ Supino Reto Barra           │
│ PEITO · ombros, tríceps    │
│ ● ● ● dificuldade           │
└─────────────────────────────┘
```

- Ícone do equipamento via `lucide-react` (Dumbbell, Cable, etc.) + chip colorido.
- Músculo primário destacado em cyan; secundários em muted.
- Estrelas (★) renderizadas com Lucide `Star`/`StarHalf`.
- Detalhe (sheet) inclui mini-diagrama anatômico SVG reaproveitando o `AnatomyHeatmap` (modo `highlightOnly`) destacando músculos atingidos — sem geração de imagem.

## 3. Catálogo de ~120 Exercícios

Novo `src/lib/exercise-library.ts` agrupado por **equipamento**:

- **Peso Livre — Barra** (~20): supino reto/inclinado/declinado, agachamento livre/front, levantamento terra convencional/sumô, stiff, remada curvada, desenvolvimento militar, rosca direta, etc.
- **Peso Livre — Halter** (~25): supino halter, crucifixo, desenvolvimento Arnold, elevações (lateral, frontal, posterior), remada serrote, agachamento goblet, búlgaro, rosca alternada/martelo/concentrada, tríceps francês, etc.
- **Máquinas Articuladas** (~25): leg press 45°, hack, cadeira extensora/flexora, mesa flexora, adutora/abdutora, supino máquina, voador (peck deck), pulldown, remada sentada máquina, panturrilha sentado/em pé, abdominal máquina, etc.
- **Polia / Cabos** (~20): puxada alta (pronada/supinada/neutra), remada baixa, crossover alto/médio/baixo, tríceps corda/barra/unilateral, rosca polia, face pull, pull-through, abdução cabo, woodchopper.
- **Peso Corporal / Calistenia** (~15): barra fixa (pronada/supinada/neutra), paralelas, flexão (normal/diamante/declinada), muscle-up, pistol squat, abdominal solo, prancha, hiperextensão, dips.
- **Cardio/Funcional** (~15): kettlebell swing, farmer's walk, sled push, jump rope, box jump, burpee, mountain climber, battle rope, air bike, esteira HIIT.

Novo schema:

```ts
type Rating = { stars: number; sampleSize: number; source: "curated" | "deep-research"; updatedAt: string; rationale: string };

interface LibraryExercise {
  id: string;
  name: string;
  equipment: Equipment;       // 'barbell'|'dumbbell'|'machine'|'cable'|'bodyweight'|'cardio'
  machineName?: string;       // "Leg Press 45°", "Smith", null se peso livre
  primary: MuscleId;
  secondary: MuscleId[];
  difficulty: 1|2|3;
  defaultRestSeconds: number;
  defaultTempo: string;
  shortDescription: string;   // 1-2 linhas, exibido no card e topo do sheet
  instructions: string[];
  cues: string[];             // dicas técnicas curtas
  rating: Rating;             // notas iniciais curadas (1 pesquisa manual condensada)
  tags?: string[];            // "compound", "isolador", "unilateral", "explosivo"
}
```

## 4. Rating 5★ "Gym Tok" (Híbrido)

**Notas iniciais curadas** (estáticas no arquivo) baseadas em consenso de referências fitness reconhecidas (Jeff Nippard, Mike Israetel/RP, Eugene Teo, Chris Bumstead) sintetizado pelo agente em um único passo — sem custo recorrente.

**Refresh sob demanda** via Perplexity:

- Server fn `refreshExerciseRating` em `src/lib/exercise-ratings.functions.ts` chamando Perplexity `sonar-deep-research` com prompt focado em "comunidade fitness TikTok/Instagram, eficácia hipertrófica, popularidade, segurança" → retorna `{ stars, rationale, sampleSize }`.
- Persistido em nova tabela `exercise_ratings` (Supabase): `exercise_id text pk, owner uuid, stars numeric, rationale text, source text, updated_at timestamptz` + RLS por owner + GRANTs. Não fazemos seed; tabela só guarda overrides.
- Botão "Atualizar rating (deep research)" no sheet de detalhe; loading state + toast.
- Requer conector Perplexity ativado; checagem amigável se ausente.

## 5. "Trocar Exercício Saturado" no /workout

Três peças coordenadas:

### 5a. Botão "Sugerir alternativa"
- Em cada exercício do `/workout`, ação rápida → navega para `/library?swap=<id>&day=<id>&filter=primary` com lista pré-filtrada pelo `primary` muscle.
- Ordenação default: `stars desc, sampleSize desc`, ocultando exercícios marcados como "saturado" ainda vigentes.

### 5b. Saturação
- Nova ação `markExerciseSaturated(exerciseLibId, weeks)` no store; persistida em `exercise_saturation` (Supabase) ou localStorage fallback.
- Tabela: `exercise_id text, owner uuid, hidden_until timestamptz, reason text`.
- Toggle "Marcar como saturado por: 2 / 4 / 8 semanas" no sheet de detalhe e no card do `/workout`.

### 5c. Histórico de rotação por slot
- Novo store-derived: `slotHistory[dayId][slotIndex] = [{ libId, weeksUsed }]`.
- Quando um slot fica ≥4 semanas no mesmo `libId`, exibir badge "♻ Considere variar" no card do `/workout` com CTA → mesma rota de sugestão acima.
- Cálculo a partir dos `workout_logs` existentes (group by week/exerciseId).

## 6. Detalhe Técnico

Arquivos novos:
- `src/lib/exercise-ratings.functions.ts` — server fn Perplexity (protegida com `requireSupabaseAuth`).
- `src/components/marcola/ExerciseRatingStars.tsx` — render ★/☆ + tooltip rationale.
- `src/components/marcola/MiniMuscleMap.tsx` — SVG compacto reutilizando paths de `AnatomyHeatmap`.
- Migração SQL: `supabase/migrations/<timestamp>_exercise_ratings_and_saturation.sql` (2 tabelas + GRANTs + RLS).

Arquivos alterados:
- `src/lib/exercise-library.ts` — schema novo + 120 exercícios + ratings curados.
- `src/routes/_app.library.tsx` — remover `<img>`, novos cards, filtro por equipamento expandido, suporte a `?filter=primary`, ordenação por rating, ocultar saturados.
- `src/routes/_app.workout.tsx` — botões "Sugerir alternativa" + "Marcar saturado" + badge de rotação.
- `src/store/marcola.ts` — actions `markExerciseSaturated`, `unmarkSaturated`, selectors `getActiveAlternatives`, `getSlotRotationHint`.

Secrets: `PERPLEXITY_API_KEY` via conector (não pedir manualmente; instruir conexão se faltar).

## 7. Validação

- Build TS limpo (schema novo bate com store).
- `/library` renderiza 120 itens, filtros e estrelas; nenhum 404 de imagem.
- `/workout` "Sugerir alternativa" abre biblioteca filtrada e swap funciona.
- Marcar saturado oculta exercício até `hidden_until`.
- Refresh de rating persiste em `exercise_ratings` e atualiza UI (somente se Perplexity conectado).

---

## Perguntas em aberto (decido sozinho se não responder)

- **Sem Perplexity conectado:** mostro estado curado + botão desabilitado com tooltip "Conecte Perplexity para deep research". Posso já incluir o fluxo de conexão na primeira tentativa.
- **Migração Supabase:** vou criar as 2 tabelas via `supabase/migrations/` (não Lovable Cloud, conforme regra do workspace). Confirma?
