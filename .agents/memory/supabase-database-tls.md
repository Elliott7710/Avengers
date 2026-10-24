---
name: Supabase database TLS
description: Certificate trust requirement for this project's external Supabase administrator connection.
---

For direct PostgreSQL administration, use the database root certificate downloaded from Supabase Database Settings → SSL Configuration when the normal trust stores do not validate the server.

**Why:** Both Node's bundled roots and the container's system roots rejected this project's pooler certificate chain. Supabase's official connection guide documents supplying the dashboard-downloaded root certificate.

**How to apply:** Keep certificate and hostname verification enabled. Request the public database root certificate, not a private key, and configure it as the driver's CA. Never print the connection URI or disable certificate verification to make a migration work.
