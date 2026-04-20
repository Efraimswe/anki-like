# Quickstart: Onboarding Flow (008)

## Prerequisites

- Node.js 20+, pnpm installed
- Vercel CLI: `npm i -g vercel@latest`
- Access to the Vercel project (for AI Gateway OIDC auth)

## 1. Install new dependencies

```bash
pnpm add ai
```

(`@ai-sdk/react` may also be needed if not already present — check `node_modules/@ai-sdk/react`.)

## 2. Pull environment variables (includes AI Gateway OIDC token)

```bash
vercel link       # First time only — connect to Vercel project
vercel env pull .env.local
```

This provisions `VERCEL_OIDC_TOKEN` for local AI Gateway access. No provider API keys needed.

## 3. Run the Prisma migration

Add the new fields to the User model in `prisma/schema.prisma` (see [data-model.md](data-model.md)), then:

```bash
pnpm prisma migrate dev --name add_onboarding_fields
```

## 4. Start the dev server

```bash
pnpm dev
```

## 5. Test the onboarding flow

1. Register a new account → should redirect to `/onboarding/step-1`
2. Select a language → should advance to step 2
3. Chat in English for 8+ messages → level should be assessed and revealed
4. Chat in native language about goals → goals should be extracted
5. Click "Let's go" on step 4 → should redirect to `/dashboard`

## 6. Test the enforcement

1. With a new (incomplete) account, navigate directly to `/dashboard` → should redirect to `/onboarding`
2. With a completed account, navigate to `/onboarding` → should redirect to `/dashboard`

## Key files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Add onboarding fields to User model |
| `src/middleware.ts` | Add `onboardingCompleted` check |
| `src/app/onboarding/` | Step pages + Leo layout |
| `src/app/api/onboarding/` | API routes |
| `src/components/onboarding/` | Leo character, chat UI, voice input |
| `src/lib/onboarding/prompts.ts` | System prompts for AI agents |
| `src/lib/onboarding/languages.ts` | Supported language list |
