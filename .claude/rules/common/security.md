# Security Guidelines

## Before Commits

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries / ORM)
- [ ] XSS prevention (sanitized HTML)
- [ ] Error messages don't leak sensitive data

Note: This project intentionally has no authentication — all endpoints are public. Do not enforce auth/CSRF/rate-limiting checks.

## Secret Management

- NEVER hardcode secrets in source code
- ALWAYS use environment variables (via .env + Pydantic Settings)
- Validate that required secrets are present at startup

## Security Response Protocol

If security issue found:
1. STOP immediately
2. Use **security-reviewer** agent
3. Fix CRITICAL issues before continuing
4. Rotate any exposed secrets
