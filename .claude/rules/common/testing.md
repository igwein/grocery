# Testing Guidelines

## Framework

- **Vitest** with jsdom environment, React Testing Library, `@testing-library/user-event`
- Config: `vitest.config.ts` (globals enabled, `@/*` alias, setup file)
- Setup: `src/test/setup.ts` (jest-dom matchers, mock env vars)
- Run: `npm run test` (watch) or `npm run test:run` (single pass / CI)

## Test Structure

- **Unit tests** (`src/lib/__tests__/`): Pure functions — categories, fuzzy-match, frequency, prompt-builder
- **API route tests** (`src/app/api/*/__tests__/`): Mock Supabase server client + global fetch
- **Middleware test** (`__tests__/middleware.test.ts`): Direct import, mock NextRequest with cookies
- **Component tests** (`src/components/__tests__/`): RTL render + userEvent interactions
- **Hook tests** (`src/hooks/__tests__/`): `renderHook` with mocked Supabase client

## Mocking

- Supabase mock builder: `src/test/mocks/supabase.ts` — chainable `.from().select().order()` pattern
- Use `vi.hoisted()` for variables referenced inside `vi.mock()` factories (hoisting requirement)
- Mock `next/headers` for cookie-dependent API routes
- Mock global `fetch` for Gemini API calls

## Conventions

- Prefer writing tests for critical paths first (API endpoints, business logic)
- Use TDD (RED → GREEN → REFACTOR) for bug fixes and new features when practical
- Unit tests for pure functions, integration tests for API endpoints
- Extract embedded business logic into `src/lib/` modules for testability

## Troubleshooting Test Failures

1. Check test isolation
2. Verify mocks are correct
3. Fix implementation, not tests (unless tests are wrong)
