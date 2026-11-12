# FlowGuard
 
> A team-based travel-request and approval workspace that connects employee requests, human decisions, and activity history for small businesses.
 
Built by **Team Avengers** (Asia Pacific University) for the Orbyte Smart SME Challenge, Domain 2. Proposed SDG alignment: SDG 8, Decent Work and Economic Growth (target 8.2).
 
## Links
 
| Resource | Link |
|---|---|
| Live demo | https://avengers-flowguard.replit.app |
| Demo video | https://youtu.be/qtBa4LHtPG8 |
| Slide deck | https://www.canva.com/design/DAHY5-LhEpg/wp192d15JSnOJOTddGODCQ/edit?ui=eyJBIjp7fX0 |
 
## Overview
 
### Problem
 
Small businesses often coordinate travel requests through messages, spreadsheets and informal approvals. Trip details, estimated costs, manager decisions and status updates end up in different places. FlowGuard explores whether one shared workflow can reduce repeated clarification and make decisions easier to follow. This is a hypothesis and has not yet been validated with customer research.
 
### Solution
 
FlowGuard connects one journey:
 
**Employee request → trip data → validation and budget flag → manager approval → logged outcome**
 
Employees submit travel requests, and a different manager approves or rejects with a reason. Both roles can see the outcome and the activity history.
 
### Key Features
 
- **Travel requests:** traveller, destination, dates, purpose, estimated cost and an optional claim reference
- **Validation:** checks required fields and valid dates
- **Budget-review flag:** an illustrative MYR 1,000 threshold that flags a request for review but never approves or rejects it automatically
- **Independent manager decisions:** a different manager must approve or reject, with a note
- **Activity history:** records submission, edits, decisions, booking-status changes and deletions
- **Team-scoped access:** Supabase policies and database logic enforce membership and permissions
- **Team Insights:** a separate team-scoped workspace module
- **Optional AI summary:** an advisory trip summary drafted after a manager confirms external processing. It cannot approve, reject or book travel.
Booking-status notes do not purchase tickets or make external bookings, and the claim-reference field is not an accounting integration.
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript, Vite |
| Backend | Node.js, Express |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Access control | Row Level Security, SQL functions and triggers |
| AI (optional) | RunPod Qwen3 32B AWQ public endpoint |
| Hosting | Replit |
| Testing | Node.js tests, disposable PostgreSQL tests, simulated Chromium rehearsals |
 
## Architecture
 
```text
User
  │
  ▼
FlowGuard frontend (Replit)
  │
  ├──► Supabase Auth
  │
  ├──► Supabase PostgreSQL / RPC
  │      ├── Profiles and team membership
  │      ├── Travel requests
  │      ├── Insights
  │      └── Activity history
  │
  └──► Express API (Replit)
         ├── Browser-safe Supabase configuration
         └── Optional manager-requested summary
                │
                ▼
         RunPod Qwen3 32B AWQ → advisory summary for the manager
```
 
The summary API checks the user's session, manager membership and the pending request before contacting RunPod.
 
## Project Structure
 
```text
.
├── artifacts/
│   ├── flowguard/
│   │   ├── source/
│   │   │   ├── frontend/      # HTML pages, CSS, JavaScript
│   │   │   ├── backend/sql/   # Schema, policies, database tests
│   │   │   ├── docs/          # Demo guides
│   │   │   ├── scripts/       # Test and maintenance scripts
│   │   │   ├── tests/         # Unit tests and fixtures
│   │   │   └── server.cjs     # Standalone preview server
│   │   └── SETUP.md
│   ├── api-server/            # Config and optional summary API
│   ├── flowguard-pitch/       # Eight-slide presentation
│   └── mockup-sandbox/        # Design preview
├── lib/                       # Shared libraries
└── scripts/                   # Workspace utilities
```
 
## How to Run
 
### On Replit
 
1. Open the FlowGuard Replit workspace.
2. Add your Supabase URL, Supabase publishable key and (optionally) `RUNPOD_API_KEY` through Replit Secrets. Exact variable names are in `artifacts/flowguard/SETUP.md`.
3. Set up the database using `artifacts/flowguard/source/backend/sql/README.md`. For a new database, run the scripts in this order: `profiles.sql`, `travel_insights.sql`, `privacy_requests.sql` (optional), `travel_workflow.sql`, set up the initial manager profile, then `teams.sql`.
4. In Supabase Auth, set the Site URL and allowed redirect URLs for your host.
5. Start the FlowGuard web and API Server workflows, then sign in with separate employee and manager demo accounts.
> **Warning:** the `teams.sql` bootstrap groups all existing profiles and records into one demo team. Do not apply it to unrelated data, and do not rerun earlier baseline policy scripts after installing team isolation.
 
### Locally
 
Requires Node.js 20 or later.
 
```bash
git clone https://github.com/Elliott7710/Avengers.git
cd Avengers/artifacts/flowguard/source
npm ci
npm start
```
 
Set the Supabase variables in your environment first, then open `http://localhost:5000`. Never commit real keys. The standalone server does not include the optional RunPod relay from `artifacts/api-server/`.
 
### Tests
 
From the folder containing `server.cjs`:
 
```bash
npm test                  # workflow rules, calculations, notifications, config
npm run test:workflow-db  # needs PostgreSQL tools
npm run test:workflow-ui  # needs Chromium
npm run test:teams-ui     # needs Chromium
```
 
The database and browser tests use a disposable local database and simulated Supabase clients, so they do not prove the hosted site is configured correctly.
 
## AI Summary (Optional)
 
- **Purpose:** draft a concise trip summary for a human manager
- **Model:** RunPod Qwen3 32B AWQ public endpoint
- **Flow:** the manager requests the summary and confirms external processing, then the Express API sends an authenticated server-side request
- **Data sent:** trip purpose, destination, dates, estimated cost and budget flag. Traveller name, claim reference and internal IDs are left out, but free-text fields could still contain identifying details, so use synthetic data for demos.
- **Output:** temporary advisory text that never changes approval state or request history
- **Status:** integration implemented; live inference has not yet been verified.
## Challenges & Learnings
 
- **Keeping the existing interface:** we kept the original HTML/CSS/JS app rather than rewriting it.
- **Enforcing team boundaries:** access rules had to be enforced in the database, not just by hiding buttons.
- **Connecting both sides of approval:** the employee must see the manager's decision, note and history after a refresh.
- **Separating checks from decisions:** validation and budget flags must never become automatic approval.
- **Handling configuration safely:** public browser config and private server credentials need different treatment.
- **Reporting evidence accurately:** unit tests, simulated browser tests, live checks and provider usage are different kinds of evidence.
## Future Improvements
 
- [ ] Verify published-site access and authentication
- [ ] Verify live RunPod inference
- [ ] Test broader signup, access-isolation and workflow cases
- [ ] Measure the manual-process baseline against FlowGuard review time
- [ ] Validate the workflow with real SME users
- [ ] Review third-party asset licences and privacy implications
**Proposed impact target:** reduce median travel-request review time by 30% against a measured manual baseline. This is a goal, not an achieved result.
 
## Team
 
| Name | Role | GitHub |
|---|---|---|
| Soo Jun Hin | Backend, frontend, AI integration, demo video | [@Elliott7710](https://github.com/Elliott7710) |
| Quah Yu Qi | Slides | [@Iquyi11](https://github.com/Iquyi11) |
| *(add remaining members)* | | |
 
Team leader: Dayanitha
 
## License
 
Apache License 2.0. See [LICENSE](artifacts/flowguard/source/LICENSE). Third-party libraries, assets and models remain subject to their own licences.
