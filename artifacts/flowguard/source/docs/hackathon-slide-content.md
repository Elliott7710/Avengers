# FlowGuard — paste-ready pitch slide content

This is a content brief, not a designed deck. It is written for six concise
slides and follows the supplied SDC preliminary form's emphasis on problem,
solution, architecture, sustainability/impact, and feasibility. Team identity,
SDC track, public URLs, and impact numbers are intentionally left for
confirmation. Do not present unmeasured benefits or unvalidated user research
as results.

## Slide 1 — FlowGuard

**Headline:** FlowGuard

**Subhead:** A clearer travel request and approval workflow for small teams.

**Small footer:** SDC 2026 · [Team name] · [University]

**Speaker note:** We are testing the hypothesis that small businesses can reduce
travel-approval coordination friction by keeping request details, human
decisions, and activity history in one role-scoped workflow.

## Slide 2 — The problem we are testing

**Headline:** Travel approvals can get split across messages and spreadsheets

- Request details, cost context, and manager decisions may live in different places
- Employees can struggle to see what is waiting, approved, or already booked
- Small teams need a lightweight record of who decided and why
- This is a problem hypothesis, not yet validated by customer research

**Speaker note:** We have not interviewed customers or measured the current
process. Our first step is to test this workflow with intended SME users and
record a baseline.

## Slide 3 — One request, one accountable decision

**Headline:** From request to outcome—with a person in control

1. Employee submits trip details, purpose, dates, estimated cost, and optional claim reference
2. Validation catches incomplete details; an illustrative MYR 1,000 rule flags budget review
3. A different manager reviews and records an approve/reject reason
4. The employee sees the decision; only an approved request can be marked booked
5. Each successful action appears in role-labelled activity history

**Callout:** No automatic approval. No real booking. The MYR 1,000 threshold is illustrative, not company policy.

## Slide 4 — What is implemented

**Headline:** A working prototype with the important rules enforced

- Browser app: HTML, CSS, and JavaScript, served in Replit
- Supabase Auth and PostgreSQL for accounts and team-scoped records
- Database policies and triggers enforce permissions and status transitions
- Independent manager decisions require a reason; activity writes are append-only
- Optional manager-requested Runpod draft summary; it is advisory and does not make decisions
- Local unit, disposable-PostgreSQL, and simulated-browser tests are available

**Architecture line:** Browser → Replit FlowGuard UI → Supabase Auth + PostgreSQL; manager-requested summary → Replit API Server → Runpod Qwen3 32B AWQ

**Truth-in-labeling callout:** Budget flags and validation are deterministic. The optional Runpod feature drafts a manager summary only; it cannot approve or reject. The key is stored in Replit Secrets; live inference still needs a synthetic end-to-end test.

**Speaker note:** Replit is the development/hosting environment; Supabase provides
authentication and the relational data service. The public deployment and
judge-access link still need team verification.

## Slide 5 — How we will measure benefit

**Headline:** Measure review time before claiming time saved

- **KPI:** Median minutes from a complete request being presented to a manager’s recorded decision
- **Baseline:** TBD—time the same reviewers using the team’s current process
- **Comparison:** Equivalent synthetic scenarios using FlowGuard
- **Also record:** Sample size, clarification count, and setup/training time
- **Result and target:** TBD until measured; no time saving is claimed today

**SDG note:** Candidate for team review: UN SDG 8.2, “Achieve higher levels of
economic productivity through diversification, technological upgrading and
innovation.” Confirm the fit and official SDC domain/track before presenting it
as the selected alignment. Source: [UN SDG Indicators metadata](https://unstats.un.org/sdgs/metadata?Goal=8&Text=).

## Slide 6 — Hardest risk and next proof

**Headline:** The next milestone is evidence—not a bigger feature list

- **Hardest risk:** We have not verified that the coordination problem is frequent or costly for the intended SMEs
- **Technical dependency:** Live approval needs Supabase schema, access policies, and Auth redirects; the optional summary needs Runpod credits and a synthetic end-to-end test
- **Safe demo:** Use separate synthetic employee and manager accounts in staging
- **Fallback:** If staging is not ready, label local tests as simulated; do not bypass authentication or permissions
- **Before submission:** Confirm team details, baseline, public repository/Replit links, proof forms, and video

**Close:** FlowGuard is a testable workflow prototype. Next, we will measure the
current process and validate the workflow with the intended users.

## Optional closing details (only after confirmation)

- **Team/domain/SDG:** [TEAM TO CONFIRM]
- **GitHub repository:** [PUBLIC LINK OR JUDGE-ACCESS LINK]
- **Replit project/live demo:** [LINK; test anonymous judge access first]
- **Runpod:** Optional manager-only Qwen3 32B AWQ summary; verify one synthetic
  end-to-end request and organizer proof requirements before claiming use.
- **Demo video:** [YOUTUBE OR APPROVED HOST LINK AFTER RECORDING]
- **Measured result:** [INSERT ONLY AFTER RUNNING THE TIMED COMPARISON; INCLUDE
  SAMPLE SIZE AND METHOD]
