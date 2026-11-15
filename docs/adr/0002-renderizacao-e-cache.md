# ADR 0002 — Renderização dinâmica e cache

- **Status:** aceito
- **Data:** 2026-11-14
- **Contexto da etapa:** Etapa 3 — Fundação

## Contexto

Quase todo o produto está atrás de autenticação e depende de três coisas por requisição: a sessão do usuário (cookies), o espaço de trabalho ativo e dados que mudam com frequência (tarefas do dia, foco, prazos). As telas públicas são apenas login, criação de conta, recuperação de senha, confirmação de e-mail, offline e o portfólio não listado.

O Next 16 oferece Cache Components e Partial Prefetching, mas o projeto foi criado com essas flags desligadas. Ao tentar usá-las, páginas de autenticação que leem `searchParams` e cookies bloquearam a prerenderização e o build falhou.

## Decisão

1. Manter **Cache Components e Partial Prefetching desligados** em `next.config.ts`.
2. Forçar renderização por requisição na área autenticada com `export const dynamic = "force-dynamic"` no layout de `app/(app)`.
3. Não fazer cache de dados de workspace em nenhuma camada: nem no servidor, nem no cliente, nem no service worker.
4. Usar `cache()` do React apenas para **deduplicar** leituras dentro da mesma requisição (contexto, perfil, espaço), nunca para compartilhar dados entre usuários ou requisições.
5. Usar TanStack Query no cliente somente para interações que se beneficiam de estado local e invalidação, com `staleTime` curto e sem persistência em disco.

## Consequências

**Positivas**

- Nenhuma possibilidade de vazar dados de um usuário para outro por cache compartilhado.
- Build funciona sem variáveis de ambiente, porque nenhuma página protegida é pré-renderizada com um redirecionamento estático.
- O comportamento é previsível: recarregar sempre traz o estado atual.

**Negativas**

- Toda navegação protegida faz trabalho no servidor; não há shell estático para essas rotas.
- A latência depende do banco e da região do deploy. O spike da Netlify precisa medir cold start e tempo de resposta.
- Se no futuro quisermos cache, ele terá de ser explicitamente por usuário e invalidado em cada mutação — uma decisão nova, não um ajuste silencioso.

## Quando revisitar

- Se a maior parte das rotas passar a ser pública ou anônima.
- Se métricas mostrarem custo de renderização por requisição relevante.
- Se o Next estabilizar um modelo de cache privado por usuário que simplifique o caso sem risco de vazamento.

Qualquer revisão deve manter a regra: **dado de workspace não é cacheado sem escopo de usuário e invalidação explícita**.
