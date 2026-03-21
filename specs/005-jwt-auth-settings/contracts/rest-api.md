# REST API Contract: Auth, Users & Sessions

All endpoints prefixed with `/api/v1`. Mutations require `X-CSRF-Token` header.

## Auth Endpoints

### POST /auth/sign-up
Create a new account. Sets HttpOnly cookies on success.

**Request**:
```json
{ "email": "user@example.com", "password": "min8chars" }
```

**Response 201**:
```json
{ "user": { "id": "uuid", "email": "user@example.com", "displayName": null, "theme": "light" } }
```
Sets cookies: `access_token`, `refresh_token`, `csrf_token`

**Response 409**: Email already registered (generic message: "Unable to create account")

---

### POST /auth/sign-in
Authenticate with email/password. Sets HttpOnly cookies.

**Request**:
```json
{ "email": "user@example.com", "password": "password123" }
```

**Response 200**:
```json
{ "user": { "id": "uuid", "email": "user@example.com", "displayName": "John", "theme": "dark" } }
```
Sets cookies: `access_token`, `refresh_token`, `csrf_token`

**Response 401**: "Invalid email or password" (no hint about which is wrong)

---

### POST /auth/refresh
Refresh access token using refresh token cookie. No body required.

**Response 200**:
```json
{ "message": "Token refreshed" }
```
Sets new `access_token` cookie. Updates session `lastActiveAt`.

**Response 401**: Refresh token invalid/expired → clear all auth cookies

---

### POST /auth/sign-out
Invalidate current session. Clears auth cookies.

**Response 200**:
```json
{ "message": "Signed out" }
```
Clears cookies: `access_token`, `refresh_token`, `csrf_token`

---

## User Endpoints (authenticated)

### GET /users/me
Get current user profile.

**Response 200**:
```json
{ "id": "uuid", "email": "user@example.com", "displayName": "John", "theme": "dark", "createdAt": "ISO" }
```

---

### PATCH /users/me
Update profile (display name, theme).

**Request**:
```json
{ "displayName": "New Name", "theme": "dark" }
```
All fields optional.

**Response 200**: Updated user object (same shape as GET /users/me)

---

## Session Endpoints (authenticated)

### GET /sessions
List all active sessions for the current user.

**Response 200**:
```json
{
  "sessions": [
    {
      "id": "uuid",
      "deviceInfo": "Chrome on Windows",
      "ipAddress": "192.168.1.1",
      "lastActiveAt": "ISO",
      "createdAt": "ISO",
      "isCurrent": true
    }
  ]
}
```

---

### DELETE /sessions/:id
Revoke a specific session (cannot revoke current session).

**Response 200**:
```json
{ "message": "Session revoked" }
```

**Response 403**: Cannot revoke current session
**Response 404**: Session not found or doesn't belong to user

---

## Modified Existing Endpoints

All existing endpoints (`/decks`, `/cards`, `/reviews`, `/statistics`) now:
- Require authentication (401 if no valid access token)
- Automatically scope data to the authenticated user
- No request/response shape changes — just filtered by `userId`
