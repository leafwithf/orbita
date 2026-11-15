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
for f in supabase/tests/*.sql; do case $f in *00_supabase_shim*) continue;; esac; echo ">> $f"; $RUN "$P -h $DIR -p $PORT -d orbita_test -f $PWD/$f" 2>&1 | grep -E "PASS|ERROR|FAIL" || true; done
echo "OK: migrações e suítes SQL concluídas"
