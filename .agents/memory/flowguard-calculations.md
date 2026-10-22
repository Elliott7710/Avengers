---
name: FlowGuard travel calculations
description: User-confirmed status rules for the Travel estimated-spend metric.
---

“Estimated spend” includes trips with status Requested, Approved, or Booked, and excludes Rejected trips. Costs are estimates; the user chose the status rule, not a billing/payment calculation.

**Why:** Rejected requests should not inflate the expected travel spend shown to the business.

**How to apply:** Keep the status set aligned with the Travel workflow if statuses change, and update its regression tests. Do not treat this metric as FlowGuard revenue or payments.
