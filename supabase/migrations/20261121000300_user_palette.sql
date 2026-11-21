alter table public.user_preferences
  add column if not exists palette text not null default 'amber'
  check (palette in ('amber', 'orange', 'blue', 'green', 'purple', 'red'));
