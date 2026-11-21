-- Add a visual identifier to projects without changing existing records.
-- Existing projects receive the default rocket emoji.
alter table public.projects
  add column if not exists emoji text not null default '🚀';

-- Keep this migration safe when the SQL was already applied manually.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_emoji_length'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_emoji_length
      check (char_length(emoji) between 1 and 8);
  end if;
end
$$;
