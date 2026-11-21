-- Add a visual identifier to projects without changing existing records.
-- Existing projects receive the default rocket emoji.
alter table public.projects
  add column if not exists emoji text not null default '🚀';

alter table public.projects
  add constraint projects_emoji_length
  check (char_length(emoji) between 1 and 8);
