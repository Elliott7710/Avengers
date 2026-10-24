# FlowGuard submission evidence

**Team:** Avengers  
**Project:** FlowGuard  
**Last updated:** 25 October 2026

This is an evidence index, not an official SDC proof-of-use form. Only items
labelled as verified below have been checked. The organiser's supplied Replit
and RunPod proof PDFs in the project archive are one-page “EXAMPLE ONLY” covers;
do not submit those covers as completed forms. Confirm the current accepted
forms and evidence requirements with the organiser.

## Evidence included

### App workflow screenshots

[`evidence/flowguard-demo-and-runpod-note.png`](evidence/flowguard-demo-and-runpod-note.png)

The team owner confirmed that the traveller name and trip details shown are
synthetic demo data. The composite image shows the FlowGuard Travel screen with
an approved request and its activity history. It supports the demo walkthrough;
it is not an independent audit or proof of public-site access.

The image also includes a written note about the direct RunPod test. For
provider-side evidence, add a separate RunPod request/usage screenshot that
matches the test below. The note is a team-authored description, not a provider
record. Do not expose API keys, tokens, or private account information.

## Verified RunPod request

- **Date:** 24 October 2026
- **Endpoint:** Qwen3 32B AWQ public endpoint (`qwen3-32b-awq`)
- **Requests sent:** One direct request with synthetic trip fields only
- **Provider result:** HTTP 200; RunPod status `COMPLETED`
- **FlowGuard app route:** Not exercised; the test did not use a signed-in
  manager session or the app's `/api/travel/summary` route
- **Output quality:** Failed review. The response contained irrelevant,
  fabricated content about silica processing. It was not used for a decision.
- **Credits/charge:** The team reported redeeming credits. The corresponding
  RunPod dashboard usage record has not been attached or independently checked.

This confirms that the configured RunPod endpoint returned an inference
response. It does **not** establish that FlowGuard's manager flow works
end-to-end or that the generated summary is reliable. Do not present the
summary as a successful product feature or use it in the demo until the output
quality issue is addressed and retested.

### Replit evidence

The FlowGuard app and API are configured as Replit workspace workflows. The
current image shows the app preview, not the Replit workspace or its running
workflow panel.

**Still needed:** capture a genuine screenshot of the Replit workspace with the
FlowGuard web and API workflows running. Follow
[`evidence/proof-capture-guide.md`](evidence/proof-capture-guide.md). Do not
show secret values.

## Evidence still to collect

- A screenshot of the matching RunPod request and usage record from the
  RunPod dashboard, with credentials and private account details hidden.
- A Replit workspace screenshot with the project and running workflows visible.
- A fresh app capture from the final published URL, once public access is
  verified. The included composite is a Replit preview capture.
- A verified end-to-end manager-to-RunPod test after the summary-quality issue
  is addressed. Use synthetic data and do not repeat requests until the team
  has reviewed current provider pricing and available credits.
- The correct official proof-of-use forms, completed and signed if required.
- Final public links for the slide deck and YouTube demo video.

## Other submission items not evidenced here

Team contact details and the five-person roster; the official team leader;
final SDG track/sub-target; completed workshop, ownership, and IP declarations;
an impact baseline and Phase 2 target approved by the team; final asset-license
review; completed official preliminary and technology declaration PDFs; and
leader review, signature, and date.
