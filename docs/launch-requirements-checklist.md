# FlowGuard launch requirements checklist

This is a working product checklist based on the current repository review. It is not legal advice. Legal documents and privacy obligations need review for the countries where FlowGuard and its users operate.

## Current scope and findings

- **Payments:** FlowGuard is planned to be free for now. There is no checkout or subscription flow in the project. Refund and billing terms are not launch requirements unless paid access is introduced.
- **Audience and age:** The intended audience is small businesses worldwide, with an intended minimum age of 16+. Malaysia is the first operating country; jurisdiction-specific age requirements and additional markets still need review.
- **Business identity and contact:** No legal entity is registered yet. A public support contact has not been selected; the chosen privacy-request channel is an in-app form, which is not implemented yet.
- **Database and files:** The app currently uses Supabase Auth and reads profile roles from `profiles`. Travel and Insights records are also stored in Supabase PostgreSQL tables. No Replit App Storage integration or user file-upload feature was found. Do not describe the database as registration-only.
- **Browser-stored data:** The app still reads legacy Travel and Insights records from `localStorage` and keeps the source copy plus a migration marker after import. Account deletion must account for those copies on the user's browsers.
- **Security and domain:** The frontend contains a Supabase publishable key, which is intended for browser use; private/service-role keys must never be exposed there. No custom domain is set up, so Cloudflare cannot yet be checked for domain/zone security configuration.
- **Calculations:** Estimated spend now includes requested, approved, and booked trips and excludes rejected trips. Totals are accumulated in cents; invalid active costs produce a visible warning. Currency is currently MYR, while dates and currency formatting use `en-US` locale settings; these settings still need product confirmation.
- **Assets and cookies:** No local image or font files were found. The stylesheet loads a remote background image from an external website; its reuse rights are not documented. Inter is named as a font with system fallbacks, but no Inter font file is bundled. No analytics or tracking-cookie code was found in the repository; verify the deployed app and Supabase auth behavior before making a public cookie statement.

## 1. Product, legal, and privacy decisions

- [ ] Decide who will operate FlowGuard and register the legal entity before publication; provide its exact legal name, country, and public-facing brand name.
- [ ] Confirm Malaysia as the first operating country and identify which additional jurisdictions to support. The intended market is small businesses worldwide; obtain jurisdiction-specific review before offering globally.
- [ ] Provide a public support contact.
- [x] Choose an in-app form as the privacy/data-request channel.
- [ ] Implement the form and ensure requests reach only authorized company management.
- [x] Set 16+ as the intended minimum age.
- [ ] Verify that age requirement against applicable laws in each supported market and decide how reports of underage accounts will be handled.
- [x] Current product is planned to be free, with no subscription, paid tier, checkout, or in-app purchase.
- [ ] List the data FlowGuard collects and why: account details, profile/role, travel requests, costs, destinations, dates, insights, coaching notes, and any operational logs.
- [ ] Confirm retention periods for account, travel, insight, and security data.
- [ ] Confirm the full set of data processors and hosting locations, including Supabase, Replit hosting, the external image host, and the JavaScript CDN.
- [ ] Confirm whether any cookies, local storage, analytics, advertising, or session-recording tools are used in the deployed app.

## 2. Privacy Policy and Terms of Service

- [ ] Draft a public Privacy Policy covering data collected, purposes, processors, storage/security, retention, user rights, deletion, minors, cookies/local storage, and policy updates.
- [ ] Draft public Terms of Service covering the service scope, account rules, acceptable use, user content, service availability, intellectual property, suspension/termination, liability, and governing law.
- [ ] State clearly that travel costs and Insights are user-entered operational records; do not imply that FlowGuard processes payments or provides financial advice.
- [ ] Add public routes/pages for the documents and link them from registration and the app footer.
- [ ] Ensure registration links resolve to the actual documents before asking users to accept them.
- [ ] Record the policy version and acceptance time in a way appropriate to the chosen legal and technical requirements.
- [ ] Have a qualified lawyer review the drafts before launch.

## 3. Cookies, refunds, and payments

- [ ] Document the browser storage and authentication behavior found in the deployed app; do not claim “no cookies” without checking production.
- [ ] Add a cookie notice/consent flow only if required by the actual technologies and jurisdictions; do not add tracking without a defined need and disclosures.
- [ ] Mark a refund policy **not applicable while the app is free and does not accept payments**.
- [ ] Before enabling payments, decide pricing, billing intervals, renewals, cancellation, refunds, taxes, payment provider, and customer support process; then update the Terms and publish payment/refund terms before checkout goes live.

## 4. Correct and test calculations

- [x] Estimated spend includes requested, approved, and booked requests; rejected requests are excluded. There is no separate cancelled status in the current form.
- [x] Costs are estimates, zero is allowed, and negative or non-numeric entry is rejected. Invalid stored active costs show a warning instead of being silently counted as zero.
- [ ] Confirm the business currency (currently MYR) and expected display locale, decimal precision, rounding, and formatting.
- [ ] Decide whether users may enter multiple currencies; if yes, define the exchange-rate source, rate date, and conversion/rounding rules.
- [ ] Validate numeric values at input and before saving; reject non-finite and out-of-range values.
- [x] Use cent-based arithmetic for currency totals.
- [ ] Expand tests to cover large values and currency formatting; current tests cover empty data, decimal values, status inclusion/exclusion, and invalid values.
- [ ] Define and test the Insights aggregation rules, including date-period ordering and treatment of duplicate or incomplete entries.

## 5. Fonts, images, and third-party assets

- [ ] Identify the source and license/permission for the externally hosted background image; keep a record or replace it with an asset that has clear reuse rights.
- [ ] Confirm whether the app uses the Inter font or only system fallbacks; if bundling or remotely loading Inter, record and follow its license and source requirements.
- [ ] Inventory any later-added images, icons, illustrations, fonts, and other assets; record source, license, attribution requirements, and proof of permission.
- [ ] Review third-party scripts and remote assets for purpose, privacy impact, availability, and production suitability.

## 6. Data access, storage, and deletion

- [ ] Confirm which database is authoritative for each data type: Supabase Auth for accounts, Supabase PostgreSQL for profiles and structured Travel/Insights records, and object storage only if file uploads are introduced.
- [ ] Decide whether Replit App Storage is actually needed. It is not currently configured in the repository; do not assume it stores the app’s data or project files.
- [ ] Keep service-role keys, database passwords, and other private credentials in server-side secrets only; never put them in browser code or committed files.
- [ ] Run the existing profile/RLS audit and isolation tests against a separate staging Supabase project with two employee accounts and a manager account before production changes.
- [ ] Implement a user-facing account/data deletion request path and explain how to contact support/privacy.
- [ ] Design deletion to remove the Auth account, profile, owned Travel/Insights rows, and any future stored files, subject to a documented legal retention exception.
- [ ] Define the deletion completion timeline and confirmation message.
- [ ] Provide clear instructions for removing legacy browser data. Decide whether the app should offer an explicit local-data cleanup/export action after successful migration.
- [ ] Test deletion and verify that a deleted user's records are no longer accessible; do not delete production data as part of staging tests.

## 7. Database technology decision

- [ ] Keep the existing Supabase PostgreSQL setup as the default for the current product. The app has relational identities/ownership and row-level security, while PostgreSQL `jsonb` already supports flexible Travel/Insights record payloads.
- [ ] Treat “SQL” as the query language and PostgreSQL as the database engine; the project already uses PostgreSQL through Supabase.
- [ ] Consider MongoDB only if requirements change to favor document-first workloads enough to justify redesigning authentication integration, access controls, migrations, backups, and data movement.
- [ ] Do not add MongoDB alongside PostgreSQL for the same records without a specific need and a documented source-of-truth/synchronization plan.

## 8. Launch verification

- [ ] Verify signup, sign-in, sign-out, password recovery, profile visibility, and role assignment in staging.
- [ ] Verify row-level security for cross-user reads/writes and manager access; confirm the manager scope matches the intended business rule.
- [ ] Verify legal links, accessible forms, responsive pages, and error states.
- [ ] Run the project’s available tests and security checks; record anything that cannot be verified because staging accounts, a custom domain, or production access are unavailable.
- [ ] Recheck the published app for exposed private secrets, unintended public files, external scripts/assets, and domain/TLS/security configuration after a custom domain is connected.

## Suggested order

1. Resolve the product/legal facts in section 1 and confirm calculation rules in section 4.
2. Run staging access checks and implement/test deletion in section 6.
3. Inventory/replace assets and confirm deployed storage/cookie behavior.
4. Draft legal pages from the confirmed facts, then obtain legal review.
5. Complete launch verification; defer refund/payment work until paid access is planned.
