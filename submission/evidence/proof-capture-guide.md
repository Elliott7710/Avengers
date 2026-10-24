# Replit and RunPod proof capture guide

These steps describe the evidence still needed for the SDC submission. This
guide is not itself proof, and it does not replace the organiser's official
proof form. Only submit genuine screenshots from the relevant services.

## Replit workspace proof

1. Open the FlowGuard Replit workspace.
2. Start the FlowGuard web and API Server workflows and wait until both show
   they are running.
3. Arrange the workspace so one screenshot shows the project identity, the
   running workflows, and the app preview if the layout allows.
4. Save the screenshot as `replit-workspace-running.png`.
5. Keep the screenshot free of all secret values. Do not open or capture the
   contents of Secrets.

Suggested caption:

> FlowGuard running in its Replit workspace. The web app and API Server
> workflows are active; the preview shows the application served from this
> workspace.

The existing app screenshot is useful workflow evidence, but it does not show
the Replit workspace or prove that the workflows were running.

## RunPod utilization proof

1. In the RunPod account used for the synthetic test on 24 October 2026, find
   the request or usage record for the Qwen3 32B AWQ public endpoint
   (`qwen3-32b-awq`).
2. Capture the provider record showing the endpoint, request date, completed
   status, and usage or charge details if available.
3. Save it as `runpod-request-usage-2026-10-24.png`.
4. Hide API keys, tokens, account email, and unrelated private account details.

Suggested caption:

> One direct inference request using synthetic travel data was sent from the
> Replit environment to the RunPod Qwen3 32B AWQ endpoint on 24 October 2026.
> The provider returned HTTP 200 and `COMPLETED`. The generated text was
> irrelevant and was not used for a manager decision.

The existing composite screenshot contains a written test note, not a RunPod
dashboard record. The direct test did not exercise FlowGuard's signed-in
manager route and does not prove that the output is useful or reliable. Do not
describe it as a successful FlowGuard AI feature.

Do not send another request just to create evidence unless the team has checked
current pricing and explicitly approved the possible charge. Prefer the
provider's record for the already completed synthetic test.

## Add the screenshots to the evidence index

After capturing the screenshots, place them in this folder and update
`../evidence-index.md` with their exact filenames and any remaining limitations.
If RunPod does not retain a provider-side record, keep that item marked
unverified rather than recreating a successful-looking record.
