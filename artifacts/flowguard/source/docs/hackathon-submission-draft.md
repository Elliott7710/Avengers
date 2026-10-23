# SDC 2026 preliminary submission — working draft

This is a field-by-field draft based on the supplied
`SDC2026_TeamName_Preliminary.pdf` form. It is **not ready to submit** until
bracketed facts are confirmed, the required workshop declaration is accurate,
the impact-baseline fields are resolved, and the team completes the eligibility
checklist in the official PDF. The template says the deadline is 25 October
2026; confirm the organizer's current deadline.

## Cover fields

- **Team Name:** [TEAM TO CONFIRM]
- **Selected Domain:** [SELECT ONE OFFICIAL DOMAIN]
- **Selected SDG Track (1–17):** [TEAM TO CONFIRM; candidate 8, if justified]
- **Project / Solution Name:** FlowGuard
- **Name (Leader):** [TEAM TO CONFIRM]
- **Email & Phone (Leader):** [TEAM TO COMPLETE IN THE OFFICIAL FORM]
- **University Affiliation(s):** [TEAM TO CONFIRM]
- **Number of Team Members:** [TEAM TO CONFIRM]

## 2.1. The Problem Context — draft (under 250 words)

Small businesses often coordinate employee travel through a mix of messages,
spreadsheets, and informal manager approvals. This can separate the request
details, estimated cost, decision, and later booking note, making it harder for
employees and managers to see what needs review and what has already happened.
This is a problem hypothesis for the proposed SME audience, not a finding from
customer research. FlowGuard will test whether one shared, role-scoped request
and activity history makes the review process easier to complete and audit. The
target is operational clarity and review time, not reduced travel emissions:
the prototype does not optimize routes, measure emissions, place bookings, or
integrate with an accounting or claims system.

## 2.2. The Proposed AI Solution — draft (under 300 words)

FlowGuard is a browser-based travel request and approval prototype for small
teams. An employee submits the traveller, destination, dates, purpose, estimated
MYR cost, and an optional claim reference. The app validates required details
and dates, then shows an illustrative `standard` or `high_budget` flag based on
a MYR 1,000 threshold. A separate manager must review the request and record a
reason to approve or reject it. Approved requests can be marked Booked with a
note. Status, edits, decisions, and booking actions are recorded in an
append-only activity history. Supabase PostgreSQL policies and triggers enforce
team membership, independent decisions, and permitted status changes.

**This prototype does not currently use artificial intelligence.** Its
validation and budget flag are deterministic rules, and it does not call a
generative-AI API or use RunPod. Calling these rules “AI” would misrepresent the
implementation. If the SDC form requires an AI component, the team must decide
whether to add one within the rules and access available, or submit a different
project concept; no AI feature is implied by this draft.

The current prototype uses plain HTML, CSS, and JavaScript, Replit hosting,
Node.js runtime configuration, Supabase Auth and PostgreSQL, and the Supabase
JavaScript SDK. The team must confirm which Phase 1 GenAI, database, or cloud
workshops members completed and which official sponsor resources, if any, were
used. No workshop or sponsor participation is asserted here.

## 3.1. Conceptual Tech Stack

| Layer | Current implementation |
|---|---|
| Frontend | Multi-page HTML, CSS, and JavaScript |
| Runtime/config endpoint | Node.js in the standalone source; Replit API Server artifact in this workspace |
| Authentication | Supabase Auth |
| Database/access control | Supabase PostgreSQL, row-level security, SQL functions and triggers |
| Third-party library | Supabase JavaScript SDK 2.x; exact resolved version to confirm from lockfile |
| AI / compute | None in the running product |
| Hosting/development | Replit web artifact and API Server workflows |
| Sponsor-provided GenAI API or cloud platform | [TEAM TO CONFIRM; none identified in the repository] |

**Architecture:** browser → Replit-served frontend → Supabase Auth and PostgreSQL
through the browser SDK. A Replit API endpoint returns the Supabase URL and
publishable browser key from secrets; it does not expose a service-role key or
database password. No RunPod endpoint or AI model is connected.

## 3.2. Design-Thinking & Deployment Strategy — draft (under 200 words)

The prototype focuses on one narrow journey: an employee submits a request, a
different manager reviews it, and both roles can see the outcome and activity
history. The role boundary, status transitions, validation, and history are
implemented in the database as well as reflected in the interface, so a hidden
or altered browser control is not the security boundary. The team should
validate the workflow with intended SME users before claiming usability or
business impact. For Phase 2, use synthetic accounts in an isolated staging
project; apply the SQL migrations only after reviewing the target, configure
Auth redirects, and test employee/manager isolation. Compare the time to process
the same complete synthetic request in the team's current process and in
FlowGuard, using the same participants and scenario, and report the observed
median without generalizing beyond the test. Production deployment, user
research, and live-service verification are not claimed.

## Impact baseline and KPI — required, unresolved

The supplied form requests a specific SDG sub-target, numeric current baseline,
core KPI, and percentage-based Phase 2 target. No measured baseline, public
benchmark, or validated environmental impact was found in the project files.
Do not submit made-up numbers.

| Form field | Defensible draft |
|---|---|
| Target SDG sub-target(s) | Candidate for team review: UN SDG target 8.2, “Achieve higher levels of economic productivity through diversification, technological upgrading and innovation.” Confirm the exact fit and selected SDC domain/track before claiming alignment. Source: [UN SDG Indicators metadata](https://unstats.un.org/sdgs/metadata?Goal=8&Text=). |
| Current problem baseline | **TBD — not measured.** Time the same complete synthetic request in the team's current process and record start-to-decision time, including pauses/clarification requests. |
| Core measurable KPI | Median elapsed minutes from a complete request being presented to a manager's recorded decision; separately record requests requiring clarification. |
| Phase 2 impact target | **TBD — do not invent a percentage.** Set only after the baseline and feasibility are known; report actual comparison, sample size, and limitations. |
| Source/citation | No external baseline source is claimed in this draft. Add a credible citation only if the team uses published data. |

Suggested low-cost measurement: have the same reviewers process a small,
predeclared set of equivalent synthetic cases in the current method and
FlowGuard; record task start/end, clarifications, and completion. Report the
sample size and median. This is a proposed measurement plan, not completed user
research or evidence of time saving.

## Eligibility and ownership fields — team must complete

- **Mandatory GenAI, Database, and Cloud Deployment workshops completed by all
  members:** [TEAM TO VERIFY]
- **Verified real-world problem mapped to UN SDGs:** [NOT VERIFIED; the SME pain
  point is currently a hypothesis]
- **Functional, deployed application:** [LOCAL/REPLIT WORKSPACE PREVIEW EXISTS;
  confirm public deployment and judge access]
- **All fields completed within word limits:** [INCOMPLETE UNTIL THIS DRAFT IS
  RESOLVED AND TRANSFERRED TO OFFICIAL PDF]
- **6.1 Pre-existing/prior-owned work:** [TEAM TO DECLARE; provenance and
  ownership cannot be inferred from this workspace]
- **6.2 Third-party code, datasets, or models:** Yes—Supabase JS SDK and
  Supabase-hosted Auth/PostgreSQL; synthetic test fixtures; no model identified.
  Confirm full dependency and external-asset inventory before signing.

## Transfer note

The official preliminary PDF also contains additional third-party, sustainability,
and team-attestation fields. Transfer the final confirmed text into the supplied
PDF and have the team leader review and sign it. Do not submit this working
Markdown as if it were the official form.
