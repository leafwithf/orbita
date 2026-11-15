# ADR 0004 — Segurança, RLS e chaves

- **Status:** aceito
- **Data:** 2026-11-14
- **Contexto da etapa:** Etapa 3 — Fundação

## Contexto

O alpha será privado, mas guardará dados pessoais e de equipes. O cliente web nunca pode receber a chave de serviço, e toda tabela exposta pela API do Supabase precisa de Row Level Security. A autorização não pode depender de o frontend esconder um botão.

## Decisão

1. **RLS ligado em todas as tabelas do schema `public`.** Nenhuma tabela exposta fica sem política para `authenticated`; operações não cobertas são negadas por padrão.
2. **Funções auxiliares** `is_workspace_member(workspace_id)` e `has_workspace_role(workspace_id, role)` centralizam a checagem. A hierarquia é `reader < collaborator < editor < admin < owner`.
3. **Escritas por papel:**
   - `reader`: leitura.
   - `collaborator`: cria e move as próprias tarefas, comenta.
   - `editor`: cria e edita conteúdo do espaço.
   - `admin`/`owner`: gerencia membros, convites e configurações.
4. **Chaves:**
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` no navegador e no servidor, sujeita a RLS.
   - `SUPABASE_SERVICE_ROLE_KEY` apenas em código de servidor, para tarefas administrativas futuras (convites, cotas, limpeza). Nunca em Client Component, nunca em `NEXT_PUBLIC_*`.
5. **Sessão SSR:** cookies `httpOnly` gerenciados por `@supabase/ssr`, renovados no proxy (`lib/supabase/proxy.ts`) e revalidados no layout autenticado. `getUser()` é a fonte de verdade, não o cookie bruto.
6. **Convites:** token de 32 bytes, somente o hash é armazenado, validade de 7 dias, uso único e aceite via RPC `accept_invitation()`.
7. **Arquivos (etapas seguintes):** upload direto ao Storage com URL assinada, validação real de MIME no servidor, limite de 25 MB por arquivo e 1 GB por workspace. Links públicos do portfólio usam token revogável e `noindex`.

## Consequências

**Positivas**

- A regra de acesso acompanha o dado em qualquer caminho: Server Component, Server Action, rota de API ou cliente.
- Vazamento por cache é evitado porque nenhum dado de workspace é cacheado.
- A chave de serviço não circula no bundle.

**Negativas / cuidados**

- Políticas RLS são código de produção e precisam de teste. A migração inicial deve ser validada em um projeto de desenvolvimento.
- Funções `security definer` exigem `set search_path = ''` e validação explícita de entrada para não virarem escalada de privilégio.
- Toda nova tabela precisa de RLS e políticas no mesmo PR; não existe “depois eu adiciono”.
- O SQL Editor do Supabase roda como `postgres` e **não** testa RLS. Testes de política devem usar a chave anônima com uma sessão real.

## Checklist para novas tabelas

- [ ] `alter table ... enable row level security`
- [ ] políticas separadas para `select`, `insert`, `update` e `delete` (quando aplicável)
- [ ] coluna `workspace_id` indexada
- [ ] `deleted_at` para exclusão lógica
- [ ] timestamps em `timestamptz` (UTC)
- [ ] teste com chave anônima: sem sessão, retorno vazio ou erro
- [ ] teste com dois usuários de espaços diferentes: nenhum vê o dado do outro
