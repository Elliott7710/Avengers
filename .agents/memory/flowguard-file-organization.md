---
name: FlowGuard file organization
description: User-confirmed timing for reorganizing the frontend file structure.
---

Leave existing route files and folders in place until the user has added their planned privacy-policy UI, chatbot, and other frontend work. Reorganize afterward as one coordinated change.

**Why:** The static server serves `frontend/` as the web root, and the current links and auth redirects depend on top-level HTML page paths. Moving them early could break routes and conflict with the user's pending UI work.

**How to apply:** When the user returns with the frontend additions, first map all page links, script paths, and redirects; then reorganize and verify every route. Do not move platform-managed directories or caches.
