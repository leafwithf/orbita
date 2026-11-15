-- ============================================================================
-- ÓRBITA — suíte de verificação de RLS, triggers e foco único.
-- Rodar DEPOIS da migração, em um banco de desenvolvimento/teste.
-- Cada bloco imprime "PASS: ..." ou aborta com a falha.
-- No Supabase real, execute pelo SQL Editor (role postgres) ou via psql.
-- ============================================================================
\set ON_ERROR_STOP on
\set A '00000000-0000-0000-0000-00000000000a'
\set B '00000000-0000-0000-0000-00000000000b'

-- Limpa dados de execuções anteriores (somente usuários de teste)
delete from public.workspaces where owner_id in (:'A', :'B');
delete from auth.users where id in (:'A', :'B');

-- 1. Signup provisiona perfil, preferências, espaço e vínculo ------------------
insert into auth.users (id, email, raw_user_meta_data) values
  (:'A', 'a@teste.dev', '{"full_name":"Ana"}'),
  (:'B', 'b@teste.dev', '{}');

do $$
declare n int;
begin
  select count(*) into n from public.profiles where id in
    ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000b');
  assert n = 2, 'perfis criados no signup';
  select count(*) into n from public.user_preferences where user_id in
    ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000b');
  assert n = 2, 'preferências criadas no signup';
  select count(*) into n from public.workspace_members where role = 'owner' and user_id in
    ('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000b');
  assert n = 2, 'cada usuário vira owner do próprio espaço';
  assert (select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Ana', 'nome vem do metadata';
  assert (select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'b', 'nome cai para o prefixo do e-mail';
  raise notice 'PASS: signup cria profiles, user_preferences, workspaces e workspace_members';
end $$;

-- Dados de apoio criados com a role de serviço (ignora RLS)
create temp table _ids as
select
  (select workspace_id from public.workspace_members where user_id = :'A') as ws_a,
  (select workspace_id from public.workspace_members where user_id = :'B') as ws_b;
grant select on _ids to authenticated, anon;

-- 2. Usuário A cria projetos e cursos no próprio espaço ------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'A', true) as _s \gset
insert into public.projects (workspace_id, title, created_by)
  select ws_a, 'Projeto A1', :'A' from _ids;
insert into public.projects (workspace_id, title, created_by)
  select ws_a, 'Projeto A2', :'A' from _ids;
insert into public.courses (workspace_id, title, created_by)
  select ws_a, 'Curso A1', :'A' from _ids;
do $$ begin
  assert (select count(*) from public.projects) = 2, 'A enxerga os próprios projetos';
  raise notice 'PASS: A cria e lê projetos/cursos do próprio espaço';
end $$;
commit;

-- B cria um projeto no espaço dele (usado no teste de alvo de outro espaço)
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'B', true) as _s \gset
insert into public.projects (workspace_id, title, created_by)
  select ws_b, 'Projeto B1', :'B' from _ids;
commit;

-- 3. Isolamento: B não enxerga nem altera dados de A ---------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'B', true) as _s \gset
do $$
declare n int; ws_a uuid; ok boolean := false;
begin
  select _ids.ws_a into ws_a from _ids;
  assert (select count(*) from public.projects) = 1, 'B só vê 1 projeto (o dele)';
  assert (select count(*) from public.projects where workspace_id = ws_a) = 0, 'B não vê projetos do espaço de A';
  assert (select count(*) from public.courses) = 0, 'B não vê cursos de A';
  assert (select count(*) from public.workspaces) = 1, 'B só vê o próprio workspace';
  assert (select count(*) from public.workspace_members) = 1, 'B só vê o próprio vínculo';
  assert (select count(*) from public.profiles) = 1, 'B não vê o perfil de A (sem espaço em comum)';

  -- UPDATE em linha de A: deve afetar 0 linhas
  update public.projects set title = 'invadido' where workspace_id = ws_a;
  get diagnostics n = row_count;
  assert n = 0, 'B não consegue atualizar projeto de A';

  -- DELETE em linha de A: deve afetar 0 linhas
  delete from public.projects where workspace_id = ws_a;
  get diagnostics n = row_count;
  assert n = 0, 'B não consegue apagar projeto de A';

  -- INSERT no espaço de A: deve ser barrado por RLS
  begin
    insert into public.projects (workspace_id, title, created_by) values (ws_a, 'injetado', '00000000-0000-0000-0000-00000000000b');
  exception when insufficient_privilege then ok := true; end;
  assert ok, 'B não consegue inserir projeto no espaço de A';

  -- Tenta se auto-adicionar como membro do espaço de A
  ok := false;
  begin
    insert into public.workspace_members (workspace_id, user_id, role) values (ws_a, '00000000-0000-0000-0000-00000000000b', 'owner');
  exception when insufficient_privilege then ok := true; end;
  assert ok, 'B não consegue se auto-adicionar ao espaço de A';

  raise notice 'PASS: isolamento entre usuários (select/update/delete/insert/auto-convite)';
end $$;
commit;

-- 4. Chave anônima não lê nada --------------------------------------------------
begin;
set local role anon;
do $$
declare t text; n int; denied int := 0; empty int := 0;
begin
  for t in select tablename from pg_tables where schemaname = 'public' order by 1 loop
    begin
      execute format('select count(*) from public.%I', t) into n;
      if n = 0 then empty := empty + 1; else raise exception 'anon leu % linhas de %', n, t; end if;
    exception when insufficient_privilege then denied := denied + 1; end;
  end loop;
  assert denied + empty = 22, 'todas as 22 tabelas verificadas';
  raise notice 'PASS: anon sem acesso (% negadas, % vazias, 0 vazamentos)', denied, empty;
end $$;
commit;

-- 5. Foco: permissão, alvo inválido, não arquiva o anterior --------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'A', true) as _s \gset
do $$
declare ws_a uuid; ws_b uuid; p1 uuid; p2 uuid; pb uuid; c1 uuid; r jsonb; ok boolean;
begin
  select _ids.ws_a, _ids.ws_b into ws_a, ws_b from _ids;
  select id into p1 from public.projects where title = 'Projeto A1';
  select id into p2 from public.projects where title = 'Projeto A2';
  select id into c1 from public.courses  where title = 'Curso A1';

  r := public.set_primary_focus(ws_a, 'project', p1);
  assert (r ->> 'target_id')::uuid = p1 and r -> 'previous_target_id' = 'null'::jsonb, 'primeiro foco definido';
  r := public.set_primary_focus(ws_a, 'project', p2);
  assert (r ->> 'previous_target_id')::uuid = p1, 'troca devolve o foco anterior (para desfazer)';
  assert (select count(*) from public.focus_assignments where kind = 'project') = 1, 'um único foco de projeto';
  assert (select archived_at is null and deleted_at is null from public.projects where id = p1), 'trocar o foco não arquiva o projeto anterior';

  r := public.set_primary_focus(ws_a, 'course', c1);
  assert (select count(*) from public.focus_assignments) = 2, 'um foco de projeto + um de curso';

  -- Alvo de outro espaço
  ok := false;
  select id into pb from public.projects where workspace_id = ws_b; -- invisível para A
  begin perform public.set_primary_focus(ws_a, 'project', coalesce(pb, gen_random_uuid()));
  exception when sqlstate '23514' then ok := true; end;
  assert ok, 'alvo inexistente/de outro espaço é recusado';

  -- Espaço alheio
  ok := false;
  begin perform public.set_primary_focus(ws_b, 'project', p1);
  exception when sqlstate '42501' then ok := true; end;
  assert ok, 'A não define foco no espaço de B';

  raise notice 'PASS: set_primary_focus (um foco por tipo, histórico, alvo inválido, espaço alheio)';
end $$;
commit;

-- Sem sessão (auth.uid() nulo)
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true) as _s \gset
do $$
declare ok boolean := false; ws uuid; p uuid;
begin
  select _ids.ws_a into ws from _ids;
  begin perform public.set_primary_focus(ws, 'project', gen_random_uuid());
  exception when sqlstate '28000' then ok := true; end;
  assert ok, 'sem sessão: not_authenticated';
  raise notice 'PASS: set_primary_focus exige sessão';
end $$;
commit;

-- 6. Unicidade no banco (mesmo sem passar pelo RPC) ----------------------------
do $$
declare ws uuid; p uuid; ok boolean := false;
begin
  select ws_a into ws from _ids;
  select id into p from public.projects where title = 'Projeto A1';
  begin
    insert into public.focus_assignments (workspace_id, kind, scope_key, target_id, set_by)
    values (ws, 'project', 'workspace', p, '00000000-0000-0000-0000-00000000000a');
  exception when unique_violation then ok := true; end;
  assert ok, 'unique (workspace_id, kind, scope_key) barra duplicata';
  raise notice 'PASS: unicidade do foco garantida pelo banco';
end $$;
