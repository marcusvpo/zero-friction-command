Plano para conectar o Supabase externo:

1. Adicionar as variáveis públicas de ambiente no projeto
   - `VITE_SUPABASE_URL=https://lhqyxeednbbmfcrkowxl.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_O-CUBepanZ5VUB66iR_oiQ_snzbEJPp`

2. Manter a integração existente em `src/lib/supabase.ts`
   - O cliente já lê `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
   - Não vou trocar para Lovable Cloud nem alterar o schema.

3. Validar o fluxo atual
   - Confirmar que `src/lib/db.ts` passa a usar o cliente real.
   - Confirmar que `hydrateFromCloud` em `src/store/marcola.ts` deixa de operar em modo offline quando as variáveis estão presentes.

4. Resultado esperado
   - Rotina, logs de treino, inventário e agenda de suplementos passam a sincronizar com as tabelas SQL que você já criou.