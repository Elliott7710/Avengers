-- READ-ONLY preflight for a staging Supabase project.
-- Run in the staging project's SQL editor before writing or applying a
-- migration. This script does not change tables, grants, or policies.
--
-- Expected behavior from the supplied policy snapshot:
--   * authenticated users may SELECT only the profile whose id matches auth.uid()
--   * managers have no additional profile-read policy
--   * no profile INSERT/UPDATE/DELETE policy was included in the snapshot
--
-- Confirm the actual table and row-level-security state first.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS row_level_security_enabled,
  c.relforcerowsecurity AS row_level_security_forced,
  has_table_privilege('anon', c.oid, 'SELECT') AS anon_can_select,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_can_select,
  has_table_privilege('authenticated', c.oid, 'INSERT') AS authenticated_can_insert,
  has_table_privilege('authenticated', c.oid, 'UPDATE') AS authenticated_can_update,
  has_table_privilege('authenticated', c.oid, 'DELETE') AS authenticated_can_delete
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'profiles'
  AND c.relkind IN ('r', 'p');

-- List every active policy on public.profiles, including any additional
-- permissive policies that could broaden the supplied own-profile rule.
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- Distinguish table-level grants from column-level grants on the role field.
-- A table-level UPDATE grant can allow updates beyond column-specific grants.
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

SELECT
  grantee,
  column_name,
  privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'role'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- Confirm whether authenticated users have column-level UPDATE on role.
-- If profiles/role is absent, this returns no rows.
SELECT
  a.attname AS column_name,
  has_column_privilege('authenticated', c.oid, a.attname, 'UPDATE')
    AS authenticated_can_update_column
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
JOIN pg_attribute AS a ON a.attrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relname = 'profiles'
  AND a.attname = 'role'
  AND a.attnum > 0
  AND NOT a.attisdropped;
