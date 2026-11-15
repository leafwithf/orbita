-- ============================================================================
-- ÓRBITA — 0001: núcleo do produto
-- Perfis, espaços, membros, foco único, projetos, tarefas, ideias, cursos,
-- arquivos, notas, colaboração e portfólio. RLS em todas as tabelas expostas.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.workspace_kind as enum ('personal', 'team', 'client');
create type public.workspace_role as enum (
  'owner', 'admin', 'editor', 'collaborator', 'reader'
);
create type public.member_status as enum ('active', 'suspended');
create type public.focus_scope as enum ('workspace', 'user');
create type public.focus_kind as enum ('project', 'course');
create type public.project_stage as enum (
  'idea', 'research', 'planning', 'design', 'build',
  'review', 'launch', 'follow_up', 'done'
);
create type public.project_status as enum ('active', 'paused', 'completed');
create type public.priority as enum ('low', 'medium', 'high', 'urgent');
create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.idea_state as enum (
  'new', 'evaluating', 'validated', 'not_prioritized', 'converted'
);
create type public.idea_potential as enum ('low', 'medium', 'high');
create type public.course_status as enum (
  'planned', 'in_progress', 'paused', 'completed'
);
create type public.file_status as enum (
  'pending', 'ready', 'quarantined', 'deleted'
);
create type public.portfolio_visibility as enum ('private', 'unlisted', 'public');

-- ---------------------------------------------------------------------------
-- Perfis e preferências
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  timezone text not null default 'America/Sao_Paulo',
  locale text not null default 'pt-BR',
  onboarding_done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (char_length(full_name) <= 120)
);

create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  theme text not null default 'system'
    check (theme in ('system', 'light', 'dark')),
  start_of_week smallint not null default 1
    check (start_of_week between 0 and 6),
  notification_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Espaços e pessoas
-- ---------------------------------------------------------------------------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind public.workspace_kind not null default 'personal',
  focus_scope public.focus_scope not null default 'workspace',
  settings jsonb not null default '{}'::jsonb,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint workspaces_name_length check (
    char_length(name) between 1 and 80
  ),
  constraint workspaces_slug_format check (slug ~ '^[a-z0-9-]{3,80}$')
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.workspace_role not null default 'collaborator',
  status public.member_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text,
  role public.workspace_role not null default 'collaborator'
    check (role <> 'owner'),
  token_hash text not null unique,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  revoked_at timestamptz,
  invited_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint invitations_email_lowercase check (
    email is null or email = lower(email)
  )
);

-- ---------------------------------------------------------------------------
-- Foco único (projeto/curso principal)
-- ---------------------------------------------------------------------------
create table public.focus_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind public.focus_kind not null,
  -- 'workspace' ou o id do usuário, derivado de workspaces.focus_scope.
  scope_key text not null,
  target_id uuid not null,
  set_by uuid not null references public.profiles (id) on delete cascade,
  set_at timestamptz not null default now(),
  constraint focus_unique unique (workspace_id, kind, scope_key)
);

-- ---------------------------------------------------------------------------
-- Projetos, tarefas, ideias
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  objective text,
  description text,
  stage public.project_stage not null default 'idea',
  status public.project_status not null default 'active',
  priority public.priority not null default 'medium',
  start_date date,
  due_date date,
  owner_id uuid references public.profiles (id) on delete set null,
  progress_mode text not null default 'tasks'
    check (progress_mode in ('tasks', 'stages')),
  risks text,
  next_step text,
  cover_url text,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_title_length check (
    char_length(title) between 1 and 160
  ),
  constraint projects_dates_order check (
    start_date is null or due_date is null or start_date <= due_date
  )
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  parent_task_id uuid references public.tasks (id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid references public.profiles (id) on delete set null,
  due_date date,
  priority public.priority not null default 'medium',
  status public.task_status not null default 'todo',
  weight numeric(6, 2) not null default 1 check (weight > 0),
  estimate_min integer check (estimate_min is null or estimate_min >= 0),
  spent_min integer check (spent_min is null or spent_min >= 0),
  position numeric not null default 0,
  completed_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_length check (char_length(title) between 1 and 200),
  constraint tasks_not_own_parent check (parent_task_id is null or parent_task_id <> id)
);

create table public.task_checklists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  label text not null,
  done boolean not null default false,
  position numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_checklists_label_length check (
    char_length(label) between 1 and 200
  )
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  body text,
  state public.idea_state not null default 'new',
  potential public.idea_potential,
  converted_project_id uuid references public.projects (id) on delete set null,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ideas_title_length check (char_length(title) between 1 and 160)
);

-- ---------------------------------------------------------------------------
-- Cursos
-- ---------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  platform text,
  url text,
  objective text,
  status public.course_status not null default 'planned',
  progress smallint not null default 0 check (progress between 0 and 100),
  next_lesson text,
  due_date date,
  cover_url text,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_title_length check (char_length(title) between 1 and 160)
);

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  position numeric not null default 0,
  done_at timestamptz,
  materials jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_modules_title_length check (
    char_length(title) between 1 and 160
  )
);

-- ---------------------------------------------------------------------------
-- Notas, arquivos e pastas
-- ---------------------------------------------------------------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  entity_type text not null
    check (entity_type in ('project', 'task', 'course', 'idea', 'file')),
  entity_id uuid not null,
  body text not null default '',
  pinned boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  parent_id uuid references public.folders (id) on delete cascade,
  name text not null,
  context text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint folders_name_length check (char_length(name) between 1 and 120)
);

create table public.files_metadata (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  folder_id uuid references public.folders (id) on delete set null,
  storage_path text not null,
  file_name text not null,
  mime text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  checksum text,
  status public.file_status not null default 'pending',
  scan_status text not null default 'not_scanned'
    check (scan_status in ('not_scanned', 'clean', 'infected', 'error')),
  entity_type text
    check (entity_type is null or entity_type in ('project', 'task', 'course', 'idea')),
  entity_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint files_path_unique unique (workspace_id, storage_path)
);

-- ---------------------------------------------------------------------------
-- Colaboração, tags, notificações e portfólio
-- ---------------------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  entity_type text not null
    check (entity_type in ('project', 'task', 'course', 'idea', 'file')),
  entity_id uuid not null,
  body text not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint comments_body_length check (char_length(body) between 1 and 5000)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  verb text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  color text not null default '#2F6FE0',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_name_unique unique (workspace_id, name),
  constraint tags_name_length check (char_length(name) between 1 and 40)
);

create table public.entity_tags (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  entity_type text not null
    check (entity_type in ('project', 'task', 'course', 'idea', 'file')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (tag_id, entity_type, entity_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  slug text not null unique,
  summary text,
  visibility public.portfolio_visibility not null default 'private',
  access_token_hash text,
  published_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_slug_format check (slug ~ '^[a-z0-9-]{12,80}$'),
  constraint portfolio_unlisted_needs_token check (
    visibility <> 'unlisted' or access_token_hash is not null
  )
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target text,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
create index workspaces_owner_idx on public.workspaces (owner_id);
create index workspace_members_user_idx
  on public.workspace_members (user_id, status);
create index invitations_workspace_idx
  on public.invitations (workspace_id, created_at desc);
create index invitations_expires_idx on public.invitations (expires_at)
  where accepted_at is null and revoked_at is null;

create index projects_workspace_status_idx
  on public.projects (workspace_id, status) where deleted_at is null;
create index projects_workspace_due_idx
  on public.projects (workspace_id, due_date) where deleted_at is null;

create index tasks_workspace_status_idx
  on public.tasks (workspace_id, status) where deleted_at is null;
create index tasks_workspace_due_idx
  on public.tasks (workspace_id, due_date) where deleted_at is null;
create index tasks_assignee_status_idx
  on public.tasks (assignee_id, status) where deleted_at is null;
create index tasks_project_status_idx
  on public.tasks (project_id, status) where deleted_at is null;
create index tasks_parent_idx on public.tasks (parent_task_id);
create index task_checklists_task_idx
  on public.task_checklists (task_id, position);

create index ideas_workspace_state_idx
  on public.ideas (workspace_id, state) where deleted_at is null;
create index courses_workspace_status_idx
  on public.courses (workspace_id, status) where deleted_at is null;
create index course_modules_course_idx
  on public.course_modules (course_id, position);

create index notes_entity_idx
  on public.notes (workspace_id, entity_type, entity_id) where deleted_at is null;
create index folders_workspace_parent_idx
  on public.folders (workspace_id, parent_id) where deleted_at is null;
create index files_workspace_status_idx
  on public.files_metadata (workspace_id, status) where deleted_at is null;
create index files_entity_idx
  on public.files_metadata (workspace_id, entity_type, entity_id);

create index comments_entity_idx
  on public.comments (workspace_id, entity_type, entity_id, created_at)
  where deleted_at is null;
create index activity_workspace_created_idx
  on public.activity_events (workspace_id, created_at desc);
create index entity_tags_entity_idx
  on public.entity_tags (workspace_id, entity_type, entity_id);
create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc) where read_at is null;
create index portfolio_workspace_idx
  on public.portfolio_entries (workspace_id, visibility);
create index focus_target_idx on public.focus_assignments (target_id);

-- ---------------------------------------------------------------------------
-- Funções auxiliares de permissão (SECURITY DEFINER evita recursão de RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_workspace_member(p_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = p_workspace
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.has_workspace_role(
  p_workspace uuid,
  p_minimum public.workspace_role
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = p_workspace
      and m.user_id = auth.uid()
      and m.status = 'active'
      and array_position(
        array['reader', 'collaborator', 'editor', 'admin', 'owner'],
        m.role::text
      ) >= array_position(
        array['reader', 'collaborator', 'editor', 'admin', 'owner'],
        p_minimum::text
      )
  );
$$;

create or replace function public.shares_workspace_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members me
    join public.workspace_members them
      on them.workspace_id = me.workspace_id
    where me.user_id = auth.uid()
      and me.status = 'active'
      and them.user_id = p_user
      and them.status = 'active'
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.has_workspace_role(uuid, public.workspace_role)
  from public;
revoke all on function public.shares_workspace_with(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, public.workspace_role)
  to authenticated;
grant execute on function public.shares_workspace_with(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'user_preferences', 'workspaces', 'workspace_members',
    'projects', 'tasks', 'task_checklists', 'ideas', 'courses',
    'course_modules', 'notes', 'folders', 'files_metadata', 'comments',
    'tags', 'portfolio_entries'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I
       for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Provisionamento de novos usuários
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_slug text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1),
    'Você'
  );

  insert into public.profiles (id, full_name)
  values (new.id, v_name)
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  v_slug := 'espaco-' || substr(replace(new.id::text, '-', ''), 1, 10);

  insert into public.workspaces (name, slug, kind, owner_id)
  values ('Meu espaço', v_slug, 'personal', new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'active')
  on conflict (workspace_id, user_id) do nothing;

  return new;
end;
$$;

create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- ---------------------------------------------------------------------------
-- Validação do foco único
-- ---------------------------------------------------------------------------
create or replace function public.validate_focus_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scope public.focus_scope;
  v_target_exists boolean;
begin
  select focus_scope into v_scope
  from public.workspaces
  where id = new.workspace_id and deleted_at is null;

  if v_scope is null then
    raise exception 'workspace_not_found' using errcode = '23503';
  end if;

  if v_scope = 'workspace' and new.scope_key <> 'workspace' then
    raise exception 'focus_scope_mismatch' using errcode = '23514';
  end if;

  if v_scope = 'user' and new.scope_key <> new.set_by::text then
    raise exception 'focus_scope_mismatch' using errcode = '23514';
  end if;

  if new.kind = 'project' then
    select exists (
      select 1 from public.projects
      where id = new.target_id
        and workspace_id = new.workspace_id
        and deleted_at is null
    ) into v_target_exists;
  else
    select exists (
      select 1 from public.courses
      where id = new.target_id
        and workspace_id = new.workspace_id
        and deleted_at is null
    ) into v_target_exists;
  end if;

  if not v_target_exists then
    raise exception 'invalid_focus_target' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger focus_assignments_validate
  before insert or update on public.focus_assignments
  for each row execute function public.validate_focus_assignment();

-- ---------------------------------------------------------------------------
-- RPC: definir foco com serialização (duas abas não vencem juntas)
-- ---------------------------------------------------------------------------
create or replace function public.set_primary_focus(
  p_workspace uuid,
  p_kind public.focus_kind,
  p_target uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_scope public.focus_scope;
  v_scope_key text;
  v_target_title text;
  v_previous_target uuid;
  v_previous_title text;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not public.has_workspace_role(p_workspace, 'editor') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Serializa trocas concorrentes no mesmo workspace.
  select focus_scope into v_scope
  from public.workspaces
  where id = p_workspace and deleted_at is null
  for update;

  if v_scope is null then
    raise exception 'workspace_not_found' using errcode = '23503';
  end if;

  v_scope_key := case
    when v_scope = 'user' then v_user::text
    else 'workspace'
  end;

  if p_kind = 'project' then
    select title into v_target_title
    from public.projects
    where id = p_target
      and workspace_id = p_workspace
      and deleted_at is null;

    select fa.target_id, p.title
      into v_previous_target, v_previous_title
    from public.focus_assignments fa
    left join public.projects p on p.id = fa.target_id
    where fa.workspace_id = p_workspace
      and fa.kind = 'project'
      and fa.scope_key = v_scope_key;
  else
    select title into v_target_title
    from public.courses
    where id = p_target
      and workspace_id = p_workspace
      and deleted_at is null;

    select fa.target_id, c.title
      into v_previous_target, v_previous_title
    from public.focus_assignments fa
    left join public.courses c on c.id = fa.target_id
    where fa.workspace_id = p_workspace
      and fa.kind = 'course'
      and fa.scope_key = v_scope_key;
  end if;

  if v_target_title is null then
    raise exception 'invalid_focus_target' using errcode = '23514';
  end if;

  insert into public.focus_assignments (
    workspace_id, kind, scope_key, target_id, set_by
  )
  values (p_workspace, p_kind, v_scope_key, p_target, v_user)
  on conflict (workspace_id, kind, scope_key)
  do update set
    target_id = excluded.target_id,
    set_by = excluded.set_by,
    set_at = now();

  insert into public.activity_events (
    workspace_id, actor_id, verb, entity_type, entity_id, metadata
  )
  values (
    p_workspace,
    v_user,
    'focus_changed',
    p_kind::text,
    p_target,
    jsonb_build_object('previous_target_id', v_previous_target)
  );

  return jsonb_build_object(
    'scope_key', v_scope_key,
    'target_id', p_target,
    'target_title', v_target_title,
    'previous_target_id', v_previous_target,
    'previous_title', v_previous_title
  );
end;
$$;

revoke all on function public.set_primary_focus(
  uuid, public.focus_kind, uuid
) from public;
grant execute on function public.set_primary_focus(
  uuid, public.focus_kind, uuid
) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invitations enable row level security;
alter table public.focus_assignments enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_checklists enable row level security;
alter table public.ideas enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.notes enable row level security;
alter table public.folders enable row level security;
alter table public.files_metadata enable row level security;
alter table public.comments enable row level security;
alter table public.activity_events enable row level security;
alter table public.tags enable row level security;
alter table public.entity_tags enable row level security;
alter table public.notifications enable row level security;
alter table public.portfolio_entries enable row level security;
alter table public.audit_logs enable row level security;

-- Perfis
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_workspace_with(id));

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Preferências
create policy user_preferences_select on public.user_preferences
  for select to authenticated using (user_id = auth.uid());
create policy user_preferences_insert on public.user_preferences
  for insert to authenticated with check (user_id = auth.uid());
create policy user_preferences_update on public.user_preferences
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Espaços
create policy workspaces_select on public.workspaces
  for select to authenticated
  using (public.is_workspace_member(id));

create policy workspaces_insert on public.workspaces
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy workspaces_update on public.workspaces
  for update to authenticated
  using (public.has_workspace_role(id, 'admin'))
  with check (public.has_workspace_role(id, 'admin'));

create policy workspaces_delete on public.workspaces
  for delete to authenticated
  using (owner_id = auth.uid());

-- Membros
create policy workspace_members_select on public.workspace_members
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy workspace_members_insert on public.workspace_members
  for insert to authenticated
  with check (
    public.has_workspace_role(workspace_id, 'admin')
    and role <> 'owner'
  );

create policy workspace_members_update on public.workspace_members
  for update to authenticated
  using (
    public.has_workspace_role(workspace_id, 'admin')
    and role <> 'owner'
  )
  with check (
    public.has_workspace_role(workspace_id, 'admin')
    and role <> 'owner'
  );

create policy workspace_members_delete on public.workspace_members
  for delete to authenticated
  using (
    public.has_workspace_role(workspace_id, 'admin')
    and role <> 'owner'
  );

-- Convites
create policy invitations_select on public.invitations
  for select to authenticated
  using (public.has_workspace_role(workspace_id, 'admin'));
create policy invitations_insert on public.invitations
  for insert to authenticated
  with check (
    public.has_workspace_role(workspace_id, 'admin')
    and invited_by = auth.uid()
  );
create policy invitations_update on public.invitations
  for update to authenticated
  using (public.has_workspace_role(workspace_id, 'admin'))
  with check (public.has_workspace_role(workspace_id, 'admin'));
create policy invitations_delete on public.invitations
  for delete to authenticated
  using (public.has_workspace_role(workspace_id, 'admin'));

-- Foco: leitura para membros; escrita apenas pela RPC.
create policy focus_assignments_select on public.focus_assignments
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- Projetos
create policy projects_select on public.projects
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy projects_insert on public.projects
  for insert to authenticated
  with check (
    public.has_workspace_role(workspace_id, 'editor')
    and created_by = auth.uid()
  );
create policy projects_update on public.projects
  for update to authenticated
  using (public.has_workspace_role(workspace_id, 'editor'))
  with check (public.has_workspace_role(workspace_id, 'editor'));

-- Tarefas
create policy tasks_select on public.tasks
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (
    public.has_workspace_role(workspace_id, 'editor')
    or (
      public.has_workspace_role(workspace_id, 'collaborator')
      and assignee_id = auth.uid()
      and created_by = auth.uid()
    )
  );
create policy tasks_update on public.tasks
  for update to authenticated
  using (
    public.has_workspace_role(workspace_id, 'editor')
    or (
      public.has_workspace_role(workspace_id, 'collaborator')
      and assignee_id = auth.uid()
    )
  )
  with check (
    public.has_workspace_role(workspace_id, 'editor')
    or (
      public.has_workspace_role(workspace_id, 'collaborator')
      and assignee_id = auth.uid()
    )
  );

-- Checklists seguem a tarefa
create policy task_checklists_select on public.task_checklists
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy task_checklists_insert on public.task_checklists
  for insert to authenticated
  with check (
    public.has_workspace_role(workspace_id, 'editor')
    or exists (
      select 1 from public.tasks t
      where t.id = task_id and t.assignee_id = auth.uid()
    )
  );
create policy task_checklists_update on public.task_checklists
  for update to authenticated
  using (
    public.has_workspace_role(workspace_id, 'editor')
    or exists (
      select 1 from public.tasks t
      where t.id = task_id and t.assignee_id = auth.uid()
    )
  )
  with check (
    public.has_workspace_role(workspace_id, 'editor')
    or exists (
      select 1 from public.tasks t
      where t.id = task_id and t.assignee_id = auth.uid()
    )
  );

-- Ideias: captura rápida para colaborador, edição para editor ou autor
create policy ideas_select on public.ideas
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy ideas_insert on public.ideas
  for insert to authenticated
  with check (
    public.has_workspace_role(workspace_id, 'collaborator')
    and created_by = auth.uid()
  );
create policy ideas_update on public.ideas
  for update to authenticated
  using (
    public.has_workspace_role(workspace_id, 'editor')
    or (
      created_by = auth.uid()
      and public.has_workspace_role(workspace_id, 'collaborator')
    )
  )
  with check (public.has_workspace_role(workspace_id, 'collaborator'));

-- Cursos
create policy courses_select on public.courses
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy courses_insert on public.courses
  for insert to authenticated
  with check (
    public.has_workspace_role(workspace_id, 'editor')
    and created_by = auth.uid()
  );
create policy courses_update on public.courses
  for update to authenticated
  using (public.has_workspace_role(workspace_id, 'editor'))
  with check (public.has_workspace_role(workspace_id, 'editor'));

create policy course_modules_select on public.course_modules
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy course_modules_insert on public.course_modules
  for insert to authenticated
  with check (public.has_workspace_role(workspace_id, 'editor'));
create policy course_modules_update on public.course_modules
  for update to authenticated
  using (public.has_workspace_role(workspace_id, 'editor'))
  with check (public.has_workspace_role(workspace_id, 'editor'));

-- Notas
create policy notes_select on public.notes
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy notes_insert on public.notes
  for insert to authenticated
  with check (
    public.has_workspace_role(workspace_id, 'editor')
    and created_by = auth.uid()
  );
create policy notes_update on public.notes
  for update to authenticated
  using (
    public.has_workspace_role(workspace_id, 'editor')
    or created_by = auth.uid()
  )
  with check (public.is_workspace_member(workspace_id));

-- Pastas
create policy folders_select on public.folders
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy folders_insert on public.folders
  for insert to authenticated
  with check (public.has_workspace_role(workspace_id, 'editor'));
create policy folders_update on public.folders
  for update to authenticated
  using (public.has_workspace_role(workspace_id, 'editor'))
  with check (public.has_workspace_role(workspace_id, 'editor'));

-- Arquivos
create policy files_metadata_select on public.files_metadata
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy files_metadata_insert on public.files_metadata
  for insert to authenticated
  with check (
    public.has_workspace_role(workspace_id, 'editor')
    and created_by = auth.uid()
  );
create policy files_metadata_update on public.files_metadata
  for update to authenticated
  using (public.has_workspace_role(workspace_id, 'editor'))
  with check (public.has_workspace_role(workspace_id, 'editor'));

-- Comentários
create policy comments_select on public.comments
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy comments_insert on public.comments
  for insert to authenticated
  with check (
    public.has_workspace_role(workspace_id, 'collaborator')
    and author_id = auth.uid()
  );
create policy comments_update on public.comments
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- Atividade
create policy activity_events_select on public.activity_events
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy activity_events_insert on public.activity_events
  for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and actor_id = auth.uid()
  );

-- Tags
create policy tags_select on public.tags
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy tags_insert on public.tags
  for insert to authenticated
  with check (public.has_workspace_role(workspace_id, 'editor'));
create policy tags_update on public.tags
  for update to authenticated
  using (public.has_workspace_role(workspace_id, 'editor'))
  with check (public.has_workspace_role(workspace_id, 'editor'));
create policy tags_delete on public.tags
  for delete to authenticated
  using (public.has_workspace_role(workspace_id, 'editor'));

create policy entity_tags_select on public.entity_tags
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy entity_tags_insert on public.entity_tags
  for insert to authenticated
  with check (public.has_workspace_role(workspace_id, 'editor'));
create policy entity_tags_delete on public.entity_tags
  for delete to authenticated
  using (public.has_workspace_role(workspace_id, 'editor'));

-- Notificações
create policy notifications_select on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Portfólio
create policy portfolio_entries_select on public.portfolio_entries
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy portfolio_entries_insert on public.portfolio_entries
  for insert to authenticated
  with check (public.has_workspace_role(workspace_id, 'editor'));
create policy portfolio_entries_update on public.portfolio_entries
  for update to authenticated
  using (public.has_workspace_role(workspace_id, 'editor'))
  with check (public.has_workspace_role(workspace_id, 'editor'));

-- Auditoria: sem policies de cliente (somente service role).

-- ---------------------------------------------------------------------------
-- Privilégios de tabela (RLS continua sendo a barreira real)
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public
  to authenticated;
grant usage on schema public to authenticated;
