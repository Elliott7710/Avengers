# FlowGuard

FlowGuard is a travel-request and approval workspace for small teams. It is a
prototype for the hypothesis that keeping travel context, budget checks,
independent approval, and decision history together can reduce the coordination
burden of handling requests across messages and spreadsheets. That customer
problem and any time saving are **not yet validated or measured**.

## Hackathon and project status

- **Team:** Avengers
- **Institution:** Asia Pacific University (APU)
- **Challenge:** SDC 2026 — Domain 2: Orbyte Smart SME Challenge
- **Recommended SDG alignment:** SDG 8 — Decent Work and Economic Growth,
  target 8.2, productivity through technological upgrading and innovation.
  Final selection remains for the team to confirm.
- **Proposed Phase 2 goal:** reduce median travel-request review time by 30%
  compared with a measured manual-process baseline. This is a proposed,
  unvalidated target, not an achieved result; the baseline has not been measured.

The project owner reported successful live employee/manager access to an
existing request and approval reflected for the employee with the manager note
and activity history. The owner also supplied a SQL result showing one travel
record assigned to a team. These checks are owner-reported, not an independent
end-to-end security audit.

| Submission link / evidence | Current status |
|---|---|
| Published website | Publication underway; final URL and public access not yet verified |
| GitHub repository | Team-supplied URL: https://github.com/Elliott7710/Avengers — latest contents and public access not verified |
| YouTube product demo | Pending recording and upload |
| Replit proof of use | Workspace and running workflows exist; capture submission evidence |
| Runpod proof of use | Successful live inference remains unverified; an API key alone is not proof |

## Domain 2 alignment

| Challenge requirement | FlowGuard approach |
|---|---|
| One recurring SME burden | Coordinating travel requests, decisions, and follow-ups in one place |
| Automated journey | Request submitted → trip data → validation/budget flag → manager decision → logged outcome |
| Accuracy and consistency | Required-field/date checks, explicit status transitions, and recorded decision notes |
| Human control | A different manager decides; neither budget flags nor AI drafts approve requests |
| Orbyte fit and reuse | A proposed reusable, team-scoped SME workflow; no implemented Orbyte integration or verified platform compatibility is claimed |
| Business benefit and SDG link | Proposed review-time improvement aligned with SDG 8.2; no measured productivity gain claimed |
| Ease of learning | Focused forms, role-specific actions, and visible history; first-time-user usability still needs evaluation |

## What works

- Employees submit travel requests with traveller, destination, dates, purpose,
  estimated cost, and an optional claim reference.
- Requests are validated and marked `standard` or `high_budget` using an
  illustrative MYR 1,000 threshold. This is a demo rule, not a confirmed SME
  policy.
- A different manager must approve or reject a request with a note. No request
  is automatically approved. Approved requests can be marked Booked with a
  booking note; FlowGuard does not book travel or process payments.
- Status changes and edits appear in an append-only activity history. Database
  policies and triggers enforce the workflow; the UI is not the security
  boundary.
- Team membership scopes access to Travel and Insights. Insights is a separate
  workspace module, not part of the approval decision.

The approval rules, synthetic setup, and known edge cases are documented in
[`docs/travel-workflow-demo.md`](docs/travel-workflow-demo.md) and
[`docs/teams-demo.md`](docs/teams-demo.md).

## Current limitations and assumptions

- The SME coordination problem is a **hypothesis**; no customer interviews,
  field study, or timed comparison is claimed.
- The workspace includes an optional, manager-triggered Runpod summary draft
  using the Qwen3 32B AWQ public endpoint. It only runs after the server-side
  key is configured and a manager confirms external processing for that request.
  It does not approve or reject requests. Live inference still needs to be
  verified with the team's Runpod account.
- Validation and budget flags remain deterministic; do not describe them as
  AI-generated.
- The MYR 1,000 threshold is illustrative, not a business-approved policy.
- Use synthetic accounts and records for a demonstration.
- Hosted behavior depends on the documented Supabase schema, access policies,
  and Auth redirect configuration. The owner-reported approval check covers
  only the stated demo flow; it does not verify new-user signup, all team
  isolation cases, or the published site's configuration.
- No production readiness, user count, measured time saving, workshop
  completion, or completed public deployment is asserted here.

## Run on this Replit workspace

This workspace serves FlowGuard as the `artifacts/flowguard` web artifact and
the runtime Supabase configuration endpoint from the `artifacts/api-server`
workflow.

1. Start the **FlowGuard: web** and **API Server** workflows.
2. Add `FLOWGUARD_SUPABASE_URL` and
   `FLOWGUARD_SUPABASE_PUBLISHABLE_KEY` through Replit Secrets. The publishable
   key is intended for browser use; never add a service-role key or database
   password.
3. Optional AI summary setup: add `RUNPOD_API_KEY` through Replit Secrets. The
   integration uses Runpod's pre-deployed `qwen3-32b-awq` public endpoint; no
   custom GPU deployment is needed, but the Runpod account needs credits. The
   request can incur provider charges; check current availability, account
   requirements, and pricing on
   [Runpod's endpoint page](https://docs.runpod.io/public-endpoints/models/qwen3-32b)
   before use. A summary is only requested by a
   manager, after an explicit confirmation in the UI. Use synthetic data unless
   the organization has approved external processing.
4. Configure the Supabase Auth Site URL and allowed redirect URL for the Replit
   preview/deployment origin.
5. Apply the database setup in the intended Supabase project, following
   [`backend/sql/README.md`](backend/sql/README.md). Review the target before
   running SQL; use synthetic accounts and data.
6. Sign in with separate synthetic employee and manager accounts and rehearse
   [`docs/travel-workflow-demo.md`](docs/travel-workflow-demo.md).

The summary sends only the free-text trip purpose, destination, dates, estimated
cost, and budget flag. The separate traveller-name and claim-reference fields,
plus account, team, and request IDs, are not sent; the purpose text could still
contain personal details, so do not include names or identifiers there. The
draft is displayed temporarily, is not saved to request history, and does not
replace the manager's decision. The Runpod key must remain server-side.

The workflow code will load without working Supabase configuration, but
authenticated features require the project settings, schema, and policies.
Never paste credentials into this README, a checked-in `.env`, or chat.

## Run this source folder locally

Requirements: Node.js 20+ and npm. From this directory:

```sh
npm install
FLOWGUARD_SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
FLOWGUARD_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY \
npm start
```

Open `http://localhost:5000`. Keep real credentials in your local environment
or a secrets manager; do not commit them. The local server serves the same
browser-safe configuration at `/api/config/supabase.js` used by the pages.
Database migrations and live authentication still require the intended
Supabase project. The optional Runpod relay is provided by the Replit API Server
workflow and is not included in this standalone preview server.

## Architecture

```text
Browser
  ├─ FlowGuard HTML, CSS, and JavaScript (Replit web artifact)
  ├─ Supabase JS SDK (jsDelivr)
  └─ Supabase Auth + PostgreSQL / RPC
       └─ profiles, team membership, Travel, Insights, activity

Replit API Server
  ├─ /api/config/supabase.js
  │    └─ returns only the Supabase project URL and browser publishable key
  └─ /api/travel/summary (manager-only, explicit request)
       ├─ verifies the Supabase session, team role, and pending request
       └─ sends minimized trip details to Runpod Qwen3 32B AWQ
```

The static frontend is plain HTML/CSS/JavaScript. Node.js serves it in the
standalone source project; in this Replit workspace, Vite serves the multi-page
artifact and a separate API artifact supplies runtime configuration. Supabase
provides hosted authentication and PostgreSQL with row-level security. The
optional Runpod integration drafts manager summaries only; it does not approve
requests, process payments, or book travel. Live model use remains unverified
until a successful, authorized provider request has been checked.
The workspace also uses the Replit Agent for development assistance; this is
not a runtime dependency of FlowGuard.

## Test commands

Run from this directory:

```sh
npm test
npm run test:workflow-db
npm run test:workflow-ui
npm run test:teams-ui
```

- `npm test` runs the Node.js unit tests for workflow rules, calculations,
  notifications, caching, and safe runtime configuration.
- `npm run test:workflow-db` starts a disposable local PostgreSQL cluster,
  applies test fixtures and migrations (including reruns), and checks
  permission/workflow rules. It requires `initdb`, `pg_ctl`, and `psql` on
  `PATH`; it does not connect to Supabase.
- `npm run test:workflow-ui` and `npm run test:teams-ui` run Chromium-based
  browser rehearsals against simulated Supabase clients. They require
  `chromium` on `PATH`; they do not sign in to or mutate a hosted project.

For setup and limitations of the database and team policies, see
[`backend/sql/README.md`](backend/sql/README.md) and
[`docs/teams-demo.md`](docs/teams-demo.md).

At the 24 October 2026 cleanup check, `npm test` passed all 23 tests, the
workspace typecheck passed, and the FlowGuard production build passed with the
artifact's required environment settings. The restarted landing page also
loaded successfully. These checks did not repeat the disposable-database or
simulated-browser suites, and do not establish complete hosted security or
production readiness. The separate owner-reported live approval check is
described above.

## Replit and repository context

The source is maintained in this Replit workspace under
`artifacts/flowguard/source/`. The Replit preview is served by the configured
FlowGuard web workflow; the API Server workflow supplies runtime Supabase
configuration. The team supplied the GitHub URL listed above, but its latest
contents and public access have not been verified. The published-app URL and
judge access also remain unverified. Replace pending entries only after
checking the actual published site; a workspace preview is not publication
evidence.

The team reports SDC provided Replit and Runpod credits. Replit is used for this
workspace. At the latest team report, Runpod credits were unredeemed; no paid
inference or Runpod credit consumption is claimed.

Working submission drafts are in
[`docs/hackathon-submission-draft.md`](docs/hackathon-submission-draft.md),
[`docs/tech-declaration-draft.md`](docs/tech-declaration-draft.md),
[`docs/hackathon-demo-runbook.md`](docs/hackathon-demo-runbook.md), and
[`docs/submission-checklist.md`](docs/submission-checklist.md). Slide copy is
in [`docs/hackathon-slide-content.md`](docs/hackathon-slide-content.md); no
slides artifact was created.

## Proof-of-use and demo evidence checklist

Capture only synthetic data and public-facing information. Keep API keys,
database connection strings, passwords, account emails, session tokens, and
private invite codes out of screenshots and recordings.

- [ ] **Replit:** capture the project open in Replit with the FlowGuard preview
  and running web/API workflows. Include organizer-required proof fields in
  the official form; a screenshot alone may not satisfy every requirement.
- [ ] **Published site:** add the final URL, check that the landing page opens
  without workspace access, and rehearse employee/manager login on that origin.
- [ ] **Workflow:** record a synthetic employee request, validation/budget flag,
  manager decision, and employee-visible status, note, and activity history.
- [ ] **Runpod, if claimed:** after explicit approval for a potentially billable
  synthetic request, capture an actual returned summary and corresponding
  provider usage/request evidence. Label the output advisory. Configuration,
  available credits, or an API key are not proof of a completed inference.
- [ ] **Video:** upload the product demo to YouTube, check judge access, and add
  the link to the README and official submission form.
- [ ] **Forms:** complete team details, workshop/ownership declarations,
  baseline/target fields, required proof forms, and the leader's signature.

Use the organizer's supplied template as the authority on accepted evidence.
Do not mark an item complete simply because implementation code exists.

## License

This project includes an Apache License 2.0 file. Review
[`LICENSE`](LICENSE) and confirm the correct copyright holder and attribution
before submission; do not infer ownership from the template archive.
