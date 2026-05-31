---
name: Password reset flow
description: Token-based password reset without email service
---
Password reset uses `password_reset_tokens` table (schema in `lib/db/src/schema/password_reset_tokens.ts`).
Routes: `POST /api/auth/forgot-password` (generates token) and `POST /api/auth/reset-password` (consumes token).
Token expires in 1 hour. Token is returned directly in the API response (since no email service is configured).

**Why:** Apple App Store requires a password recovery mechanism. Without an email service, the token is shown on-screen.

**How to apply:** When an email service (Resend/SendGrid) is added, remove `token` from the forgot-password response and send it by email instead.
