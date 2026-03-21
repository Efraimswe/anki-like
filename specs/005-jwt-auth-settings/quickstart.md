# Quickstart: JWT Auth, Settings & Navigation

## Setup

1. Run migration: `cd backend && npx prisma migrate dev`
2. Start backend: `cd backend && npm run start:dev`
3. Start frontend: `cd frontend && npm run dev`

## Test Scenarios

### 1. Sign Up Flow
1. Open `http://localhost:5174`
2. Should redirect to `/sign-in`
3. Click "Sign up" link
4. Enter email + password (min 8 chars)
5. Should redirect to `/decks` with navbar visible
6. Check browser cookies: `access_token`, `refresh_token`, `csrf_token` should exist as HttpOnly (first two) and non-HttpOnly (csrf)

### 2. Sign In Flow
1. Sign out first
2. Navigate to `/sign-in`
3. Enter credentials
4. Should redirect to `/decks`

### 3. Protected Routes
1. Clear all cookies manually
2. Try to navigate to `/decks`
3. Should redirect to `/sign-in`

### 4. Navbar Navigation
1. Sign in
2. Verify navbar shows: Decks, Cards, Statistics, Settings
3. Click each link — should navigate correctly
4. Verify user name/email visible in navbar with sign-out option

### 5. Session Management
1. Sign in from two different browsers
2. Go to Settings > Sessions
3. Should see both sessions with device info
4. Revoke the other session
5. Switch to the other browser — should be redirected to sign-in

### 6. Profile & Theme
1. Go to Settings > Profile
2. Change display name → should update in navbar
3. Toggle to dark mode → entire app should switch immediately
4. Refresh page → dark mode persists
5. Sign out and sign in → dark mode still active

### 7. Cards Section
1. Create a deck with cards
2. Click "Cards" in navbar
3. Should see all cards with their deck names
4. Click deck name → navigate to deck detail

### 8. Token Refresh
1. Sign in
2. Wait 15+ minutes (or manually expire access_token)
3. Perform any action
4. Should work transparently (refresh token auto-refreshes)

### 9. CSRF Protection
1. Using curl/Postman, try a POST without `X-CSRF-Token` header
2. Should get 403 Forbidden
3. Include the CSRF token from cookie → should succeed
