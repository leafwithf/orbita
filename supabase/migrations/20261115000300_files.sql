-- ============================================================================
-- ÓRBITA — 0003: arquivos (Etapa 5)
-- Cota atômica, ciclo de upload (pending → ready | quarantined), políticas do
-- Storage, expurgo de lixeira (30 dias) e de uploads pendentes (24 h).
-- ============================================================================

-- 1. Cota de 1 GiB por espaço, serializada por espaço -------------------------
create or replace function public.enforce_file_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_used bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.workspace_id::text, 0));
  select coalesce(sum(size_bytes), 0) into v_used
  from public.files_metadata
  where workspace_id = new.workspace_id
    and deleted_at is null
    and status in ('pending', 'ready');

  if v_used + new.size_bytes > 1073741824 then
    raise exception 'quota_exceeded' using errcode = '53400';
  end if;
  return new;
end;
$$;

create trigger files_metadata_enforce_quota
  before insert on public.files_metadata
  for each row execute function public.enforce_file_quota();

-- 2. Iniciar upload: valida e cria o registro pendente (sob RLS do chamador) ---
create or replace function public.begin_file_upload(
  p_workspace uuid,
  p_name text,
  p_size bigint,
  p_mime text,
  p_entity_type text default null,
  p_entity_id uuid default null
)
returns table (id uuid, storage_path text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_name text := btrim(p_name);
  v_ext text := lower(substring(btrim(p_name) from '\.([^.]+)$'));
begin
  if v_name is null or char_length(v_name) not between 1 and 255
     or v_name ~ '[/\\]' or v_name ~ '[[:cntrl:]]' then
    raise exception 'invalid_file_name' using errcode = '22023';
  end if;
  if p_size is null or p_size <= 0 or p_size > 26214400 then
    raise exception 'invalid_file_size' using errcode = '22023';
  end if;
  if v_ext = any (array[
    'exe','bat','cmd','com','scr','msi','dll','js','mjs','cjs','vbs','ps1',
    'sh','jar','apk','html','htm','xhtml','svg','php','py','rb','pl','swf'
  ]) then
    raise exception 'blocked_file_type' using errcode = '22023';
  end if;

  insert into public.files_metadata (
    id, workspace_id, storage_path, file_name, mime, size_bytes,
    entity_type, entity_id, created_by
  )
  values (
    v_id, p_workspace, 'ws/' || p_workspace || '/' || v_id, v_name,
    lower(btrim(p_mime)), p_size, p_entity_type, p_entity_id, auth.uid()
  );

  return query select v_id, 'ws/' || p_workspace || '/' || v_id;
end;
$$;

revoke all on function public.begin_file_upload(uuid, text, bigint, text, text, uuid) from public;
grant execute on function public.begin_file_upload(uuid, text, bigint, text, text, uuid) to authenticated;

-- 3. Concluir upload: o servidor decide (tamanho/assinatura) e o banco aplica ---
create or replace function public.finalize_file_upload(
  p_file uuid,
  p_ok boolean,
  p_checksum text default null,
  p_reason text default null
)
returns public.file_status
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_file public.files_metadata%rowtype;
  v_status public.file_status;
begin
  select * into v_file
  from public.files_metadata
  where id = p_file and deleted_at is null
  for update;

  if not found or v_file.status <> 'pending' then
    raise exception 'file_not_pending' using errcode = '23514';
  end if;

  v_status := case when p_ok then 'ready' else 'quarantined' end;
  update public.files_metadata
  set status = v_status, checksum = p_checksum
  where id = p_file;

  insert into public.activity_events (
    workspace_id, actor_id, verb, entity_type, entity_id, metadata
  )
  values (
    v_file.workspace_id, auth.uid(),
    case when p_ok then 'file_uploaded' else 'file_quarantined' end,
    'file', p_file,
    jsonb_strip_nulls(jsonb_build_object('title', v_file.file_name, 'reason', p_reason))
  );

  return v_status;
end;
$$;

revoke all on function public.finalize_file_upload(uuid, boolean, text, text) from public;
grant execute on function public.finalize_file_upload(uuid, boolean, text, text) to authenticated;

-- 4. Expurgo (somente service_role): duas fases para não deixar objetos órfãos --
create or replace function public.list_expired_files(
  p_trash_days integer default 30,
  p_pending_hours integer default 24
)
returns table (id uuid, storage_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, f.storage_path
  from public.files_metadata f
  where (f.deleted_at is not null
         and f.deleted_at < now() - make_interval(days => p_trash_days))
     or (f.status = 'pending'
         and f.created_at < now() - make_interval(hours => p_pending_hours))
$$;

create or replace function public.delete_purged_files(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_count integer;
begin
  delete from public.files_metadata where id = any (p_ids);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.list_expired_files(integer, integer) from public, anon, authenticated;
revoke all on function public.delete_purged_files(uuid[]) from public, anon, authenticated;
grant execute on function public.list_expired_files(integer, integer) to service_role;
grant execute on function public.delete_purged_files(uuid[]) to service_role;

-- 5. Storage: bucket privado e políticas por espaço -----------------------------
create or replace function public.storage_workspace_id(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when p_name ~ '^ws/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f-]{36}$'
    then (split_part(p_name, '/', 2))::uuid
  end
$$;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('workspace-files', 'workspace-files', false, 26214400)
    on conflict (id) do update
      set public = false, file_size_limit = 26214400;

    drop policy if exists workspace_files_select on storage.objects;
    create policy workspace_files_select on storage.objects
      for select to authenticated
      using (
        bucket_id = 'workspace-files'
        and public.is_workspace_member(public.storage_workspace_id(name))
      );

    drop policy if exists workspace_files_insert on storage.objects;
    create policy workspace_files_insert on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'workspace-files'
        and exists (
          select 1 from public.files_metadata f
          where f.storage_path = name
            and f.workspace_id = public.storage_workspace_id(name)
            and f.status = 'pending'
            and f.created_by = auth.uid()
        )
      );
    -- Sem políticas de update/delete: remoção de objetos é feita só pelo job com service_role.
  end if;
end;
$$;
