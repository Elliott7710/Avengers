# FlowGuard

FlowGuard is a team coordination app for employee profiles, travel workflows, team management, notifications, and insights.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the shared API server
- `pnpm --filter @workspace/flowguard run dev` — run the FlowGuard web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required shared secrets: `FLOWGUARD_SUPABASE_URL`, `FLOWGUARD_SUPABASE_PUBLISHABLE_KEY`
- `artifacts/flowguard/SETUP.md` — Supabase keys, SQL migrations, and Auth redirect setup
- `artifacts/flowguard/source/backend/sql/README.md` — migration order and database safety notes

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: Vite with the imported HTML/CSS/JavaScript app
- API: Express 5; serves browser-safe Supabase configuration
- Data and authentication: user's Supabase project
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/flowguard/source/frontend/` — multi-page FlowGuard interface
- `artifacts/flowguard/source/frontend/styles/` — page stylesheets
- `artifacts/flowguard/source/frontend/scripts/` — browser-side JavaScript
- `artifacts/flowguard/source/frontend/assets/` — static frontend assets
- `artifacts/flowguard/source/backend/server.cjs` — standalone imported-project server
- `artifacts/flowguard/source/backend/sql/` — Supabase schema and policy scripts
- `artifacts/api-server/src/routes/` and `src/lib/` — Express API routes and helpers
- `artifacts/api-server/src/routes/supabase-config.ts` — runtime config endpoint
- `lib/api-spec/openapi.yaml` — shared API contract

## Architecture decisions

- Supabase credentials are injected at runtime through Replit Secrets; never commit the publishable key or any privileged key.
- Only a publishable key or legacy `anon` key may be returned to the browser. Service-role keys are not supported.
- Keep HTML page entry points in `source/frontend/` to preserve existing URLs; organize their styles, scripts, and static assets in the matching subfolders.

## Product

- Employee registration, profiles, team membership, travel requests and approvals, notifications, and insights.

## Gotchas

- Supabase tables and Auth redirect URLs must be configured separately; adding app secrets alone does not initialize the database.
- The `teams.sql` migration is required for current team-scoped features. Review the SQL guide before running migrations on an existing project.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
