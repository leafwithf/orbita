-- ============================================================================
-- ÓRBITA — 0004: colaboração (Etapa 6)
-- Espaços de equipe, convites (hash, 7 dias, uso único), papéis, atribuições,
-- comentários e notificações internas.
-- ============================================================================

-- 0. Aceite registrado ---------------------------------------------------------
alter table public.invitations
  add column accepted_by uuid references public.profiles (id) on delete set null;

-- 1. Ninguém entra num espaço sem aceitar um convite ----------------------------
-- A política antiga deixava um admin inserir qualquer usuário direto em
-- workspace_members. A entrada passa a existir só por accept_invitation (e pelo
-- gatilho que cria o proprietário).
drop policy if exists workspace_members_insert on public.workspace_members;

create or replace function public.guard_member_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.workspace_id <> old.workspace_id or new.user_id <> old.user_id then
      raise exception 'member_identity_immutable' using errcode = '42501';
    end if;
    if new.role = 'admin' and old.role <> 'admin'
       and auth.uid() is not null
       and not public.has_workspace_role(old.workspace_id, 'owner') then
      raise exception 'only_owner_grants_admin' using errcode = '42501';
    end if;
  end if;

  -- Só o proprietário altera ou remove administradores (exceto a própria saída).
  if old.role = 'admin'
     and auth.uid() is not null
     and old.user_id <> auth.uid()
     and not public.has_workspace_role(old.workspace_id, 'owner') then
    raise exception 'only_owner_manages_admin' using errcode = '42501';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger workspace_members_guard
  before update or delete on public.workspace_members
  for each row execute function public.guard_member_change();

-- Quem sai ou é removido deixa de ser responsável por tarefas do espaço.
create or replace function public.unassign_removed_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.tasks
  set assignee_id = null
  where workspace_id = old.workspace_id and assignee_id = old.user_id;
  return old;
end;
$$;

create trigger workspace_members_unassign
  after delete on public.workspace_members
  for each row execute function public.unassign_removed_member();

-- 2. Criar espaço de equipe/cliente ------------------------------------------------
create or replace function public.create_workspace(
  p_name text,
  p_kind public.workspace_kind default 'team'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_name text := btrim(coalesce(p_name, ''));
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_kind not in ('team', 'client') then
    raise exception 'invalid_workspace_kind' using errcode = '22023';
  end if;
  if char_length(v_name) not between 1 and 80 then
    raise exception 'invalid_workspace_name' using errcode = '22023';
  end if;

  insert into public.workspaces (id, name, slug, kind, owner_id)
  values (v_id, v_name, 'equipe-' || replace(v_id::text, '-', ''), p_kind, auth.uid());
  -- o gatilho on_workspace_created adiciona o proprietário como membro
  return v_id;
end;
$$;

revoke all on function public.create_workspace(text, public.workspace_kind) from public;
grant execute on function public.create_workspace(text, public.workspace_kind) to authenticated;

-- 3. Convites ------------------------------------------------------------------------
create or replace function public.create_invitation(
  p_workspace uuid,
  p_role public.workspace_role,
  p_email text,
  p_token_hash text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_kind public.workspace_kind;
  v_pending integer;
begin
  select kind into v_kind from public.workspaces where id = p_workspace and deleted_at is null;
  if not found or not public.has_workspace_role(p_workspace, 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_kind = 'personal' then
    raise exception 'personal_workspace' using errcode = '22023';
  end if;
  if p_role = 'admin' and not public.has_workspace_role(p_workspace, 'owner') then
    raise exception 'only_owner_grants_admin' using errcode = '42501';
  end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_token_hash' using errcode = '22023';
  end if;

  select count(*) into v_pending
  from public.invitations
  where workspace_id = p_workspace
    and accepted_at is null and revoked_at is null and expires_at > now();
  if v_pending >= 20 then
    raise exception 'too_many_invitations' using errcode = '53400';
  end if;

  insert into public.invitations (workspace_id, email, role, token_hash, invited_by)
  values (p_workspace, nullif(lower(btrim(p_email)), ''), p_role, p_token_hash, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.revoke_invitation(p_invitation uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.invitations
  set revoked_at = now()
  where id = p_invitation and accepted_at is null and revoked_at is null;
  if not found then
    raise exception 'invitation_not_revocable' using errcode = '23514';
  end if;
end;
$$;

-- Prévia: mostra espaço e papel ANTES de aceitar. Só para quem está logado.
create or replace function public.preview_invitation(p_token_hash text)
returns table (
  workspace_name text,
  role public.workspace_role,
  email_bound boolean,
  email_matches boolean,
  state text,
  invited_by_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select w.name,
         i.role,
         i.email is not null,
         i.email is null
           or i.email = (select lower(u.email) from auth.users u where u.id = auth.uid()),
         case when i.accepted_at is not null then 'used'
              when i.revoked_at is not null then 'revoked'
              when i.expires_at <= now() then 'expired'
              else 'valid' end,
         p.full_name
  from public.invitations i
  join public.workspaces w on w.id = i.workspace_id and w.deleted_at is null
  left join public.profiles p on p.id = i.invited_by
  where i.token_hash = p_token_hash
    and auth.uid() is not null
$$;

-- Aceite atômico: a linha do convite fica travada, então dois aceites simultâneos
-- nunca passam os dois.
create or replace function public.accept_invitation(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_inv public.invitations%rowtype;
  v_email text;
  v_member public.workspace_members%rowtype;
  v_name text;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select i.* into v_inv
  from public.invitations i
  join public.workspaces w on w.id = i.workspace_id and w.deleted_at is null
  where i.token_hash = p_token_hash
  for update of i;

  if not found then raise exception 'invitation_invalid'; end if;
  if v_inv.accepted_at is not null then raise exception 'invitation_used'; end if;
  if v_inv.revoked_at is not null then raise exception 'invitation_revoked'; end if;
  if v_inv.expires_at <= now() then raise exception 'invitation_expired'; end if;

  if v_inv.email is not null then
    select lower(email) into v_email from auth.users where id = v_user;
    if v_email is distinct from v_inv.email then
      raise exception 'invitation_email_mismatch';
    end if;
  end if;

  select * into v_member
  from public.workspace_members
  where workspace_id = v_inv.workspace_id and user_id = v_user;
  if found then
    raise exception '%', case when v_member.status = 'suspended'
                              then 'membership_suspended' else 'already_member' end;
  end if;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (v_inv.workspace_id, v_user, v_inv.role, 'active');

  update public.invitations
  set accepted_at = now(), accepted_by = v_user
  where id = v_inv.id;

  select full_name into v_name from public.profiles where id = v_user;
  insert into public.notifications (workspace_id, user_id, type, payload)
  values (v_inv.workspace_id, v_inv.invited_by, 'invitation_accepted',
          jsonb_build_object('by', v_user, 'by_name', v_name, 'role', v_inv.role));
  insert into public.activity_events (workspace_id, actor_id, verb, entity_type, entity_id, metadata)
  values (v_inv.workspace_id, v_user, 'member_joined', 'workspace', v_inv.workspace_id,
          jsonb_build_object('title', v_name, 'role', v_inv.role));

  return v_inv.workspace_id;
end;
$$;

revoke all on function public.create_invitation(uuid, public.workspace_role, text, text) from public;
revoke all on function public.revoke_invitation(uuid) from public;
revoke all on function public.preview_invitation(text) from public;
revoke all on function public.accept_invitation(text) from public;
grant execute on function public.create_invitation(uuid, public.workspace_role, text, text) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.preview_invitation(text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;

-- 4. Pessoas: diretório (e-mail só para admin/proprietário), papéis, saída ----------
create or replace function public.list_workspace_members(p_workspace uuid)
returns table (
  user_id uuid, full_name text, email text,
  role public.workspace_role, status public.member_status, joined_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id,
         p.full_name,
         case when public.has_workspace_role(p_workspace, 'admin') then u.email end,
         m.role, m.status, m.created_at
  from public.workspace_members m
  join public.profiles p on p.id = m.user_id
  left join auth.users u on u.id = m.user_id
  where m.workspace_id = p_workspace
    and public.is_workspace_member(p_workspace)
  order by m.created_at
$$;

create or replace function public.change_member_role(
  p_workspace uuid, p_user uuid, p_role public.workspace_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_workspace_role(p_workspace, 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_role = 'owner' then
    raise exception 'owner_not_assignable' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'cannot_change_self' using errcode = '22023';
  end if;

  update public.workspace_members
  set role = p_role
  where workspace_id = p_workspace and user_id = p_user and role <> 'owner';
  if not found then
    raise exception 'member_not_found' using errcode = 'P0002';
  end if;

  insert into public.notifications (workspace_id, user_id, type, payload)
  values (p_workspace, p_user, 'role_changed',
          jsonb_build_object('role', p_role, 'by', auth.uid()));
end;
$$;

create or replace function public.remove_member(p_workspace uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_workspace_role(p_workspace, 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'use_leave_workspace' using errcode = '22023';
  end if;

  delete from public.workspace_members
  where workspace_id = p_workspace and user_id = p_user and role <> 'owner';
  if not found then
    raise exception 'member_not_found' using errcode = 'P0002';
  end if;

  insert into public.notifications (workspace_id, user_id, type, payload)
  values (null, p_user, 'removed_from_workspace',
          jsonb_build_object('workspace_id', p_workspace, 'by', auth.uid()));
end;
$$;

create or replace function public.leave_workspace(p_workspace uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_role public.workspace_role; v_kind public.workspace_kind;
begin
  select m.role, w.kind into v_role, v_kind
  from public.workspace_members m
  join public.workspaces w on w.id = m.workspace_id
  where m.workspace_id = p_workspace and m.user_id = auth.uid() and m.status = 'active';

  if not found then raise exception 'not_a_member' using errcode = '42501'; end if;
  if v_role = 'owner' then raise exception 'owner_cannot_leave' using errcode = '22023'; end if;

  delete from public.workspace_members
  where workspace_id = p_workspace and user_id = auth.uid();
end;
$$;

revoke all on function public.list_workspace_members(uuid) from public;
revoke all on function public.change_member_role(uuid, uuid, public.workspace_role) from public;
revoke all on function public.remove_member(uuid, uuid) from public;
revoke all on function public.leave_workspace(uuid) from public;
grant execute on function public.list_workspace_members(uuid) to authenticated;
grant execute on function public.change_member_role(uuid, uuid, public.workspace_role) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.leave_workspace(uuid) to authenticated;

-- 5. Atribuição de tarefas ---------------------------------------------------------------
create or replace function public.validate_task_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_role public.workspace_role;
begin
  if new.assignee_id is null then return new; end if;
  if tg_op = 'UPDATE' and new.assignee_id is not distinct from old.assignee_id then
    return new;
  end if;

  select role into v_role
  from public.workspace_members
  where workspace_id = new.workspace_id and user_id = new.assignee_id and status = 'active';

  if not found then
    raise exception 'assignee_not_member' using errcode = '23514';
  end if;
  if v_role = 'reader' then
    raise exception 'assignee_cannot_work' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger tasks_validate_assignee
  before insert or update of assignee_id on public.tasks
  for each row execute function public.validate_task_assignee();

create or replace function public.notify_task_assigned()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assignee_id is not null
     and new.assignee_id is distinct from auth.uid()
     and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id) then
    insert into public.notifications (workspace_id, user_id, type, payload)
    values (new.workspace_id, new.assignee_id, 'task_assigned',
            jsonb_build_object('task_id', new.id, 'title', new.title, 'by', auth.uid()));
  end if;
  return new;
end;
$$;

create trigger tasks_notify_assigned
  after insert or update of assignee_id on public.tasks
  for each row execute function public.notify_task_assigned();

-- 6. Comentários ------------------------------------------------------------------------
create or replace function public.validate_comment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare v_exists boolean;
begin
  if tg_op = 'INSERT' then
    execute format(
      'select exists (select 1 from public.%I where id = $1 and workspace_id = $2 and deleted_at is null)',
      case new.entity_type
        when 'project' then 'projects' when 'task' then 'tasks'
        when 'course' then 'courses' when 'idea' then 'ideas'
        else 'files_metadata' end)
    into v_exists using new.entity_id, new.workspace_id;
    if not v_exists then
      raise exception 'entity_not_found' using errcode = '23503';
    end if;
  else
    if new.workspace_id <> old.workspace_id or new.entity_type <> old.entity_type
       or new.entity_id <> old.entity_id or new.author_id <> old.author_id then
      raise exception 'comment_identity_immutable' using errcode = '42501';
    end if;
    if new.body is distinct from old.body then
      new.edited_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger comments_validate
  before insert or update on public.comments
  for each row execute function public.validate_comment();

create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_people uuid[] := '{}';
  v_title text;
begin
  case new.entity_type
    when 'task' then
      select array[created_by, assignee_id], title into v_people, v_title
      from public.tasks where id = new.entity_id;
    when 'project' then
      select array[created_by, owner_id], title into v_people, v_title
      from public.projects where id = new.entity_id;
    when 'idea' then
      select array[created_by], title into v_people, v_title
      from public.ideas where id = new.entity_id;
    when 'course' then
      select array[created_by], title into v_people, v_title
      from public.courses where id = new.entity_id;
    else
      select array[created_by], file_name into v_people, v_title
      from public.files_metadata where id = new.entity_id;
  end case;

  v_people := coalesce(v_people, '{}') || coalesce((
    select array_agg(distinct c.author_id)
    from public.comments c
    where c.entity_type = new.entity_type and c.entity_id = new.entity_id
      and c.id <> new.id and c.deleted_at is null
  ), '{}');

  insert into public.notifications (workspace_id, user_id, type, payload)
  select new.workspace_id, m.user_id, 'comment',
         jsonb_build_object(
           'comment_id', new.id, 'entity_type', new.entity_type,
           'entity_id', new.entity_id, 'title', v_title,
           'by', new.author_id, 'excerpt', left(new.body, 120))
  from public.workspace_members m
  where m.workspace_id = new.workspace_id
    and m.status = 'active'
    and m.user_id = any (v_people)
    and m.user_id <> new.author_id;

  return new;
end;
$$;

create trigger comments_notify
  after insert on public.comments
  for each row execute function public.notify_comment();

-- Autor ou admin apagam (exclusão lógica); admin não edita texto alheio.
create or replace function public.delete_comment(p_comment uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_c public.comments%rowtype;
begin
  select * into v_c from public.comments where id = p_comment and deleted_at is null;
  if not found then raise exception 'comment_not_found' using errcode = 'P0002'; end if;
  if v_c.author_id <> auth.uid() and not public.has_workspace_role(v_c.workspace_id, 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.comments set deleted_at = now() where id = p_comment;
end;
$$;

revoke all on function public.delete_comment(uuid) from public;
grant execute on function public.delete_comment(uuid) to authenticated;

-- 7. Notificações: só read_at muda; criação só por gatilho/RPC ---------------------------
create or replace function public.guard_notification_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (new.id, new.workspace_id, new.user_id, new.type, new.payload, new.created_at)
     is distinct from
     (old.id, old.workspace_id, old.user_id, old.type, old.payload, old.created_at) then
    raise exception 'notification_immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger notifications_guard
  before update on public.notifications
  for each row execute function public.guard_notification_update();

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare v_count integer;
begin
  update public.notifications
  set read_at = now()
  where user_id = auth.uid() and read_at is null
    and (p_ids is null or id = any (p_ids));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.mark_notifications_read(uuid[]) from public;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;
