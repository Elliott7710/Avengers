# FlowGuard hackathon demo runbook

## Goal and honest scope

Show a synthetic employee request moving through validation and an illustrative
budget flag, an independent manager decision, a visible employee outcome, and a
role-labelled activity history. This demonstrates workflow enforcement and
human control. If the optional Runpod key is configured, it can also demonstrate
a manager-requested AI summary draft. It does not demonstrate real booking,
accounting integration, customer validation, or measured time savings.

## Readiness checks

1. Start the Replit **FlowGuard: web** and **API Server** workflows.
2. Confirm the Supabase URL and publishable key are present through Replit
   Secrets without copying them into this runbook, chat, or screenshots.
3. Confirm the intended Supabase project, Auth Site URL, and allowed redirect
   URLs. Do not apply SQL to an unreviewed or production project.
4. Confirm the required schema is installed in an isolated staging project:
   `profiles.sql`, `travel_insights.sql`, `privacy_requests.sql` if demonstrating
   privacy requests, `travel_workflow.sql`, then `teams.sql`. See
   [`backend/sql/README.md`](../backend/sql/README.md).
5. Create two synthetic accounts in the same demo team: one employee and one
   manager. The reviewer must be a different account from the request owner.
6. If demonstrating the AI summary, confirm `RUNPOD_API_KEY` is present in
   Replit Secrets without copying it into notes, and ensure the Runpod account
   has credits. The current listed rate for the
   Qwen3 32B AWQ endpoint is $10 per 1 million tokens; confirm current pricing.
   Keep the key out of screenshots and logs.
7. Use synthetic data only. The illustrative threshold is MYR 1,000 and is not
   an approved business policy.
8. Keep a backup screen recording or static screenshots only if they contain no
   credentials, real personal data, or private invitation codes.

**If staging setup is incomplete:** do not imply the signed-in journey was live.
Use local tests to explain the intended behavior, label them as simulated, and
show the unconfigured state honestly. Do not disable authentication or database
permissions to make the demo work.

## Rehearsal journey (two signed-in browser sessions)

| Segment | Action and narration | Visible proof |
|---|---|---|
| 1. Set context | “This is a prototype for small-team travel approvals. The coordination problem is a hypothesis; we have not measured savings.” | Travel workspace and role/team context |
| 2. Submit synthetic request | As employee, submit “Demo client review,” destination “Demo City,” 2–4 November 2026, estimated cost MYR 1,500, with a synthetic claim reference only if required. | Required-field validation, Requested status |
| 3. Show validation/flag | Point out the `high_budget` flag because the illustrative threshold is over MYR 1,000. Explain it is not auto-approval or a confirmed policy. | Budget flag and still-pending request |
| 4. Show initial activity | Open request history. | `Submitted` entry with actor/time |
| 5. Demonstrate edit and recalculation (optional) | While still Requested, change cost to MYR 1,000 and save. The flag becomes standard; approval is still required. | Updated details/flag and `Edited` activity |
| 6. Optional Runpod summary | As manager, confirm external processing for the synthetic request and choose “Draft with Runpod.” Explain that only purpose, destination, dates, estimated cost, and the budget flag are sent. | Temporary draft appears; no employee name, claim reference, account ID, or approval action is sent |
| 7. Independent decision | In the manager session, enter a concise review reason and choose Approve or Reject. The AI draft is only a reference. | Manager decision; no self-approval; note required |
| 8. Show employee outcome | Refresh employee session and show the outcome, manager note, locked details, and next step. | Outcome is visible to requester; no real booking claimed |
| 9. Optional booking | As manager, record a synthetic booking confirmation note and choose Mark booked. | Booked status and activity entry; no booking API |
| 10. Close with history | Reopen activity history and recap submit → validation/flag → optional summary → human decision → outcome → record. | Role-labelled chronological history; summary is not stored in history |

### Optional alternate-path checks

- Submit a second synthetic request and reject it with a reason.
- Show that an employee has no approval control and cannot decide their own
  request.
- Show that invalid dates and an empty decision note are rejected.
- If time permits, show another employee cannot read someone else's request or
  history in the intended staging project.

Do not make live access-isolation claims unless tested with separate accounts
against the configured staging database. Do not demonstrate deletion unless
there is a safe synthetic pending record to remove.

## Proposed benefit measurement (not yet performed)

Measure median minutes from presentation of a complete request to a recorded
manager decision, comparing the same reviewers and equivalent synthetic cases
in the team's current method and FlowGuard. Record the sample size, start/end
times, clarification count, and any setup/training time separately. The
baseline, target percentage, and results are **TBD** until collected; do not
claim a time saving in the demo.

## Likely judge question: “Where is the AI?”

Answer accurately: “There is an optional Runpod Qwen3 32B AWQ feature that drafts
a short summary for a manager after explicit confirmation. It does not approve
or reject requests, and the budget flag and date/field validation are still
deterministic rules. We have not verified live inference until the key is
configured and a synthetic request is tested.”

## Fallbacks

- **Auth/migrations/redirects not ready:** stop before sign-in, show the
  configuration warning or offline test results, and explain that live staging
  verification remains outstanding.
- **Manager session cannot decide:** do not bypass permissions. Show the
  relevant local test and mark the live step unverified.
- **Runpod credits or authenticated staging are not ready:** skip the optional summary. Do not imply
  that the AI request was live or use real employee data.
- **Network unavailable:** use the prerecorded demo only if it is labeled
  clearly as a prior recording from the same build and contains synthetic data.
  Otherwise present the source code and test output as local evidence.
- **No public deployment/video:** give judges the Replit workspace preview and
  source link only if access has been tested; leave the video URL blank until a
  team member publishes and verifies it.
