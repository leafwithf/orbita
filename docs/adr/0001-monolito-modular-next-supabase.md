# ADR 0001 — Monólito modular em Next.js com Supabase

- **Status:** aceito
- **Data:** 2026-11-14
- **Contexto da etapa:** Etapa 3 — Fundação

## Contexto

O ÓRBITA precisa entregar, em um alpha privado, autenticação, espaços de trabalho, projetos, tarefas, cursos, arquivos, colaboração e portfólio com uma equipe pequena. O produto é fortemente baseado em formulários, listas e leitura de dados por usuário, e a maior parte das telas exige sessão e dados atualizados.

## Decisão

Adotar um **monólito modular**:

- **Next.js 16 (App Router) + React 19 + TypeScript** para UI, rotas, Server Actions e o proxy de sessão.
- **Supabase** (Postgres, Auth, Storage e RLS) como backend gerenciado, sem servidor de aplicação separado.
- **Tailwind CSS 4 + shadcn/ui** com tokens portados do protótipo aprovado.
- **Zod + React Hook Form** para validação compartilhada e **TanStack Query** para estado de servidor no cliente quando necessário.
- Regras de negócio puras em `modules/`, leitura de dados em `lib/data/` (`server-only`) e mutações em `lib/actions/`.

O código é organizado por domínio, não por camada técnica. Um módulo pode ganhar mais arquivos, mas não vira um serviço separado nem um repositório à parte.

A hospedagem alvo é a **Netlify**, condicionada a um spike de compatibilidade de um dia com Next 16 (SSR, cookies, Server Actions, proxy e build). Se o spike falhar nos critérios de aceite, a Vercel é a alternativa, sem alteração de código de produto.

## Consequências

**Positivas**

- Um único deploy, um único modelo mental e menos infraestrutura para manter.
- RLS permite que a autorização viva perto dos dados, reduzindo a chance de uma rota esquecer uma checagem.
- Server Actions eliminam uma camada de API para os fluxos de formulário do MVP.
- O protótipo estático continua sendo a referência visual, sem acoplar o design ao framework.

**Negativas / riscos**

- O acoplamento ao Supabase exige cuidado com migrações e testes de políticas.
- Server Actions exigem validação e autorização explícitas no servidor; nunca confiar no cliente.
- Um monólito mal modularizado vira um monólito emaranhado. A separação `modules/` × `lib/data/` × `lib/actions/` é o contrato a preservar.
- A Netlify pode limitar recursos específicos do Next. O spike existe para descobrir isso antes do lançamento, não depois.

## Alternativas consideradas

- **Vercel desde o início:** menor atrito técnico, mas decisão de fornecedor sem o spike acordado.
- **Backend próprio (Node/Nest) + Postgres:** mais controle, custo operacional desproporcional para o MVP.
- **Microserviços:** excluídos explicitamente do escopo do MVP.
