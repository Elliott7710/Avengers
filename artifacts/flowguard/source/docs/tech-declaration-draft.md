# SDC 2026 technology declaration — working draft

Use this draft to complete the supplied
`SDC2026_TeamName_TechDeclaration.pdf`. It contains no credentials. Confirm every
team-level and external-service detail before signing. The SDC form says to
declare all tools, APIs, services, models, and datasets; write `None` where
appropriate rather than leaving a field blank.

## Cover fields — team to complete

- **Team Name:** Avengers
- **Project / Solution Name:** FlowGuard
- **Leader / email / phone:** Dayanitha [confirm leader; supplied roster also names Soo Jun Hin as Team Lead; complete contact details in official PDF]
- **University affiliation(s):** Asia Pacific University (APU)
- **Live Prototype URL:** [ADD ONLY AFTER PUBLIC DEPLOYMENT AND JUDGE ACCESS ARE VERIFIED]
- **Code Repository URL:** https://github.com/Elliott7710/Avengers [provided by team; verify public/judge access and repository contents]

## 2.1 System Architecture Overview — draft (under 200 words)

FlowGuard is a multi-page browser application served by Replit. The browser
loads HTML, CSS, JavaScript, and the Supabase JavaScript SDK. A Replit API
configuration endpoint supplies the Supabase project URL and browser
publishable key from Replit Secrets; it does not expose a database password or
service-role key. Supabase Auth provides account sessions. The browser client
uses Supabase PostgreSQL tables, row-level security, and database functions and
triggers for profiles, team membership, Travel, Insights, and travel activity.
The travel workflow validates request details, displays an illustrative budget
flag, and requires an independent manager decision. An optional manager action
can request a factual draft summary from the Runpod Qwen3 32B AWQ public
endpoint. The server-side key is stored in Replit Secrets, but no paid inference
has been made, so provider authentication and live inference remain unverified.
The API Server verifies the Supabase session and team-manager role, then reads
the eligible request with the caller's JWT before sending selected fields.
The summary does not decide, approve, or reject a request. The product does not
process payments or place bookings. Public deployment and judge access remain
unverified.

## 2.2 Languages, frameworks, and libraries

| Name / version | Purpose | License / terms |
|---|---|---|
| JavaScript, HTML5, CSS; Node.js 24.22.1 in this workspace (source supports Node 20+) | Browser UI, standalone server, and API runtime | Node.js project license and bundled notices; confirm deployed runtime |
| Express 5.3.0 | API Server routes | MIT |
| Vite 7.3.7 | Web artifact development/build | MIT |
| Supabase JavaScript SDK 2.118.0 in source lockfile | Browser Auth and PostgREST client | MIT; HTML pages load jsDelivr `@supabase/supabase-js@2`, which is a floating major-version URL |
| Zod 3.25.76; OpenAPI 3.1; Orval 8.41.0 (build-time) | API request validation and generated API/schema code | Zod MIT; verify Orval's license from package metadata before signing |
| Pino 9.14.0 and pino-http 10.5.0 | API request logging | MIT |
| PostgreSQL / Supabase SQL | Structured data, policies, functions, and triggers | PostgreSQL license; Supabase service terms apply |
| Chromium (test environment only) | Headless UI test runner | Chromium license; only needed for UI rehearsals |

Confirm the exact versions and licenses from the final lockfile and
third-party asset inventory before submission.

## 3.1 External APIs

| API / provider | Purpose | Access tier |
|---|---|---|
| Supabase Auth and PostgREST/RPC | Sign-in, profile/team data, Travel/Insights, guarded workflow actions | Supabase project plan: [TEAM TO CONFIRM] |
| Runpod Public Endpoint (`qwen3-32b-awq`) | Optional manager-requested travel summary; integration is configured but no model request has been made | SDC-provided Runpod credits are unredeemed. Current model page lists $10 / 1M tokens; verify pricing and credit eligibility before any request |
| jsDelivr CDN | Delivers the Supabase JS SDK to browser pages | Public CDN; access tier: [TEAM TO CONFIRM] |

No maps, payment, email, or booking API is connected. The source also loads a
third-party Noupe JavaScript embed and a CodingStella-hosted CSS background
image. Their purpose, data behavior, and usage licenses are not yet verified;
inspect or remove them before signing. Confirm actual deployed-page requests.

## 3.2 Cloud Platforms & Deployment

| Service / provider | Purpose | Plan / region |
|---|---|---|
| Replit | Development workspace; FlowGuard web and API Server workflows | SDC provided Replit credits; redemption status not stated. Confirm plan/region; public deployment unverified |
| Supabase | Hosted Auth and PostgreSQL | Project region/plan: [TEAM TO CONFIRM] |
| Runpod | Optional Qwen3 32B AWQ Public Endpoint; no custom GPU deployment is required; integration has not made a request | SDC credits supplied but not redeemed; no inference or credit consumption is claimed. Verify current pricing before use |

## 4.1 AI Models Used in the Solution

| Model & version | Source / provider | Usage | License / terms |
|---|---|---|---|
| Qwen3 32B AWQ (`qwen3-32b-awq`) | Runpod Public Endpoint; [provider model page](https://docs.runpod.io/public-endpoints/models/qwen3-32b) | Pre-trained model configured for an optional manager-requested draft summary; no live request has been made | Confirm upstream model license and Runpod endpoint terms before signing; do not infer from the API endpoint name |

The feature is wired and the server-side key is stored in Replit Secrets, but
no paid inference has been made. Provider authentication and live output remain
unverified. The MYR threshold flag and form validation are deterministic rules.
Replit Agent is development assistance, not an embedded solution model; list it
in section 4.3.

## 4.2 Datasets

| Dataset | Source / URL | Type | License | Personal data? |
|---|---|---|---|---|
| Travel, team, profile, and activity records | Supabase project; demo entries or app users | Self-collected; synthetic for rehearsals | Internal / team-controlled | Yes for live accounts and travel requests; synthetic test records contain no real identities |
| Model training/evaluation data | None identified | None | N/A | N/A |

Use synthetic records for demos. The optional Runpod prompt contains the
free-text purpose, destination, dates, estimated cost, and budget flag; the
separate traveller-name and claim-reference fields and account/team/request IDs
are omitted. Purpose text could still contain personal details, so exclude
names and identifiers from it.

## 4.3 AI-assisted development tools

**Did the team use a generative-AI tool?** Yes.

| Tool & version | Used for | Extent |
|---|---|---|
| Replit Agent; underlying model/version not disclosed | Repository changes, testing support, and draft documentation in this workspace | Substantial; team to confirm the description and add tools used independently by other members |

**Review and responsibility (under 100 words):** Replit Agent assisted with
code changes and draft text. Local tests and builds passed, but live Supabase
team access and Runpod inference remain unverified. The team must independently
review the generated code and declarations, check licenses and provider terms,
and test the deployed prototype with synthetic accounts before signing. The
team leader remains responsible for the final submission.

## SDC sponsor resources

- **Did the project use an official SDC sponsor resource?** Yes. The team
  reports SDC supplied Replit and Runpod credits; the Replit workspace is used
  for development. Confirm whether Replit credits were redeemed.
- **Sponsor/resource/use:** Replit workspace: used for the project. Runpod
  credits: supplied but not redeemed; the summary integration is configured,
  but no model request, inference, or credit usage is claimed.
- **Essential or replaceable (under 100 words):** Replit was the development
  workspace. The Runpod summary is optional and replaceable; core travel
  requests, approvals, and activity history work without it. Runpod credits
  remain unredeemed, so do not claim Runpod inference or proof of credit use.

## 6.1 Data Handling & Privacy — draft (under 150 words)

Supabase Auth manages accounts and sessions; Supabase PostgreSQL stores profiles,
team memberships, travel requests and costs, Insights, and activity. Live travel
records can include names, destinations, dates, purpose, and claim references,
so use synthetic accounts and requests for the demo. Supabase policies restrict
access by user and team role. The Replit API returns only the Supabase URL and
publishable key. On a manager's explicit request, it sends free-text purpose,
destination, dates, estimated cost, and budget flag to Runpod. Separate name and
claim-reference fields and account/team/request IDs are omitted, but purpose
text could still identify someone. The UI requires confirmation; FlowGuard does
not save the generated summary. Supabase retention and Runpod retention,
training, and region terms are unverified. Do not send real travel data until
the team reviews and approves those terms.

## 6.2 Known Limitations & Risks — draft (under 150 words)

The optional AI summary can hallucinate or omit facts; it is not an approval
decision. The Runpod key is configured, but provider authentication and live
inference are unverified. The prompt is capped at 180 output tokens and the API
has an in-process limit of six requests per user per minute; these do not set a
hard dollar cap. The team must verify current token pricing and provider data
terms. The illustrative budget threshold is not company policy. The business
problem and any time saving remain unvalidated. Live Supabase auth, team
isolation, and migrations are unverified. The Noupe embed and remote image need
purpose, privacy, and license review. The prototype does not book travel or
process payments.

## Final declaration checklist

- [ ] Confirm the team and leader details, public URLs, repository access, and live prototype state.
- [ ] Reconcile every service and library against the final source, lockfile, and browser network requests; investigate the Noupe embed and CodingStella image.
- [ ] Confirm AI-development tools used by every team member and review generated output.
- [ ] Confirm SDC workshop completion and current Runpod pricing/terms. SDC-provided Runpod credits are unredeemed; do not claim inference or credit use.
- [ ] Confirm synthetic-only demo data, disclose possible personal data in free-text purpose, and review Runpod terms.
- [ ] Verify Supabase staging/auth/team access and make one explicitly requested synthetic Runpod test before claiming live behavior.
- [ ] Complete every official form field, checklist item, signature, and date.
- [ ] Ensure no keys, passwords, tokens, or credentials appear in submission files.

## Official declaration checkboxes — leave unticked until verified

- [ ] All APIs, cloud services, AI tools, models, and datasets are declared.
- [ ] Third-party licenses and required attributions are verified.
- [ ] No credentials are exposed in source, prototype, or submission files.
- [ ] Team-wide AI development use is disclosed and reviewed.
- [ ] Official SDC sponsor resources are declared in Section 5.
- [ ] The prototype is accessible to judges using the provided links.
- [ ] Every field is complete and within its word limit.
- **Team leader signature:** [SIGN IN OFFICIAL PDF]
- **Date:** [COMPLETE IN OFFICIAL PDF]
