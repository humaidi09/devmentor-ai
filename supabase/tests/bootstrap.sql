-- Isolated local test stack only; not a production migration.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role authenticator login password 'close-ai-local-only' noinherit;
grant anon,authenticated,service_role to authenticator;
create role supabase_auth_admin login password 'close-ai-local-only' createrole;
create schema auth authorization supabase_auth_admin;
grant usage on schema public to anon,authenticated,service_role;
grant all on schema public to supabase_auth_admin;
create function auth.uid() returns uuid language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid;
$$;
grant usage on schema auth to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant select,insert,update,delete on tables to authenticated;
alter function auth.uid() owner to supabase_auth_admin;
alter role supabase_auth_admin set search_path=auth,public;
