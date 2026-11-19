-- Suíte da Etapa 6: convites, papéis, atribuições, comentários, notificações e isolamento.
-- Monta a equipe SOMENTE pelo fluxo real (create_workspace → create_invitation → accept_invitation).
\set ON_ERROR_STOP on
\set O '00000000-0000-0000-0000-0000000000e1'
\set AD '00000000-0000-0000-0000-0000000000e2'
\set E '00000000-0000-0000-0000-0000000000e3'
\set C '00000000-0000-0000-0000-0000000000e4'
\set R '00000000-0000-0000-0000-0000000000e5'
\set X '00000000-0000-0000-0000-0000000000e6'
\set J '00000000-0000-0000-0000-0000000000e7'
\set AD2 '00000000-0000-0000-0000-0000000000e8'

drop schema if exists zz_test cascade;
create schema zz_test;
grant usage on schema zz_test to authenticated;
create function zz_test.fails(p_sql text, p_match text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlerrm like '%' || p_match || '%' or sqlstate = p_match then return; end if;
    raise exception 'esperava erro "%", veio "%" (%)', p_match, sqlerrm, sqlstate;
  end;
  raise exception 'esperava erro "%", mas executou sem erro: %', p_match, p_sql;
end $$;
create function zz_test.h(k text) returns text language sql immutable as $$ select md5(k) || md5(k || 'x') $$;
grant execute on function zz_test.fails(text, text), zz_test.h(text) to authenticated;

delete from public.workspaces where owner_id in (:'O',:'AD',:'E',:'C',:'R',:'X',:'J',:'AD2');
delete from auth.users where id in (:'O',:'AD',:'E',:'C',:'R',:'X',:'J',:'AD2');
insert into auth.users (id, email) values
  (:'O','o@teste.dev'),(:'AD','ad@teste.dev'),(:'E','e@teste.dev'),(:'C','c@teste.dev'),
  (:'R','r@teste.dev'),(:'X','x@teste.dev'),(:'J','J@Teste.dev'),(:'AD2','ad2@teste.dev');

create temp table _t (k text primary key, v text);
grant all on _t to authenticated;
-- projeto de OUTRO espaço (do estranho X) para testar vínculo entre espaços
insert into _t select 'xproj', null;
with p as (
  insert into public.projects (workspace_id, title, created_by)
  select workspace_id, 'Projeto do X', :'X' from public.workspace_members where user_id = :'X'
  returning id)
update _t set v = (select id::text from p) where k = 'xproj';


begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'O', true) as _s \gset
do $$
declare ws uuid; pws uuid;
begin
  ws := public.create_workspace('Equipe Alfa', 'team');
  insert into _t values ('ws', ws::text);
  assert (select role from public.workspace_members where workspace_id = ws and user_id = auth.uid()) = 'owner', 'criador é proprietário';
  perform zz_test.fails($f$select public.create_workspace('x', 'personal')$f$, '22023');
  perform zz_test.fails($f$select public.create_workspace('   ', 'team')$f$, '22023');
  select id into pws from public.workspaces where kind = 'personal' and owner_id = auth.uid();
  perform zz_test.fails(format($f$select public.create_invitation(%L, 'editor', null, %L)$f$, pws, zz_test.h('p')), 'personal_workspace');
  perform zz_test.fails(format($f$select public.create_invitation(%L, 'editor', null, 'curto')$f$, ws), 'invalid_token_hash');
  perform public.create_invitation(ws, 'admin', null, zz_test.h('ad'));
  perform public.create_invitation(ws, 'admin', null, zz_test.h('ad2'));
  perform public.create_invitation(ws, 'editor', null, zz_test.h('e'));
  perform public.create_invitation(ws, 'collaborator', null, zz_test.h('c'));
  perform public.create_invitation(ws, 'reader', null, zz_test.h('r'));
  perform public.create_invitation(ws, 'editor', '  J@Teste.dev ', zz_test.h('j'));
  perform public.create_invitation(ws, 'reader', null, zz_test.h('exp'));
  perform public.create_invitation(ws, 'reader', null, zz_test.h('rev'));
  perform public.revoke_invitation((select id from public.invitations where token_hash = zz_test.h('rev')));
  perform zz_test.fails(format($f$select public.revoke_invitation(%L)$f$, (select id from public.invitations where token_hash = zz_test.h('rev'))), 'invitation_not_revocable');
  assert (select email from public.invitations where token_hash = zz_test.h('j')) = 'j@teste.dev', 'e-mail do convite é normalizado';
  assert (select count(*) from public.invitations where token_hash like '%' || 'ad' || '%') >= 0, 'sanidade';
  raise notice 'PASS: criar equipe e convites (só hash, papéis, e-mail normalizado, limites básicos)';
end $$;
commit;
update public.invitations set expires_at = now() - interval '1 day' where token_hash = zz_test.h('exp');

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'X', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  assert (select state from public.preview_invitation(zz_test.h('j'))) = 'valid', 'prévia válida';
  assert (select email_matches from public.preview_invitation(zz_test.h('j'))) = false, 'e-mail não confere';
  assert (select state from public.preview_invitation(zz_test.h('exp'))) = 'expired', 'prévia expirado';
  assert (select state from public.preview_invitation(zz_test.h('rev'))) = 'revoked', 'prévia revogado';
  assert not exists (select 1 from public.preview_invitation('0000000000000000000000000000000000000000000000000000000000000000')), 'token inexistente não tem prévia';
  perform zz_test.fails(format($f$select public.accept_invitation(%L)$f$, zz_test.h('j')), 'invitation_email_mismatch');
  perform zz_test.fails(format($f$select public.accept_invitation(%L)$f$, zz_test.h('exp')), 'invitation_expired');
  perform zz_test.fails(format($f$select public.accept_invitation(%L)$f$, zz_test.h('rev')), 'invitation_revoked');
  perform zz_test.fails($f$select public.accept_invitation('0000000000000000000000000000000000000000000000000000000000000000')$f$, 'invitation_invalid');
  perform zz_test.fails(format($f$select public.create_invitation(%L, 'reader', null, %L)$f$, ws, zz_test.h('x1')), 'forbidden');
  assert (select count(*) from public.invitations) = 0, 'estranho não lista convites';
  assert (select count(*) from public.workspace_members where workspace_id = ws) = 0, 'estranho não lista membros';
  assert (select count(*) from public.list_workspace_members(ws)) = 0, 'diretório vazio para estranho';
  raise notice 'PASS: convite expirado, revogado, de outro e-mail ou inexistente é recusado; estranho não vê nada';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'AD', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  assert (select state from public.preview_invitation(zz_test.h('ad'))) = 'valid', 'prévia valida';
  assert (select role from public.preview_invitation(zz_test.h('ad'))) = 'admin', 'prévia mostra o papel';
  assert public.accept_invitation(zz_test.h('ad')) = ws, 'aceite devolve o espaço';
  assert (select role from public.workspace_members where workspace_id = ws and user_id = auth.uid()) = 'admin', 'papel aplicado';
  perform zz_test.fails(format($f$select public.accept_invitation(%L)$f$, zz_test.h('ad')), 'invitation_used');
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'AD2', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  assert (select state from public.preview_invitation(zz_test.h('ad2'))) = 'valid', 'prévia valida';
  assert (select role from public.preview_invitation(zz_test.h('ad2'))) = 'admin', 'prévia mostra o papel';
  assert public.accept_invitation(zz_test.h('ad2')) = ws, 'aceite devolve o espaço';
  assert (select role from public.workspace_members where workspace_id = ws and user_id = auth.uid()) = 'admin', 'papel aplicado';
  perform zz_test.fails(format($f$select public.accept_invitation(%L)$f$, zz_test.h('ad2')), 'invitation_used');
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'E', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  assert (select state from public.preview_invitation(zz_test.h('e'))) = 'valid', 'prévia valida';
  assert (select role from public.preview_invitation(zz_test.h('e'))) = 'editor', 'prévia mostra o papel';
  assert public.accept_invitation(zz_test.h('e')) = ws, 'aceite devolve o espaço';
  assert (select role from public.workspace_members where workspace_id = ws and user_id = auth.uid()) = 'editor', 'papel aplicado';
  perform zz_test.fails(format($f$select public.accept_invitation(%L)$f$, zz_test.h('e')), 'invitation_used');
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'C', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  assert (select state from public.preview_invitation(zz_test.h('c'))) = 'valid', 'prévia valida';
  assert (select role from public.preview_invitation(zz_test.h('c'))) = 'collaborator', 'prévia mostra o papel';
  assert public.accept_invitation(zz_test.h('c')) = ws, 'aceite devolve o espaço';
  assert (select role from public.workspace_members where workspace_id = ws and user_id = auth.uid()) = 'collaborator', 'papel aplicado';
  perform zz_test.fails(format($f$select public.accept_invitation(%L)$f$, zz_test.h('c')), 'invitation_used');
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'R', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  assert (select state from public.preview_invitation(zz_test.h('r'))) = 'valid', 'prévia valida';
  assert (select role from public.preview_invitation(zz_test.h('r'))) = 'reader', 'prévia mostra o papel';
  assert public.accept_invitation(zz_test.h('r')) = ws, 'aceite devolve o espaço';
  assert (select role from public.workspace_members where workspace_id = ws and user_id = auth.uid()) = 'reader', 'papel aplicado';
  perform zz_test.fails(format($f$select public.accept_invitation(%L)$f$, zz_test.h('r')), 'invitation_used');
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'J', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  assert (select state from public.preview_invitation(zz_test.h('j'))) = 'valid', 'prévia valida';
  assert (select role from public.preview_invitation(zz_test.h('j'))) = 'editor', 'prévia mostra o papel';
  assert public.accept_invitation(zz_test.h('j')) = ws, 'aceite devolve o espaço';
  assert (select role from public.workspace_members where workspace_id = ws and user_id = auth.uid()) = 'editor', 'papel aplicado';
  perform zz_test.fails(format($f$select public.accept_invitation(%L)$f$, zz_test.h('j')), 'invitation_used');
end $$;
commit;

do $$ begin raise notice 'PASS: aceite de convite aplica o papel e é de uso único (incl. e-mail com caixa diferente)'; end $$;


begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'AD', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  perform public.create_invitation(ws, 'editor', null, zz_test.h('adinv'));
  perform zz_test.fails(format($f$select public.create_invitation(%L, 'admin', null, %L)$f$, ws, zz_test.h('adinv2')), 'only_owner_grants_admin');
  perform zz_test.fails(format($f$insert into public.workspace_members (workspace_id, user_id, role) values (%L, %L, 'reader')$f$, ws, '00000000-0000-0000-0000-0000000000e6'), '42501');
  perform zz_test.fails(format($f$update public.workspace_members set user_id = %L where workspace_id = %L and user_id = %L$f$, '00000000-0000-0000-0000-0000000000e6', ws, '00000000-0000-0000-0000-0000000000e5'), 'member_identity_immutable');
  perform zz_test.fails(format($f$select public.change_member_role(%L, %L, 'admin')$f$, ws, '00000000-0000-0000-0000-0000000000e3'), 'only_owner_grants_admin');
  perform zz_test.fails(format($f$select public.change_member_role(%L, %L, 'owner')$f$, ws, '00000000-0000-0000-0000-0000000000e3'), 'owner_not_assignable');
  perform zz_test.fails(format($f$select public.change_member_role(%L, %L, 'reader')$f$, ws, '00000000-0000-0000-0000-0000000000e2'), 'cannot_change_self');
  perform zz_test.fails(format($f$select public.remove_member(%L, %L)$f$, ws, '00000000-0000-0000-0000-0000000000e1'), 'member_not_found');
  assert (select count(*) from public.list_workspace_members(ws) where email is not null) = 7, 'admin vê e-mails dos 7 membros';
  raise notice 'PASS: admin não adiciona sem convite, não cria admin, não promove, não mexe no proprietário';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'AD2', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  perform zz_test.fails(format($f$select public.change_member_role(%L, %L, 'editor')$f$, ws, '00000000-0000-0000-0000-0000000000e2'), 'only_owner_manages_admin');
  perform zz_test.fails(format($f$select public.remove_member(%L, %L)$f$, ws, '00000000-0000-0000-0000-0000000000e2'), 'only_owner_manages_admin');
  perform public.change_member_role(ws, '00000000-0000-0000-0000-0000000000e5', 'reader');
  raise notice 'PASS: admin não altera nem remove outro admin';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'O', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  perform public.change_member_role(ws, '00000000-0000-0000-0000-0000000000e8', 'editor');
  assert (select role from public.workspace_members where workspace_id = ws and user_id = '00000000-0000-0000-0000-0000000000e8') = 'editor', 'proprietário rebaixa admin';
  perform public.change_member_role(ws, '00000000-0000-0000-0000-0000000000e8', 'admin');
  assert (select count(*) from public.notifications where type = 'invitation_accepted') = 6, 'proprietário recebeu 6 avisos de aceite';
  perform zz_test.fails(format($f$select public.remove_member(%L, %L)$f$, ws, '00000000-0000-0000-0000-0000000000e1'), 'use_leave_workspace');
  raise notice 'PASS: proprietário gerencia admins e é avisado dos aceites';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'AD2', true) as _s \gset
do $$ begin
  assert (select count(*) from public.notifications where type = 'role_changed') = 2, 'AD2 recebeu 2 avisos de papel';
  raise notice 'PASS: mudança de papel notifica a pessoa';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'R', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  perform zz_test.fails(format($f$insert into public.tasks (workspace_id, title, created_by) values (%L, 'x', %L)$f$, ws, '00000000-0000-0000-0000-0000000000e5'), '42501');
  assert (select count(*) from public.list_workspace_members(ws) where email is not null) = 0, 'leitor não vê e-mails';
  assert (select count(*) from public.list_workspace_members(ws)) = 7, 'leitor vê a lista de pessoas';
  raise notice 'PASS: leitor lê, mas não cria tarefa; e-mails ficam ocultos';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'C', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  perform zz_test.fails(format($f$insert into public.projects (workspace_id, title, created_by) values (%L, 'x', %L)$f$, ws, '00000000-0000-0000-0000-0000000000e4'), '42501');
  assert (select count(*) from public.list_workspace_members(ws) where email is not null) = 0, 'colaborador não vê e-mails';
  raise notice 'PASS: colaborador não cria projeto';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'E', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws'); p uuid; t uuid;
begin
  insert into public.projects (workspace_id, title, created_by) values (ws, 'Site novo', auth.uid()) returning id into p;
  insert into _t values ('proj', p::text);
  insert into public.tasks (workspace_id, project_id, title, created_by, assignee_id)
    values (ws, p, 'Escrever copy', auth.uid(), '00000000-0000-0000-0000-0000000000e4') returning id into t;
  insert into _t values ('task', t::text);
  insert into public.tasks (workspace_id, project_id, title, created_by, assignee_id)
    values (ws, p, 'Tarefa minha', auth.uid(), auth.uid());
  perform zz_test.fails(format($f$insert into public.tasks (workspace_id, title, created_by, assignee_id) values (%L, 'a', %L, %L)$f$, ws, auth.uid(), '00000000-0000-0000-0000-0000000000e6'), 'assignee_not_member');
  perform zz_test.fails(format($f$insert into public.tasks (workspace_id, title, created_by, assignee_id) values (%L, 'a', %L, %L)$f$, ws, auth.uid(), '00000000-0000-0000-0000-0000000000e5'), 'assignee_cannot_work');
  perform zz_test.fails(format($f$update public.tasks set assignee_id = %L where id = %L$f$, '00000000-0000-0000-0000-0000000000e6', t), 'assignee_not_member');
  assert (select count(*) from public.notifications where type = 'task_assigned') = 0, 'quem atribui a si não recebe aviso';
  raise notice 'PASS: atribuição só a membro ativo que não seja leitor';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'R', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws'); t uuid := (select v::uuid from _t where k = 'task');
begin
  perform zz_test.fails(format($f$insert into public.comments (workspace_id, entity_type, entity_id, body, author_id) values (%L, 'task', %L, 'oi', auth.uid())$f$, ws, t), '42501');
  assert (select count(*) from public.comments where workspace_id = ws) = 0, 'leitor lê comentários (nenhum ainda)';
  raise notice 'PASS: leitor não comenta';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'C', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws'); t uuid := (select v::uuid from _t where k = 'task'); c uuid;
begin
  assert (select count(*) from public.notifications where type = 'task_assigned' and payload->>'title' = 'Escrever copy') = 1, 'colaborador foi avisado da atribuição';
  insert into public.comments (workspace_id, entity_type, entity_id, body, author_id) values (ws, 'task', t, 'Começo hoje', auth.uid()) returning id into c;
  insert into _t values ('c1', c::text);
  perform zz_test.fails(format($f$insert into public.comments (workspace_id, entity_type, entity_id, body, author_id) values (%L, 'task', %L, 'x', auth.uid())$f$, ws, gen_random_uuid()), 'entity_not_found');
  perform zz_test.fails(format($f$insert into public.comments (workspace_id, entity_type, entity_id, body, author_id) values (%L, 'project', %L, 'x', auth.uid())$f$, ws, (select v::uuid from _t where k = 'xproj')), 'entity_not_found');
  perform zz_test.fails(format($f$insert into public.comments (workspace_id, entity_type, entity_id, body, author_id) values (%L, 'task', %L, 'x', %L)$f$, ws, t, '00000000-0000-0000-0000-0000000000e3'), '42501');
  update public.comments set body = 'Começo amanhã' where id = c;
  assert (select edited_at from public.comments where id = c) is not null, 'edição marca edited_at';
  perform zz_test.fails(format($f$update public.comments set entity_id = %L where id = %L$f$, gen_random_uuid(), c), 'comment_identity_immutable');
  raise notice 'PASS: comentários validam o vínculo, não cruzam espaços e marcam edição';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'E', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws'); t uuid := (select v::uuid from _t where k = 'task'); c uuid;
begin
  assert (select count(*) from public.notifications where type = 'comment') = 1, 'criador da tarefa foi avisado do comentário';
  insert into public.comments (workspace_id, entity_type, entity_id, body, author_id) values (ws, 'task', t, 'Combinado', auth.uid()) returning id into c;
  insert into _t values ('c2', c::text);
  assert (select count(*) from public.notifications where type = 'comment') = 1, 'autor não se avisa';
  raise notice 'PASS: comentário avisa responsáveis e participantes, nunca o autor';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'C', true) as _s \gset
do $$
declare n uuid; c2 uuid := (select v::uuid from _t where k = 'c2');
begin
  assert (select count(*) from public.notifications where type = 'comment') = 1, 'C foi avisada (responsável + já comentou), sem duplicar';
  select id into n from public.notifications where type = 'comment';
  assert public.mark_notifications_read(array[n]) = 1, 'marca uma como lida';
  assert public.mark_notifications_read(array[n]) = 0, 'idempotente';
  perform zz_test.fails(format($f$update public.notifications set payload = '{}' where id = %L$f$, n), 'notification_immutable');
  perform zz_test.fails(format($f$insert into public.notifications (user_id, type) values (%L, 'x')$f$, auth.uid()), '42501');
  assert (select count(*) from public.notifications where user_id <> auth.uid()) = 0, 'não lê avisos de outros';
  perform zz_test.fails(format($f$select public.delete_comment(%L)$f$, c2), 'forbidden');
  perform public.delete_comment((select v::uuid from _t where k = 'c1'));
  assert public.mark_notifications_read() >= 1, 'marcar todas devolve a contagem';
  raise notice 'PASS: notificações são privadas, imutáveis (só read_at) e idempotentes; autor apaga o próprio comentário';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'AD', true) as _s \gset
do $$
declare n int; c2 uuid := (select v::uuid from _t where k = 'c2');
begin
  update public.comments set body = 'editado pelo admin' where id = c2;
  get diagnostics n = row_count;
  assert n = 0, 'admin não edita texto alheio';
  perform public.delete_comment(c2);
  assert (select deleted_at from public.comments where id = c2) is not null, 'admin modera';
  raise notice 'PASS: admin modera (apaga) mas não reescreve comentário alheio';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'O', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws'); t uuid := (select v::uuid from _t where k = 'task');
begin
  perform public.remove_member(ws, '00000000-0000-0000-0000-0000000000e4');
  assert (select assignee_id from public.tasks where id = t) is null, 'tarefa do removido fica sem responsável';
  assert not exists (select 1 from public.workspace_members where workspace_id = ws and user_id = '00000000-0000-0000-0000-0000000000e4'), 'removido saiu';
  raise notice 'PASS: remover pessoa a tira do espaço e desatribui suas tarefas';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'C', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  assert (select count(*) from public.projects where workspace_id = ws) = 0, 'removido não vê projetos';
  assert (select count(*) from public.tasks where workspace_id = ws) = 0, 'removido não vê tarefas';
  assert (select count(*) from public.comments where workspace_id = ws) = 0, 'removido não vê comentários';
  assert (select count(*) from public.list_workspace_members(ws)) = 0, 'removido não vê pessoas';
  assert (select count(*) from public.notifications where type = 'removed_from_workspace') = 1, 'removido foi avisado';
  perform zz_test.fails(format($f$select public.accept_invitation(%L)$f$, zz_test.h('c')), 'invitation_used');
  perform zz_test.fails(format($f$insert into public.comments (workspace_id, entity_type, entity_id, body, author_id) values (%L, 'task', %L, 'x', auth.uid())$f$, ws, (select v::uuid from _t where k = 'task')), 'entity_not_found');  -- nem enxerga a tarefa mais
  raise notice 'PASS: pessoa removida perde todo o acesso e não reutiliza o convite';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'R', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  perform public.leave_workspace(ws);
  assert (select count(*) from public.projects where workspace_id = ws) = 0, 'quem saiu não vê mais nada';
  perform zz_test.fails(format($f$select public.leave_workspace(%L)$f$, ws), 'not_a_member');
  raise notice 'PASS: sair do espaço funciona e corta o acesso';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'O', true) as _s \gset
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws'); i int := 0;
begin
  perform zz_test.fails(format($f$select public.leave_workspace(%L)$f$, ws), 'owner_cannot_leave');
  -- limite de 20 convites pendentes
  while (select count(*) from public.invitations where workspace_id = ws and accepted_at is null and revoked_at is null and expires_at > now()) < 20 loop
    i := i + 1;
    perform public.create_invitation(ws, 'reader', null, zz_test.h('fill' || i));
  end loop;
  perform zz_test.fails(format($f$select public.create_invitation(%L, 'reader', null, %L)$f$, ws, zz_test.h('overflow')), 'too_many_invitations');
  raise notice 'PASS: proprietário não sai; limite de 20 convites pendentes';
end $$;
commit;

-- Estado final consistente: exatamente 1 proprietário, nenhum membro duplicado.
do $$
declare ws uuid := (select v::uuid from _t where k = 'ws');
begin
  assert (select count(*) from public.workspace_members where workspace_id = ws and role = 'owner') = 1, 'um proprietário';
  assert (select count(*) from (select user_id from public.workspace_members where workspace_id = ws group by 1 having count(*) > 1) d) = 0, 'sem duplicados';
  raise notice 'PASS: estado final consistente (1 proprietário, sem membros duplicados)';
end $$;
drop schema zz_test cascade;

