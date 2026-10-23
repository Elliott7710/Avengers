---
name: FlowGuard team access
description: User-selected multiple-team membership and shared Insights access model.
---

Users can belong to multiple private teams and join through manager-issued
invitations. Manager authority must be scoped to a team, not all users globally.
Employees should be able to view Insights from their team, while editing only
their own entries.

**Why:** The user wants separate groups similar to Microsoft Teams so records
are not global, and explicitly chose multiple teams plus shared team Insights
with employee author-only editing.

**How to apply:** Keep team membership as the access boundary in the database,
not just a hidden navigation link or a selected-team filter. Do not restore
workspace-wide manager privileges when adding future modules. Keep a separate
Projects feature out of scope unless explicitly requested.
