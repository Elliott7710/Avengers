# FlowGuard

### Travel requests, manager decisions, and activity history in one workspace.

FlowGuard is a team-based travel-request and approval prototype built for the **SDC 2026 Hackathon — Domain 2: Orbyte Smart SME Challenge**.

It brings request details, validation, manager decisions, and activity history together instead of leaving them scattered across messages and spreadsheets.

## Project And Team Information

| Item | Details |
|---|---|
| Team | Avengers |
| University | Asia Pacific University (APU) |
| Challenge | Domain 2 — Orbyte Smart SME Challenge |
| Repository | https://github.com/Elliott7710/Avengers |
| Published website | **Pending — add the published URL** |
| Product demo | **Pending — add the YouTube link** |
| Proposed SDG alignment | SDG 8 — Decent Work and Economic Growth, target 8.2 |
| Team Leader | Dayanitha |
| Total Members | 5 members |

## The Problem

Employee travel requests can involve repeated messages, missing details, inconsistent review, and uncertainty about approval status.

FlowGuard explores whether a shared, team-scoped workflow can make this process easier to follow and review.

This is currently a **problem hypothesis**. Customer research and measured productivity improvements have not yet been established.

## Our Solution

FlowGuard follows a clear operational journey:

**Request submitted → trip data → validation and budget flag → manager decision → logged outcome**

Employees submit requests, managers review them, and both can see the resulting status and activity history.

Validation supports the decision—it does not replace human approval.

## Features

### Employee Travel Requests
- Submit traveller, destination, dates, purpose, and estimated cost.
- Include an optional claim reference.
- Edit or delete a pending request.
- View status, manager notes, and activity history.

### Manager Review
- Review requests within teams where the account is a manager.
- Approve or reject another employee’s request with a required note.
- Record a booking-status note after approval.
- Review the request’s activity history.

FlowGuard records booking status; it does **not** purchase tickets or make real travel bookings.

### Validation and Budget Flags
- Required-field and date validation.
- An illustrative MYR 1,000 budget threshold.
- Requests above the threshold receive a `high_budget` flag.
- Other valid requests receive a `standard` flag.
- Neither flag automatically approves a request.

The threshold is a demonstration rule, not a validated SME policy.

### Teams and Access Control
- Team membership scopes access.
- Employees see their own travel requests within joined teams.
- Managers review requests within teams they manage.
- Insights are shared within teams, with role-based editing permissions.
- Supabase Row Level Security, functions, and triggers enforce access and workflow rules.

### Activity History
- Records submission, edits, decisions, booking-status changes, and deletion events.
- Displays actor and timestamp information.
- Browser users cannot directly rewrite or delete activity entries.

### Optional Runpod Summary
The workspace includes a manager-requested AI summary integration using Runpod’s Qwen3 32B AWQ public endpoint.

- Requires explicit confirmation before external processing.
- Produces an advisory draft for a pending request.
- Does not approve, reject, or book travel.
- Keeps the Runpod API key on the server.
- Does not persist the generated summary in request history.

**Status:** successful live Runpod inference has not yet been verified. An API key or configured endpoint alone is not proof of usage.

## Domain 2 Alignment

| Requirement | FlowGuard approach |
|---|---|
| One clear SME problem | Repeated coordination of travel requests and decisions |
| Automated journey | Submission, validation, human approval, and logged outcome |
| Accuracy and consistency | Field checks, controlled status transitions, and required decision notes |
| Human control | An independent manager makes the decision |
| Orbyte fit and reuse | Proposed reusable, team-scoped SME workflow |
| Business benefit and SDG link | Proposed reduction in review time, aligned with productivity through technology |
| Ease of learning | Focused forms, role-specific actions, and visible request history |

No implemented Orbyte integration or verified Orbyte platform compatibility is currently claimed.

## SDG Alignment and Impact Goal

### Proposed alignment: SDG 8, target 8.2

FlowGuard aims to support productivity through technological upgrading and innovation by organising a recurring administrative workflow.

### Proposed Phase 2 target

> Reduce median travel-request review time by 30% compared with a measured manual-process baseline.

This is an **unvalidated future goal**, not an achieved result.

The evaluation plan is to:
1. Prepare equivalent synthetic review cases.
2. Time the manual process and FlowGuard using the same timing definition.
3. Record completion time, clarification requests, and sample size.
4. Compare median review times.
5. Report results and limitations honestly.

The manual-process baseline has not yet been measured.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Workspace frontend tooling | Vite |
| API server | Node.js and Express |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Access control | Row Level Security, SQL functions, and triggers |
| Optional AI service | Runpod Qwen3 32B AWQ public endpoint |
| Development environment | Replit |
| Tests | Node.js tests, disposable PostgreSQL tests, and simulated browser tests |

## Architecture

```text
Browser
  ├── FlowGuard HTML / CSS / JavaScript
  ├── Supabase JavaScript SDK
  └── Supabase Auth and PostgreSQL
       ├── Profiles and team membership
       ├── Travel requests
       ├── Insights
       └── Activity history

Replit API Server
  ├── Browser-safe Supabase configuration
  └── Optional manager-only summary endpoint
       ├── Verifies session, team role, and request
       └── Sends minimised trip context to Runpod
```

## Setup

### Requirements
- Node.js 20 or later for the standalone source server.
- A Supabase project with the required schema and authentication settings.
- pnpm for the complete Replit workspace.
- A funded Runpod account only if demonstrating the optional AI feature.

### Environment Settings

Configure these through your hosting environment or secrets manager:

| Variable | Purpose |
|---|---|
| `FLOWGUARD_SUPABASE_URL` | Supabase project URL |
| `FLOWGUARD_SUPABASE_PUBLISHABLE_KEY` | Browser-safe publishable key |
| `RUNPOD_API_KEY` | Optional server-side AI integration key |

Never commit passwords, database connection strings, service-role keys, or Runpod keys.

The Supabase publishable key is intended for browser use. Database security still depends on correctly configured access policies.

### Database Setup

Follow the included database guide and review the target project before applying SQL.

The installation order is:

1. `profiles.sql`
2. `travel_insights.sql`
3. `privacy_requests.sql` — optional privacy-request intake
4. `travel_workflow.sql`
5. Establish the trusted initial manager profile, as documented.
6. `teams.sql`

**Important:** the teams migration groups existing profiles and records into an initial demo team. Do not apply that bootstrap to unrelated company data.

Do not rerun earlier baseline policy scripts after installing team isolation.

Configure the Supabase Auth Site URL and allowed redirect URLs for the host being used.

### Run in Replit

Start the configured:
- FlowGuard web workflow
- API Server workflow

The web workflow serves the interface. The API Server provides runtime configuration and the optional summary endpoint.

### Standalone Local Preview

From the directory containing `server.cjs` and the source `package.json`:

```sh
npm ci
npm start
```

Set the required Supabase environment variables before starting, then open:

```text
http://localhost:5000
```

The standalone server does not include the optional Runpod API relay.

## Testing

From the source directory:

```sh
npm test
npm run test:workflow-db
npm run test:workflow-ui
npm run test:teams-ui
```

| Command | Coverage |
|---|---|
| `npm test` | Workflow rules, calculations, notifications, caching, and runtime configuration |
| `npm run test:workflow-db` | Permissions and workflow checks against disposable local PostgreSQL |
| `npm run test:workflow-ui` | Browser rehearsal with a simulated Supabase client |
| `npm run test:teams-ui` | Team-flow rehearsal with a simulated Supabase client |

Database tests require PostgreSQL tools. Browser rehearsals require Chromium. These tests do not establish that the hosted Supabase project or published site is correctly configured.

### Verification Status

At the 24 October 2026 workspace cleanup check:
- All **23 unit tests passed**.
- Workspace typechecking passed.
- The FlowGuard production build passed.
- The restarted landing page loaded successfully.

The project owner separately reported that:
- Employee and manager accounts could access the existing request.
- Manager approval worked.
- The employee could see the approval, manager note, and activity history.

These checks cover the stated demo flow—not every feature, security boundary, or production scenario.

## Suggested Product Demo

Use synthetic data only.

1. Sign in as an employee.
2. Submit a travel request.
3. Show validation and the budget-review flag.
4. Show the initial activity entry.
5. Sign in separately as the manager.
6. Review and approve the request with a note.
7. Return to the employee account and refresh.
8. Show the updated status, manager note, and activity history.

Demonstrate the AI summary only after a successful authorised Runpod test.

## Proof of Use

| Evidence | Status |
|---|---|
| Replit workspace and running application | In use; submission evidence needs capture |
| Published website and public access | Pending verification |
| Employee-to-manager approval flow | Reported working by the project owner |
| Runpod response and corresponding usage evidence | Pending |
| YouTube product demo | Pending |

The team reports that SDC provided Replit and Runpod credits. At the latest report, the Runpod credits had not been redeemed.

Keep credentials, account emails, session tokens, and private invitation codes out of screenshots and recordings. Follow the organiser’s requirements for accepted proof.

## Known Limitations

- No measured time saving or validated customer demand.
- No verified live Runpod inference.
- No implemented Orbyte integration.
- No real booking, payment, accounting, or claims-system integration.
- The claim reference is a reference field, not a connected claims service.
- Broader signup, access-isolation, and published-site checks remain necessary.
- Remote assets, embedded third-party scripts, and model/provider terms still require final license and privacy review.
- This is a hackathon prototype, not a production-readiness claim.

## License

FlowGuard includes an **Apache License 2.0** file.

Confirm ownership, copyright details, and required attribution before submission. Third-party libraries, assets, and models remain subject to their own licenses and terms.
