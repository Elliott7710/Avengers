# Backend

This repository currently uses Supabase as a hosted service; it does not contain
a separate application server. Keep database schema and access-control SQL in
`sql/`, and server-side functions in `functions/` if they are added later.

The Supabase client in `frontend/js/supabase.js` must remain frontend code because
the browser uses it to connect. Only public project configuration belongs there;
never put service-role keys, database passwords, or other private secrets in
frontend files or commit them to the repository.
