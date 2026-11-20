#!/usr/bin/env bash
# Valida migrações + suítes SQL em um Postgres local descartável (sem Supabase).
# Uso: scripts/db-local.sh   (requer postgresql-16 instalado; roda como usuário não-root)
set -euo pipefail
cd "$(dirname "$0")/.."
PGBIN=${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)}
DIR=$(mktemp -d); PORT=${PGPORT:-54329}
if [ "$(id -u)" = 0 ]; then id pgtest >/dev/null 2>&1 || useradd -m pgtest; chown pgtest "$DIR"; RUN="su pgtest -c"; else RUN="bash -c"; fi
$RUN "$PGBIN/initdb -D $DIR/data -A trust >/dev/null"
$RUN "$PGBIN/pg_ctl -D $DIR/data -o '-p $PORT -k $DIR' -l $DIR/log -w start >/dev/null"
trap '$RUN "$PGBIN/pg_ctl -D $DIR/data -m immediate stop >/dev/null" || true; rm -rf "$DIR"' EXIT
export PGHOST=$DIR PGPORT=$PORT PGUSER=${PGUSER_OVERRIDE:-pgtest}; [ "$(id -u)" != 0 ] && PGUSER=$(whoami)
$RUN "$PGBIN/createdb -h $DIR -p $PORT orbita_test"
export PGDATABASE=orbita_test
P="$PGBIN/psql -v ON_ERROR_STOP=1 -q"
$RUN "$P -h $DIR -p $PORT -d orbita_test -f supabase/tests/00_supabase_shim.sql"
for f in supabase/migrations/*.sql; do echo ">> $f"; $RUN "$P -h $DIR -p $PORT -d orbita_test -f $f"; done
FAIL=0
for f in supabase/tests/*.sql; do
  case $f in *00_supabase_shim*) continue;; esac
  echo ">> $f"
  if OUT=$($RUN "$P -h $DIR -p $PORT -d orbita_test -f $PWD/$f" 2>&1); then RC=0; else RC=1; fi
  echo "$OUT" | grep -E "PASS|ERROR|FAIL" || true
  [ "$RC" = 0 ] || { echo "FALHOU: $f"; FAIL=1; }
done
# Concorrência: 16 pessoas aceitando o mesmo convite ao mesmo tempo.
if [ -x "$PGBIN/pgbench" ]; then
  echo ">> concorrência de convites (pgbench)"
  TOK=$(printf 'a%.0s' $(seq 1 64))
  $RUN "$P -h $DIR -p $PORT -d orbita_test -f $PWD/supabase/tests/concurrency/invite_setup.sql" || FAIL=1
  $RUN "$PGBIN/pgbench -n -h $DIR -p $PORT -f $PWD/supabase/tests/concurrency/invite_accept.pgbench -c 16 -j 4 -t 1 -D tok=$TOK orbita_test" >/dev/null 2>&1 || true
  if OUT=$($RUN "$P -h $DIR -p $PORT -d orbita_test -f $PWD/supabase/tests/concurrency/invite_verify.sql" 2>&1); then :; else FAIL=1; fi
  echo "$OUT" | grep -E "PASS|ERROR|FAIL" || true
fi
# Backup/restore: dump completo -> banco novo -> mesmas contagens, políticas e funções.
echo ">> backup e restauração (pg_dump/pg_restore)"
$RUN "$PGBIN/pg_dump -h $DIR -p $PORT -Fc -f $DIR/backup.dump orbita_test" || FAIL=1
$RUN "$PGBIN/createdb -h $DIR -p $PORT orbita_restore" || FAIL=1
$RUN "$PGBIN/pg_restore -h $DIR -p $PORT -d orbita_restore --no-owner $DIR/backup.dump" >/dev/null 2>&1 || true
SNAP="select (select string_agg(relname||'='||n_live_tup, ',' order by relname) from pg_stat_user_tables where schemaname='public') as _x"
COUNTS="select string_agg(c.relname||'='||(xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', c.relname), false, true, '')))[1]::text, ',' order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'"
STRUCT="select (select count(*) from pg_policies where schemaname='public')||'/'||(select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public')||'/'||(select count(*) from pg_trigger where not tgisinternal)"
A=$($RUN "$PGBIN/psql -h $DIR -p $PORT -d orbita_test -Atc \"$COUNTS\"")
B=$($RUN "$PGBIN/psql -h $DIR -p $PORT -d orbita_restore -Atc \"$COUNTS\"")
SA=$($RUN "$PGBIN/psql -h $DIR -p $PORT -d orbita_test -Atc \"$STRUCT\"")
SB=$($RUN "$PGBIN/psql -h $DIR -p $PORT -d orbita_restore -Atc \"$STRUCT\"")
if [ -n "$A" ] && [ "$A" = "$B" ] && [ "$SA" = "$SB" ]; then echo "PASS: restauração idêntica (contagens por tabela e $SA políticas/funções/gatilhos)"; else echo "FAIL: restauração diverge"; echo "orig:  $A"; echo "rest:  $B"; echo "estr:  $SA vs $SB"; FAIL=1; fi
[ "$FAIL" = 0 ] && echo "OK: migrações e suítes SQL concluídas" || { echo "ERRO: há suítes com falha"; exit 1; }
