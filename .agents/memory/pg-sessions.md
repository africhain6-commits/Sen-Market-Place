---
name: PostgreSQL sessions
description: How sessions are persisted across server restarts using connect-pg-simple
---
Sessions are stored in PostgreSQL via `connect-pg-simple` in `artifacts/api-server/src/app.ts`.
The `pool` exported from `@workspace/db` is passed directly to `PgStore`.
`createTableIfMissing: true` auto-creates the `session` table — no Drizzle schema needed for it.

**Why:** In-memory sessions were lost on server restart, causing random logouts — unacceptable for production/iOS App Store.

**How to apply:** Any change to session config (secret, maxAge, cookie options) goes in `app.ts` session middleware block.
