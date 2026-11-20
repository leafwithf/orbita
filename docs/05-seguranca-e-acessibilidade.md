# Revisão de segurança e acessibilidade (Etapa 7)

Legenda: ✅ verificado aqui · 🔎 verificado só por leitura de código · ⏳ precisa rodar no seu ambiente/aparelho.

## Segurança
- ✅ **RLS em toda tabela pública** e **SECURITY DEFINER sempre com `search_path` fixo**, e **`anon` sem acesso direto a tabelas** — invariantes em `supabase/tests/zz_security_invariants.sql` (testado: uma tabela sem RLS faz a suíte falhar).
- ✅ **Isolamento entre espaços e papéis** (suítes `rls_and_focus`, `collaboration`), convites com hash e uso único, aceite concorrente.
- ✅ **Portfólio não listado**: token de 32 bytes, só o hash no banco, hash invisível ao cliente, escrita só por funções com papel de editor, leitura pública só de campos curados (sem riscos, próximo passo, tarefas, arquivos, pessoas), revogação e troca de token imediatas, auditoria.
- 🔎 Página `/p/...`: `noindex` (meta + `X-Robots-Tag`), `Referrer-Policy: no-referrer`, `Cache-Control: private, no-store`; `robots.txt` bloqueia tudo.
- 🔎 Sem `dangerouslySetInnerHTML`; links externos com `rel="noopener noreferrer"`; service role só na rota de cron (variável de servidor); nenhuma variável `NEXT_PUBLIC_` sensível.
- 🔎 Cabeçalhos globais: `nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy`.
- ⏳ **Content-Security-Policy não implementada** (exige testar com o build real; risco de quebrar scripts do Next). Recomendada como primeira melhoria pós-lançamento, em modo `Report-Only`.
- ⏳ Limite de tentativas (rate limit) no login/convite/portfólio: hoje depende do Supabase Auth; os tokens têm 256 bits, então adivinhar não é viável.
- ⏳ Rodar `npm audit` e habilitar Dependabot no GitHub.

## Acessibilidade
- 🔎 Alvos de toque ≥ 44 px nos controles novos; rótulos associados a campos; `aria-label` em botões só de ícone; barra de progresso com `role="progressbar"` e valores; mensagens de status com `role="status"`; confirmações destrutivas em duas etapas (`<details>`), sem arrastar com mouse (Kanban por botões).
- ⏳ **axe/Lighthouse não foram rodados** (o app não compila na nuvem). Antes do lançamento: `npm run build && npm start`, depois axe nas telas `/hoje`, `/tarefas/quadro`, `/espacos`, `/portfolio`, `/p/...`, e leitura com VoiceOver/TalkBack nos fluxos de convite e comentário.
- ⏳ Contraste: conferir os tons `--brand`/`--faint` em claro e escuro com o axe.
