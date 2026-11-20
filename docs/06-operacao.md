# Operação: backup, restauração e monitoramento

## Backup e restauração
**O que foi testado aqui:** `scripts/db-local.sh` faz `pg_dump -Fc` do banco já migrado e testado, restaura em um banco novo com `pg_restore` e compara contagem de linhas por tabela e nº de políticas, funções e gatilhos (PASS: idêntico).

**O que NÃO foi testado:** o backup do Supabase em si e o Storage (arquivos). Para o projeto real:
1. Plano Free do Supabase **não tem backup automático diário com restauração** — faça backup manual semanal:
   `pg_dump "$DATABASE_URL" -Fc -f orbita-$(date +%F).dump` (string de conexão em Project Settings → Database; guarde o arquivo fora do repositório e do zip).
2. Restauração de teste (mensal): crie um projeto Supabase vazio de teste, aplique `supabase/migrations/*.sql` e rode `pg_restore --no-owner --data-only` do dump; depois `npm run verify:supabase` apontando para ele.
3. Arquivos (bucket `workspace-files`): o `pg_dump` não os inclui. Exporte com a CLI do Supabase (`supabase storage cp -r`) ou aceite o risco enquanto o volume for pequeno.
4. Meta sugerida: perder no máximo 7 dias de dados (RPO) e restaurar em até 1 dia (RTO). Ajuste se o produto passar a ter usuários reais.

## Monitoramento (mínimo viável, sem custo)
- **Disponibilidade:** monitor gratuito (UptimeRobot ou similar) em `/login` a cada 5 min.
- **Erros do app:** logs de funções do Netlify; `console.error` nas actions já registra falhas sem dados pessoais. Sentry é opcional (exige DSN; não incluído).
- **Banco:** painel do Supabase (uso de disco, conexões); `audit_logs` guarda publicações/revogações do portfólio.
- **Rotinas:** `/api/cron/purge-files` precisa de agendador externo (Netlify Scheduled Function ou cron do GitHub Actions) chamando com `Authorization: Bearer $CRON_SECRET`; sem isso, arquivos na lixeira não são limpos.
- **Segredos:** `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` só como variáveis do Netlify (marcadas como secretas). Se vazarem, gire no painel e reimplante.

## Checklist de lançamento
- [ ] `npm ci && npm run check && npm run build` verde (Node 24+)
- [ ] `npm run verify:supabase` verde em projeto de DEV
- [ ] Preview no Netlify; "Confirm email" decidido para produção (ligar em produção e configurar SMTP)
- [ ] Checklist de PWA em aparelho (`docs/04-pwa-checklist.md`)
- [ ] axe nas telas principais (`docs/05-seguranca-e-acessibilidade.md`)
- [ ] Agendador do cron de arquivos ativo
- [ ] Backup manual feito e restauração de teste executada
- [ ] Verificação jurídica do nome ÓRBITA e do domínio (fora do alcance técnico)
