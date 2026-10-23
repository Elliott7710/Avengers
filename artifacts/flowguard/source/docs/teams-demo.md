# Private teams in FlowGuard

## Upgrade the existing demo

The four original setup scripts must already be installed, with at least one
synthetic account whose `profiles.role` is `manager`. In the same Supabase
project's **SQL Editor**, run the full contents of `backend/sql/teams.sql`.

This migration is transactional. It:

- Creates the initial **FlowGuard Demo Team** and adds existing profiles to it.
- Copies the existing employee/manager roles into that team's memberships.
- Assigns existing Travel, Insights, and activity records to the initial team.
- Preserves existing record details, timestamps, and activity entries.
- Makes existing Insights readable by members of this initial team.
- Replaces workspace-wide manager access with team-specific database rules.

Use only synthetic records for this demo. Do not bootstrap unrelated real-company
records into one team. Do not reapply the earlier baseline migrations after this
final migration: they contain the old workspace-wide policies. If that happens,
reapply `teams.sql` before using FlowGuard.

After this migration, changing `profiles.role` does **not** change a user's team
permissions. Membership roles in `flowguard_team_members` are authoritative.
The initial manager can create additional teams from Overview and becomes the
manager of each team they create. Invited accounts join as employees.

## Use teams

1. Reload Overview. The header's **Team** selector lists only your memberships.
2. As a manager, use **Create a team** to create another private team.
3. In that team, select **Create invite code** and share the code only with
   intended members. Codes last seven days and allow up to 20 accounts to join.
4. Another signed-in user pastes the code into **Join a team** on Overview.
5. Use the header selector to switch between joined teams.

There is no public team directory. New signups have no memberships until invited.
Rerunning the migration does not autojoin accounts created after initial setup.
Invite codes are bearer invitations: anyone possessing an unexpired code can
join that team as an employee. Do not post them publicly.

## Access rules

| Resource | Employee | Manager |
| --- | --- | --- |
| Travel | Own requests in joined teams | Requests in teams they manage |
| Approval/booking | No decisions | Another requester's request in managed team |
| Insights | View all in joined team; create/edit/delete own | Manage Insights in managed team |
| Travel activity | Own request history | History within managed team |
| Invitations | Join using a code | Generate codes for managed team |

An account may be a manager in one team and an employee in another. Data belongs
to one team and cannot be moved by changing a browser request. Database policies
enforce membership; the active-team filter in the UI is not the security boundary.
This feature scopes the existing Travel and Insights modules; it does not add a
separate Projects module.

## Verification

- `npm test` checks existing rules/configuration/notifications.
- `npm run test:workflow-db` uses disposable local PostgreSQL, tests the upgrade
  with existing records, reruns migrations, and checks approval, invitation,
  cross-team denial, and employee Insights ownership rules.
- `npm run test:workflow-ui` exercises the real module UI with a simulated API,
  including shared read-only Insights for a different employee.
- `npm run test:teams-ui` exercises invitations, team creation, joining,
  switching, team-role controls, and safe team-name rendering with a simulated API.

These tests do not connect to the linked Supabase project. Live verification
still needs the migration applied and synthetic signed-in sessions. Check that a
manager who belongs only to Team A cannot view or approve Team B's records, that
employees can view team Insights but cannot edit others' entries, and that an
uninvited account sees no team data.

## Loading and caching

Page code and styles use ETag-based browser caching: unchanged files return 304
instead of downloading again, but each visit revalidates so deployed edits are
not hidden behind a long cache lifetime. Runtime Supabase configuration remains
`no-store`.

Within a page, concurrent sign-in checks share one request. Module records are
cached in memory for up to 15 seconds and separated by account, team, role, and
module. Travel and its notifications can share the same request; other pages
limit notification reads to 100 records. Each module loads only its own records.

Successful saves, deletions, and decisions invalidate cached results and notify
other open tabs to discard their caches. Signing out clears the page cache.
Travel's Refresh all and Insights' Refresh buttons bypass recent cached results.
Errors are not cached, private rows are not persisted in browser storage, and
team membership is fetched again on navigation. Privacy requests and audit
history are not cached. No additional SQL migration is needed for caching.
