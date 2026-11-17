-- Simula o mínimo do Supabase em um Postgres puro (roles, auth.users, auth.uid()).
-- SOMENTE para validação local/CI. Nunca rode no Supabase real.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- Storage mínimo (tabelas e foldername) para testar políticas de objetos.
create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text, public boolean not null default false,
  file_size_limit bigint, allowed_mime_types text[]
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text, owner uuid, created_at timestamptz not null default now()
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(p_name text) returns text[]
language sql immutable as $$
  select (string_to_array(p_name, '/'))[1:greatest(array_length(string_to_array(p_name, '/'), 1) - 1, 0)]
$$;
grant usage on schema storage to anon, authenticated, service_role;
grant select, insert on storage.objects to authenticated;
grant select on storage.buckets to authenticated;

-- No Supabase, service_role recebe todos os privilégios nas tabelas do schema public.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
