# Spike de compatibilidade — Netlify

- **Status:** aguardando credenciais e repositório remoto
- **Prazo alvo:** 1 dia de trabalho
- **Critério de saída:** preview publicado com login SSR, Server Action e proxy funcionando, ou decisão registrada de migrar para a Vercel

## Por que existe

A Netlify é a hospedagem escolhida, mas o ÓRBITA usa recursos do Next 16 que dependem do runtime da plataforma: proxy (antigo middleware), cookies SSR, Server Actions, streaming e o plugin oficial do Next. O spike valida esses pontos antes de o produto depender da plataforma.

## Pré-requisitos

- Repositório no GitHub com o código da Etapa 3.
- Conta na Netlify com acesso ao time.
- Projeto Supabase de desenvolvimento com a migração aplicada e as Redirect URLs configuradas.
- Token de acesso da Netlify (para CLI) ou permissão para conectar o repositório pelo painel.

## Passo a passo

1. **Conectar o repositório** em Netlify → Add new site → Import an existing project.
2. Confirmar que o `netlify.toml` foi detectado:
   - build: `npm run build`
   - publish: `.next`
   - plugin: `@netlify/plugin-nextjs`
   - Node: 24
3. **Configurar variáveis** em Site configuration → Environment variables, para o escopo *Deploy previews* e *Production*:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (a URL do preview/produção)
   - `SUPABASE_SERVICE_ROLE_KEY` (somente se alguma rota administrativa já existir; não é necessária para o login)
4. **Atualizar o Supabase** em Authentication → URL Configuration:
   - adicionar a URL do preview e a de produção em Redirect URLs;
   - confirmar `https://SEU-SITE.netlify.app/auth/confirm`, `/auth/callback` e `/redefinir-senha`.
5. **Disparar o deploy** e acompanhar o log de build.
6. **Executar o roteiro de aceite** abaixo no preview.

## Roteiro de aceite

| # | Cenário | Como verificar | Resultado esperado |
| --- | --- | --- | --- |
| 1 | Build limpo | log do deploy | build conclui sem erro de tipo, lint não bloqueia, rotas geradas |
| 2 | Página pública | abrir `/login` | HTML SSR, formulário visível, sem flash de conteúdo protegido |
| 3 | Proxy | abrir `/projetos` deslogado | redireciona para `/login` com `proximo` |
| 4 | Cadastro | criar conta no preview | e-mail chega com link para o domínio correto |
| 5 | Confirmação | abrir o link do e-mail | sessão criada, onboarding em `/bem-vindo` |
| 6 | Cookie SSR | recarregar a página | sessão persiste; cookie `httpOnly` presente |
| 7 | Server Action | concluir uma tarefa e desfazer | ação executa, UI atualiza, sem erro de CSRF/origem |
| 8 | Streaming | abrir a visão geral com dados | resposta progressiva, sem erro de runtime |
| 9 | PWA | abrir `/manifest.webmanifest` e DevTools → Application | manifest válido, ícones carregam, service worker registra em produção |
| 10 | Offline | ativar offline e navegar | `/offline` aparece; nenhum dado do workspace é servido do cache |
| 11 | Segurança | `curl -I` na home | headers `nosniff`, `Referrer-Policy`, `X-Frame-Options` |
| 12 | Desempenho | navegar entre 5 telas | sem cold start perceptível repetido; registrar tempos |

## Evidências a registrar

- URL do preview e hash do commit.
- Print ou texto do log de build.
- Tempos de resposta das telas principais (primeira visita e navegação).
- Resultado de cada linha da tabela acima.
- Qualquer limitação encontrada (imagem, cache, função, região, cold start).

## Critérios de decisão

**Manter Netlify** se:

- os 12 cenários passarem;
- o login SSR e as Server Actions funcionarem sem workaround;
- não houver bloqueio de plataforma para proxy, cookies ou streaming;
- o desempenho for aceitável para um alpha privado.

**Migrar para Vercel** se:

- o plugin não suportar Next 16 no momento do spike;
- Server Actions ou proxy exigirem configuração frágil;
- houver falha recorrente de cookies/SSR;
- o custo de contorno for maior que o de trocar de plataforma.

A migração para Vercel não muda o código de produto: o build continua `npm run build` e as variáveis são as mesmas. O `netlify.toml` pode permanecer por compatibilidade ou ser removido em um PR separado.

## Riscos conhecidos

- **Preview URLs dinâmicas:** cada deploy preview tem URL própria; o Supabase precisa aceitar os domínios usados. Avalie um domínio fixo de preview ou wildcard, se disponível.
- **Cold start:** funções serverless podem adicionar latência na primeira requisição. Meça antes de concluir.
- **Tamanho do corpo em Server Actions:** uploads grandes não passam por Server Action; o desenho prevê upload direto ao Storage (etapa de arquivos).
- **Cache de assets:** o service worker e o manifest precisam de headers corretos; já configurados em `next.config.ts`, mas confirme no preview.

## Resultado

Preencher ao concluir:

```
Data:
Preview:
Commit:
Decisão: ( ) manter Netlify  ( ) migrar para Vercel
Observações:
```
