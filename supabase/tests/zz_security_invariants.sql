-- Invariantes de segurança: valem para qualquer tabela criada no futuro.
\set ON_ERROR_STOP on
do $$
declare t text;
begin
  select string_agg(c.relname, ', ') into t
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  assert t is null, 'tabelas sem RLS: ' || coalesce(t, '');

  select string_agg(p.proname, ', ') into t
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef
    and (p.proconfig is null or not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%'));
  assert t is null, 'SECURITY DEFINER sem search_path fixo: ' || coalesce(t, '');

  select string_agg(table_name, ', ') into t
  from information_schema.role_table_grants
  where table_schema = 'public' and grantee = 'anon';
  assert t is null, 'anon com acesso direto a tabelas: ' || coalesce(t, '');
  raise notice 'PASS: toda tabela pública tem RLS; SECURITY DEFINER com search_path fixo; anon sem acesso direto a tabelas';
end $$;
