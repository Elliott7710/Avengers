# FlowGuard

**Travel requests, manager decisions, and activity history in one team workspace.**

FlowGuard is Team Avengers' prototype for **SDC 2026 — Domain 2: Orbyte Smart
SME Challenge**. It addresses the recurring task of coordinating employee travel
requests across messages and spreadsheets, while keeping approval decisions
with people. The SME problem and productivity benefits still need user research
and measurement.

## Project links

| Item | Status |
|---|---|
| Published website | Pending publication and public-access verification |
| YouTube product demo | Pending recording and upload |
| Replit proof | Workspace is in use; submission evidence still needs capture |
| Runpod proof | Integration is implemented; successful live inference is not yet verified |

No demo passwords, database credentials, or private invitation codes are included
in this repository.

## Main features

- Employee travel requests with field/date validation and an illustrative
  MYR 1,000 budget-review threshold.
- Independent manager approval/rejection with a required decision note.
- Booking-status notes and append-only activity history; no real travel booking.
- Team-scoped Travel and Insights access using Supabase policies and triggers.
- Optional manager-requested Runpod summary drafts, advisory only and not yet
  verified against the live provider.

The project owner reported successful live employee/manager access to an
existing request and approval appearing for the employee with its note and
history. This does not establish that every feature or security path is tested.

## Start here

- **[Full project README](artifacts/flowguard/source/README.md)** — features,
  architecture, setup, tests, limitations, SDG alignment, and proof checklist.
- **[Workspace setup](artifacts/flowguard/SETUP.md)** — Supabase settings and
  database setup.
- **[Database guide](artifacts/flowguard/source/backend/sql/README.md)** —
  migration order and safety notes.
- **[Submission checklist](artifacts/flowguard/source/docs/submission-checklist.md)**
  — remaining submission requirements.

## Repository structure

```text
artifacts/
  flowguard/
    source/
      frontend/       Working HTML, CSS, and JavaScript app
      backend/sql/    Supabase schema, policies, and database tests
      tests/          Unit tests and simulated browser fixtures
      scripts/        Test and maintenance scripts
      docs/           Submission drafts and demo guides
      server.cjs      Standalone local preview server
    vite.config.ts    Replit frontend build configuration
  api-server/         Runtime configuration and optional Runpod summary API
  mockup-sandbox/     Separate design/Canvas preview project
lib/                  Shared API contracts and workspace libraries
scripts/              Workspace utilities
```

## Run in this workspace

Use the configured **FlowGuard web** and **API Server** workflows. Configure the
Supabase URL and publishable key through Replit Secrets, and follow the database
guide before using authenticated features.

From the workspace root:

```sh
pnpm install
pnpm run typecheck
pnpm --filter @workspace/flowguard run build
```

The artifact-managed build supplies `PORT` and `BASE_PATH`. For a manual shell
build outside that environment:

```sh
PORT=25078 BASE_PATH=/ pnpm --filter @workspace/flowguard run build
```

For the standalone local preview and test commands, see the full project README.
The standalone preview does not include the optional Runpod API relay.

## License

FlowGuard source includes [Apache License 2.0](artifacts/flowguard/source/LICENSE).
Third-party libraries, remote assets, and model/provider terms require their own
license and attribution review.
