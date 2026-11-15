# Pendências e próximos passos

- **Atualizado em:** 2026-11-15 (Etapas 1 e 2 de execução concluídas; ver seção 7)
- **Etapa atual:** 3 — Fundação (implementada, aceite pendente de validação externa)
- **Regra:** a etapa só é declarada concluída quando o critério do plano for comprovado, não quando o código estiver escrito.

## 1. O que já está pronto

| Área | Situação | Evidência |
| --- | --- | --- |
| Aplicação Next.js 16 + React 19 + TypeScript | pronto | `npm run build` |
| Design system e shell responsivo | pronto | `design/` portado para `app/globals.css` e `components/` |
| Autenticação (login, cadastro, confirmação, recuperação, logout) | código pronto | `app/(auth)`, `lib/auth`, `app/auth/*` |
| Migração inicial (22 tabelas, triggers, RPC de foco) | **escrita, não executada** | `supabase/migrations/20261114000100_init.sql` |
| RLS em todas as tabelas expostas | **escrita, não testada em runtime** | 22/22 `enable row level security` |
| Área interna com estados vazios orientados | pronto | 18 páginas em `app/` |
| PWA (manifest, service worker, offline) | pronto | `app/manifest.ts`, `public/sw.js`, `app/offline` |
| Testes unitários | 41 verdes | `npm run test` |
| Smoke tests de navegador | 14 verdes (desktop + mobile) | `npm run test:e2e` |
| CI | configurado | `.github/workflows/ci.yml` |
| Documentação e ADRs | pronto | `docs/`, `docs/adr/` |

## 2. Bloqueios para fechar a Etapa 3

### 2.1 Versionamento

- [x] Repositório git inicializado e primeiro commit (`main`).
- [ ] Remoto no GitHub criado e enviado (`git remote add origin … && git push -u origin main`).

> O zip `orbita-etapa-3-fundacao.zip` é um pacote de conferência, não substitui o versionamento.

### 2.2 Supabase de desenvolvimento

Credenciais necessárias (nunca comitar):

| Variável | Onde obter | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API | app e migração |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API | app (sujeita a RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API | apenas servidor/admin |
| `NEXT_PUBLIC_SITE_URL` | você define | links de e-mail e metadados |

Passos:

- [ ] Criar `.env.local` a partir de `.env.example`.
- [ ] Aplicar `supabase/migrations/20261114000100_init.sql` (SQL Editor ou `npx supabase db push`).
- [ ] Configurar Site URL e Redirect URLs: `/auth/confirm`, `/auth/callback`, `/redefinir-senha`.
- [ ] Colar os templates de `supabase/templates/` em Auth → Email Templates.

Validações obrigatórias depois da migração. Os itens marcados com **(local)** foram comprovados em um Postgres 16 local com o Supabase simulado (ver seção 7); **repita-os no Supabase real** com `supabase/tests/rls_and_focus.sql`:

- [x] **(local)** Migração executa sem erro: 22 tabelas, 22 com RLS, 63 policies, 19 triggers.
- [x] **(local)** Cadastro cria `profiles`, `user_preferences`, `workspaces` e `workspace_members` (trigger).
- [ ] Confirmação de e-mail abre `/bem-vindo` com sessão SSR.
- [ ] Onboarding grava nome/fuso e libera a área interna.
- [ ] Logout encerra a sessão; `/projetos` volta para `/login`.
- [ ] Recuperação de senha conclui em `/redefinir-senha`.
- [x] **(local)** Consulta com a role `anon` é negada nas 22 tabelas, nunca retorna dados.
- [x] **(local)** Dois usuários de espaços diferentes não se enxergam (select, update, delete, insert e auto-convite barrados).
- [x] **(local)** Trocas simultâneas de foco resultam em **uma** linha por `(workspace_id, kind, scope_key)` (1.200 trocas, 8 clientes, 0 falhas).
- [x] **(local)** Nenhuma tabela pública sem política além de `audit_logs` (decisão registrada na ADR 0004).

### 2.3 Deploy preview

- [ ] Repositório remoto conectado à Netlify.
- [ ] Variáveis de ambiente configuradas para *Deploy previews* e *Production*.
- [ ] URLs do preview adicionadas às Redirect URLs do Supabase.
- [ ] Roteiro dos 12 cenários de `docs/02-netlify-spike.md` executado e registrado.
- [ ] Decisão final: manter Netlify ou migrar para Vercel.

## 3. Dívida técnica conhecida (baixa prioridade)

- `notes_update` e `comments_update` permitem que o autor edite sem exigir papel `editor`; revisar junto da Etapa 6.
- `portfolio_entries` ainda não tem política pública para link não listado; entra na Etapa 7 com token e `noindex`.
- `workspaces.owner_id` usa `on delete restrict`: excluir usuário exige tratar o espaço antes. Não há exclusão de conta no MVP.
- E2E cobre apenas superfícies públicas; fluxos autenticados dependem do Supabase de teste (Etapa 4).
- Migração não é idempotente: rodar uma única vez por banco.

## 4. Depois do aceite — etapas do plano

| Etapa | Entrega | Critério de saída |
| --- | --- | --- |
| 4. MVP pessoal | CRUD de ideias, projetos, tarefas e cursos; Kanban acessível; busca; histórico; converter ideia em projeto; concluir com desfazer | Fluxos A–D verdes em E2E autenticado |
| 5. Arquivos + PWA | Upload direto assinado, MIME real, 25 MB/arquivo, 1 GB/espaço, preview, lixeira 30 dias, instalação | Fluxo F em aparelho real |
| 6. Colaboração | Convites com token, papéis, membros, comentários, atribuições, notificações internas | Fluxo E verde + teste de acesso cruzado |
| 7. Portfólio + lançamento | Link não listado revogável + `noindex`, revisão de segurança, axe, backup/restauração, monitoramento | Critérios de aceite do MVP |

## 5. Critérios de aceite do MVP ainda não comprovados

1. Sessão SSR ponta a ponta (cadastro → confirmação → login → logout).
2. Ideia convertida em projeto preservando notas e anexos.
3. Um único projeto foco por escopo, com teste de concorrência.
4. Um único curso foco, mesma prova.
5. Tarefa criada em ≤ 3 interações e concluída com desfazer em 5 s.
6. Kanban por teclado, menu e arrastar.
7. Upload de 20 MB no celular, com tipo inválido rejeitado no servidor.
8. Nenhum vazamento entre espaços (suíte de RLS verde).
9. Convite expirado/revogado/duplicado recusado.
10. Portfólio privado/sem token não retorna conteúdo e inclui `noindex`.
11. PWA instalável e shell offline.
12. Axe sem violações críticas nas 6 telas principais.
13. CI verde por completo.
14. Restauração de backup executada e documentada.

## 6. Fora do alcance técnico

- Verificação jurídica do nome **ÓRBITA**.
- Registro e disponibilidade de domínio.
- Contratação de e-mail transacional próprio (o alpha usa o e-mail do Supabase).

## 7. Registro de execução

### Etapa 1 — versionamento e verificação (2026-11-15)

- `git init` em `main` e commit inicial. Sem segredos: só `.env.example` (vazio).
- Typecheck, lint, 41 testes unitários e build de produção (18 rotas) verdes. Rodado em Node 22; o projeto exige Node 24+.
- Ajustes de mobile: `orientation: "any"` no manifest e `viewportFit: "cover"` no viewport, para o `env(safe-area-inset-bottom)` da barra inferior funcionar no iPhone.
- **Pendente:** criar o remoto no GitHub e fazer `git push -u origin main`.

### Etapa 2 — migração, RLS e foco em Postgres local (2026-11-15)

- Ambiente: Postgres 16 local, com `auth.users`, `auth.uid()` e as roles `anon`/`authenticated`/`service_role` **simulados**. Não é o Supabase real: Auth, Storage, PostgREST e e-mail não foram exercitados.
- Suíte: `supabase/tests/rls_and_focus.sql` (7 blocos, todos PASS, reexecutável) e `supabase/tests/focus_concurrency.pgbench`.
- **Correção na migração:** o slug do espaço pessoal usava só 10 caracteres do UUID, e uma colisão faria o cadastro falhar. Agora usa o UUID inteiro. A migração nunca havia sido executada em nenhum banco, então a alteração foi feita no próprio arquivo.
- Confirmado o comportamento já documentado: `owner_id` com `on delete restrict` exige apagar o espaço antes do usuário.
- **Pendente:** rodar a migração e a suíte no projeto Supabase de desenvolvimento.
