# Security Policy

## Supported Versions

This is a starter template. Security fixes should target the `main` branch.

## Reporting a Vulnerability

Do not open public issues for sensitive vulnerabilities. Email the maintainer address configured in `SECURITY_CONTACT` or open a private advisory after the repository is published.

## Baseline Controls

- HttpOnly session cookie
- Hashed session tokens
- CSRF header verification for authenticated mutations
- bcrypt password hashing
- Tenant membership guard
- Role-based permission guard
- Tenant-scoped resource queries
- Hashed invitation tokens
- Audit logging for important tenant mutations

Before production use, configure HTTPS, production secrets, rate limits appropriate to your traffic, email verification and centralized logging.
