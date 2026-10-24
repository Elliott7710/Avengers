### A centralised travel-request and approval workspace for small businesses
FlowGuard brings travel requests, estimated costs, manager decisions, and activity history into one workspace.
The prototype explores whether a shared workflow can reduce the coordination involved in handling requests across messages and spreadsheets. Business impact and time savings have not yet been measured.

## Team Information
| Field | Details |
|---|---|
| Team name | Avengers |
| Competition domain | Domain 2 |
| University | Asia Pacific University (APU) |
| Number of members | 5 |
| Team leader | Dayanitha — confirm against the final team roster |
| Project contributor | Soo Jun Hin — [@Elliott7710](https://github.com/Elliott7710) |
| SDG track | To be confirmed |
Add the complete five-member roster and each member’s actual contribution before submission.

## Project Links
| Resource | Link / status |
|---|---|
| GitHub repository | https://github.com/Elliott7710/Avengers |
| Replit project | ADD_REPLIT_PROJECT_LINK |
| Published application | ADD_PUBLISHED_APP_LINK |
| Pitch deck | ADD_SLIDE_DECK_LINK |
| Product demonstration | ADD_YOUTUBE_DEMO_LINK |
| Runpod integration | Implemented; live inference not yet verified |
The repository link has been supplied by the team. Final repository contents, judge access, and the published application link must be checked before submission.
## The Problem
Small teams may handle travel requests using separate messages, spreadsheets, and informal approvals.
This can make it difficult to keep request details, estimated costs, decisions, and supporting context together.
FlowGuard provides a structured workflow for submitting and reviewing those requests. This problem statement is currently a hypothesis; no customer research or measured improvement is claimed.

## Main Features
### Travel requests
Employees can submit:
- Traveller name
- Destination
- Start and end dates
- Trip purpose
- Estimated cost in MYR
- Optional claim reference

### Budget review flags
FlowGuard validates request details and displays either a `standard` or `high_budget` flag using an illustrative MYR 1,000 threshold.
This is a demonstration rule, not a confirmed company policy. Budget flags and validation are deterministic rules, not AI-generated decisions.

### Independent manager review
- Requests begin in the `Requested` state.
- A different user with manager access can approve or reject a request.
- Managers must provide a decision note.
- Managers cannot approve their own requests.
- Approved requests can be marked `Booked` with a booking note.
FlowGuard records booking status; it does not purchase tickets, make reservations, or process payments.

### Activity history
Edits, decisions, and status changes are recorded in an append-only activity history.
Database policies, functions, and triggers enforce workflow rules. Hidden browser controls are not the sole security boundary.

### Team workspace
Team membership scopes access to Travel and Insights. Insights is a separate workspace module and does not make approval decisions.

### Optional AI summary
The application includes a manager-triggered integration with Runpod’s Qwen3 32B AWQ public endpoint.
It is configured to draft a short summary of another employee’s pending travel request. The summary is advisory and cannot approve or reject a request.
**Current status:** The API key is stored server-side, but no inference request has been made. SDC supplied Runpod credits, which have not been redeemed. Credit eligibility, provider authentication, and live output remain unverified.

## Technology Stack
| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Web development/build | Vite |
| Backend API | Node.js and Express |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Database access control | Row-level security, SQL functions, and triggers |
| Browser database client | Supabase JavaScript SDK |
| Optional model inference | Runpod Public Endpoint — Qwen3 32B AWQ |
| Development environment | Replit |
| AI-assisted development | Replit Agent |

## Architecture
```text
Browser
  |
  +-- FlowGuard frontend
  |
  +-- Supabase Auth
  |
  +-- Supabase PostgreSQL / RPC
       |
       +-- Profiles and team membership
       +-- Travel requests
       +-- Insights
       +-- Activity history
Replit API Server
  |
  +-- Browser-safe Supabase configuration
  |
  +-- Optional manager-requested summary
       |
       +-- Verify Supabase session
       +-- Verify team role and eligible request
       +-- Send selected trip fields to Runpod
       +-- Return an advisory draft
```
The current integration uses a pre-deployed Runpod public endpoint. It does not require the custom Python `handler.py` or `RUNPOD_ENDPOINT_ID` described in the original README template.
## Run in the Existing Replit Workspace
The current workspace contains two relevant workflows:
- `artifacts/flowguard: web`
- `artifacts/api-server: API Server`

### 1. Configure environment variables
Use Replit Secrets for:
| Variable | Purpose |
|---|---|
| `FLOWGUARD_SUPABASE_URL` | Supabase project URL |
| `FLOWGUARD_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable key |
| `RUNPOD_API_KEY` | Optional server-side Runpod authentication |
Never substitute a Supabase service-role key for the browser publishable key.
Never commit API keys, passwords, database connection strings, session credentials, or populated environment files.

### 2. Configure Supabase
Follow:
[Database setup instructions](artifacts/flowguard/source/backend/sql/README.md)
Before applying SQL:
- Confirm the intended Supabase project.
- Review the migration instructions.
- Configure the correct Auth Site URL and allowed redirects.
- Use separate synthetic employee and manager accounts for testing.
- Verify access policies before entering real data.
  
### 3. Start the workflows
Start the FlowGuard web and API Server workflows, then open the FlowGuard preview.

### 4. Rehearse the workflow
Using synthetic data:
1. Sign in as an employee.
2. Join or select the intended team.
3. Submit a travel request.
4. Sign in as a different manager in that team.
5. Approve or reject the request with a note.
6. Confirm that the decision and activity history are visible.
7. If approved, record a booking status with a note.
Skip the optional AI summary until Runpod credits, data terms, and a synthetic inference test are confirmed.
## Standalone Local Preview
The following instructions apply to the current workspace layout.
Requirements:
- Node.js 20 or later
- npm
- A configured Supabase project for authenticated features
```bash
git clone https://github.com/Elliott7710/Avengers.git
cd Avengers/artifacts/flowguard/source
npm install
```
Set `FLOWGUARD_SUPABASE_URL` and
`FLOWGUARD_SUPABASE_PUBLISHABLE_KEY` in your local environment, then run:
```bash
npm start
```
Open:
```text
http://localhost:5000
```
These commands assume the GitHub repository contains the current Replit workspace layout. Verify this after pushing the final code.
The standalone server provides the frontend and browser-safe Supabase configuration. It does **not** include the separate Replit API Server’s Runpod summary relay.

## Testing
From `artifacts/flowguard/source`:
```bash
npm test
npm run test:workflow-db
npm run test:workflow-ui
npm run test:teams-ui
```

### Test scope
- `npm test`: workflow rules, calculations, notifications, caching, and runtime configuration.
- `test:workflow-db`: database rules against a disposable local PostgreSQL database. Requires `initdb`, `pg_ctl`, and `psql`.
- `test:workflow-ui`: browser workflow rehearsal with simulated Supabase responses. Requires Chromium.
- `test:teams-ui`: team-related browser rehearsal with simulated Supabase responses. Requires Chromium.
These checks passed in the development workspace, including 23 Node.js tests. Workspace type checks and application builds also passed.
**These results do not prove live Supabase configuration, deployed judge access, or successful Runpod inference.**
  
## How We Used Replit

Replit was used to:
- Develop and run the API server.
- Manage the application workflows and preview.
- Store environment configuration and API credentials using Secrets.
- Run local tests, type checks, and builds.
- Assist with implementation and documentation through Replit Agent.

Official proof-of-use materials should contain genuine project screenshots and details. A working development preview should not be presented as proof of a published deployment.

## How We Integrate Runpod
FlowGuard includes an optional API route for manager-requested travel summaries.
The intended flow is:
1. A manager explicitly requests a summary.
2. The API verifies the user’s session, team role, and eligible pending request.
3. Selected trip fields are sent to Runpod.
4. A temporary advisory summary is returned for human review.

**Usage declaration:**
- SDC supplied Runpod credits.
- Those credits have not been redeemed.
- The integration and server-side key are configured.
- No live inference request has been made.
- Runpod inference or credit consumption is not claimed.
Confirm the organizer’s accepted proof-of-use requirements before marking Runpod proof complete.

## Privacy and Human Oversight
Use synthetic accounts and travel records for demonstrations.
The optional summary request includes:
- Free-text trip purpose
- Destination
- Travel dates
- Estimated cost
- Budget flag
Separate traveller-name and claim-reference fields, plus account, team, and request IDs, are omitted.
However, free-text purpose can still contain personal information. Do not include names, identifiers, or sensitive details in it.
The summary:
- Requires explicit confirmation before external processing.
- Is not saved to request history by FlowGuard.
- Does not replace manager review.
- Cannot approve, reject, book, or pay for travel.
Provider retention, training, regional processing, and other data terms must be reviewed before using real employee data.

## Known Limitations
- The target-user problem and business impact have not been validated through field research.
- No measured time-saving percentage is claimed.
- The budget threshold is illustrative.
- Live Supabase authentication, redirects, schema, and team isolation still require staging verification.
- Runpod inference has not been tested.
- Public deployment and judge access remain unverified.
- External scripts, images, and model terms require a final license and privacy review.
- FlowGuard does not connect to a booking, payment, accounting, or reimbursement platform.

## Future Improvements
- Validate the workflow with intended SME users.
- Measure review time and clarification rates.
- Replace the demonstration budget threshold with configurable team policy.
- Verify live authentication and team isolation.
- Complete a synthetic Runpod test after resolving credits and provider terms.
- Review external assets and remove unnecessary dependencies.
- Improve accessibility and mobile usability based on testing.

## Submission Checklist
- [x] Team name, domain, university, and member count recorded
- [x] Replit development workspace used
- [x] Runpod integration implemented
- [ ] Confirm official team leader and complete five-member roster
- [ ] Confirm SDG track and sub-target
- [ ] Confirm workshop completion and eligibility declarations
- [ ] Establish an evidence-based impact baseline and target
- [ ] Verify final GitHub contents and judge access
- [ ] Add a published application link
- [ ] Complete official Replit proof of use
- [ ] Confirm and complete applicable Runpod proof of use
- [ ] Complete preliminary submission PDF
- [ ] Complete technology declaration PDF
- [ ] Add pitch-deck link
- [ ] Add YouTube demonstration link
- [ ] Review source ownership, licenses, and required attribution
- [ ] Check source, history, screenshots, and video for exposed credentials


## License
An Apache License 2.0 file is included in the project source.
