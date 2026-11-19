\set ON_ERROR_STOP on
do $$
declare ws uuid := (select id from public.workspaces where slug = 'equipe-concorrencia'); n int; a int;
begin
  select count(*) into n from public.workspace_members where workspace_id = ws and role = 'editor';
  select count(*) into a from public.invitations where workspace_id = ws and accepted_by is not null;
  assert n = 1, format('esperava exatamente 1 aceite, houve %s', n);
  assert a = 1, 'convite registra um único aceitante';
  assert (select count(*) from public.workspace_members where workspace_id = ws) = 2, 'dono + 1 convidado';
  raise notice 'PASS: 16 aceites simultâneos do mesmo convite → exatamente 1 entrou';
end $$;
