# Data Model: Onboarding Flow

**Feature**: 008-onboarding-flow  
**Date**: 2026-04-13

## Schema Changes

### User model — new fields

The existing `User` model (in `prisma/schema.prisma`) needs four new fields:

```prisma
model User {
  // ... existing fields ...

  // Onboarding
  onboardingCompleted Boolean  @default(false) @map("onboarding_completed")
  nativeLanguage      String?  @map("native_language") @db.VarChar(10)  // BCP-47 code e.g. "ru", "fr"
  englishLevel        String?  @map("english_level") @db.VarChar(20)    // e.g. "B1 solid"
  goals               Json?    // UserGoals JSON object
}
```

### Prisma migration

A new migration is required:

```sql
-- Migration: add_onboarding_fields_to_users
ALTER TABLE users
  ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN native_language VARCHAR(10),
  ADD COLUMN english_level VARCHAR(20),
  ADD COLUMN goals JSONB;
```

## Entity Definitions

### UserGoals (stored as JSONB in `users.goals`)

```typescript
type UserGoals = {
  primary: string           // e.g. "Get a remote job in tech"
  secondary?: string[]      // e.g. ["Watch Netflix without subtitles"]
  context?: string          // e.g. "Living in Belgium, applying for jobs"
  urgency?: 'low' | 'medium' | 'high'
}
```

### EnglishLevel (stored as string in `users.english_level`)

Valid values (ordered):
```
A1 | A1 solid | A2 | A2 solid | B1 | B1 solid | B2 | B2 solid | C1 | C1 solid | C2 | C2 solid | Fluent
```

### Language code (`users.native_language`)

BCP-47 language codes (2-letter ISO 639-1). Examples:
- `ru` — Russian
- `fr` — French  
- `es` — Spanish
- `de` — German
- `zh` — Chinese (Mandarin)
- `pt` — Portuguese
- `ar` — Arabic
- `ja` — Japanese
- `ko` — Korean
- `it` — Italian

Full list defined in `src/lib/onboarding/languages.ts`.

## State Transitions

```
User registered
  └─→ onboardingCompleted = false (default)
        └─→ Step 1: nativeLanguage set
              └─→ Step 2: englishLevel set
                    └─→ Step 3: goals set
                          └─→ Step 4: onboardingCompleted = true
                                └─→ Dashboard accessible
```

## Middleware Logic

The existing `middleware.ts` is modified to add an `onboardingCompleted` check:

```
1. isPublic(pathname) → pass through
2. No token → redirect /sign-in  (existing)
3. Token invalid → try refresh → redirect /sign-in  (existing)
4. Token valid, pathname starts with /onboarding → 
   - Decode JWT payload
   - If onboardingCompleted = true → redirect /dashboard
   - Else → pass through
5. Token valid, other protected route →
   - Decode JWT payload
   - If onboardingCompleted = false → redirect /onboarding
   - Else → pass through  (existing behavior)
```

**JWT payload change**: The access token JWT must include `onboardingCompleted: boolean` so middleware can check it without a DB round-trip. On Step 4 completion, a new access token is issued with `onboardingCompleted: true`.

## Read Patterns

| Route | Data Needed | Source |
|-------|-------------|--------|
| Step 1 | Nothing | — |
| Step 2 | `nativeLanguage` (for character greeting) | JWT payload or DB |
| Step 3 | `nativeLanguage` (chat language) | JWT payload or DB |
| Step 4 | `nativeLanguage`, `englishLevel` (for welcome message) | DB |
| Middleware | `onboardingCompleted` | JWT payload |

## Write Patterns

| Action | Endpoint | Data Written |
|--------|----------|--------------|
| Language selected | `POST /api/onboarding/language` | `nativeLanguage` |
| Level assessed | `POST /api/onboarding/chat/level` (via tool call) | `englishLevel` |
| Goals extracted | `POST /api/onboarding/chat/goals` (via tool call) | `goals` |
| Onboarding done | `POST /api/onboarding/complete` | `onboardingCompleted = true` + new JWT |
