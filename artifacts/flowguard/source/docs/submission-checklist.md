# SDC 2026 submission checklist — FlowGuard

Statuses reflect this workspace review on 24 October 2026, not organizer
approval. **Draft** means material exists but must be confirmed by the team;
**outstanding** means proof or a team action is still missing.

| Criterion / proof | Status | Evidence or next action |
|---|---|---|
| Target SME workflow and recurring burden | Draft; hypothesis only | [`README.md`](../README.md) and [`hackathon-submission-draft.md`](hackathon-submission-draft.md). Obtain user evidence before calling it verified. |
| Working approval journey | Owner-reported live demo verified | The owner reports that employee and manager accounts can access the request and that the employee sees the manager's decision and note. Supporting composite screenshot: `submission/evidence/flowguard-demo-and-runpod-note.png`; not an independent audit. |
| Human approval and activity history | Implemented; owner-reported live check | Independent manager decision, required reason, append-only history; see [`travel-workflow-demo.md`](travel-workflow-demo.md) and the supplied screenshot. |
| Measurable benefit plan | Draft; no results | Median decision time and clarification count; run a timed baseline and report N and method before setting a target. |
| README: summary, setup, architecture, assumptions, tests | Draft complete | [`README.md`](../README.md). Verify the instructions on a clean checkout before submission. |
| Pitch deck | Created in Replit; public link outstanding | The approved eight-slide deck exists as a Replit slides artifact. Export/share it and add the final accessible link. |
| Demo runbook | Draft complete | [`hackathon-demo-runbook.md`](hackathon-demo-runbook.md). Staging-dependent steps are identified. |
| Official preliminary form | Draft only | [`hackathon-submission-draft.md`](hackathon-submission-draft.md). Transfer to official PDF; confirm all identity, eligibility, SDG, baseline, and prior-work fields. |
| Tech-tools declaration | Draft only | [`tech-declaration-draft.md`](tech-declaration-draft.md). Confirm team-wide tools, service tiers/regions, asset inventory, workshop/sponsor use, and signatures. |
| GitHub repository URL / judge access | URL supplied; access not verified | Team supplied `https://github.com/Elliott7710/Avengers`. Confirm the link is accessible to judges and that repository contents/history are appropriate for submission. |
| Replit proof of use | Workspace used; evidence capture and official proof outstanding | Replit artifacts and workflows are configured here. Capture genuine workspace and workflow screenshots; conceal secret values. The supplied POU PDF is an “EXAMPLE ONLY” cover, not a completed form. |
| Replit live app and judge access | Outstanding | Workspace preview runs locally in Replit. Confirm a public deployment URL and test anonymous judge access if required. |
| RunPod inference / proof of use | One direct synthetic inference completed; feature quality failed review | On 24 October 2026, a direct request to `qwen3-32b-awq` returned HTTP 200 / `COMPLETED`, but the response included unrelated fabricated content. This did not exercise the authenticated FlowGuard manager route. Add the matching provider dashboard usage screenshot and use the evidence limits in [`../../../../submission/evidence-index.md`](../../../../submission/evidence-index.md). Do not call the summary reliable or make further requests until reviewed. |
| Demo video / YouTube link | Outstanding | Record the flow with synthetic data, verify privacy/access, publish only with team approval, and paste the URL. No video has been published. |
| Apache 2.0 license | File present; ownership needs confirmation | `LICENSE` exists. Confirm copyright holder and repository provenance before signing/distribution. |
| Submission filenames and forms | Outstanding | Replace `TeamName` with the confirmed team name; complete the official Preliminary and TechDeclaration PDFs and any required POU forms. |
| Team/domain/SDG/workshop/ownership eligibility | Partially confirmed | Team: Avengers; Domain 2; APU; five members. SDG track, workshop completion, repository ownership/timing, and employment-IP status remain unconfirmed. The supplied notes conflict on team leader (Dayanitha vs. Soo Jun Hin). The form requires original work created during the SDC 2026 period. |
| README setup and roster consistency | Pending GitHub update and final check | The user will update GitHub from the chat draft. Verify that the published README matches the JavaScript/Express project, current RunPod test limitations, final links, and confirmed team details. |
| No secrets in repository | Check before public sharing | Review staged files, history, and screenshots; keep credentials only in Replit Secrets. |
| Local checks | Passed in the latest recorded cleanup check | `npm test` (23 tests), workspace typecheck, and the FlowGuard frontend production build passed. These checks do not establish production readiness or AI summary quality. |
| Staging auth, redirects, schema, and access policies | Partially owner-verified; further checks outstanding | Employee/manager request access and approval were reported working. Signup, redirect, broader cross-team isolation, and a full production audit remain unverified. Use synthetic accounts. |

## Final go/no-go

Do not label the submission “complete” until the team has resolved the unknown
official-form fields, set an evidence-based baseline and target (or obtained
organizer approval for a transparent TBD), checked repository/deployment access,
completed any required POU forms, and confirmed what evidence is accepted for
Runpod proof-of-use requirements and whether organizers require live inference.
