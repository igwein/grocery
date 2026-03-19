# Testing Guidelines

## Current State

No test framework is configured yet. When tests are added:

- Prefer writing tests for critical paths first (API endpoints, business logic)
- Use TDD (RED → GREEN → REFACTOR) for bug fixes and new features when practical
- Unit tests for pure functions, integration tests for API endpoints

## Troubleshooting Test Failures

1. Check test isolation
2. Verify mocks are correct
3. Fix implementation, not tests (unless tests are wrong)
