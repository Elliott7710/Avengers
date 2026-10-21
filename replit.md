# FlowGuard

## Run on Replit
- Click **Run** to launch the **Start application** workflow, or run `npm run dev`.
- `npm start` runs the same server.
- Node.js 20 serves the existing `frontend/` directory on `0.0.0.0:5000`.
- `/` opens `frontend/index.html`. Other pages retain their `.html` paths.
- No build step or additional server dependencies are required.
- Only `frontend/` is served; repository files and backend documentation are not public.

## Existing services
- Keep the plain HTML/CSS/JavaScript frontend and existing folder structure.
- Supabase is the hosted authentication/database service; there is no local application backend.
- The browser loads the Supabase SDK from jsDelivr. Existing public project configuration is in `frontend/js/supabase.js`.
- Never put service-role keys, database passwords, or other private credentials in frontend code.
- Account and profile functionality depends on the existing Supabase project's availability, schema, and access policies. SQL and server-function folders currently contain documentation only.
- To use email confirmation links on this host, the Supabase owner may need to configure the project's Site URL and allowed redirect URLs.
