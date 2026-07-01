# Reorganizar dock inferior

## Contexto
Hoje o dock tem: Terminal (→ /workout) · Intel · **[+ central abre QuickLog]** · Builder · Operator. O botão azul central abre um drawer "Registro Rápido" — o usuário não vê utilidade prática nele.

## Mudanças

1. **Botão central vira o CTA principal de treino.**
   - Ícone: `Dumbbell` (halter) do lucide-react, no lugar do `Plus`.
   - Comportamento: `<Link to="/workout">` (não abre mais o QuickLogSheet).
   - Fica destacado como "página principal/padrão" — mantém o círculo elevado e o glow atual.
   - `aria-label`: "Treino".

2. **Botão "Terminal" (posição 1 do dock) vira placeholder.**
   - Rota nova `src/routes/_app.terminal.tsx` com uma tela simples:
     - Título "Terminal"
     - Mensagem: "Em desenvolvimento — em breve."
     - Ícone sutil (`Construction` ou `Wrench`), tipografia minimalista alinhada ao novo padrão de /workout.
   - Ajustar o item do dock: `to: "/terminal"`.

3. **Remover uso do `QuickLogSheet` do dock.**
   - Deletar o import e o state `quickOpen`. O componente `QuickLogDrawer.tsx` fica no repositório caso seja reaproveitado, mas não é montado no dock.

## Escopo
- `src/components/marcola/BottomDock.tsx` — trocar ícone/comportamento do central, atualizar item Terminal, remover QuickLogSheet.
- `src/routes/_app.terminal.tsx` — nova rota placeholder com `head()` (título "Terminal · Marcola Prime", description curta).

Sem mudanças em store, /workout, ou lógica de negócio.
