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

### Etapa 3 — fechamento sem credenciais (2026-11-15)

- Repositório já versionado (`main`, 2 commits). Falta só o remoto: `git remote add origin <url>` e `git push -u origin main`.
- `scripts/db-local.sh` (`npm run verify:db`): sobe um Postgres 16 descartável, aplica o shim do Supabase (`supabase/tests/00_supabase_shim.sql`), todas as migrações e todas as suítes. Linha de base reproduzida: 7/7 PASS.
- `scripts/verify-supabase.mjs` (`npm run verify:supabase`): roda no Supabase **real** com a anon key. Cobre anon sem acesso, isolamento entre dois usuários, foco concorrente (30 chamadas paralelas), conclusão/histórico, conversão e busca. Requer "Confirm email" desativado no projeto de dev.
- **Contornos gratuitos adotados:** sem service role (testes só com anon + 2 usuários); preview Netlify via *Import from Git* na interface (sem token); sem domínio próprio (`*.netlify.app`).

### Etapa 4 — parte 1: banco e domínio (2026-11-15)

- Migração `20261115000200_mvp_personal.sql`: `completed_at` coerente por gatilho; histórico automático (created, completed, reopened, status/stage/state_changed, trashed, restored, archived, converted); `convert_idea_to_project` atômica sob RLS; `search_workspace` (sem acento, sem caixa, curingas literais, mínimo 2 caracteres).
- Suíte `supabase/tests/mvp_personal.sql`: 5/5 PASS no Postgres local.
- `modules/tasks/kanban.ts`: posição fracionária com rebalanceamento, movimento por teclado, janela de desfazer (5 s), normalização de busca, rótulos de histórico. 10/10 testes e `tsc --strict` OK (executados fora do vitest, ver limitação).
- **Limitação desta sessão:** sem `node_modules` e sem rede, não foi possível rodar `typecheck`, `lint`, `vitest` e `build` do app Next.js. Rode `npm ci && npm run check` localmente (Node 24+).
### Etapa 4 — parte 2: telas e ações (2026-11-15) — NÃO COMPILADO

- Novas rotas: `/tarefas/quadro` (Kanban), `/busca`, `/historico`, `/lixeira`; no backlog, "Converter em projeto", mudança de estado e exclusão com desfazer.
- Kanban acessível: movimento por botões com rótulo (teclado, leitor de tela, celular, alvos de 44 px), região `aria-live` anunciando a nova posição, desfazer de conclusão (toast de 6 s) e de exclusão (8 s). **Sem arrastar com o mouse** por decisão: os botões cobrem a exigência de teclado e o toque.
- Ações do servidor: `lib/actions/mvp.ts` (mover, reordenar coluna, converter, estado da ideia, lixeira/restaurar). Dados: `lib/data/{activity,search}.ts` e `listKanbanTasks`.
- E2E autenticado: `tests/e2e/authenticated.spec.ts` (fluxos A–D = onboarding, ideia, projeto, foco; mais quadro, busca, histórico, lixeira). Roda só com `E2E_EMAIL` e `E2E_PASSWORD`; caso contrário é ignorado.
- **Verificação feita:** checagem de tipos dos arquivos novos com pacotes externos simulados (sem erros além do ruído da simulação). **Não verificado:** `npm run check`, `build` e o E2E. Os seletores do fluxo D (foco) foram inferidos do código e podem precisar de ajuste.
- **Primeiro comando ao receber este zip:** `npm ci && npm run check && npm run build`. Se algo falhar, cole a saída aqui.
- **Fora desta etapa / pendente:** edição de campos de projetos, tarefas e cursos além do que já existia; arquivar pela interface; limpeza automática da lixeira (30 dias, Etapa 5); busca com índice (suficiente no volume do MVP pessoal).

### Etapa 5 — arquivos + PWA (2026-11-17) — banco verificado; aplicação NÃO COMPILADA

**Banco (verificado no Postgres local, 9 novos PASS em `supabase/tests/files.sql`):**
- Migração `20261115000300_files.sql`: cota de 1 GiB por espaço com trava por espaço (pendentes contam); `begin_file_upload` (25 MB, nomes e extensões bloqueadas, RLS do chamador); `finalize_file_upload` (pending → ready | quarantined, uma única vez, com evento); expurgo em duas fases `list_expired_files` / `delete_purged_files` (lixeira > 30 dias, pendentes > 24 h), só `service_role`; bucket privado `workspace-files` e políticas de Storage (leitura por espaço; inserção só em registro pendente do próprio usuário; sem update/delete para usuários).
- `scripts/db-local.sh` agora **falha de verdade** se qualquer suíte falhar (antes um `|| true` escondia erros); o shim ganhou Storage simulado e privilégios do `service_role`.

**Domínio (verificado, 16 testes + `tsc --strict`):** `modules/files/domain.ts` — lista de permissão de tipos, extensão × tipo, assinatura real (PNG, JPEG, GIF, WebP, PDF, ZIP/OOXML; texto por UTF-8), decisão de quarentena, cota, formatação. Um teste garante que a lista de extensões bloqueadas é idêntica à da migração.

**Aplicação (escrita, não compilada):**
- `POST /api/files/sign` (valida, reserva cota, devolve URL assinada de upload de 10 min), `POST /api/files/{id}/complete` (lê o objeto, confere tamanho e assinatura, calcula SHA-256, finaliza), `GET /api/files/{id}/url` (redireciona para URL de leitura de 5 min; só imagem/PDF abrem inline), `POST /api/cron/purge-files` (protegida por `CRON_SECRET`).
- Uploader com progresso real (XHR), cancelar, tentar de novo, vários arquivos, arrastar e soltar; ações de visualizar/baixar/excluir; lixeira passa a incluir arquivos; cota com alerta aos 80%.
- E2E (gated por credenciais): imagem válida, arquivo disfarçado, tipo inválido, > 25 MB, 20 MB.
- PWA: manifest, ícones, service worker e `/offline` já existiam; o SW ignora requisições de outras origens (URLs assinadas não são cacheadas). Checklist manual em `docs/04-pwa-checklist.md`.

**Ativar a limpeza diária (grátis):** defina `CRON_SECRET` (`openssl rand -hex 32`) e `SUPABASE_SERVICE_ROLE_KEY` **só** no ambiente do servidor (Netlify), e agende `POST https://SEU-SITE/api/cron/purge-files` com `Authorization: Bearer <CRON_SECRET>` uma vez por dia (ex.: cron-job.org, gratuito).

**Riscos/limites conhecidos:**
- O PUT do XHR replica o formato do `uploadToSignedUrl` do supabase-js (FormData com `cacheControl` e campo vazio). É a parte mais provável de precisar de ajuste no primeiro teste real; se falhar, trocar por `supabase.storage.from(...).uploadToSignedUrl` (sem barra de progresso).
- Restaurar um arquivo da lixeira não reconfere a cota.
- Objeto enviado cujo `complete` nunca chega fica pendente e é removido pela limpeza em 24 h.
- Varredura antimalware continua fora do escopo (Fase 3 do plano).


### Etapa 6 — colaboração (2026-11-18) — banco verificado; aplicação NÃO COMPILADA

**Banco (verificado no Postgres local: 41 PASS no total, 20 em `supabase/tests/collaboration.sql` + concorrência com pgbench):**
- Migração `20261117000400_collaboration.sql`: espaços de equipe/cliente (`create_workspace`), convites (token de 32 bytes, só o hash SHA-256 no banco, validade de 7 dias, uso único, e-mail opcional, máx. 20 pendentes), papéis (dono, admin, editor, colaborador, leitor; só o dono concede/gerencia admin), remoção/saída com proteção do último dono, atribuição de tarefa só a membros, comentários validados, notificações criadas só por gatilhos/RPCs e imutáveis exceto `read_at`.
- Ninguém vira membro sem convite aceito (política de INSERT em membros removida). Espaço pessoal não aceita convite.
- Aceite concorrente: 16 clientes simultâneos no mesmo convite → exatamente 1 sucesso.

**Domínio (verificado, 11 testes + `tsc --strict` com stubs):** `modules/collab/{domain,token}.ts`.

**Aplicação (escrita, não compilada):** seletor de espaço e sino de notificações no topo; `/espacos` (pessoas, papéis, convites, criar espaço, sair); `/convite/[token]` (público, redireciona ao login e volta); `/notificacoes`; comentários em tarefas e projetos; atribuição de responsável em `/tarefas/[id]`; títulos do quadro e das listas agora abrem a tarefa. O espaço ativo fica em cookie httpOnly validado contra as associações a cada requisição.

**Para verificar no Supabase real:** `npm run verify:supabase` agora cobre também a colaboração (3 contas, convite, aceite paralelo, isolamento, atribuição, comentário, notificação, remoção). Exige "Confirm email" desativado no projeto de DEV.

**Riscos/limites conhecidos:**
- A aplicação não foi compilada aqui: rodar `npm ci && npm run check && npm run build` (Node 24+).
- O link do convite é mostrado uma única vez ao dono (o banco não guarda o token); não há envio por e-mail — o dono copia e envia.
- Moderação: admin/dono só apagam comentários de outros (não editam).
- Sem preferências de notificação por usuário e sem e-mail/push.

### Etapa 7 — portfólio, segurança e operação (2026-11-20)
- **Verificado (Postgres local, 48 PASS):** portfólio (6 testes: publicar, escrita direta bloqueada, leitura pública curada, não-membro, rotação/revogação, lixeira, auditoria), invariantes de segurança, backup/restauração idêntica.
- **Escrito, não compilado:** `/p/[slug]/[token]` (público, noindex), gestão em `/portfolio` (publicar, trocar token, revogar), `robots.ts`, cabeçalhos. Domínio: 6 testes + `tsc` com stubs.
- **Não feito/limites:** CSP, rate limit próprio, axe/Lighthouse, backup do Storage, monitoramento real (ver `docs/05` e `docs/06`).
- Link do portfólio é mostrado uma vez (banco guarda só o hash); para ver de novo, troque o token.
