#!/usr/bin/env bash
# Runs an isolated, loopback-only integration test stack, never a hosted project.
set -euo pipefail
cd "$(dirname "$0")/.."
docker_local() { env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock "$@"; }
stack() { docker_local compose -p close-ai-phase3 -f supabase/compose.test.yml "$@"; }
if [[ ${1:-} == reset ]]; then stack down -v; fi
stack up -d
for attempt in {1..60}; do
 if curl -fsS http://127.0.0.1:59999/health >/dev/null; then break; fi
 sleep 1
done
curl -fsS http://127.0.0.1:59999/health >/dev/null
stack exec -T db psql -U postgres -v ON_ERROR_STOP=1 -c 'create schema if not exists supabase_migrations; create table if not exists supabase_migrations.schema_migrations(version text primary key);'
for file in supabase/migrations/*.sql; do
 version="$(basename "$file" | cut -d_ -f1)"
 applied="$(stack exec -T db psql -U postgres -Atc "select count(*) from supabase_migrations.schema_migrations where version='$version'")"
 if [[ $applied == 0 ]]; then
  stack exec -T db psql -U postgres -v ON_ERROR_STOP=1 --single-transaction < "$file"
  stack exec -T db psql -U postgres -v ON_ERROR_STOP=1 -c "insert into supabase_migrations.schema_migrations values('$version')"
 fi
done
stack exec -T db psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/auth-compat.sql
stack exec -T db psql -U postgres -v ON_ERROR_STOP=1 < supabase/seed-demo.sql
stack exec -T db psql -U postgres -v ON_ERROR_STOP=1 -c "notify pgrst, 'reload schema'"
