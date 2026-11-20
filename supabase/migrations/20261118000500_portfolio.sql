-- Etapa 7: portfólio com link não listado e revogável.
-- O cliente nunca escreve em portfolio_entries: tudo passa por funções que
-- validam papel, geram auditoria e guardam só o hash do token.

-- 1. Cliente: só leitura, sem a coluna do hash -------------------------------------
drop policy if exists portfolio_entries_insert on public.portfolio_entries;
drop policy if exists portfolio_entries_update on public.portfolio_entries;
revoke insert, update, delete on public.portfolio_entries from authenticated, anon;
revoke select on public.portfolio_entries from authenticated, anon;
grant select (id, workspace_id, project_id, slug, summary, visibility,
              published_at, revoked_at, created_at, updated_at)
  on public.portfolio_entries to authenticated;

-- Um projeto tem no máximo uma publicação ativa.
create unique index if not exists portfolio_one_active_per_project
  on public.portfolio_entries (project_id)
  where visibility <> 'private' and revoked_at is null;

-- 2. Publicar ----------------------------------------------------------------------
create or replace function public.publish_portfolio(
  p_project uuid,
  p_summary text,
  p_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ws uuid;
  v_id uuid;
  v_summary text := nullif(btrim(coalesce(p_summary, '')), '');
begin
  select workspace_id into v_ws
  from public.projects
  where id = p_project and deleted_at is null and archived_at is null;
  if not found or auth.uid() is null or not public.has_workspace_role(v_ws, 'editor') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_token_hash' using errcode = '22023';
  end if;
  if v_summary is not null and char_length(v_summary) > 600 then
    raise exception 'summary_too_long' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.portfolio_entries
    where project_id = p_project and visibility <> 'private' and revoked_at is null
  ) then
    raise exception 'already_published' using errcode = '23505';
  end if;

  insert into public.portfolio_entries
    (workspace_id, project_id, slug, summary, visibility, access_token_hash, published_at)
  values
    (v_ws, p_project, substr(replace(gen_random_uuid()::text, '-', ''), 1, 24), v_summary,
     'unlisted', p_token_hash, now())
  returning id into v_id;

  insert into public.audit_logs (workspace_id, actor_id, action, target)
  values (v_ws, auth.uid(), 'portfolio.publish', v_id::text);
  return v_id;
end;
$$;

-- 3. Trocar o token (invalida o link antigo) ---------------------------------------
create or replace function public.rotate_portfolio_token(p_entry uuid, p_token_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_ws uuid;
begin
  select workspace_id into v_ws from public.portfolio_entries
  where id = p_entry and visibility = 'unlisted' and revoked_at is null;
  if not found or auth.uid() is null or not public.has_workspace_role(v_ws, 'editor') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_token_hash' using errcode = '22023';
  end if;
  update public.portfolio_entries
     set access_token_hash = p_token_hash, updated_at = now()
   where id = p_entry;
  insert into public.audit_logs (workspace_id, actor_id, action, target)
  values (v_ws, auth.uid(), 'portfolio.rotate', p_entry::text);
end;
$$;

-- 4. Revogar -----------------------------------------------------------------------
create or replace function public.revoke_portfolio(p_entry uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_ws uuid;
begin
  select workspace_id into v_ws from public.portfolio_entries
  where id = p_entry and visibility <> 'private' and revoked_at is null;
  if not found or auth.uid() is null or not public.has_workspace_role(v_ws, 'editor') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.portfolio_entries
     set visibility = 'private', access_token_hash = null,
         revoked_at = now(), updated_at = now()
   where id = p_entry;
  insert into public.audit_logs (workspace_id, actor_id, action, target)
  values (v_ws, auth.uid(), 'portfolio.revoke', p_entry::text);
end;
$$;

-- 5. Leitura pública: só campos curados --------------------------------------------
-- Nunca devolve riscos, próximo passo, tarefas, arquivos, pessoas ou ids internos.
create or replace function public.get_public_portfolio(p_slug text, p_token_hash text)
returns table (
  title text,
  objective text,
  description text,
  stage text,
  summary text,
  tasks_total integer,
  tasks_done integer,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.title, p.objective, p.description, p.stage::text, e.summary,
         (select count(*)::int from public.tasks t
           where t.project_id = p.id and t.deleted_at is null),
         (select count(*)::int from public.tasks t
           where t.project_id = p.id and t.deleted_at is null and t.status = 'done'),
         e.published_at
  from public.portfolio_entries e
  join public.projects p on p.id = e.project_id
  where e.slug = p_slug
    and e.visibility = 'unlisted'
    and e.revoked_at is null
    and e.access_token_hash is not null
    and e.access_token_hash = p_token_hash
    and p.deleted_at is null
    and p.archived_at is null;
$$;

revoke all on function public.publish_portfolio(uuid, text, text) from public;
revoke all on function public.rotate_portfolio_token(uuid, text) from public;
revoke all on function public.revoke_portfolio(uuid) from public;
revoke all on function public.get_public_portfolio(text, text) from public;
grant execute on function public.publish_portfolio(uuid, text, text) to authenticated;
grant execute on function public.rotate_portfolio_token(uuid, text) to authenticated;
grant execute on function public.revoke_portfolio(uuid) to authenticated;
grant execute on function public.get_public_portfolio(text, text) to anon, authenticated;
