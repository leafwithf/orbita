-- ============================================================================
-- ÓRBITA — 0002: MVP pessoal (Etapa 4)
-- Histórico automático, consistência de conclusão, conversão de ideia em
-- projeto e busca textual. Tudo respeita RLS (funções SECURITY INVOKER),
-- exceto o log de atividade, que precisa gravar mesmo para papéis restritos.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. completed_at sempre coerente com o status da tarefa
-- ---------------------------------------------------------------------------
create or replace function public.sync_task_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' then
    if tg_op = 'INSERT' or old.status is distinct from 'done' then
      new.completed_at := coalesce(new.completed_at, now());
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_sync_completed_at
  before insert or update of status on public.tasks
  for each row execute function public.sync_task_completed_at();

-- ---------------------------------------------------------------------------
-- 2. Histórico: eventos relevantes de projetos, tarefas, ideias e cursos
--    (edições comuns e mudanças só de posição não geram evento)
-- ---------------------------------------------------------------------------
create or replace function public.log_entity_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new jsonb := to_jsonb(new);
  v_old jsonb;
  v_verb text;
  v_from text;
  v_to text;
  v_type text := case tg_table_name
    when 'projects' then 'project' when 'tasks' then 'task'
    when 'ideas' then 'idea' else 'course' end;
begin
  if tg_op = 'INSERT' then
    v_verb := 'created';
  else
    v_old := to_jsonb(old);
    if v_old->>'deleted_at' is null and v_new->>'deleted_at' is not null then
      v_verb := 'trashed';
    elsif v_old->>'deleted_at' is not null and v_new->>'deleted_at' is null then
      v_verb := 'restored';
    elsif v_old->>'archived_at' is null and v_new->>'archived_at' is not null then
      v_verb := 'archived';
    elsif v_old->>'archived_at' is not null and v_new->>'archived_at' is null then
      v_verb := 'unarchived';
    elsif tg_table_name = 'tasks' and v_old->>'status' is distinct from v_new->>'status' then
      v_from := v_old->>'status'; v_to := v_new->>'status';
      v_verb := case when v_to = 'done' then 'completed'
                     when v_from = 'done' then 'reopened'
                     else 'status_changed' end;
    elsif tg_table_name = 'ideas' and v_old->>'state' is distinct from v_new->>'state' then
      v_from := v_old->>'state'; v_to := v_new->>'state';
      v_verb := case when v_to = 'converted' then 'converted' else 'state_changed' end;
    elsif tg_table_name = 'projects' and v_old->>'stage' is distinct from v_new->>'stage' then
      v_from := v_old->>'stage'; v_to := v_new->>'stage';
      v_verb := 'stage_changed';
    elsif tg_table_name in ('projects', 'courses') and v_old->>'status' is distinct from v_new->>'status' then
      v_from := v_old->>'status'; v_to := v_new->>'status';
      v_verb := 'status_changed';
    else
      return new;
    end if;
  end if;

  insert into public.activity_events (
    workspace_id, actor_id, verb, entity_type, entity_id, metadata
  )
  values (
    new.workspace_id, auth.uid(), v_verb, v_type, new.id,
    jsonb_strip_nulls(jsonb_build_object(
      'title', v_new->>'title', 'from', v_from, 'to', v_to
    ))
  );
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['projects', 'tasks', 'ideas', 'courses'] loop
    execute format(
      'create trigger %I after insert or update on public.%I
       for each row execute function public.log_entity_activity()',
      t || '_log_activity', t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Converter ideia em projeto (atômico; usa as políticas do chamador)
-- ---------------------------------------------------------------------------
create or replace function public.convert_idea_to_project(p_idea uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_idea public.ideas%rowtype;
  v_project uuid;
begin
  select * into v_idea
  from public.ideas
  where id = p_idea and deleted_at is null
  for update;

  if not found then
    raise exception 'idea_not_found' using errcode = '23503';
  end if;
  if v_idea.state = 'converted' then
    raise exception 'already_converted' using errcode = '23505';
  end if;

  insert into public.projects (workspace_id, title, description, stage, created_by, owner_id)
  values (v_idea.workspace_id, v_idea.title, v_idea.body, 'planning', auth.uid(), auth.uid())
  returning id into v_project;

  update public.ideas
  set state = 'converted', converted_project_id = v_project
  where id = p_idea;

  return v_project;
end;
$$;

revoke all on function public.convert_idea_to_project(uuid) from public;
grant execute on function public.convert_idea_to_project(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Busca textual (sem acento, sem diferenciar caixa, curingas literais)
-- ---------------------------------------------------------------------------
create or replace function public.fold_text(p_text text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(translate(
    coalesce(p_text, ''),
    'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
    'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'
  ))
$$;

create or replace function public.search_workspace(
  p_workspace uuid,
  p_query text,
  p_limit integer default 20
)
returns table (entity_type text, id uuid, title text, snippet text, rank integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select '%' || replace(replace(replace(
      public.fold_text(trim(p_query)), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pat
  ),
  hits as (
    select 'idea'::text as entity_type, i.id, i.title, i.body as extra,
           i.created_at as ts
    from public.ideas i
    where i.workspace_id = p_workspace and i.deleted_at is null and i.archived_at is null
    union all
    select 'project', p.id, p.title, coalesce(p.objective, p.description), p.created_at
    from public.projects p
    where p.workspace_id = p_workspace and p.deleted_at is null and p.archived_at is null
    union all
    select 'task', t.id, t.title, t.description, t.created_at
    from public.tasks t
    where t.workspace_id = p_workspace and t.deleted_at is null and t.archived_at is null
    union all
    select 'course', c.id, c.title, coalesce(c.objective, c.next_lesson), c.created_at
    from public.courses c
    where c.workspace_id = p_workspace and c.deleted_at is null and c.archived_at is null
  )
  select h.entity_type, h.id, h.title,
         left(coalesce(h.extra, ''), 140) as snippet,
         case when public.fold_text(h.title) like q.pat escape '\' then 0 else 1 end as rank
  from hits h, q
  where char_length(trim(p_query)) >= 2
    and (public.fold_text(h.title) like q.pat escape '\'
         or public.fold_text(h.extra) like q.pat escape '\')
  order by 5, h.ts desc
  limit least(greatest(p_limit, 1), 50)
$$;

revoke all on function public.search_workspace(uuid, text, integer) from public;
grant execute on function public.search_workspace(uuid, text, integer) to authenticated;
