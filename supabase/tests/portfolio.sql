-- Suíte da Etapa 7: portfólio não listado, token só em hash, revogação, vazamento.
\set ON_ERROR_STOP on
\set A '00000000-0000-0000-0000-0000000000e1'
\set B '00000000-0000-0000-0000-0000000000e2'

delete from public.workspaces where owner_id in (:'A', :'B');
delete from auth.users where id in (:'A', :'B');
insert into auth.users (id, email) values (:'A', 'e1@teste.dev'), (:'B', 'e2@teste.dev');
create temp table _ids as
select (select workspace_id from public.workspace_members where user_id = :'A') as ws_a;
grant select on _ids to authenticated, anon, service_role;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'A', true) as _s \gset
do $$
declare
  ws uuid := (select ws_a from _ids);
  p uuid; t uuid; e uuid; e2 uuid;
  h1 text := repeat('a', 64); h2 text := repeat('b', 64);
begin
  insert into public.projects (workspace_id, title, objective, risks, next_step, created_by)
  values (ws, 'Site da padaria', 'Vender online', 'RISCO SECRETO', 'PASSO SECRETO', auth.uid())
  returning id into p;
  insert into public.tasks (workspace_id, project_id, title, created_by)
  values (ws, p, 'TAREFA INTERNA', auth.uid()) returning id into t;
  update public.tasks set status = 'done' where id = t;

  -- hash inválido e cliente não escreve direto
  begin perform public.publish_portfolio(p, 'x', 'curto'); assert false, 'hash curto';
  exception when sqlstate '22023' then null; end;
  begin
    insert into public.portfolio_entries (workspace_id, project_id, slug, visibility, access_token_hash)
    values (ws, p, 'slug-direto-123', 'unlisted', h1);
    assert false, 'insert direto';
  exception when insufficient_privilege then null; end;

  e := public.publish_portfolio(p, 'Resumo público', h1);
  assert (select slug from public.portfolio_entries where id = e) ~ '^[a-z0-9-]{12,80}$', 'slug válido';
  begin perform public.publish_portfolio(p, null, h2); assert false, 'duplicado';
  exception when sqlstate '23505' then null; end;
  begin update public.portfolio_entries set visibility = 'public' where id = e; assert false, 'update direto';
  exception when insufficient_privilege then null; end;
  begin perform access_token_hash from public.portfolio_entries; assert false, 'ler hash';
  exception when insufficient_privilege then null; end;
  raise notice 'PASS: publicar (hash inválido, escrita direta bloqueada, duplicado, hash oculto)';
end $$;
commit;

reset role;
-- Leitura pública (anon): precisa de slug + hash corretos; só campos curados.
create temp table _pub as
select slug from public.portfolio_entries where project_id in (select id from public.projects where title = 'Site da padaria');
grant select on _pub to anon, authenticated;

begin;
set local role anon;
do $$
declare s text := (select slug from _pub); r record;
begin
  select * into r from public.get_public_portfolio(s, repeat('a', 64));
  assert r.title = 'Site da padaria' and r.summary = 'Resumo público', 'anon lê com token certo';
  assert r.tasks_total = 1 and r.tasks_done = 1, 'só contagens de tarefas';
  assert not exists (select 1 from public.get_public_portfolio(s, repeat('b', 64))), 'token errado';
  assert not exists (select 1 from public.get_public_portfolio('outro-slug-qualquer', repeat('a', 64))), 'slug errado';
  assert (select count(*) from jsonb_object_keys(to_jsonb(r))) = 8, 'só 8 campos expostos';
  assert not (to_jsonb(r)::text ~* 'SECRETO|INTERNA'), 'sem riscos, passo ou título de tarefa';
  begin perform 1 from public.portfolio_entries; assert false, 'anon lê tabela';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.projects; assert false, 'anon lê projetos';
  exception when insufficient_privilege then null; end;
  raise notice 'PASS: leitura pública (token certo/errado, slug errado, campos curados, anon sem tabelas)';
end $$;
commit;

-- Outro usuário (B) não publica nem revoga; editor revoga; rotação invalida o antigo.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'B', true) as _s \gset
do $$
declare e uuid := (select id from public.portfolio_entries where slug = (select slug from _pub));
begin
  begin perform public.revoke_portfolio(e); assert false, 'B revoga';
  exception when sqlstate '42501' then null; end;
  begin perform public.rotate_portfolio_token(e, repeat('c', 64)); assert false, 'B rotaciona';
  exception when sqlstate '42501' then null; end;
  begin perform public.publish_portfolio((select project_id from public.portfolio_entries where id = e), null, repeat('d', 64)); assert false, 'B publica';
  exception when sqlstate '42501' then null; end;
  raise notice 'PASS: não-membro não publica, rotaciona nem revoga';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'A', true) as _s \gset
do $$
declare s text := (select slug from _pub);
        e uuid := (select id from public.portfolio_entries where slug = (select slug from _pub));
begin
  perform public.rotate_portfolio_token(e, repeat('c', 64));
  assert not exists (select 1 from public.get_public_portfolio(s, repeat('a', 64))), 'token antigo morre';
  assert exists (select 1 from public.get_public_portfolio(s, repeat('c', 64))), 'token novo vale';
  perform public.revoke_portfolio(e);
  assert not exists (select 1 from public.get_public_portfolio(s, repeat('c', 64))), 'revogado não abre';
  begin perform public.revoke_portfolio(e); assert false, 'revogar duas vezes';
  exception when sqlstate '42501' then null; end;
  -- republicar após revogar gera link novo
  perform public.publish_portfolio((select project_id from public.portfolio_entries where id = e), null, repeat('e', 64));
  assert (select count(*) from public.portfolio_entries where revoked_at is null and visibility = 'unlisted') = 1, 'uma ativa';
  raise notice 'PASS: rotação invalida token antigo; revogação fecha o link; republicar gera novo';
end $$;
commit;

-- Projeto na lixeira some do público.
reset role;
update public.projects set deleted_at = now() where title = 'Site da padaria';
reset role;
do $$
declare s text := (select slug from public.portfolio_entries where revoked_at is null and visibility = 'unlisted');
begin
  set local role anon;
  assert not exists (select 1 from public.get_public_portfolio(s, repeat('e', 64))), 'projeto na lixeira não aparece';
  raise notice 'PASS: projeto na lixeira some do link público';
end $$;

-- Auditoria (só service role lê): publish x2, rotate, revoke; cliente não enxerga.
reset role;
do $$
begin
  assert (select count(*) from public.audit_logs where action = 'portfolio.publish') = 2, 'auditoria publish';
  assert (select count(*) from public.audit_logs where action = 'portfolio.rotate') = 1, 'auditoria rotate';
  assert (select count(*) from public.audit_logs where action = 'portfolio.revoke') = 1, 'auditoria revoke';
  raise notice 'PASS: auditoria de publicar, trocar token e revogar';
end $$;
