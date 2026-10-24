# SDC 2026 submission checklist — FlowGuard

Statuses reflect this workspace review on 23 October 2026, not organizer
approval. **Draft** means material exists but must be confirmed by the team;
**outstanding** means proof or a team action is still missing.

| Criterion / proof | Status | Evidence or next action |
|---|---|---|
| Target SME workflow and recurring burden | Draft; hypothesis only | [`README.md`](../README.md) and [`hackathon-submission-draft.md`](hackathon-submission-draft.md). Obtain user evidence before calling it verified. |
| Working approval journey | Implemented locally; live Supabase unverified | [`travel-workflow-demo.md`](travel-workflow-demo.md). Rehearse with two synthetic accounts only after staging setup. |
| Human approval and activity history | Implemented and locally tested | Independent manager decision, required reason, append-only history; see demo runbook and workflow tests. |
| Measurable benefit plan | Draft; no results | Median decision time and clarification count; run a timed baseline and report N and method before setting a target. |
| README: summary, setup, architecture, assumptions, tests | Draft complete | [`README.md`](../README.md). Verify the instructions on a clean checkout before submission. |
| Pitch deck | Outstanding | Create a concise deck after the team selects length/style and confirms outline. Add final link here. |
| Demo runbook | Draft complete | [`hackathon-demo-runbook.md`](hackathon-demo-runbook.md). Staging-dependent steps are identified. |
| Official preliminary form | Draft only | [`hackathon-submission-draft.md`](hackathon-submission-draft.md). Transfer to official PDF; confirm all identity, eligibility, SDG, baseline, and prior-work fields. |
| Tech-tools declaration | Draft only | [`tech-declaration-draft.md`](tech-declaration-draft.md). Confirm team-wide tools, service tiers/regions, asset inventory, workshop/sponsor use, and signatures. |
| GitHub repository URL / judge access | URL supplied; access not verified | Team supplied `https://github.com/Elliott7710/Avengers`. Confirm the link is accessible to judges and that repository contents/history are appropriate for submission. |
| Replit proof of use | Workspace evidence exists; official proof outstanding | Replit artifacts/workflows are configured in this workspace. The team reports SDC supplied Replit credits; redemption status is not stated. Complete the organizer's Replit POU form with genuine evidence. |
| Replit live app and judge access | Outstanding | Workspace preview runs locally in Replit. Confirm a public deployment URL and test anonymous judge access if required. |
| Runpod AI feature / proof of use | Integration wired; no inference | The key is stored, but the team reports SDC Runpod credits are unredeemed and no model request has been made. Do not claim Runpod inference or credit usage; confirm with organizers whether integration-only evidence meets their POU requirement. |
| Demo video / YouTube link | Outstanding | Record the flow with synthetic data, verify privacy/access, publish only with team approval, and paste the URL. No video has been published. |
| Apache 2.0 license | File present; ownership needs confirmation | `LICENSE` exists. Confirm copyright holder and repository provenance before signing/distribution. |
| Submission filenames and forms | Outstanding | Replace `TeamName` with the confirmed team name; complete the official Preliminary and TechDeclaration PDFs and any required POU forms. |
| Team/domain/SDG/workshop/ownership eligibility | Partially confirmed | Team: Avengers; Domain 2; APU; five members. SDG track, workshop completion, repository ownership/timing, and employment-IP status remain unconfirmed. The supplied notes conflict on team leader (Dayanitha vs. Soo Jun Hin). The form requires original work created during the SDC 2026 period. |
| README setup and roster consistency | Outstanding | The supplied README text describes a Python `src/main.py`, a custom RunPod Serverless endpoint/endpoint ID, and marks RunPod proof complete. Those claims conflict with the current HTML/JavaScript + Express app and the unredeemed RunPod credits/no inference status. Reconcile before submission. |
| No secrets in repository | Check before public sharing | Review staged files, history, and screenshots; keep credentials only in Replit Secrets. |
| Local checks | Passed locally; live services unverified | `npm test` (23 tests), `npm run test:workflow-db`, `npm run test:workflow-ui`, and `npm run test:teams-ui` passed. Workspace typecheck and FlowGuard/API Server builds passed. These checks do not verify live Supabase access or a real Runpod inference. |
| Staging auth, redirects, schema, and access policies | Outstanding / separate project task | Apply and verify only in the intended staging project with synthetic users. Do not treat offline tests as live proof. |

## Final go/no-go

Do not label the submission “complete” until the team has resolved the unknown
official-form fields, set an evidence-based baseline and target (or obtained
organizer approval for a transparent TBD), checked repository/deployment access,
completed any required POU forms, and confirmed what evidence is accepted for
Runpod proof-of-use requirements and whether organizers require live inference.
