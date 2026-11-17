-- Suíte da Etapa 5: arquivos, cota, ciclo de upload, Storage e expurgo.
\set ON_ERROR_STOP on
\set A '00000000-0000-0000-0000-0000000000d1'
\set B '00000000-0000-0000-0000-0000000000d2'

delete from storage.objects where bucket_id = 'workspace-files';
delete from public.workspaces where owner_id in (:'A', :'B');
delete from auth.users where id in (:'A', :'B');
insert into auth.users (id, email) values (:'A', 'd1@teste.dev'), (:'B', 'd2@teste.dev');
create temp table _ids as
select (select workspace_id from public.workspace_members where user_id = :'A') as ws_a,
       (select workspace_id from public.workspace_members where user_id = :'B') as ws_b;
grant select on _ids to authenticated, service_role;

-- 1. Início de upload: caminho, limites e tipos bloqueados -----------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'A', true) as _s \gset
do $$
declare ws uuid := (select ws_a from _ids); r record; n int := 0;
begin
  select * into r from public.begin_file_upload(ws, 'contrato.pdf', 20971520, 'application/pdf');
  assert r.storage_path = 'ws/' || ws || '/' || r.id, 'caminho ws/{workspace}/{fileId}';
  assert (select status from public.files_metadata where id = r.id) = 'pending', 'nasce pendente';

  declare bad record;
  begin
    for bad in select * from (values
      ('zero.pdf', 0::bigint), ('grande.pdf', 26214401::bigint), ('a.exe', 10::bigint),
      ('pagina.HTML', 10::bigint), ('img.svg', 10::bigint), ('a/b.pdf', 10::bigint), ('  ', 10::bigint)
    ) as t(nm, sz)
    loop
      begin
        perform public.begin_file_upload(ws, bad.nm, bad.sz, 'application/pdf');
      exception when sqlstate '22023' then n := n + 1; end;
    end loop;
  end;
  assert n = 7, format('7 entradas inválidas recusadas, recusou %s', n);
  raise notice 'PASS: begin_file_upload (caminho, 25 MB, tipos bloqueados, nomes inválidos)';
end $$;
commit;

-- 2. B não inicia upload no espaço de A ---------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'B', true) as _s \gset
do $$
begin
  begin
    perform public.begin_file_upload((select ws_a from _ids), 'x.pdf', 10, 'application/pdf');
    raise exception 'B não deveria conseguir';
  exception when sqlstate '42501' then null; end;
  raise notice 'PASS: usuário B não inicia upload no espaço de A';
end $$;
commit;

-- 3. Cota de 1 GiB (pendentes contam) ------------------------------------------------
-- 'drop' das linhas de teste anteriores deste espaço, depois 40 x 25 MB = 1000 MiB
delete from public.files_metadata where workspace_id = (select ws_a from _ids);
insert into public.files_metadata (workspace_id, storage_path, file_name, mime, size_bytes, status, created_by)
select (select ws_a from _ids), 'fill/' || g, 'f' || g || '.bin', 'application/octet-stream', 26214400, 'ready', :'A'
from generate_series(1, 40) g;
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'A', true) as _s \gset
do $$
declare ws uuid := (select ws_a from _ids);
begin
  begin
    perform public.begin_file_upload(ws, 'estoura.pdf', 26214400, 'application/pdf');
    raise exception 'deveria estourar a cota';
  exception when sqlstate '53400' then null; end;
  perform public.begin_file_upload(ws, 'cabe.pdf', 1000000, 'application/pdf');
  raise notice 'PASS: cota de 1 GiB por espaço (recusa acima, aceita abaixo)';
end $$;
commit;

-- 4. Ciclo pending → ready | quarantined --------------------------------------------
delete from public.files_metadata where workspace_id = (select ws_a from _ids);
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'A', true) as _s \gset
do $$
declare ws uuid := (select ws_a from _ids); f1 record; f2 record;
begin
  select * into f1 from public.begin_file_upload(ws, 'ok.png', 1000, 'image/png');
  select * into f2 from public.begin_file_upload(ws, 'falso.png', 1000, 'image/png');
  assert public.finalize_file_upload(f1.id, true, 'abc123') = 'ready', 'vira ready';
  assert public.finalize_file_upload(f2.id, false, null, 'assinatura divergente') = 'quarantined', 'vira quarantined';
  assert (select checksum from public.files_metadata where id = f1.id) = 'abc123', 'guarda checksum';
  begin
    perform public.finalize_file_upload(f1.id, true);
    raise exception 'não pode finalizar duas vezes';
  exception when sqlstate '23514' then null; end;
  assert exists (select 1 from public.activity_events where verb = 'file_quarantined' and metadata->>'reason' = 'assinatura divergente'), 'evento de quarentena';
  assert exists (select 1 from public.activity_events where verb = 'file_uploaded'), 'evento de upload';
  raise notice 'PASS: ciclo de upload (ready, quarentena, sem dupla finalização, eventos)';
end $$;
commit;

-- 5. Storage: inserção só para registro pendente do próprio usuário; leitura por espaço
create temp table _f as select id, storage_path from public.files_metadata
  where workspace_id = (select ws_a from _ids) and file_name = 'ok.png';
grant select on _f to authenticated;
insert into public.files_metadata (workspace_id, storage_path, file_name, mime, size_bytes, status, created_by)
select ws_a, 'ws/' || ws_a || '/' || gen_random_uuid(), 'pend.pdf', 'application/pdf', 100, 'pending', :'A' from _ids;
create temp table _p as select storage_path from public.files_metadata where file_name = 'pend.pdf';
grant select on _p to authenticated;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'A', true) as _s \gset
do $$
declare path text := (select storage_path from _p);
begin
  insert into storage.objects (bucket_id, name, owner) values ('workspace-files', path, auth.uid());
  begin   -- registro já 'ready' não aceita novo objeto
    insert into storage.objects (bucket_id, name, owner) values ('workspace-files', (select storage_path from _f), auth.uid());
    raise exception 'não deveria inserir em registro ready';
  exception when sqlstate '42501' then null; end;
  begin   -- caminho sem registro
    insert into storage.objects (bucket_id, name, owner)
    values ('workspace-files', 'ws/' || (select ws_a from _ids) || '/' || gen_random_uuid(), auth.uid());
    raise exception 'não deveria inserir sem registro';
  exception when sqlstate '42501' then null; end;
  assert (select count(*) from storage.objects where bucket_id = 'workspace-files') = 1, 'A lê o próprio objeto';
  raise notice 'PASS: Storage só aceita objeto de upload pendente do próprio usuário';
end $$;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'B', true) as _s \gset
do $$
begin
  assert (select count(*) from storage.objects) = 0, 'B não lê objetos de A';
  begin
    insert into storage.objects (bucket_id, name, owner) values ('workspace-files', (select storage_path from _p), auth.uid());
    raise exception 'B não deveria inserir no caminho de A';
  exception when sqlstate '42501' then null; end;
  raise notice 'PASS: Storage isolado entre espaços';
end $$;
commit;

-- 6. Expurgo: lixeira > 30 dias e pendentes > 24 h; só service_role -------------------
update public.files_metadata set deleted_at = now() - interval '31 days' where file_name = 'ok.png';
update public.files_metadata set created_at = now() - interval '25 hours' where file_name = 'pend.pdf';
insert into public.files_metadata (workspace_id, storage_path, file_name, mime, size_bytes, status, deleted_at, created_by)
select ws_a, 'ws/' || ws_a || '/' || gen_random_uuid(), 'recente.pdf', 'application/pdf', 100, 'ready', now() - interval '2 days', :'A' from _ids;

begin;
set local role authenticated;
do $$
begin
  begin
    perform * from public.list_expired_files();
    raise exception 'authenticated não deveria executar';
  exception when sqlstate '42501' then null; end;
  raise notice 'PASS: expurgo negado a usuários comuns';
end $$;
commit;

begin;
set local role service_role;
do $$
declare ids uuid[]; n int;
begin
  select array_agg(id) into ids from public.list_expired_files();
  assert array_length(ids, 1) = 2, format('2 expirados (lixeira 31 d + pendente 25 h), vieram %s', coalesce(array_length(ids, 1), 0));
  assert not exists (select 1 from public.list_expired_files() e join public.files_metadata f using (id) where f.file_name = 'recente.pdf'), 'item de 2 dias na lixeira fica';
  n := public.delete_purged_files(ids);
  assert n = 2, 'remove os 2 registros';
  raise notice 'PASS: expurgo em duas fases (lixeira 30 d, pendente 24 h) preserva o recente';
end $$;
commit;
