# FlowGuard

## Run on Replit
- Click **Run** to launch the **Start application** workflow, or run `npm run dev`.
- `npm start` runs the same server.
- Node.js 20 serves the existing `frontend/` directory on `0.0.0.0:5000`.
- `/` opens `frontend/index.html`. Other pages retain their `.html` paths.
- No build step or additional server dependencies are required.
- Only `frontend/` is served as static content; repository files and backend documentation are not public.

## Existing services
- Keep the plain HTML/CSS/JavaScript frontend and existing folder structure.
- Supabase is the hosted authentication/database service. The small Node.js server serves static files and a browser-safe runtime configuration endpoint; it is not an application-data backend.
- The browser loads the Supabase SDK from jsDelivr. `/api/config/supabase.js` reads `FLOWGUARD_SUPABASE_URL` and `FLOWGUARD_SUPABASE_PUBLISHABLE_KEY` from the server environment and returns only those browser-safe values without caching.
- Never put service-role keys, database passwords, or other private credentials in frontend code.
- Account, profile, Travel, and Insights functionality depends on the Supabase project's availability, schema, and access policies. The SQL files in `backend/sql/` are real migrations; review the target project and follow `backend/sql/README.md` before applying them.
- To use email confirmation links on this host, the Supabase owner may need to configure the project's Site URL and allowed redirect URLs.
