# Database SQL

## First install for a new FlowGuard Supabase project

The project's browser-safe URL and publishable key are configured using Replit
Secrets (`FLOWGUARD_SUPABASE_URL` and
`FLOWGUARD_SUPABASE_PUBLISHABLE_KEY`). They connect the client but do not create
database tables. The browser key is public by design; never place a Supabase
service-role key or database password in frontend code or these files.

The connected user's own Supabase project initially returned 404 for the
profiles, travel, insights, and activity tables. No schema changes or records
were written during that check. In the SQL editor of the intended Supabase
project, apply these scripts in order:

1. `profiles.sql` — profile table and safe employee profile creation at signup.
2. `travel_insights.sql` — Travel and Insights tables, RLS, and role protection.
3. `privacy_requests.sql` — optional privacy request intake used by the Profile
   page; customer managers cannot read or update it.
4. `travel_workflow.sql` — guarded travel approval and activity history.

Then create the synthetic employee and manager accounts and assign the initial
manager's `profiles.role` through the trusted SQL Editor, as described below.
Finally apply **`teams.sql`**. The current frontend requires this final migration;
the earlier four scripts alone no longer enable team-scoped modules.

### Existing demo upgrade: teams

If the first four scripts are already installed and a manager account exists,
run only `teams.sql` in that same project's SQL Editor. It creates an initial
**FlowGuard Demo Team**, adds existing profiles to that team using their current
employee/manager roles, and assigns all existing Travel, Insights, and activity
records to it. It preserves record details, timestamps, and history. Existing
Insights become readable by members of this initial team; do not run this
bootstrap against unrelated real-company data.

Afterward roles are team-specific; `profiles.role` is only a legacy/bootstrap
value and no longer grants access across teams. Newly registered accounts must
join using a manager-issued code. Rerunning the migration does not automatically
add new accounts to the initial team. See `docs/teams-demo.md` for the UI flow.

Each script contains transaction boundaries and may be rerun. Review the target
project in the Supabase dashboard before executing them. Existing accounts are
not backfilled or promoted by `profiles.sql`; this project's preflight found no
FlowGuard tables, so no FlowGuard data was affected.

New signups become employees. To create a manager for a synthetic demo, first
sign up that account, then in Supabase SQL Editor set only that intended profile's
role to `manager` using its verified auth user ID. Role assignment is trusted
admin work and must never be made available as a browser form.

After applying, verify the tables exist with the zero-row checks in
`docs/travel-workflow-demo.md`. Sign up an employee and manager using synthetic
data; verify email confirmation or disable it only for an isolated demo project.
Configure the Supabase Auth Site URL and allowed redirect URL for the Replit
preview/deployment host as appropriate.

Run `profile-access-audit.sql` against staging before applying database permission
changes. It is read-only and inspects the existing `profiles` table, RLS state,
policies, and grants; it does not modify the database.

Apply `privacy_requests.sql` to staging before enabling the privacy-request form.
Authenticated users can submit requests and read only their own request history.
Customer workspace managers receive no access; FlowGuard operators process
requests through trusted Supabase admin access. No request status can be changed
from the browser. The table intentionally does not cascade-delete with an auth
account so an account-deletion request remains available for processing. Set and
document a retention period before launch.

Run `tests/privacy_requests_rls_test.sql` in a disposable staging project with
two employee accounts and one manager. It verifies anonymous denial, own-request
access, cross-user isolation, manager isolation, and that users cannot change or
delete requests. The test rolls back its test data.

Apply `travel_insights.sql` to the existing Supabase project before using the
Travel or Insights pages. It creates two FlowGuard module tables with RLS.
Before `teams.sql`, employees can access only records they own; accounts whose protected
`profiles.role` is `manager` can read, update, and delete records across this
workspace. New records are always owned by the signed-in user. These
baseline policies have workspace-wide manager scope. `teams.sql` replaces those
policies with team membership checks; do not stop at the baseline migration.

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

The older `tests/travel_insights_rls_test.sql` is for baseline, pre-team policies
only. For the current schema, use `npm run test:workflow-db`: it tests the
upgrade with existing records, reruns migrations, and checks team membership,
shared Insights reads, author-only employee edits, and manager team isolation.
It never connects to the linked Supabase project. Verify the installed project
separately using synthetic accounts.

Do not store credentials or service-role keys in this folder.

## Travel approval workflow

After `travel_insights.sql`, apply `travel_workflow.sql` in the same Supabase
project as the frontend, then apply `teams.sql`. Travel checks for workflow
version 2 and blocks mutations until the team migration is installed. The triggers restrict pending edits to the
owner, require an independent manager and a note for approvals/rejections/bookings,
validate dates/costs, and write append-only activity atomically. Manager scope
is limited to the teams where the account has manager membership.

See `docs/travel-workflow-demo.md` for the illustrative MYR 1,000 flag, setup,
legacy-record limitations, and the employee/manager rehearsal.
`npm run test:workflow-db` uses a disposable local fixture and never uses your
Supabase credentials. The older travel RLS test uses incomplete travel payloads;
use the new `tests/travel_workflow_test.sql` via that command for the full workflow.
