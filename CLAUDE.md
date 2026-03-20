# Grocery List App

A Hebrew-language (RTL) family grocery shopping list PWA with AI-powered weekly list generation.

## Quick Start

```bash
# Prerequisites: Node.js, Supabase CLI, Docker (for local Supabase)

# 1. Start local Supabase
supabase start

# 2. Install dependencies
npm install

# 3. Run the dev server
npm run dev          # → http://localhost:3000

# 4. Seed data from CSV (one-time)
npx tsx scripts/import-csv.ts
```

## Environment Variables

Defined in `.env.local` (not committed):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL (local: `http://127.0.0.1:54331`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public, client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `GEMINI_API_KEY` | Google Gemini API key for AI list generation |
| `MANAGER_PIN` | PIN code for manager login |
| `SHOPPER_PIN` | PIN code for shopper login |

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Database**: Supabase (PostgreSQL) with Realtime subscriptions
- **AI**: Google Gemini API (`gemini-3-flash-preview`) for weekly list suggestions
- **Font**: Assistant (Google Fonts, supports Hebrew)
- **Testing**: Vitest + React Testing Library + jsdom
- **PWA**: Web app manifest for mobile install

## Architecture

### Roles & Auth

Simple PIN-based auth via cookie (`role` cookie, 30-day expiry):
- **Manager** (`/manager`): Creates/manages the shopping list, generates AI suggestions, views purchase history
- **Shopper** (`/shopper`): Checks off items in-store, finishes shopping (moves checked items to history)

Middleware (`middleware.ts`) enforces role-based route access. No real auth — intentionally public.

### Database (Supabase / PostgreSQL)

Three tables defined in `supabase/migrations/001_initial_schema.sql`:

| Table | Purpose |
|-------|---------|
| `items_catalog` | Master list of known grocery items (name + category emoji) |
| `purchase_history` | Historical purchases with dates, seeded from CSV |
| `shopping_list` | Current active list, **realtime-enabled** via `supabase_realtime` publication |

### Real-time Sync

The `useShoppingList` hook subscribes to Postgres changes on `shopping_list` via Supabase Realtime. Both manager and shopper views update live.

### AI List Generation

`POST /api/generate-list` → calculates item purchase frequency from `purchase_history`, builds a prompt with frequency data + current list, calls Gemini API, returns suggested items with confidence levels (high/medium/low).

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/route.ts          # PIN auth endpoint
│   │   └── generate-list/route.ts # AI list generation
│   ├── login/page.tsx             # PIN pad login
│   ├── manager/
│   │   ├── page.tsx               # List management + AI suggestions
│   │   └── history/page.tsx       # Purchase history (frequency & timeline views)
│   ├── shopper/page.tsx           # In-store shopping view
│   ├── page.tsx                   # Role selection home
│   ├── layout.tsx                 # Root layout (RTL, Hebrew, Assistant font)
│   └── globals.css                # Tailwind + custom styles
├── components/
│   ├── ShoppingList.tsx           # Groups items by category
│   ├── CategoryGroup.tsx          # Collapsible category section
│   ├── ItemRow.tsx                # Single item with check/remove
│   └── AddItemInput.tsx           # Search/add modal with catalog autocomplete
├── hooks/
│   └── useShoppingList.ts         # Core hook: CRUD + realtime + finish shopping
├── lib/
│   ├── types.ts                   # Shared TypeScript interfaces
│   ├── categories.ts              # Category definitions (24 categories, emoji-keyed)
│   ├── fuzzy-match.ts             # Levenshtein distance + fuzzy search scoring
│   ├── frequency.ts               # Purchase frequency calculation for AI prompt
│   ├── prompt-builder.ts          # Gemini prompt construction + LLM JSON parsing
│   └── supabase/
│       ├── client.ts              # Browser Supabase client (anon key)
│       └── server.ts              # Server Supabase client (service role key)
└── test/
    ├── setup.ts                   # Vitest setup (jest-dom matchers, env vars)
    └── mocks/
        └── supabase.ts            # Chainable Supabase client mock
scripts/
└── import-csv.ts                  # One-time CSV → Supabase seeder
supabase/
├── config.toml                    # Local Supabase config (port 54331)
└── migrations/
    └── 001_initial_schema.sql     # Schema + indexes + realtime publication
```

## Key Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
npm run test      # Vitest in watch mode
npm run test:run  # Vitest single run (CI)
```

## Data Flow

1. **Manager** creates list manually or via AI → items inserted into `shopping_list`
2. **Shopper** checks items off → `is_checked = true` in `shopping_list`
3. **Shopper** finishes shopping → checked items moved to `purchase_history`, removed from `shopping_list`
4. Purchase history feeds future AI suggestions

## Notes

- All UI text is in Hebrew; the app is RTL (`dir="rtl"`, `lang="he"`)
- Categories are emoji-keyed and ordered by supermarket aisle flow (defined in `src/lib/categories.ts`)
- The `items_catalog` table provides autocomplete when adding items; sorted by purchase frequency
- Path alias: `@/*` maps to `./src/*`
- Tests use Vitest with jsdom environment; config in `vitest.config.ts`
- Supabase mock in `src/test/mocks/supabase.ts` provides a chainable builder for `from().select().order()` etc.
- Pure business logic is extracted into `src/lib/` modules (fuzzy-match, frequency, prompt-builder) for testability
- No deployment pipeline is configured yet — runs locally with `supabase start`
