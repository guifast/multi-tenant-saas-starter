# Security Notes

This is a production-oriented reference implementation, not a universal production security baseline.

## Implemented

- bcrypt password hashing.
- Opaque session tokens stored as hashes.
- HttpOnly session cookie.
- CSRF header validation for authenticated mutations.
- Tenant membership resolution before protected workspace access.
- Centralized permission guard.
- Hashed invitation tokens.
- Invitation tokens redacted from request logs.
- Environment validation through Zod.
- CORS configured for the local web origin.
- Generic credential errors.

## Limitations

- No email verification.
- No production email provider.
- No PostgreSQL RLS.
- No distributed rate limiting.
- No centralized log sink.
- No MFA.

Before adapting this to production, configure HTTPS, strong secrets, production CORS, observability, backups, rate limits and incident response.
