# Setup local e Supabase

Este guia leva do zero até o login funcionando em desenvolvimento. Ele assume Node.js 24+ e npm 11+.

## 1. Dependências e variáveis

```bash
npm ci
cp .env.example .env.local
```

Preencha `.env.local`:

| Variável | Onde encontrar | Observação |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | chave pública (`anon` / `publishable`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | **somente servidor**; não é usada no login atual |
| `NEXT_PUBLIC_SITE_URL` | você define | `http://localhost:3000` no local |

Sem as duas primeiras variáveis o app abre em **modo de configuração**. Não existe sessão simulada: as telas explicam o que falta e a área interna redireciona para o login.

## 2. Criar o projeto Supabase

1. Crie um projeto em <https://supabase.com/dashboard>.
2. Guarde a senha do banco.
3. Em **Project Settings → API**, copie a URL e a chave anônima para `.env.local`.

### Opção A — aplicar a migração pelo SQL Editor

1. Abra **SQL Editor → New query**.
2. Cole todo o conteúdo de `supabase/migrations/20261114000100_init.sql`.
3. Execute. A migração é idempotente na criação de tipos/tabelas? **Não**: rode uma única vez em um banco vazio.
4. Confira em **Table Editor** se as tabelas `profiles`, `workspaces`, `projects`, `tasks` e as demais foram criadas.

### Opção B — Supabase CLI (recomendado para iteração)

Requer Docker Desktop em execução.

```bash
npx supabase start
npx supabase db reset   # aplica supabase/migrations e config.toml
```

O `db reset` recria o banco local e aplica todas as migrações. Estúdio em <http://localhost:54323>; e-mails de teste no Inbucket em <http://localhost:54324>.

Para um projeto remoto:

```bash
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

> Enquanto a migração não tiver sido executada e validada em um projeto de desenvolvimento, o login não pode ser considerado verificado. Este é um critério de aceite da Etapa 3.

## 3. Configurar autenticação

Em **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` no local; a URL pública em produção.
- **Redirect URLs** (adicione todas as variantes usadas):
  - `http://localhost:3000/auth/confirm`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/redefinir-senha`
  - as equivalentes de produção e dos previews da Netlify

Em **Authentication → Providers → Email**, mantenha a confirmação de e-mail ativa. O app usa o fluxo `token_hash`, que estabelece a sessão SSR ao abrir o link.

### Templates de e-mail

Cole o HTML de:

- `supabase/templates/confirmation.html` em **Auth → Email Templates → Confirm signup**
- `supabase/templates/recovery.html` em **Auth → Email Templates → Reset password**

Os templates apontam para:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/bem-vindo
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/redefinir-senha
```

Se preferir os templates padrão do Supabase, ajuste o **Redirect URL** para `/auth/callback`. O app aceita os dois fluxos: `token_hash` (`/auth/confirm`) e PKCE (`/auth/callback`).

## 4. Rodar e validar

```bash
npm run dev
```

Checklist manual:

1. **Criar conta** em `/criar-conta` com um e-mail real.
2. Receber o e-mail, abrir o link e cair em `/bem-vindo` autenticado.
3. Concluir o onboarding (nome + fuso) e chegar à visão geral.
4. Recarregar a página: a sessão continua ativa.
5. Sair pelo menu do usuário e tentar abrir `/projetos`: deve redirecionar para `/login`.
6. Recuperar senha em `/recuperar-senha` e concluir em `/redefinir-senha`.

### Verificações no banco

```sql
-- 1. RLS ligado em todas as tabelas públicas
select c.relname, c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- 2. Perfil, preferências, espaço e vínculo criados no signup
select p.id, p.full_name, w.name, wm.role
from public.profiles p
join public.workspace_members wm on wm.user_id = p.id
join public.workspaces w on w.id = wm.workspace_id
order by p.created_at desc
limit 5;

-- 3. Um foco por tipo e escopo
select workspace_id, kind, scope_key, target_id
from public.focus_assignments;

-- 4. Nenhuma tabela pública sem política para usuários autenticados
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Teste de RLS com a chave anônima (fora do SQL Editor, que roda como `postgres`):

```bash
curl "https://SEU-PROJETO.supabase.co/rest/v1/projects?select=id" \
  -H "apikey: SUA_ANON_KEY" \
  -H "Authorization: Bearer SUA_ANON_KEY"
```

A resposta deve ser `[]` ou um erro de permissão, nunca projetos de outro usuário.

### Teste de concorrência do foco

O RPC `set_primary_focus` usa `select ... for update` e a tabela tem `unique (workspace_id, kind, scope_key)`. Duas trocas simultâneas no mesmo escopo devem terminar com uma vencedora e a outra aplicando por último, sem duplicar registros. Verifique com duas abas autenticadas ou com o SQL abaixo, que deve sempre retornar no máximo uma linha por `kind`:

```sql
select workspace_id, kind, scope_key, count(*)
from public.focus_assignments
group by 1, 2, 3
having count(*) > 1;
```

## 5. Problemas comuns

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| “Modo de configuração” | envs ausentes ou inválidas | confira `.env.local` e reinicie o dev server |
| Login funciona, mas perfil não carrega | migração não aplicada | aplique a migração e recarregue |
| Link de e-mail cai em `/login?erro=link-expirado` | template sem `token_hash` ou link já usado | recole os templates e solicite novo e-mail |
| Redireciona para `/bem-vindo` sempre | `onboarding_done_at` nulo | conclua o onboarding; se persistir, confira permissões de update em `profiles` |
| Sessão some ao recarregar | cookies bloqueados ou `NEXT_PUBLIC_SITE_URL` divergente | use a mesma origem no navegador e nas Redirect URLs |
| `relation does not exist` | migração não executada | rode a migração antes de abrir a área interna |

## 6. Testes automatizados

```bash
npm run test        # regras de domínio, datas e nomes
npm run test:e2e    # smoke de login, proteção de rotas, PWA e offline
```

Os testes de navegador rodam sem credenciais, em modo de configuração. Na primeira vez:

```bash
npx playwright install chromium
```

Fluxos autenticados (criar, editar, concluir tarefa) serão cobertos quando houver um projeto Supabase de teste com dados semeados.
