# Database SQL

Run `profile-access-audit.sql` against staging before applying database permission
changes. It is read-only and inspects the existing `profiles` table, RLS state,
policies, and grants; it does not modify the database.

Apply `travel_insights.sql` to the existing Supabase project before using the
Travel or Insights pages. It creates two FlowGuard module tables with RLS.
Employees can access only records they own; accounts whose protected
`profiles.role` is `manager` can read, update, and delete records across this
workspace. New records are always owned by the signed-in user. The project has
no organization/team membership relation yet, so manager scope is workspace-wide.

The module tables intentionally use separate names from any normalized
`travel_requests`, `travel_approvals`, or `travel_bookings` tables already in the
project; those workflows have different columns and are not modified here.

The role lookup is performed by a narrowly scoped database function. The
migration forces browser-created profiles to the employee role and blocks
browser-authenticated changes to `profiles.role`; managers must be assigned by a
trusted administrator or server-side process. Never put a service-role key in
browser code.

The Travel and Insights pages import old `flowguard-modules-v1` browser records
only after the signed-in user confirms they own them. They retain the original
browser copy and store a per-browser migration marker so a second account on the
same device cannot automatically claim the same records. If import fails or
conflicts, the page reports the problem and leaves the original data in place.

To verify profile and module isolation, apply
`tests/travel_insights_rls_test.sql` with UUIDs for two employee accounts and
one manager account. It checks own-profile-only reads, rejects employee role
self-assignment, verifies employee record isolation, and checks the configured
manager access. Run it in a disposable staging project because the transaction
inserts temporary test rows before rolling back.

Do not store credentials or service-role keys in this folder.
