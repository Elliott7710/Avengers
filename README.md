# FlowGuard
> A team-based travel-request and approval workspace that connects employee requests, human decisions, and activity history for small businesses.
---
## Team Information
| Field | Details |
|---|---|
| **Team Name** | Avengers |
| **Team Domain** | Domain 2 — Orbyte Smart SME Challenge |
| **SDG Track (1–17)** | Proposed: SDG 8 — Decent Work and Economic Growth, target 8.2 |
| **Team Leader** | **Confirm before submission** |
| **University** | Asia Pacific University (APU) |
| **Number of Members** | 5 |
The proposed SDG alignment relates to productivity through technological upgrading and innovation. The team must confirm the final SDG selection.
## Links
| Resource | Link |
|---|---|
| GitHub Repository | https://github.com/Elliott7710/Avengers |
| Live Demo | **Pending — add the final published URL** |
| RunPod Endpoint | https://api.runpod.ai/v2/qwen3-32b-awq/runsync |
| Slide Deck | **Pending — add the submitted deck or accessible presentation link** |
| Demo Video | **Pending — add the YouTube link** |
The RunPod URL is the public inference API used by the integration, not a browser demo. Successful inference has not yet been verified.
---
## Overview
### Problem
Small businesses may coordinate travel requests through messages, spreadsheets, and informal approvals. This can separate trip details, estimated costs, manager decisions, and later status updates.
FlowGuard explores whether a shared workflow can reduce repeated clarification and make decisions easier to follow. This problem hypothesis has not yet been validated through customer research or a measured baseline.
### Solution
FlowGuard connects one operational journey:
**Employee request → trip data → validation and budget flag → manager approval → logged outcome**
Employees submit travel requests, and a different manager records an approval or rejection with a reason. Both roles can see the outcome and activity history.
An optional RunPod integration is implemented to draft a trip summary for manager review. The summary is advisory and cannot approve, reject, or book travel. Live inference remains unverified.
### Key Features
- **Travel requests** — Capture traveller, destination, dates, purpose, estimated cost, and an optional claim reference.
- **Validation** — Check required information and valid dates.
- **Budget-review flag** — Apply an illustrative MYR 1,000 threshold without automatically approving or rejecting requests.
- **Independent manager decisions** — Require a different manager to approve or reject with a note.
- **Activity history** — Record submission, edits, decisions, booking-status changes, and deletion events.
- **Team-scoped access** — Use Supabase policies and database logic to enforce membership and permissions.
- **Team Insights** — Provide a separate team-scoped workspace module.
- **Optional AI summary** — Generate an advisory draft after manager confirmation of external processing.
Booking-status notes do not purchase tickets or make external bookings. The claim-reference field is not an accounting or claims-system integration.
### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript; Vite for workspace serving/builds |
| Backend | Node.js and Express |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Access Control | Row Level Security, SQL functions, and triggers |
| AI / Compute | Optional RunPod Qwen3 32B AWQ public endpoint |
| Hosting / Dev | Replit |
| Testing | Node.js tests, disposable PostgreSQL tests, and simulated Chromium rehearsals |
---
## Project Structure
The current Replit workspace uses this structure. GitHub should contain the matching files for these paths and commands to apply.
```text
.
├── artifacts/
│   ├── flowguard/
│   │   ├── source/
│   │   │   ├── frontend/          # HTML pages, CSS, JavaScript
│   │   │   ├── backend/
│   │   │   │   └── sql/           # Schema, policies, database tests
│   │   │   ├── docs/              # Submission drafts and demo guides
│   │   │   ├── scripts/           # Test and maintenance scripts
│   │   │   ├── tests/             # Unit tests and test fixtures
│   │   │   ├── server.cjs         # Standalone preview server
│   │   │   ├── package.json
│   │   │   └── LICENSE
│   │   ├── SETUP.md
│   │   └── vite.config.ts
│   ├── api-server/                # Config and optional summary API
│   ├── flowguard-pitch/            # Eight-slide presentation
│   └── mockup-sandbox/             # Separate design preview
├── lib/                           # Shared workspace libraries
├── scripts/                       # Workspace utilities
├── .gitignore
├── .replit
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```
Add the completed official documents under:
```text
submission/
├── SDC2026_Avengers_Preliminary.pdf
├── SDC2026_Avengers_TechDeclaration.pdf
├── SDC2026_Avengers_Replit_POU.pdf
└── SDC2026_Avengers_Runpod_POU.pdf
```
These are required submission destinations, not a claim that the completed PDFs already exist.
### Architecture
```text
User
  │
  ▼
FlowGuard frontend on Replit
  │
  ├──► Supabase Auth
  │
  ├──► Supabase PostgreSQL / RPC
  │      ├── Profiles and team membership
  │      ├── Travel requests
  │      ├── Insights
  │      └── Activity history
  │
  └──► Replit Express API
         ├── Browser-safe Supabase configuration
         └── Optional manager-requested summary
                │
                ▼
         RunPod Qwen3 32B AWQ
                │
                ▼
         Advisory summary for the manager
```
The summary API checks the user session, manager membership, and pending request before contacting RunPod.
---
## How to Run
### Option 1 — Run on Replit (Recommended)
1. Open the existing FlowGuard Replit workspace.
2. Configure these settings through Replit Secrets:
   | Variable | Purpose |
   |---|---|
   | `FLOWGUARD_SUPABASE_URL` | Supabase project URL |
   | `FLOWGUARD_SUPABASE_PUBLISHABLE_KEY` | Browser-safe publishable key |
   | `RUNPOD_API_KEY` | Optional server-side summary integration |
3. Configure the database using:
   `artifacts/flowguard/source/backend/sql/README.md`
4. For a new database, follow the documented order:
   - `profiles.sql`
   - `travel_insights.sql`
   - `privacy_requests.sql` if demonstrating privacy-request intake
   - `travel_workflow.sql`
   - Establish the trusted initial manager profile
   - `teams.sql`
5. Configure Supabase Auth Site URL and allowed redirect URLs for the host being used.
6. Start the configured FlowGuard web and API Server workflows.
7. Sign in using separate employee and manager demo accounts.
**Database warning:** the teams bootstrap groups existing profiles and records into one initial demo team. Do not apply it to unrelated company data. Do not rerun earlier baseline policy scripts after installing team isolation.
The app uses the `qwen3-32b-awq` public endpoint by default. A custom `RUNPOD_ENDPOINT_ID` and Python handler are not required by this implementation.
### Option 2 — Run Locally
Requirements: Node.js 20 or later and npm.
For the workspace layout shown above:
```bash
git clone https://github.com/Elliott7710/Avengers.git
cd Avengers/artifacts/flowguard/source
npm ci
```
Set the Supabase variables in your local environment or secret manager, then run:
```bash
npm start
```
Open:
```text
http://localhost:5000
```
Do not commit real environment values.
The standalone server serves the frontend and browser-safe Supabase configuration. It does not include the optional Express RunPod relay from `artifacts/api-server/`.
If the GitHub repository contains only the standalone source files at its root, run the commands from that root instead.
### Run Tests
From the source directory containing `server.cjs`:
```bash
npm test
npm run test:workflow-db
npm run test:workflow-ui
npm run test:teams-ui
```
- `npm test` checks workflow rules, calculations, notifications, caching, and runtime configuration.
- Database tests require PostgreSQL tools and use a disposable local database.
- Browser rehearsals require Chromium and use simulated Supabase clients.
- These tests do not establish that the hosted database or published site is configured correctly.
At the latest recorded cleanup check:
- All 23 unit tests passed.
- Workspace typechecking passed.
- The FlowGuard production build passed.
- The restarted landing page loaded successfully.
The project owner also reported successful live employee/manager access and approval, including the employee-visible note and history. This covers the stated demo flow, not a complete security audit.
---
## How We Use Replit *(Required)*
- **Development:** The application is developed and maintained in a Replit workspace.
- **Runtime:** Separate configured workflows run the FlowGuard frontend and Express API.
- **Configuration:** Runtime settings are supplied through Replit Secrets.
- **Verification:** The workspace is used to run tests, typechecking, builds, and preview checks.
- **Presentation:** The eight-slide project deck is maintained as a separate presentation artifact.
The final published URL and public judge access must be checked before submission.
**Proof of use:** complete and upload  
`submission/SDC2026_Avengers_Replit_POU.pdf`
Capture the project and running application without exposing secrets, personal data, or private invitation codes.
## How We Use RunPod *(Required)*
**Current status: integration implemented; successful live usage not yet verified.**
- **Intended workload:** Draft a concise trip summary for a human manager.
- **Model endpoint:** RunPod's Qwen3 32B AWQ public endpoint.
- **Integration:** The Express API sends an authenticated server-side request to the provider.
- **Human control:** The manager explicitly requests the summary and confirms external processing.
- **Output:** Temporary advisory text; it does not change approval state or become part of request history.
Provider endpoint:
```text
POST https://api.runpod.ai/v2/qwen3-32b-awq/runsync
```
The server uses `RUNPOD_API_KEY`. No custom Python handler or team-deployed GPU pod is part of the current implementation.
The payload includes trip purpose, destination, dates, estimated cost, and budget flag. Separate traveller-name, claim-reference, and internal identifier fields are omitted, but free text could still contain identifying information.
Use synthetic data unless external processing has been approved. Requests may incur provider charges.
The team reports that SDC provided Replit and RunPod credits. At the latest report, RunPod credits had not been redeemed.
**Proof of use:** after a successful authorised request, capture the actual response and corresponding provider usage evidence, then complete  
`submission/SDC2026_Avengers_Runpod_POU.pdf`
Do not mark RunPod proof complete based only on a key, available credits, or integration code.
---
## Challenges & Learnings
- **Preserving the existing interface:** The original HTML/CSS/JavaScript application was retained rather than unnecessarily rewritten.
- **Enforcing team boundaries:** Access rules needed database enforcement, not only role-specific buttons.
- **Connecting both sides of approval:** The employee must see the manager's decision, note, and activity history after refresh.
- **Separating checks from decisions:** Validation and budget flags must not become automatic approval.
- **Handling configuration safely:** Public browser configuration and private server credentials require different treatment.
- **Reporting evidence accurately:** Unit tests, simulated browser tests, live checks, and provider usage are different forms of evidence.

## Future Improvements
- [ ] Verify published-site access and authentication.
- [ ] Complete RunPod verification and accepted proof of use.
- [ ] Test broader signup, access-isolation, and workflow cases.
- [ ] Measure the manual-process baseline and FlowGuard review time.
- [ ] Validate the workflow with intended SME users.
- [ ] Confirm Orbyte compatibility and integration requirements.
- [ ] Review third-party asset licenses and privacy implications.
- [ ] Complete official submission forms and public links.
### Proposed Phase 2 Impact Target
Reduce median travel-request review time by 30% compared with a measured manual-process baseline.
This is a proposed goal, not an achieved result. No baseline or measured time saving is currently claimed.
---
## Team
Complete and confirm all five members before submission.
| Name        | Role                | GitHub                                   |
| ----------- | ------------------- | ---------------------------------------- |
| Soo Jun Hin | Team Lead / Backend | [@Elliott7710](https://github.com/Elliott7710) |
| Soo Jun Hin | Frontend            | [@Elliott7710](https://github.com/Elliott7710) |
| Soo Jun Hin | AI / RunPod         | [@Elliott7710](https://github.com/Elliott7710) |
Confirm the official team leader before completing the signed forms.
---
## Submission Checklist
- [yes] Team name, domain, SDG track, leader, and roster confirmed
- [ ] GitHub contains the final code and matching setup instructions
- [ ] Live demo URL added and judge access verified
- [ ] Slide deck link added
- [ ] Demo video link added
- [yes] Replit proof of use completed in `submission/`
- [ ] RunPod usage verified and proof completed in `submission/`
- [ ] Preliminary submission completed
- [ ] Technology declaration completed
- [ ] Required ownership, workshop, and eligibility declarations confirmed
- [ ] Submission files renamed with `Avengers`
- [ ] “How to Run” steps verified against the submitted repository
- [ ] No secrets committed or exposed in submission evidence
- [ ] Required signatures and dates completed
---
## License
FlowGuard includes the [Apache License 2.0](artifacts/flowguard/source/LICENSE).
Confirm copyright ownership and attribution before submission. Third-party libraries, remote assets, and models remain subject to their own licenses and terms.
