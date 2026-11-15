-- Suíte da Etapa 4: histórico, completed_at, conversão de ideia e busca.
-- Rodar DEPOIS das migrações 0001 e 0002, em banco de dev/teste.
\set ON_ERROR_STOP on
\set A '00000000-0000-0000-0000-0000000000c1'
\set B '00000000-0000-0000-0000-0000000000c2'

delete from public.workspaces where owner_id in (:'A', :'B');
delete from auth.users where id in (:'A', :'B');
insert into auth.users (id, email) values (:'A', 'c1@teste.dev'), (:'B', 'c2@teste.dev');

create temp table _ids as
select (select workspace_id from public.workspace_members where user_id = :'A') as ws_a,
       (select workspace_id from public.workspace_members where user_id = :'B') as ws_b;
grant select on _ids to authenticated;

-- 1. completed_at e histórico ------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'A', true) as _s \gset
insert into public.projects (workspace_id, title, created_by)
  select ws_a, 'Lançar site', :'A' from _ids;
insert into public.tasks (workspace_id, project_id, title, created_by, assignee_id)
  select ws_a, (select id from public.projects limit 1), 'Escrever copy', :'A', :'A' from _ids;
do $$
declare t public.tasks; n int;
begin
  select * into t from public.tasks limit 1;
  assert t.completed_at is null, 'tarefa nova não tem completed_at';
  update public.tasks set status = 'in_progress' where id = t.id;
  update public.tasks set position = 5 where id = t.id;      -- não gera evento
  update public.tasks set status = 'done' where id = t.id;
  select * into t from public.tasks where id = t.id;
  assert t.completed_at is not null, 'done define completed_at';
  update public.tasks set status = 'todo' where id = t.id;   -- desfazer
  select * into t from public.tasks where id = t.id;
  assert t.completed_at is null, 'reabrir limpa completed_at';
  select count(*) into n from public.activity_events where entity_type = 'task';
  assert n = 4, format('esperava 4 eventos de tarefa (created, status_changed, completed, reopened), vieram %s', n);
  assert exists (select 1 from public.activity_events where verb = 'completed' and metadata->>'to' = 'done'), 'evento completed';
  assert exists (select 1 from public.activity_events where verb = 'reopened'), 'evento reopened';
  assert exists (select 1 from public.activity_events where verb = 'created' and entity_type = 'project'), 'evento de projeto criado';
  raise notice 'PASS: completed_at coerente e histórico automático (posição não gera ruído)';
end $$;
commit;

-- 2. Converter ideia em projeto ----------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'A', true) as _s \gset
insert into public.ideas (workspace_id, title, body, created_by)
  select ws_a, 'App de hábitos', 'Rastrear hábitos com foco', :'A' from _ids;
do $$
declare v_idea uuid; v_proj uuid; r public.ideas;
begin
  select id into v_idea from public.ideas limit 1;
  v_proj := public.convert_idea_to_project(v_idea);
  select * into r from public.ideas where id = v_idea;
  assert r.state = 'converted' and r.converted_project_id = v_proj, 'ideia marcada como convertida';
  assert (select title from public.projects where id = v_proj) = 'App de hábitos', 'projeto herda o título';
  assert (select description from public.projects where id = v_proj) = 'Rastrear hábitos com foco', 'projeto herda o corpo';
  begin
    perform public.convert_idea_to_project(v_idea);
    raise exception 'deveria ter falhado';
  exception when sqlstate '23505' then null; end;
  assert exists (select 1 from public.activity_events where verb = 'converted'), 'evento converted';
  raise notice 'PASS: conversão atômica, sem duplicar, com histórico';
end $$;
commit;

-- B não converte nem enxerga ideia de A
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'B', true) as _s \gset
do $$
begin
  begin
    perform public.convert_idea_to_project((select id from public.ideas limit 1));
    raise exception 'B não deveria ver a ideia';
  exception when sqlstate '23503' then null; end;
  raise notice 'PASS: usuário B não converte ideia de A';
end $$;
commit;

-- 3. Busca ---------------------------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'A', true) as _s \gset
insert into public.ideas (workspace_id, title, body, created_by)
  select ws_a, 'Organização da CASA', '100% prioridade_alta', :'A' from _ids;
do $$
declare ws uuid := (select ws_a from _ids); n int;
begin
  select count(*) into n from public.search_workspace(ws, 'organizacao');
  assert n = 1, 'busca ignora acento e caixa';
  select count(*) into n from public.search_workspace(ws, 'ORGANIZAÇÃO');
  assert n = 1, 'busca com acento e caixa alta';
  select count(*) into n from public.search_workspace(ws, '100%');
  assert n = 1, '% é literal';
  select count(*) into n from public.search_workspace(ws, '%%');
  assert n = 0, '%% não é curinga';
  select count(*) into n from public.search_workspace(ws, 'o');
  assert n = 0, 'consulta curta (<2) não retorna';
  select count(*) into n from public.search_workspace(ws, 'copy');
  assert n = 1, 'encontra tarefas por título';
  assert exists (select 1 from public.search_workspace(ws, 'hábitos') where entity_type = 'project'), 'encontra projetos';
  raise notice 'PASS: busca (acento, caixa, curingas literais, tipos)';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'B', true) as _s \gset
do $$
declare n int;
begin
  select count(*) into n from public.search_workspace((select ws_a from _ids), 'organizacao');
  assert n = 0, 'busca não vaza dados do espaço de A para B';
  select count(*) into n from public.activity_events;
  assert n = 0, 'B não lê histórico de A';
  raise notice 'PASS: busca e histórico isolados entre espaços';
end $$;
commit;
