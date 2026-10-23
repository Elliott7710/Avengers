# FlowGuard setup

## 1. Add the Supabase settings

In Replit Secrets, add these shared secrets:

- `FLOWGUARD_SUPABASE_URL` — your Supabase project URL, such as `https://your-project.supabase.co`
- `FLOWGUARD_SUPABASE_PUBLISHABLE_KEY` — the project's publishable key (or its legacy `anon` key)

These are the only Supabase values this app needs to run. The publishable/anon key is designed for browser use and must be protected by Supabase Row Level Security. **Do not add a service-role key or database password.**

## 2. Create the database schema

In the SQL Editor of the intended Supabase project, review and run the scripts from `source/backend/sql/` in the order documented in `source/backend/sql/README.md`. For a new install, that guide lists:

1. `profiles.sql`
2. `travel_insights.sql`
3. `privacy_requests.sql`
4. `travel_workflow.sql`
5. `teams.sql`

The final teams migration is required by the current app. Apply migrations only to the intended Supabase project; the SQL guide includes staging checks, role setup, and existing-data warnings.

## 3. Configure Supabase Auth redirects

In the Supabase project's Auth URL configuration, set the Site URL and allowed redirect URLs to the app's Replit preview or published host. Use the exact host shown by Replit.

## 4. Start and sign in

Open the FlowGuard preview. The public landing page loads without Supabase credentials; account, profile, travel, team, and insight features require the secrets and schema above.

Create a user through the app's registration page. The SQL guide explains how to grant manager access through the trusted Supabase SQL Editor for a demo account; manager assignment is intentionally not available in the browser.
