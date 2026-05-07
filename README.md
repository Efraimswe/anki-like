# anki-like

A spaced repetition flashcard app — study what you want, in any language, and let the algorithm decide when you should see each card again.

> **Live demo:** https://anki-like-two.vercel.app/
>
> **Status:** Work in progress / MVP. Core review loop works, but features and polish are still landing.

## What it is

Inspired by [Anki](https://apps.ankiweb.net/), this app schedules flashcard reviews using the [FSRS](https://github.com/open-spaced-repetition/ts-fsrs) algorithm so cards you struggle with come back sooner and cards you know stay out of the way.

Built as a single Next.js application — no separate backend service.

## Features

- Create decks and cards, then review them on a schedule driven by FSRS
- Account auth (email + password) with onboarding flow
- Dashboard for tracking decks and review activity
- Available in 31 languages out of the box (via `next-intl`)

## Tech stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL via Prisma
- **Spaced repetition:** `ts-fsrs` / `@open-spaced-repetition/binding`
- **Data fetching:** TanStack Query
- **Auth:** bcrypt + JWT (`jose`)
- **i18n:** `next-intl`
- **Testing:** Vitest
- **Hosting:** Vercel

## Getting started

```bash
pnpm install
cp .env.example .env    # set DATABASE_URL and any auth secrets
pnpm prisma:migrate
pnpm dev                # http://localhost:3000
```

### Useful scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run the dev server |
| `pnpm build` | Generate Prisma client and build for production |
| `pnpm start` | Run the production build |
| `pnpm test` | Run the Vitest suite |
| `pnpm prisma:studio` | Open Prisma Studio against your DB |

## Project layout

```
src/
  app/            # Next.js routes (auth, protected, dashboard, onboarding, api)
  components/     # Shared UI
  lib/            # Auth, FSRS, db helpers
  i18n/           # next-intl config
  hooks/          # React hooks
messages/         # Per-locale translation files (31 languages)
prisma/           # Schema and migrations
specs/            # Feature specs
tests/            # Vitest tests
```

## License

Not yet specified.
