# FlowGuard travel approval demo

This strengthens FlowGuard's existing Travel workspace; Insights remains a
separate team-shared workspace. It does not introduce a new product, email
integration, real booking service, or payment processing.

## Setup

1. Keep the current Supabase project configuration unless the owner explicitly
   chooses to switch it.
2. In the intended Supabase project's SQL editor, apply
   `backend/sql/travel_insights.sql` if it has not already been applied, then
   `backend/sql/travel_workflow.sql`. Review the target project first.
   The second script adds database-enforced approval rules and an activity table.
   It is transactional and can be rerun.
3. Use **synthetic** employee and manager accounts. A trusted database
   administrator assigns the initial manager role in `profiles`, then applies
   `backend/sql/teams.sql`. Existing accounts and records enter FlowGuard Demo
   Team. Roles thereafter come from team membership, not the global profile.
   The reviewing manager must not be the requester.
4. Reload FlowGuard. Travel requires team-scoped workflow version 2 before
   enabling mutations. Both modules require membership in the selected team.
   See `docs/teams-demo.md` for invitations and multiple-team switching.

Do not reapply old RLS test fixtures containing incomplete travel JSON after this
migration: validation now requires traveller, destination, dates, purpose, cost,
and Requested status.

## Policy used for this demo

- All new requests start as **Requested**.
- Estimated cost must be MYR 0–999,999,999.99, with at most two decimal places.
  Departure/return must be real dates; return cannot precede departure.
- Above **MYR 1,000** is `high_budget`; MYR 1,000 or below is `standard`.
  This is an illustrative threshold, not a user-confirmed company policy.
- Every request still needs an independent manager's decision. Nothing is
  auto-approved, including a manager's own submission.
- The owner may edit/delete only Requested records.
- Another manager may approve/reject a Requested record; another manager may mark
  an Approved record Booked. Every decision/booking requires a reason.
- Booked and Rejected are closed. To seek approval after rejection, create a new
  request rather than rewrite the original decision.
- Approval locks the submitted details. Changing them requires a new request.
- Database triggers enforce these rules even for direct browser API calls.
  Rule metadata is calculated by the database.
- Each successful action writes its activity in the same database transaction.
  Browser accounts cannot insert, rewrite, or delete log entries.
- A deleted pending request retains its activity. There is no fabricated history
  for records created before the migration.
- Optimistic timestamp checks reject stale edits/decisions. Decisions also lock
  the row while checking its current status.

Manager visibility is limited to teams where the account is a manager. Employees
see their own Travel requests and all Insights in their joined teams. Employees
can edit only their own Insights; managers can manage Insights within their team.
Keep using synthetic data for this assignment demonstration.

## Rehearsal (two browser sessions)

1. Employee: submit a synthetic request, purpose “Demo client review,” departure
   2026-11-02, return 2026-11-04, cost MYR 1,500. Show the review flag and Requested
   status. Open history and show Submitted.
2. Employee: change cost to MYR 1,000 while pending. The flag becomes standard,
   but approval is still required. Show Edited in history.
3. Manager: refresh Travel, filter Requested, open the request, review context,
   enter a reason, and Approve. Show Approved and its activity entry.
4. Employee: refresh and show the approval, manager note, locked details, and
   next step. Approval does not place a real booking.
5. Manager: record a synthetic booking confirmation note and Mark booked.
   Employee refreshes and sees Booked and the full history.
6. Alternate path: submit another request and Reject with a reason.
7. Safety checks: no employee approval control, no manager self-approval,
   invalid dates blocked, empty decision note blocked, no booking before approval,
   second employee cannot see someone else's request or history.
8. Delete one pending synthetic request; show that its deletion history remains.
9. Open Insights, create/edit an entry, and confirm it still works independently.

## Verification commands

- `npm test`: pure workflow rules, notification/calculation regressions.
- `npm run test:workflow-db`: starts a disposable local PostgreSQL cluster in
  `/tmp`, applies a minimal synthetic Supabase fixture, applies the migration
  twice, exercises permissions/transitions/log integrity, then stops and removes
  the cluster. Requires PostgreSQL tools on PATH. It never connects to Supabase.
- `npm run test:workflow-ui`: headless Chromium interactions using the actual
  frontend and a test-only simulated Supabase client. It does not bypass app
  authentication or touch live data.

Local tests are not evidence that the linked Supabase project's migrations,
authentication settings, or account policies are correct. Rehearse with the
intended Supabase project after setup.

## Assignment explanation

**Trigger:** employee submits operational travel context. **Connected data:**
request details, estimated cost, requester role, and linked claim reference
(a reference only, not a claim-system integration). **Decision:** consistent
budget flag and validation. **Human control:** independent manager approval.
**Outcome:** visible approval/rejection/booking status. **Accountability:**
role-labelled, timestamped activity history.

For a measurable benefit, time the same review task using scattered demo messages
and spreadsheets, then using FlowGuard. Report the measured results honestly;
do not present an assumed time saving as a proven result.
