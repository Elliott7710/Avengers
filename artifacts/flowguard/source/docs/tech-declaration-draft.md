# SDC 2026 technology declaration — working draft

Use this draft to complete the supplied
`SDC2026_TeamName_TechDeclaration.pdf`. It contains no credentials. Confirm every
team-level and external-service detail before signing. The SDC form says to
declare all tools, APIs, services, models, and datasets; write `None` where
appropriate rather than leaving a field blank.

## Cover fields — team to complete

- **Team Name:** [TEAM TO CONFIRM]
- **Project / Solution Name:** FlowGuard
- **Leader / email / phone:** [TEAM TO COMPLETE IN OFFICIAL FORM]
- **University affiliation(s):** [TEAM TO CONFIRM]
- **Live Prototype URL:** [ADD ONLY AFTER PUBLIC DEPLOYMENT AND JUDGE ACCESS ARE VERIFIED]
- **Code Repository URL:** [ADD PUBLIC/GRANTED-ACCESS URL; NOT VERIFIED]

## 2.1 System Architecture Overview — draft (under 200 words)

FlowGuard is a multi-page browser application served by Replit. The browser
loads HTML, CSS, JavaScript, and the Supabase JavaScript SDK. A Replit API
configuration endpoint supplies the Supabase project URL and browser
publishable key from Replit Secrets; it does not expose a database password or
service-role key. Supabase Auth provides account sessions. The browser client
uses Supabase PostgreSQL tables, row-level security, and database functions and
triggers for profiles, team membership, Travel, Insights, and travel activity.
The travel workflow validates request details, displays an illustrative budget
flag, and requires an independent manager decision. The current product does
not call an AI model, use RunPod, process payments, or place bookings. The
workspace uses Replit development workflows; public deployment and judge
access remain unverified.

## 2.2 Languages, frameworks, and libraries

| Name / version | Purpose | License / terms |
|---|---|---|
| JavaScript / Node.js 20+ | Browser app and small standalone HTTP server | Node.js project license; confirm source/version for final filing |
| HTML5 and CSS | Multi-page user interface | No framework identified |
| Supabase JavaScript SDK 2.x | Browser Auth and PostgreSQL client | MIT; confirm exact lockfile version |
| PostgreSQL / Supabase SQL | Structured data, policies, functions, triggers | PostgreSQL license; Supabase service terms apply |
| Chromium (test environment only) | Headless UI test runner | Chromium license; only needed for UI rehearsals |

Confirm the exact versions and licenses from the final lockfile and
third-party asset inventory before submission.

## 3.1 External APIs

| API / provider | Purpose | Access tier |
|---|---|---|
| Supabase Auth and PostgREST/RPC | Sign-in, profile/team data, Travel/Insights, guarded workflow actions | Supabase project plan: [TEAM TO CONFIRM] |
| jsDelivr CDN | Delivers the Supabase JS SDK to browser pages | Public CDN; access tier: [TEAM TO CONFIRM] |
| External page embed on Travel page (`noupe.com`) | Present in source; exact purpose and data behavior are not yet audited | [INVESTIGATE BEFORE SIGNING] |

No AI, maps, payment, email, or booking API was identified in the current
application source. Confirm the actual deployed page's external requests.

## 3.2 Cloud Platforms & Deployment

| Service / provider | Purpose | Plan / region |
|---|---|---|
| Replit | Development workspace; FlowGuard web and API Server workflows | [TEAM TO CONFIRM PLAN/REGION; public deployment unverified] |
| Supabase | Hosted Auth and PostgreSQL | Project region/plan: [TEAM TO CONFIRM] |
| jsDelivr | Browser SDK delivery | Public CDN |
| RunPod | Not used or found in the current product source | Not applicable unless team used it separately |

## 4.1 AI Models Used in the Solution

**None in the running product.** The MYR threshold flag and form validation
are deterministic rules. Do not list Replit Agent here as an embedded model;
it is development assistance and belongs in section 4.3.

## 4.2 Datasets

| Dataset | Source | Type | License | Personal data? |
|---|---|---|---|---|
| Application/demo records | Entered by a demo operator or synthetic test fixtures | Synthetic for rehearsals; live project data depends on team setup | Internal/test fixtures | No for synthetic examples; live user accounts and submitted travel data may identify people |

No model training or evaluation dataset was identified. Confirm no actual
employee or customer data is used in the demo.

## 4.3 AI-assisted development tools

The Replit Agent was used to prepare repository integration and submission
documentation in this workspace. Its specific underlying model/version is not
exposed here. **Team to confirm** whether to list this use, describe the extent
accurately, and add any other tools used by team members independently.

**Review and responsibility (under 100 words):** Draft: “The team reviewed
generated changes against the repository, ran local tests, and retained
responsibility for the final code and claims. Product behavior, data access, and
external-service declarations must be checked by the team against the final
deployment before submission.” [Team leader to verify this statement.]

## SDC sponsor resources

- **Did the project use an official SDC sponsor resource?** [TEAM TO CONFIRM;
  none was identified in the repository.]
- If yes, list sponsor, resource, and use: [TEAM TO COMPLETE]
- **Essential or replaceable:** [Complete only if a sponsor resource was used;
  do not invent a sponsor integration.]

## 6.1 Data Handling & Privacy — draft (under 150 words)

Supabase Auth stores account and session data. Supabase PostgreSQL stores
profiles, team memberships, travel requests and estimated costs, Insights, and
travel activity. Travel fields can include names, destinations, dates, purpose,
and a claim reference. Use synthetic accounts and records for the hackathon
demo; do not use actual employee travel data. Supabase policies and database
functions restrict records by user/team role, and the Replit API endpoint
returns only the browser-safe project URL and publishable key. No AI service,
RunPod workload, or file-upload storage is used by the current app. Data
retention, hosting region, deployed cookie/auth behavior, and live privacy
controls require team and staging verification before public submission.

## 6.2 Known Limitations & Risks — draft (under 150 words)

FlowGuard has no AI component; its budget threshold is illustrative and must
not be treated as company policy. The SME coordination problem and any time
saving remain unvalidated and unmeasured. Hosted authentication, team isolation,
and database enforcement depend on correctly applied Supabase migrations and
Auth redirect settings; offline tests do not prove live configuration. A
third-party embed and remote assets in the source need a purpose, privacy, and
license review. The prototype does not connect to an accounting/claims platform,
book travel, or process payments. Use only synthetic data until access policies
and privacy requirements are reviewed in the intended staging project.

## Final declaration checklist

- [ ] Confirm the team and leader details, public URLs, repository access, and live prototype state.
- [ ] Reconcile every service and library against the final source, lockfile, and browser network requests.
- [ ] Confirm AI-development tools used by every team member.
- [ ] Confirm sponsor resources, SDC workshop completion, and any RunPod activity with the team.
- [ ] Confirm synthetic-only data for the demo and disclose personal-data fields.
- [ ] Complete all official form sections, including checkboxes and signatures.
- [ ] Ensure no keys, passwords, tokens, or credentials appear in submission files.
