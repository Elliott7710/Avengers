# SDC 2026 preliminary submission — working draft

This is a field-by-field draft based on the supplied
`SDC2026_TeamName_Preliminary.pdf` form. It is **not ready to submit** until
bracketed facts are confirmed, the required workshop declaration is accurate,
the impact-baseline fields are resolved, and the team completes the eligibility
checklist in the official PDF. The template says the deadline is 25 October
2026; confirm the organizer's current deadline.

**Live workflow update (24 October 2026):** The project owner reported that the
existing travel request was accessible in employee and manager sessions and that
the approval check worked, including the employee-visible outcome, manager note,
and activity history. The SQL result supplied by the owner showed one travel
record assigned to a team. These are owner-reported checks, not an independent
end-to-end audit. New-account signup, wider access-isolation cases, public judge
access, and live Runpod inference are not established by those checks.

**Originality / eligibility blocker:** This workspace was populated from an
uploaded repository. The team must establish when that work was created, who
owns it, and what was pre-existing before answering the prior-work question or
signing the form's statement that the submission is original work created
during the SDC 2026 hackathon period. Do not mark “No” without checking.

## Cover fields

- **Team Name:** Avengers
- **Selected Domain:** Domain 2
- **Selected SDG Track (1–17):** [PROPOSED, NOT YET CONFIRMED] SDG 8 — Decent Work and Economic Growth; target 8.2. Confirm that this choice matches the organizer's Domain 2 rules.
- **Project / Solution Name:** FlowGuard
- **Name (Leader):** Dayanitha [confirm; the supplied README roster separately names Soo Jun Hin as team lead]
- **Email & Phone (Leader):** [TEAM TO COMPLETE IN THE OFFICIAL FORM]
- **University Affiliation(s):** Asia Pacific University (APU)
- **Number of Team Members:** 5

**Roster check:** The supplied information names Dayanitha as leader in the team
table, but its lower roster lists Soo Jun Hin as Team Lead and repeats that same
person for three roles. Confirm the correct leader and complete five-member
roster before signing.

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

FlowGuard is a browser travel-approval prototype for small teams. Employees
submit traveller, destination, dates, purpose, estimated MYR cost, and an
optional claim reference. Deterministic validation checks fields and dates, then
shows an illustrative `standard` or `high_budget` flag against a MYR 1,000
threshold. A different manager records an approval or rejection reason; an
approved request can be marked Booked with a note. Supabase policies and
triggers enforce team membership, independent decisions, status changes, and
append-only activity history.

The optional AI integration is configured for Runpod's Qwen3 32B AWQ public
endpoint to draft a summary for a manager reviewing another employee's pending trip. It would send
free-text purpose, destination, dates, estimated cost, and budget flag. Separate
traveller-name and claim-reference fields and account/team/request IDs are
omitted, but free text could still identify someone. The manager confirms
synthetic or approved processing. Output is temporary and advisory; it never
approves or rejects. The server key is stored in Replit Secrets, but no paid
inference has been made, so live provider behavior is unverified. Validation
and budget rules remain deterministic.

The stack is vanilla HTML/CSS/JavaScript, Node/Express, Replit, and Supabase
Auth/PostgreSQL/JS SDK. The team reports that SDC provided Replit and Runpod
credits; Replit is used for this workspace, while the Runpod credits have not
been redeemed and no model request has been made. **Workshop text to complete:**
name only Phase 1 workshops actually completed by members.

## 3.1. Conceptual Tech Stack

| Layer | Current implementation |
|---|---|
| Frontend | Multi-page HTML, CSS, and vanilla JavaScript |
| Runtime/config and summary API | Node.js; Express API Server artifact in this workspace |
| Development/build | Vite 7.3.7 |
| Authentication | Supabase Auth |
| Database/access control | Supabase PostgreSQL, row-level security, SQL functions and triggers |
| Third-party library | Supabase JavaScript SDK 2.118.0 in the source lockfile; browser pages load the floating jsDelivr `@2` URL |
| AI / compute | Optional Runpod Qwen3 32B AWQ public endpoint for manager-requested summaries; server-side key is stored in Replit Secrets, but no live inference has been made |
| Hosting/development | Replit web artifact and API Server workflows |
| Sponsor-provided GenAI API or cloud platform | SDC provided Replit and Runpod credits. Replit is used for this workspace; Replit credit redemption status is not stated. Runpod credits are unredeemed; no model inference or Runpod credit usage is claimed. |

**Architecture:** browser → Replit-served frontend → Supabase Auth and
PostgreSQL through the browser SDK. For an explicitly requested manager summary,
the Replit API Server verifies the Supabase session and team role, then sends
minimized trip details to the Runpod public endpoint. The Supabase configuration
endpoint returns only the URL and publishable browser key; no service-role key
or database password is exposed.

## 3.2. Design-Thinking & Deployment Strategy — draft (under 200 words)

The prototype is based on a problem hypothesis, not completed customer research.
Its narrow journey connects an employee travel request, an independent manager
decision, and a visible outcome with activity history. The project owner reports
that two existing accounts could access the request and that approval appeared
for the employee with the manager note and history. This is a live owner check,
not an independent audit or SME validation. Local unit, disposable-PostgreSQL,
and simulated browser tests also exercise validation, role boundaries, and
status changes.

For Phase 2, measure equivalent synthetic review tasks using a manual process
and FlowGuard. Record start-to-decision time, sample size, clarifications, and
median results. A proposed goal, subject to team confirmation, is a 30% reduction
in median review time relative to the measured manual baseline; no reduction is
claimed yet. Broader signup and access-isolation checks and public judge access
still need verification. Optional Runpod summaries must remain manager-reviewed
and limited to synthetic or explicitly approved data.

## Impact baseline and KPI — required, unresolved

The supplied form requests a specific SDG sub-target, numeric current baseline,
core KPI, and percentage-based Phase 2 target. No measured baseline, applicable
public benchmark, or validated environmental impact is established in the
project. The required numeric baseline remains unresolved; do not replace it
with an invented estimate. A future improvement target may be proposed without
claiming it has already been achieved.

| Form field | Defensible draft |
|---|---|
| Target SDG sub-target(s) | Candidate for team review: UN SDG target 8.2, “Achieve higher levels of economic productivity through diversification, technological upgrading and innovation.” Confirm the exact fit and selected SDC domain/track before claiming alignment. Source: [UN SDG Indicators metadata](https://unstats.un.org/sdgs/metadata?Goal=8&Text=). |
| Current problem baseline | **TBD — not measured.** Time the same complete synthetic request in the team's current process and record start-to-decision time, including pauses/clarification requests. |
| Core measurable KPI | Median elapsed minutes from a complete request being presented to a manager's recorded decision; separately record requests requiring clarification. |
| Phase 2 impact target | **PROPOSED — TEAM TO CONFIRM:** reduce median travel-request review time by 30% relative to a measured manual-process baseline. This is an unvalidated goal, not an achieved result. Reassess feasibility once the baseline is measured. |
| Source/citation | No external baseline source is claimed in this draft. Add a credible citation only if the team uses published data. |

Suggested low-cost measurement: have the same reviewers process a small,
predeclared set of equivalent synthetic cases in the current method and
FlowGuard; record task start/end, clarifications, and completion. Report the
sample size and median. This is a proposed measurement plan, not completed user
research or evidence of time saving.

Calculate the measured reduction as
`(manual median − FlowGuard median) / manual median × 100`, using the same timing
definition for both methods and a positive manual baseline. Use equivalent
cases and counterbalance which method reviewers try first to reduce practice
effects. A 30% target means FlowGuard's median should be at most 70% of the manual
median; it does not supply the missing baseline.

## Third-party items for form section 6.2

| Name | Type | License / attribution status |
|---|---|---|
| `@supabase/supabase-js` 2.118.0 | Code library | MIT; browser pages currently load the unpinned jsDelivr `@2` URL |
| Express 5.3.0 | Code library | MIT |
| Vite 7.3.7 | Build/development tool | MIT |
| Zod 3.25.76; Pino 9.14.0; pino-http 10.5.0 | Code libraries | MIT; verify against the final lockfile before signing |
| Qwen3 32B AWQ through Runpod Public Endpoint | Pre-trained model | Confirm upstream model license and Runpod endpoint terms before signing |
| Noupe embed script used on several pages | Remote third-party code | Purpose, data behavior, license, and necessity not yet verified |
| CodingStella image referenced as a remote CSS background | Image asset | Source/license not yet verified |
| FlowGuard demo fixtures | Synthetic test data | Project test fixtures; no external training/evaluation dataset identified |

## Eligibility and ownership fields — team must complete

- **Mandatory GenAI, Database, and Cloud Deployment workshops completed by all
  members:** [TEAM TO VERIFY]
- **Verified real-world problem mapped to UN SDGs:** [NOT VERIFIED; the SME pain
  point is currently a hypothesis]
- **Functional, deployed application:** [Replit workspace preview, local checks,
  and owner-reported live team access and approval checks exist; public deployment
  and judge access are not verified]
- **All fields completed within word limits:** [INCOMPLETE UNTIL THIS DRAFT IS
  RESOLVED AND TRANSFERRED TO OFFICIAL PDF]
- **6.1 Pre-existing/prior-owned work:** [TEAM TO DECLARE; establish repository
  origin, creation date, and ownership before answering Yes/No]
- **6.2 Third-party code, datasets, or models:** Yes—see the table above and
  the tech declaration. Confirm licenses, attribution, and the full inventory.
- **6.3 Employment-related IP conflicts:** [EACH TEAM MEMBER MUST DECLARE
  Yes/No; explain any agreement that could claim ownership]

## Required attestations and signature — team leader to complete

- [ ] Every team member completed the required GenAI, Database, and Cloud Deployment workshops.
- [ ] The project addresses a verified real-world problem mapped to one or more SDGs.
- [ ] The solution targets a functional, deployed application.
- [ ] Every official form field is complete and within its word limit.
- **Team leader signature:** [SIGN IN OFFICIAL PDF]
- **Date:** [COMPLETE IN OFFICIAL PDF]

## Transfer note

The official preliminary PDF also contains additional third-party, sustainability,
and team-attestation fields. Transfer the final confirmed text into the supplied
PDF and have the team leader review and sign it. Do not submit this working
Markdown as if it were the official form.
