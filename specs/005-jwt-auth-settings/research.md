# Research: JWT Auth, Settings & Navigation

## 1. JWT Authentication with HttpOnly Cookies in NestJS

**Decision**: Use `@nestjs/jwt` + `@nestjs/passport` with `passport-jwt` strategy. Tokens delivered via HttpOnly cookies (not Authorization header).

**Rationale**: HttpOnly cookies are immune to XSS. The JWT strategy can extract tokens from cookies instead of headers using a custom extractor. NestJS has first-class support for this via Passport.

**Alternatives considered**:
- localStorage tokens: Vulnerable to XSS, rejected per clarification
- Session-based auth (express-session): Would work but doesn't align with JWT requirement and makes session revocation more complex across services

**Implementation notes**:
- Access token cookie: `access_token`, HttpOnly, Secure, SameSite=Strict, Max-Age=900 (15min)
- Refresh token cookie: `refresh_token`, HttpOnly, Secure, SameSite=Strict, Path=/api/v1/auth/refresh, Max-Age=604800 (7d)
- JWT extractor reads from `req.cookies.access_token` instead of Authorization header
- `cookie-parser` middleware required on NestJS/Fastify

## 2. CSRF Protection

**Decision**: Use double-submit cookie pattern with a custom CSRF guard.

**Rationale**: Since tokens are in HttpOnly cookies (auto-sent by browser), CSRF is a real threat on POST/PATCH/DELETE. The double-submit pattern is stateless and simple: server sets a non-HttpOnly CSRF token cookie; frontend reads it and sends it as a header (`X-CSRF-Token`). Server validates they match.

**Alternatives considered**:
- Synchronizer token pattern (server-stored): More complex, requires DB state
- SameSite=Strict only: Not sufficient alone in all browser scenarios
- `csurf` package: Deprecated

**Implementation notes**:
- CSRF token generated on sign-in, set as non-HttpOnly cookie `csrf_token`
- Frontend reads `csrf_token` cookie and sends as `X-CSRF-Token` header on mutations
- Guard validates header matches cookie on POST/PATCH/DELETE endpoints
- GET/HEAD/OPTIONS exempt

## 3. Password Hashing

**Decision**: Use `bcrypt` with cost factor 12.

**Rationale**: Industry standard, well-tested, resistant to GPU attacks. Cost factor 12 provides good security/performance balance (~250ms hash time).

**Alternatives considered**:
- Argon2: Better in theory but less ecosystem support in Node.js
- scrypt: Good but bcrypt is more widely understood

## 4. Session Tracking

**Decision**: Store sessions in a database `Session` table linked to refresh tokens.

**Rationale**: Each refresh token maps to a session record. Session stores device info (parsed from User-Agent), creation time, last active time. Revoking a session deletes the record; refresh attempts with that token fail.

**Implementation notes**:
- One session per refresh token
- `ua-parser-js` to extract browser/OS/device from User-Agent
- Last active updated on each token refresh
- Session revocation = delete session row + invalidate refresh token

## 5. Theme Persistence

**Decision**: Store theme preference in the `User` model (`theme` field: 'light' | 'dark'). Frontend applies theme via CSS class on `<html>` element.

**Rationale**: Server-stored preference ensures theme persists across devices. CSS class toggle is the simplest approach with TailwindCSS dark mode support.

**Implementation notes**:
- TailwindCSS `darkMode: 'class'` configuration
- `useTheme` hook reads user preference, applies `dark` class to document
- Theme toggle calls PATCH `/api/v1/users/me` to persist

## 6. Data Migration Strategy

**Decision**: Destructive migration — drop all existing data, add `userId` foreign key to decks/cards/card_states/review_logs/daily_counters.

**Rationale**: Per clarification, existing data is wiped. This simplifies migration significantly — no need to assign orphaned records.

**Implementation notes**:
- Migration truncates all existing tables
- Adds `User` and `Session` tables
- Adds `user_id` column (NOT NULL, FK) to `Deck` table
- Cards/CardState/ReviewLog/DailyCounter inherit user scoping through Deck

## 7. Fastify Cookie Support

**Decision**: Use `@fastify/cookie` since the backend uses Fastify, not Express.

**Rationale**: NestJS with Fastify adapter requires `@fastify/cookie` for cookie parsing (not `cookie-parser` which is Express-only).

**Implementation notes**:
- Register `@fastify/cookie` in `main.ts` via `app.register()`
- Cookie signing optional but recommended for CSRF cookie integrity
