# ÓRBITA

Organize o que importa: **um projeto principal, as tarefas do dia, cursos e arquivos**. Sem jargão de metodologia, sem ruído e sem cobrança desnecessária.

Este repositório contém a fundação do produto (Etapa 3): aplicação Next.js, autenticação, estrutura de dados com RLS, área interna com estados vazios orientados e base instalável (PWA). Os fluxos completos de criação e edição entram nas etapas seguintes.

## Stack

| Camada | Escolha |
| --- | --- |
| Aplicação | Next.js 16 (App Router), React 19, TypeScript |
| Estilo | Tailwind CSS 4 + shadcn/ui + tokens do protótipo aprovado |
| Dados e auth | Supabase (Postgres, Auth, Storage, RLS) |
| Validação e formulários | Zod + React Hook Form + Server Actions |
| Dados no cliente | TanStack Query |
| Testes | Vitest + Playwright |
| Deploy | Netlify (com spike de compatibilidade; Vercel como alternativa) |

O protótipo visual aprovado está em [`design/`](./design) e é a fonte de verdade de aparência e interação. O plano de produto está em [`docs/00-plano-etapa-1.md`](./docs/00-plano-etapa-1.md).

## Rodar localmente

Pré-requisitos: Node.js 24+ e npm 11+.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abra <http://localhost:3000>. Sem credenciais do Supabase o app entra em **modo de configuração**: as telas explicam o que falta e nenhuma sessão falsa é criada.

### Variáveis de ambiente

```ini
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # somente servidor; necessária em rotas administrativas futuras
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- `NEXT_PUBLIC_*` chega ao navegador — nunca coloque segredos nelas.
- `SUPABASE_SERVICE_ROLE_KEY` ignora RLS. Só pode ser usada no servidor, em rotas administrativas, e nunca é necessária para o login.
- `NEXT_PUBLIC_SITE_URL` é usada em metadados e nos links de confirmação/recuperação. Em produção, use a URL pública final.

## Conectar o Supabase

O passo a passo completo está em [`docs/01-setup.md`](./docs/01-setup.md). Resumo:

1. Crie um projeto no Supabase e copie URL e chave anônima.
2. Aplique `supabase/migrations/20261114000100_init.sql` (SQL Editor ou Supabase CLI).
3. Configure **Site URL** e **Redirect URLs** para `/auth/confirm`, `/auth/callback` e `/redefinir-senha`.
4. Cole os templates de e-mail de `supabase/templates/` em Auth → Email Templates.
5. Rode a aplicação e crie sua conta. O primeiro usuário recebe perfil e espaço pessoal automaticamente por trigger.

> A migração ainda não foi executada neste ambiente. Antes de considerar o login validado, rode-a em um projeto Supabase de desenvolvimento e siga o checklist de verificação do guia.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build |
| `npm run typecheck` | Gera tipos de rota (`next typegen`) e checa TypeScript |
| `npm run lint` | ESLint |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Smoke tests de navegador (Playwright) |
| `npm run check` | Typecheck + lint + testes unitários |
| `npm run format` | Prettier |

Na primeira execução dos testes de navegador:

```bash
npx playwright install chromium
```

## Estrutura

```
app/
  (auth)/            login, criar conta, recuperar e redefinir senha
  (app)/             área autenticada: visão geral, foco, projetos, tarefas,
                     cursos, arquivos, backlog, espaços, portfólio, ajustes
  auth/              rotas de confirmação de e-mail e callback PKCE
  offline/           fallback do service worker
  manifest.ts        manifest da PWA
components/          UI, padrões visuais, formulários e shell
lib/
  actions/           Server Actions
  auth/              sessão e erros de autenticação
  data/              leitura tipada por domínio (server-only)
  supabase/          clientes browser/server e proxy de sessão
modules/             regras de domínio puras e testáveis
supabase/            migração inicial, configuração local e templates
tests/e2e/           smoke tests Playwright
docs/                plano, setup, ADRs e spike de deploy
design/              protótipo estático aprovado
```

## Decisões e limites

- **Um foco por escopo.** Projeto e curso principais são guardados em `focus_assignments`, com unicidade no banco e troca transacional via RPC. Trocar o foco nunca arquiva nem apaga o item anterior.
- **Nada some por acidente.** Exclusão é lógica (lixeira), arquivamento pede decisão sobre tarefas abertas e ações destrutivas exigem confirmação.
- **Progresso transparente.** O percentual é ponderado e sempre acompanhado de texto; status nunca dependem só de cor.
- **Prazos são datas de calendário.** “Atrasada”, “vence hoje” e “sem prazo” são calculados no fuso do perfil, sem deslocar o dia.
- **Segurança no banco.** Toda tabela exposta tem RLS; o cliente usa apenas a chave anônima; a chave de serviço fica restrita ao servidor.
- **PWA sem cache de dados.** Só o shell estático, ícones, manifest e `/offline` entram no cache. Dados do espaço nunca são guardados no dispositivo.
- **Acessibilidade WCAG 2.2 AA.** Navegação por teclado, foco visível, alvos de 44 px, textos alternativos e estados que não dependem apenas de cor.

## Deploy

O alvo é a Netlify, com um spike de compatibilidade documentado em [`docs/02-netlify-spike.md`](./docs/02-netlify-spike.md). O arquivo [`netlify.toml`](./netlify.toml) já declara build, publish e plugin do Next.js. Se o spike falhar nos critérios de aceite, a alternativa é a Vercel, sem mudança de código de produto.

## Documentação

- [`docs/00-plano-etapa-1.md`](./docs/00-plano-etapa-1.md) — plano aprovado de produto, arquitetura e fases
- [`docs/01-setup.md`](./docs/01-setup.md) — ambiente local e Supabase
- [`docs/02-netlify-spike.md`](./docs/02-netlify-spike.md) — checklist do spike de deploy
- [`docs/03-pendencias.md`](./docs/03-pendencias.md) — o que falta para o aceite e para o MVP
- [`docs/adr/`](./docs/adr) — decisões de arquitetura
- [`design/README.md`](./design/README.md) — sistema visual e inventário de telas

## Status

Fundação da Etapa 3 implementada e verificada localmente (build, 41 testes unitários e 14 smoke tests). O aceite ainda depende de três validações externas:

- executar a migração em um projeto Supabase e validar triggers, políticas e RPC de foco;
- validar o login ponta a ponta com e-mail real;
- concluir o spike na Netlify com um preview publicado.

O checklist completo está em [`docs/03-pendencias.md`](./docs/03-pendencias.md).
