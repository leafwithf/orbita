-- Prepara: 1 espaço de equipe, 16 candidatos (client_id 0..15) e UM convite de uso único.
\set ON_ERROR_STOP on
delete from public.workspaces where slug = 'equipe-concorrencia';
delete from auth.users where id::text like '00000000-0000-0000-0000-00000e%' or id = '00000000-0000-0000-0000-0000000000f0';
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000f0', 'dono-conc@teste.dev');
insert into auth.users (id, email)
select ('00000000-0000-0000-0000-00000e' || lpad(i::text, 6, '0'))::uuid, 'cand' || i || '@teste.dev'
from generate_series(0, 15) i;
insert into public.workspaces (name, slug, kind, owner_id)
values ('Concorrência', 'equipe-concorrencia', 'team', '00000000-0000-0000-0000-0000000000f0');
insert into public.invitations (workspace_id, role, token_hash, invited_by)
select id, 'editor', repeat('a', 64), '00000000-0000-0000-0000-0000000000f0'
from public.workspaces where slug = 'equipe-concorrencia';
