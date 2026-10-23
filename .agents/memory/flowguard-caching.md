---
name: FlowGuard caching boundaries
description: Privacy and freshness constraints for future performance work.
---

Prefer short-lived, memory-only caching of authenticated business records.
Do not introduce persistent/offline copies of private team records without
explicitly designing account isolation and access revalidation first. Membership
checks must remain live on page navigation, rather than trusting saved roles.

**Why:** FlowGuard has private teams and account-specific permissions; faster
navigation must not retain another account's records on shared devices or turn
cached membership into an authorization source.

**How to apply:** Scope cache entries by user, team and role. Invalidate after
mutations and account changes, preserve explicit fresh-data refresh controls,
and do not use cached successes to conceal request failures.
