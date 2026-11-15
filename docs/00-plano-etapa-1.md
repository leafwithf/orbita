# ÓRBITA — Etapa 1: Planejamento

**Versão:** 1.0 · **Data:** 14/11/2026
**Status:** aguardando aprovação. Nenhum código de aplicação foi criado ainda.

---

## 0. Como ler este documento

Este é o entregável da **Etapa 1 (Planejamento)** do prompt mestre. Ele apresenta arquitetura, modelo de dados, mapa de telas, escopo do MVP, riscos e as decisões que precisam de validação humana.

O que **não** está aqui: design final pixel-perfect (Etapa 2), código, migrações executadas e credenciais. Também não há nenhuma integração real configurada — nada de projeto Supabase, Netlify ou domínio criado até a aprovação.

Premissas assumidas (corrigíveis a qualquer momento):

- Interface e conteúdo em **pt-BR**; código, banco e nomes técnicos em inglês.
- Nome **ÓRBITA** / identificador técnico `orbita` como **nome de trabalho**. Disponibilidade de domínio e marca não foi verificada e é responsabilidade humana.
- Sem cobrança no MVP: **alpha privado gratuito**.

Decisões confirmadas pelo responsável do produto em 14/11/2026:

| # | Decisão | Escolha |
|---|---|---|
| 1 | Colaboração | **Convites e múltiplos membros já no MVP** |
| 2 | Hospedagem | **Netlify**, condicionada ao spike de compatibilidade |
| 3 | Escopo do foco | **Por workspace** |
| 4 | Portfólio | **Privado + link público não listado** |
| 5 | Limites | **25 MB por arquivo / 1 GB por workspace** |

Consequência direta da decisão 1: a Fase 6 (Colaboração) deixa de ser pós-MVP e passa a ser pré-requisito de lançamento. O MVP agora é composto pelas Etapas 3 a 7.

---

## 1. Resumo executivo

| Dimensão | Decisão proposta |
|---|---|
| Produto | PWA responsiva de gestão de ideias → projetos → entregas, com colaboração por workspace |
| Estratégia | Monólito modular, sem microserviços |
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + shadcn/ui |
| Backend | Supabase (Postgres, Auth, Storage) + rotas server-side no próprio Next.js |
| Autorização | RLS no banco **e** verificação server-side; nenhuma regra só na UI |
| Dados | `workspace_id` em toda entidade compartilhável; datas em `timestamptz` (UTC) |
| Foco único | Tabela `focus_assignments` com `unique (workspace_id, kind, scope_key)` + RPC transacional |
| Upload | URL assinada de curta duração, upload direto browser → storage, metadados só após validação |
| Hospedagem | Netlify (com spike de compatibilidade na Fase 1); Vercel como plano B |
| MVP | Pessoal completo + colaboração: dashboard, foco, ideias/backlog, projetos, tarefas, Kanban, cursos, arquivos, convites, papéis, comentários, portfólio com link não listado, PWA |
| Fora do MVP | Chat em tempo real, presença/edição simultânea, vídeo, editor colaborativo, app nativo, IA, billing, integrações |

Escopo do MVP em uma frase: **uma pessoa captura uma ideia, converte em projeto, define seu foco, executa tarefas em lista e Kanban, estuda um curso, anexa arquivos pelo celular, instala a PWA e convida alguém para um workspace — com dados isolados por workspace em todos os casos.**

---

## 2. Escopo do MVP

### 2.1 Entra no MVP

| Módulo | Entrega mínima |
|---|---|
| Autenticação | Cadastro, login, confirmação de e-mail, recuperação de senha, sessão SSR segura, perfil |
| Onboarding | 3 telas puláveis, escolha "pessoal", criação da primeira ideia/projeto, próximo passo sugerido |
| Dashboard | Foco atual + próximo passo, tarefas de hoje/atrasadas, prazos, projetos ativos, atalhos, atividade recente |
| Meu foco | Projeto principal + curso principal, fila de tarefas do dia, "concluir e ver próxima" |
| Ideias/Backlog | Captura rápida (título só), estados da ideia, avaliação, conversão em projeto preservando notas/anexos |
| Projetos | CRUD completo, 9 etapas do ciclo, status, prioridade, datas, responsável, tags, riscos/bloqueios, progresso, histórico |
| Visualizações | Cartões (padrão), lista, Kanban por status/etapa; agrupamento; visões favoritas |
| Tarefas | Criação rápida sem projeto, status, prazo, checklist interno, etiquetas, ações rápidas (concluir, adiar, prioridade, mover, duplicar, arquivar) |
| Cursos | CRUD, módulos/aulas, progresso, próxima aula, materiais, curso principal |
| Arquivos | Upload desktop + celular (câmera/galeria), progresso, cancelar, tentar de novo, preview seguro, anexo a projeto/tarefa/curso/ideia, lixeira |
| Colaboração | Workspaces pessoais e de equipe, convite por e-mail ou link seguro com validade, papéis owner/admin/editor/contribuidor/leitor, atribuição de tarefas, comentários simples (sem tempo real), notificações internas, histórico colaborativo |
| Portfólio | Rascunho privado de projeto concluído + link público **não listado** (token revogável, `noindex`); publicação indexável fica para depois |
| Busca | Busca global textual (Postgres FTS) respeitando permissões |
| Histórico | Eventos essenciais com autor, data e ação; filtro e paginação |
| Configurações | Perfil, preferências, notificações internas, exportação de dados, exclusão de conta |
| PWA | Manifest, service worker, instalável, offline básico de leitura (sem cache de dados sensíveis) |
| Qualidade | Acessibilidade AA, estados vazio/erro/carregando, testes unitários, E2E dos fluxos A–F, testes de RLS |

### 2.2 Fica para depois (explícito)

- Presença/edição simultânea, cursores, chat em tempo real, feed ao vivo.
- Menções com notificação, notificações push, digest por e-mail.
- Portfólio público indexável (SEO, página personalizada, domínio próprio).
- Upload multipart/resumível, varredura antimalware real, CDN pública.
- Linha do tempo/calendário, relatórios, modelos de projeto, automações.
- Billing, planos, cotas comerciais.
- App nativo, offline-first com escrita, i18n.

---

## 3. Arquitetura

### 3.1 Stack e versões (verificadas no registro npm em 14/11/2026)

| Camada | Escolha | Versão |
|---|---|---|
| Runtime | Node.js LTS | 24.12.0 |
| Framework | Next.js (App Router, Server Components) | 16.4.6 |
| UI | React | 19.x |
| Estilo | Tailwind CSS (config CSS-first) | 4.3.5 |
| Componentes | shadcn/ui (Radix) + tokens próprios | — |
| Formulários | React Hook Form + Zod | 7.x / 4.6.7 |
| Dados no cliente | TanStack Query | 5.107.1 |
| Backend | Supabase (Postgres 15+, Auth, Storage) | — |
| Cliente Supabase SSR | `@supabase/ssr` | 0.12.7 |
| Deploy frontend | Netlify + `@netlify/plugin-nextjs` | 5.16.7 |
| Testes | Vitest + Testing Library, Playwright, axe-core | — |

Todas as versões serão **fixadas** no `package.json` na Fase 1 (sem `latest`), com Renovate/Dependabot desativado para majors durante o MVP.

### 3.2 Forma da aplicação

Monólito modular em um único repositório:

```
Browser (PWA)
   │  RSC / Server Actions / route handlers
   ▼
Next.js na Netlify  ──►  Supabase Auth (JWT)
   │                        │
   │  service layer         ├── Postgres (RLS)
   └────────────────────────┴── Storage (buckets privados, URLs assinadas)
```

Fronteiras obrigatórias:

1. **`modules/<domínio>`** — regras de negócio puras + casos de uso. Não importa React, não importa `@supabase/*`.
2. **`lib/data/*`** — repositórios Supabase. Único lugar que conhece SQL/tabelas.
3. **`app/**`** — rotas, server actions, componentes de tela. Não faz query direta.
4. **`lib/domain`** — tipos e schemas Zod compartilhados entre cliente, servidor e testes.

Regra de ouro: **nenhum componente chama `supabase.from(...)`**. Isso permite trocar de fornecedor e testar regras sem banco.

### 3.3 Estrutura de pastas prevista

```
orbita/
├─ app/
│  ├─ (marketing)/            # landing, privacidade, termos
│  ├─ (auth)/                 # login, cadastro, recuperar-senha
│  ├─ (app)/                  # área autenticada (layout com sidebar/bottom nav)
│  │  ├─ page.tsx             # Visão geral
│  │  ├─ foco/
│  │  ├─ projetos/[id]/
│  │  ├─ tarefas/
│  │  ├─ backlog/
│  │  ├─ cursos/[id]/
│  │  ├─ arquivos/
│  │  ├─ portfolio/
│  │  └─ configuracoes/
│  ├─ api/                    # route handlers: upload sign/complete, export, webhooks
│  └─ p/[slug]/               # portfólio não listado (token + noindex)
├─ components/{ui,layout,patterns}/
├─ modules/{projects,tasks,ideas,courses,files,workspaces,portfolio,focus,activity}/
│  ├─ domain.ts               # tipos + schemas Zod + regras puras
│  ├─ service.ts              # casos de uso (recebe repositório)
│  └─ *.test.ts
├─ lib/{supabase,data,auth,permissions,utils}/
├─ db/migrations/             # SQL versionado, up/down
├─ db/tests/                  # testes de RLS
├─ e2e/                       # Playwright
└─ docs/adr/                  # decisões arquiteturais
```

### 3.4 Decisões e alternativas descartadas

| Decisão | Por quê | Descartado |
|---|---|---|
| Next.js App Router + Server Components | Menos JS no cliente, sessão segura via cookies httpOnly, PWA natural | SPA Vite + API separada (mais superfície de segurança, dois deploys) |
| Supabase como BaaS | Postgres relacional + Auth + Storage + RLS em um só lugar | Firebase (NoSQL prejudica relatórios e integridade referencial), backend próprio desde o dia 1 (custo/latência) |
| RLS + verificação server-side | Defesa em profundidade | Só RLS (regra de negócio complexa em policy é frágil); só servidor (uma rota nova mal escrita vaza tudo) |
| Monólito modular | Custo e complexidade baixos, refatorável | Microserviços, Kubernetes (sem evidência de necessidade) |
| `focus_assignments` em vez de flag `is_primary` | Unicidade garantida por constraint e serialização por lock | Flag booleana + checagem na aplicação (race condition entre duas abas) |
| Tailwind + shadcn/ui | Acessibilidade Radix, controle total do design, sem lock-in de biblioteca pesada | MUI/Chakra (identidade engessada, bundle maior) |

### 3.5 Hospedagem na Netlify — risco e spike obrigatório

O adaptador `@netlify/plugin-nextjs` 5.x roda Next.js via OpenNext. Recursos com suporte historicamente irregular: middleware em edge runtime, ISR com `revalidateTag`, streaming de Server Actions longas e cache de fetch.

**Spike de 1 dia, antes de qualquer feature:**

1. `create-next-app` + plugin em um branch descartável.
2. Validar: login SSR com cookie, Server Action com upload, streaming de página grande, middleware protegendo `/app`, rebuild incremental.
3. Medir cold start e latência de SSR na região mais próxima do Brasil.

Se algum item crítico falhar → Vercel, sem drama: o código é o mesmo, muda apenas o adaptador. A decisão não afeta a arquitetura.

---

## 4. Modelo de dados

### 4.1 Entidades

Todas com `id uuid`, `created_at`, `updated_at`, `created_by`, e `workspace_id` quando compartilhável. Exclusão lógica (`deleted_at`) em conteúdo do usuário; `deleted_at` + `purge_after` para lixeira.

| Entidade | Campos-chave |
|---|---|
| `profiles` | `id` (= auth.users), `full_name`, `avatar_url`, `timezone`, `locale`, `onboarding_done_at` |
| `workspaces` | `name`, `slug`, `kind` (personal/team/client), `focus_scope` (`workspace`\|`user`), `settings jsonb`, `owner_id` |
| `workspace_members` | `workspace_id`, `user_id`, `role`, `status`; `unique(workspace_id, user_id)` |
| `invitations` | `workspace_id`, `email?`, `role`, `token_hash`, `expires_at`, `accepted_at`, `revoked_at`, `invited_by`; token de uso único |
| `projects` | `title`, `objective`, `description`, `stage` (9 etapas), `status`, `priority`, `start_date`, `due_date`, `owner_id`, `progress_mode`, `risks`, `next_step`, `cover_url`, `archived_at` |
| `tasks` | `title`, `description`, `project_id?`, `assignee_id`, `due_date`, `priority`, `status`, `weight` (default 1), `estimate_min`, `spent_min`, `completed_at`, `parent_task_id?` |
| `task_checklists` | `task_id`, `label`, `done`, `position` |
| `ideas` | `title`, `body`, `state` (nova/em avaliação/validada/não priorizada/convertida), `potential`, `converted_project_id` |
| `courses` | `title`, `platform`, `url`, `objective`, `status`, `progress`, `next_lesson`, `due_date` |
| `course_modules` | `course_id`, `title`, `position`, `done_at`, `materials jsonb` |
| `notes` | `entity_type`, `entity_id`, `body` (texto simples no MVP), `pinned` |
| `folders` | `parent_id` (profundidade máx. 3), `name`, `context` |
| `files_metadata` | `storage_path`, `file_name`, `mime`, `size_bytes`, `checksum`, `status` (pending/ready/quarantined/deleted), `entity_type`, `entity_id`, `scan_status` |
| `comments` | `entity_type`, `entity_id`, `body`, `author_id`, `edited_at` |
| `activity_events` | `workspace_id`, `actor_id`, `verb`, `entity_type`, `entity_id`, `metadata jsonb` (sem conteúdo sensível), `created_at` |
| `tags` / `entity_tags` | N:N com `unique(tag_id, entity_type, entity_id)` |
| `notifications` | `user_id`, `type`, `payload`, `read_at` |
| `portfolio_entries` | `project_id`, `slug`, `summary`, `visibility` (private/unlisted/public), `access_token_hash`, `published_at`, `revoked_at` |
| `user_preferences` | `user_id`, `theme`, `start_of_week`, `notification_prefs jsonb` |
| `focus_assignments` | ver 4.2 |
| `audit_logs` | `actor_id`, `action`, `target`, `ip_hash`, `user_agent`, `created_at` (somente eventos sensíveis) |

Índices obrigatórios: `(workspace_id, status)`, `(workspace_id, due_date)`, `(assignee_id, status)`, `(project_id, status)`, `(entity_type, entity_id)`, GIN em `search_vector`.

### 4.2 Regra de foco único (o ponto mais delicado)

Flag booleana `is_primary` **não** resolve: duas abas salvam ao mesmo tempo e ambas passam na validação.

```sql
create table focus_assignments (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  kind          text not null check (kind in ('project','course')),
  scope_key     text not null,               -- 'workspace' ou id do usuário
  target_id     uuid not null,
  set_by        uuid not null references profiles(id),
  set_at        timestamptz not null default now(),
  constraint focus_unique unique (workspace_id, kind, scope_key)
);
```

- **Constraint** garante no máximo um foco por (workspace, tipo, escopo).
- **`scope_key`** é derivado de `workspaces.focus_scope`: `'workspace'` ou `auth.uid()`. Um trigger valida a coerência — não é possível gravar escopo por usuário em workspace configurado por workspace.
- **RPC `set_primary_focus(workspace, kind, target)`** em `plpgsql`: `SELECT ... FOR UPDATE` na linha do workspace (serializa concorrentes), valida permissão e pertencimento do alvo, faz `UPDATE ... ON CONFLICT`, grava `activity_event`, retorna estado anterior. Duas abas: a segunda recebe conflito tratado e a UI mostra "o foco mudou para X, deseja trocar mesmo assim?".
- **Nada é apagado ou arquivado** ao trocar o foco. O item anterior volta ao estado normal e o evento fica no histórico.
- Troca de foco na UI sempre pede confirmação explícita, exibindo o foco atual e o novo.

Curso principal usa exatamente a mesma tabela com `kind='course'`.

### 4.3 Progresso

- Padrão transparente: `Σ weight(tarefas concluídas) / Σ weight(tarefas ativas)`, `weight` default `1`.
- Mostrado como texto: **"3 de 8 tarefas (38%)"** — nunca só um anel colorido.
- Projeto sem tarefas: mostra o progresso por etapa (`etapa 4 de 9`), não 0%.
- Tarefa concluída não conta após arquivada; subtarefas não contam em dobro (só folhas).

### 4.4 Datas e fuso

- Banco: `timestamptz`, sempre UTC. Nunca `timestamp` sem fuso.
- Prazo de tarefa é **data**, não instante (`date`) → evita "venceu às 21h de ontem" em fusos diferentes. Lembretes são `timestamptz`.
- Exibição no fuso de `profiles.timezone` (default `America/Sao_Paulo`).
- Rótulos distintos: **Atrasada**, **Vence hoje**, **Sem prazo**.

### 4.5 Papéis e permissões

| Ação | Owner | Admin | Editor | Colaborador | Leitor |
|---|---|---|---|---|---|
| Configurações e cotas do workspace | ✅ | ✅ | — | — | — |
| Gerenciar membros/convites | ✅ | ✅ (exceto owner) | — | — | — |
| Criar/editar/excluir projetos, cursos, arquivos | ✅ | ✅ | ✅ | — | — |
| Editar/ mover tarefas atribuídas a si | ✅ | ✅ | ✅ | ✅ | — |
| Comentar | ✅ | ✅ | ✅ | ✅ | — |
| Ver conteúdo compartilhado | ✅ | ✅ | ✅ | ✅ | ✅ |
| Publicar portfólio | ✅ | ✅ | ✅ | — | — |
| Excluir workspace | ✅ | — | — | — | — |

Implementação: funções `SECURITY DEFINER` (`is_member(ws)`, `has_role(ws, min_role)`) usadas nas policies, para evitar recursão de RLS em `workspace_members` e manter as policies legíveis e indexáveis.

---

## 5. Segurança, upload e privacidade

### 5.1 Fluxo de upload (desktop e celular)

1. Cliente pede `POST /api/files/sign` com nome, tamanho, tipo e vínculo.
2. Servidor valida sessão + papel + cota + limites → cria `files_metadata` com `status='pending'` e devolve URL assinada de upload (TTL 10 min, caminho `ws/{workspace}/{fileId}`).
3. Browser envia **direto ao storage** com progresso real; pode cancelar (abort) e tentar de novo.
4. `POST /api/files/{id}/complete`: servidor faz `HEAD` no objeto, confere tamanho e **assinatura real do arquivo** (magic bytes para imagens/PDF/ZIP), calcula checksum e marca `ready`. Divergência → `quarantined` + evento.
5. Preview/download por URL assinada de leitura (TTL 5 min). Nunca URL pública.
6. Job de limpeza remove `pending` com mais de 24h. Varredura antimalware entra como job assíncrono na Fase 3 (com provider definido só então).

Limites iniciais: **25 MB por arquivo, 1 GB por workspace**, tipos permitidos configuráveis (bloqueio por padrão: executáveis, scripts, `.html` servido inline). `Content-Disposition: attachment` para tipos não visuais.

### 5.2 Convites e link de portfólio não listado

**Convite:** o servidor gera um token aleatório de 32 bytes, guarda **apenas o hash** (`token_hash`), define validade padrão de 7 dias e uso único. O link (`/convite/{token}`) mostra o workspace e o papel antes de aceitar. Aceitar exige usuário autenticado com e-mail correspondente quando o convite foi nominal; convites por link podem ser aceitos por qualquer conta, mas continuam de uso único e revogáveis. Todas as operações passam por RPC `accept_invitation()` com lock na linha, impedindo aceite duplo concorrente.

Sem provedor de e-mail configurado no início, o fluxo funciona por **link copiável** — a UI deixa claro que o envio automático de e-mail entra depois. Nenhum convite cria acesso antes do aceite.

**Portfólio não listado:** `visibility='unlisted'` significa URL com slug aleatório de alta entropia + token exigido (`/p/{slug}?k={token}`), `noindex, nofollow`, sem listagem, sem sitemap, revogável a qualquer momento. Não é "público": quem tem o link vê. Publicação indexável exige ação separada e explícita, fora do MVP.

### 5.3 Controles mínimos

- Sessão em cookies `httpOnly` + `Secure` + `SameSite=Lax` (`@supabase/ssr`); refresh em middleware.
- CSRF: Server Actions do Next já são protegidas por origem; rotas `POST` com verificação de `Origin`.
- Rate limit por IP+usuário em login, cadastro, recuperação, convite e `files/sign` (contador em Postgres/Upstash).
- Validação Zod em toda entrada, no servidor; a mesma _schema_ no cliente só para UX.
- Headers: CSP restritiva, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Segredos só em env do servidor; `service_role` **nunca** em código que chega ao browser.
- Logs estruturados sem token, senha, e-mail completo ou conteúdo de nota.
- Backups: PITR do Supabase (conforme plano) + export lógico semanal; teste de restauração documentado na Fase 1.

### 5.4 LGPD (MVP)

Página de privacidade, base legal por finalidade, exportação dos próprios dados (JSON + anexos por link), solicitação de exclusão com janela de 30 dias, retenção de lixeira de 30 dias, registro de aceite de termos, contato de encarregado. Sem cookies de marketing → sem banner de cookies no MVP.

---

## 6. Mapa de telas e fluxos

### 6.1 Telas

| # | Rota | Tela | Notas |
|---|---|---|---|
| 1 | `/` | Visão geral | Foco + próximo passo no topo; nada decorativo |
| 2 | `/foco` | Meu foco | Fila do dia, concluir → próxima |
| 3 | `/projetos` | Projetos | Cartões/lista/Kanban, agrupar, visões salvas |
| 4 | `/projetos/[id]` | Projeto | Abas: Visão, Tarefas, Arquivos, Notas, Histórico |
| 5 | `/tarefas` | Tarefas | Filtros: Hoje, Atrasadas, Próximas, Concluídas, Sem prazo |
| 6 | `/backlog` | Ideias e backlog | Captura rápida sempre visível |
| 7 | `/cursos` | Cursos | Um principal destacado |
| 8 | `/cursos/[id]` | Curso | Módulos, próxima aula, materiais |
| 9 | `/arquivos` | Arquivos | Pastas, tags, busca, upload |
| 10 | `/portfolio` | Portfólio | Rascunhos privados no MVP |
| 11 | `/espacos` / `/espacos/[id]` | Espaços | Membros, papéis, convites, link copiável |
| 12 | `/configuracoes` | Configurações | Perfil, aparência, notificações, dados, privacidade |
| 13 | `/bem-vindo` | Onboarding | 3 passos, pulável |
| 14 | `/login`, `/criar-conta`, `/recuperar` | Auth | — |
| 15 | `/convite/[token]` | Aceitar convite | Mostra workspace e papel antes de aceitar |
| 16 | `/p/[slug]` | Portfólio não listado | Token obrigatório, `noindex`, revogável |

### 6.2 Navegação

- **Desktop:** sidebar fixa com os 10 itens + botão primário "Criar" (projeto/tarefa/ideia/arquivo).
- **Mobile:** bottom nav com **Início · Foco · Projetos · Tarefas · Mais** + FAB de captura rápida. Kanban no mobile vira lista agrupada com seletor de coluna (arrastar é opcional, sempre há alternativa por menu "Mover para…").

### 6.3 Fluxos A–F

Todos os seis fluxos do documento serão cobertos por E2E. O detalhe de cada um fica no protótipo (Etapa 2), mas o comportamento já está fixado: onboarding pulável, ideia com título único obrigatório, projeto com "próximo passo" sempre preenchido ou sugerido, foco com confirmação, convite em duas etapas, upload com progresso e retomada manual.

---

## 7. Design system (base para a Etapa 2)

| Token | Valor |
|---|---|
| `--night` | `#14213D` |
| `--brand` | `#3478F6` |
| `--success` | `#35B8A0` |
| `--warning` | `#F2B84B` |
| `--danger` | `#D9493F` (derivado, para contraste AA) |
| `--bg` / `--surface` | `#F6F8FC` / `#FFFFFF` |
| `--text` / `--text-muted` | `#182230` / `#657184` |
| Dark `bg`/`surface`/`text` | `#101827` / `#182235` / `#E8EDF5` |
| Tipografia | Inter (variável), base 16px, escala 12/14/16/20/24/32 |
| Espaçamento | escala 4px (4, 8, 12, 16, 24, 32, 48) |
| Raio | 8 (input), 12 (card), 16 (modal), 999 (pill) |
| Alvo de toque | mínimo 44×44px |
| Foco visível | anel 2px `--brand` + offset 2px, nunca `outline: none` |

Status nunca só por cor: sempre **ícone + rótulo** (`● Atrasada`, `▲ Urgente`, `✓ Concluída`) com padrões distintos.

---

## 8. Acessibilidade (WCAG 2.2 AA como meta)

Checklist aplicado por componente: navegação só por teclado, ordem de foco lógica, `aria-live` em conclusão de tarefa e upload, labels reais (não placeholder), contraste ≥ 4.5:1, respeito a `prefers-reduced-motion`, sem armadilha de foco em modal, mensagens de erro associadas ao campo. Teste automatizado com `axe-core` no Playwright + uma rodada manual com leitor de tela (NVDA).

---

## 9. Estratégia de testes

| Nível | Ferramenta | Cobertura mínima |
|---|---|---|
| Unitário | Vitest | progresso, foco, conversão ideia→projeto, permissões, prazos |
| Integração | Vitest + Supabase local | serviços, constraints, RPC `set_primary_focus` |
| RLS | SQL/pgTAP no Supabase local | matriz de papéis × workspace, incluindo tentativa de acesso cruzado |
| Convites | Integração | token expirado, revogado, aceite duplo concorrente, e-mail divergente |
| Portfólio | Integração + E2E | link sem token, token revogado e `noindex` no cabeçalho |
| E2E | Playwright | fluxos A–F, upload, PWA install, mobile viewport |
| A11y | axe-core | páginas principais sem violações críticas |
| Concorrência | teste com duas conexões | dois `set_primary_focus` simultâneos → um vence |
| Carga (fase posterior) | k6 | listas e dashboard com 10k tarefas |

CI em cada PR: typecheck, lint, unit, integração, build. RLS e E2E no merge para `main`.

---

## 10. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Adaptador Next.js 16 na Netlify instável | Alto | Spike de 1 dia antes da Fase 1; Vercel como plano B sem retrabalho |
| Complexidade de colaboração atrasar o MVP | Alto | Foco em convite + papéis + comentários simples; realtime, menções e push ficam fora; modelo/RLS feitos antes das telas |
| Envio de e-mail transacional (convite) | Médio | Link copiável desde o início; provedor de e-mail entra como melhoria incremental, sem bloquear o fluxo |
| RLS lenta ou com recursão | Médio | Funções `security definer` + índices; `EXPLAIN ANALYZE` nas policies |
| PWA servindo dado antigo ou sensível do cache | Médio/Alto | Cache só de estáticos e shell; dados sempre network-first com revalidação; logout limpa caches |
| Escopo inflar (chat, IA, relatórios) | Alto | Lista explícita de "fora" e gate de aprovação por fase |
| Custo de storage/egress | Médio | Cotas desde o dia 1, URLs curtas, sem CDN pública no MVP |
| Perda de dados | Alto | Lixeira 30 dias, backups diários, teste de restauração na Fase 1 |
| Ambiguidade de marca/domínio | Médio | Nome de trabalho; validação jurídica é humana e paralela |

---

## 11. Execução por etapas (com checkpoints)

| Etapa | Entrega | Checkpoint |
|---|---|---|
| **1. Planejamento** | Este documento | **Aprovação + respostas da seção 13** |
| **2. Design** | Design system, wireframes de dashboard/foco/projeto/tarefa/backlog/Kanban/upload, protótipo clicável | Aprovação visual |
| **3. Fundação** | Repo, Next+TS+Tailwind+shadcn, Supabase dev, migrações iniciais + RLS, auth, perfil, CI, deploy preview, ADRs | App base publicado e login funcionando |
| **4. MVP pessoal** | Dashboard, foco, ideias, projetos, tarefas, Kanban, cursos, busca, histórico | Fluxos A–D verdes em E2E |
| **5. Arquivos + PWA** | Upload assinado, preview, lixeira, manifest, SW, instalação | Fluxo F em aparelho real |
| **6. Colaboração** | Convites, papéis, membros, comentários, atribuições, notificações internas, testes de isolamento | Fluxo E verde; teste de acesso cruzado falhando como deve |
| **7. Portfólio + lançamento** | Portfólio privado/não listado, revisão de segurança, acessibilidade, backup, monitoramento, docs | Critérios de aceite do MVP atendidos |

O MVP só é considerado concluído ao final da Etapa 7. As Etapas 6 e 7 deixaram de ser pós-lançamento por decisão de produto.

Cada etapa termina com o relatório de 6 itens (implementado, arquivos, como rodar, testes, riscos, próximo passo) e **para** aguardando aprovação.

---

## 12. Critérios de aceite mensuráveis

1. Cadastro → confirmação de e-mail → login → logout funcionam com sessão SSR segura.
2. Ideia criada com apenas título e convertida em projeto preservando notas e anexos.
3. Existe **no máximo um** projeto foco por escopo configurado — comprovado por teste de concorrência com duas sessões.
4. Existe **no máximo um** curso foco, mesma prova.
5. Tarefa criada em ≤ 3 interações a partir de qualquer tela; concluída com desfazer em 5s.
6. Kanban move cartão por teclado e por menu, além de arrastar.
7. Upload de 20 MB pelo celular conclui, cancela e repete; tipo inválido é rejeitado no servidor.
8. Nenhuma rota ou policy permite ler dados de outro workspace (suíte de RLS verde).
9. Convite expirado, revogado ou já aceito é recusado; aceite duplo concorrente cria **um** membro.
10. Link de portfólio sem token, com token revogado ou com `visibility=private` não retorna conteúdo; resposta inclui `noindex`.
11. PWA instalável (Lighthouse PWA installable) e shell abre offline.
12. Axe sem violações críticas nas 6 telas principais; navegação completa por teclado.
13. Build, typecheck, lint, unit, integração e E2E verdes em CI.
14. Restauração de backup executada ao menos uma vez e documentada.

---

## 13. Decisões confirmadas

| # | Decisão | Escolha | Efeito no plano |
|---|---|---|---|
| 1 | Colaboração no MVP | **Convites já no MVP** | Etapa 6 entra no escopo de lançamento; +convite, papéis, comentários simples, notificações internas |
| 2 | Hospedagem | **Netlify com spike** | Spike de 1 dia na Etapa 3; Vercel se falhar |
| 3 | Escopo do foco | **Por workspace** | `scope_key='workspace'`; constraint e RPC inalterados |
| 4 | Portfólio | **Privado + link não listado** | Token + `noindex` + revogação no MVP; indexável depois |
| 5 | Limites | **25 MB / 1 GB** | Cotas por workspace validadas no servidor desde a Etapa 5 |

Pendências humanas fora do meu alcance: verificação jurídica do nome **ÓRBITA** e disponibilidade de domínio.

## 14. Próximo passo

Aprovado o plano revisado, inicio a **Etapa 2 — Design**: tokens finais, biblioteca de componentes (botão, campo, cartão, chip de status, modal, menu, empty state, uploader), e wireframes de alta fidelidade para **Visão geral, Meu foco, Projeto (cartões + Kanban), Tarefas, Backlog, Espaços/convite e fluxo de upload** — desktop e mobile.

Nenhum código de aplicação antes da aprovação visual da Etapa 2.
