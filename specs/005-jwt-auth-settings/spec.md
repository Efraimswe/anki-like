# Feature Specification: JWT Auth, Settings & Navigation

**Feature Branch**: `005-jwt-auth-settings`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "Add JWT-based auth, navbar, cards as a section, settings with theme and profile, login/signup pages, sign-in/sign-up/logout endpoints, and session management."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign Up and Sign In (Priority: P1)

A new visitor arrives at the app and sees a sign-up page. They create an account with email and password. After signing up, they are automatically signed in and redirected to the main dashboard. Returning users go to the sign-in page, enter credentials, and gain access to their data. All existing features (decks, cards, reviews) are now scoped to the authenticated user.

**Why this priority**: Without authentication, no other feature (sessions, settings, multi-user data isolation) can work. This is the foundation.

**Independent Test**: Can be tested by visiting the app unauthenticated, creating an account, being redirected to the dashboard, signing out, and signing back in.

**Acceptance Scenarios**:

1. **Given** a visitor is not signed in, **When** they visit any page, **Then** they are redirected to the sign-in page
2. **Given** a visitor is on the sign-up page, **When** they submit a valid email and password, **Then** an account is created and they are signed in automatically
3. **Given** a registered user is on the sign-in page, **When** they enter correct credentials, **Then** they are signed in and redirected to the decks page
4. **Given** a user enters incorrect credentials, **When** they submit the sign-in form, **Then** a clear error message is displayed without revealing whether the email exists
5. **Given** a signed-in user, **When** they click "Sign Out", **Then** their session is invalidated and they are redirected to the sign-in page

---

### User Story 2 - Persistent Navigation Bar (Priority: P2)

Once signed in, the user sees a persistent navigation bar across all pages. The navbar provides quick access to all main sections: Decks, Cards (a new standalone section showing all cards across all decks), Statistics, and Settings. The navbar also shows the user's identity and a sign-out action.

**Why this priority**: Navigation is essential UX infrastructure — users need to move between sections without relying on back buttons or manually editing URLs.

**Independent Test**: Can be tested by signing in and verifying that clicking each navbar link navigates to the correct section, and the navbar remains visible on all pages.

**Acceptance Scenarios**:

1. **Given** a signed-in user is on any page, **When** the page loads, **Then** a navigation bar is visible with links to Decks, Cards, Statistics, and Settings
2. **Given** the navbar is displayed, **When** the user clicks "Cards", **Then** they see a list of all their cards across all decks
3. **Given** the navbar is displayed, **When** the user clicks their name or avatar area, **Then** they see an option to sign out

---

### User Story 3 - Session Management (Priority: P3)

A signed-in user can view all their active sessions (devices/browsers where they are currently authenticated). Each session shows identifying information (device type, last active time). Users can revoke any session except the current one, immediately invalidating that session's access.

**Why this priority**: Session visibility and revocation is critical for security — users need to know where they're logged in and be able to revoke compromised sessions.

**Independent Test**: Can be tested by signing in from two different browsers, navigating to session management, verifying both sessions appear, and revoking the other session.

**Acceptance Scenarios**:

1. **Given** a signed-in user navigates to Settings > Sessions, **When** the page loads, **Then** they see a list of all active sessions with device/browser info and last active timestamp
2. **Given** a user has multiple active sessions, **When** they revoke a session other than the current one, **Then** that session is immediately invalidated
3. **Given** a session has been revoked, **When** the revoked session attempts any action, **Then** access is denied and the user is redirected to sign-in

---

### User Story 4 - Settings: Profile and Theme (Priority: P4)

A signed-in user can access a Settings section from the navbar. Within Settings, they can update their profile (display name, email) and switch the application theme between light and dark mode. Theme preference persists across sessions.

**Why this priority**: Profile and theme are quality-of-life features that improve user satisfaction but are not blocking for core functionality.

**Independent Test**: Can be tested by navigating to Settings, changing display name, switching to dark mode, refreshing the page, and verifying both changes persisted.

**Acceptance Scenarios**:

1. **Given** a signed-in user navigates to Settings > Profile, **When** they update their display name, **Then** the change is saved and reflected in the navbar
2. **Given** a user is on the Settings page, **When** they toggle the theme to dark mode, **Then** the entire application immediately switches to a dark color scheme
3. **Given** a user has set dark mode, **When** they sign out and sign back in, **Then** dark mode is still active

---

### User Story 5 - Cards Section (Priority: P5)

A new "Cards" section accessible from the navbar shows all cards across all decks in a single searchable/filterable list. Users can see which deck each card belongs to, and can navigate to the card's deck from this view. This provides a global view of all study content.

**Why this priority**: Useful for power users who want to manage cards across decks, but not essential for core study workflow.

**Independent Test**: Can be tested by navigating to the Cards section and verifying all cards from all decks appear with their deck names.

**Acceptance Scenarios**:

1. **Given** a signed-in user clicks "Cards" in the navbar, **When** the page loads, **Then** all cards across all decks are listed with their front text and deck name
2. **Given** the cards list is displayed, **When** the user clicks a card's deck name, **Then** they are navigated to that deck's detail page

### Edge Cases

- What happens when a user's access token expires mid-session? The system should silently refresh the token using the refresh token; if that also fails, redirect to sign-in.
- What happens when a user signs up with an email that already exists? A clear error message is shown without revealing account existence details.
- What happens when all sessions are revoked except the current one? The "revoke" action should be disabled or hidden for the current session.
- What happens when a user changes their email in profile settings? The system should require re-authentication or email verification before applying the change.
- What happens when the user toggles theme rapidly? The UI should respond instantly without flicker or layout shifts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow new users to create an account with email and password
- **FR-002**: System MUST authenticate users with email and password and issue access/refresh token pairs
- **FR-003**: System MUST validate that passwords meet minimum security requirements (at least 8 characters)
- **FR-004**: System MUST invalidate tokens on sign-out
- **FR-005**: System MUST automatically refresh expired access tokens using refresh tokens without user intervention
- **FR-006**: System MUST redirect unauthenticated users to the sign-in page
- **FR-007**: All data (decks, cards, reviews, statistics) MUST be scoped to the authenticated user
- **FR-008**: Frontend MUST display a persistent navigation bar with links to Decks, Cards, Statistics, and Settings
- **FR-009**: System MUST track active sessions with device/browser identification and last active timestamp
- **FR-010**: Users MUST be able to view all their active sessions and revoke any session except the current one
- **FR-011**: Users MUST be able to update their display name in profile settings
- **FR-012**: Users MUST be able to switch between light and dark themes, with the preference persisting across sessions
- **FR-013**: The Cards section MUST display all cards across all decks for the authenticated user
- **FR-014**: Sign-in error messages MUST NOT reveal whether an email is registered (security best practice)
- **FR-015**: All pre-existing data (decks, cards, reviews) MUST be deleted as part of the auth migration — fresh start for all users
- **FR-016**: Both access and refresh tokens MUST be stored in HttpOnly cookies; the system MUST include CSRF protection on all state-changing requests

### Key Entities

- **User**: A registered person with email, password hash, display name, and theme preference
- **Session**: An active authentication context tied to a user, with device info, creation time, and last active time
- **Token Pair**: An access token (short-lived) and refresh token (long-lived) stored in HttpOnly cookies with CSRF protection

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete sign-up and reach the dashboard in under 30 seconds
- **SC-002**: Users can sign in and see their decks in under 5 seconds
- **SC-003**: Token refresh happens transparently — users never see an unexpected sign-out during normal usage within a session
- **SC-004**: Users can view and revoke sessions from at least 2 different devices
- **SC-005**: Theme toggle takes effect in under 200ms with no page reload
- **SC-006**: All existing features continue to work identically, now scoped to the signed-in user

## Clarifications

### Session 2026-03-21

- Q: How should existing cards/decks (created before auth) be handled during migration? → A: Delete all existing data (fresh start for all users)
- Q: Where should authentication tokens be stored on the frontend? → A: Both tokens in HttpOnly cookies with CSRF protection

## Assumptions

- Email/password is the only sign-in method for v1 (no OAuth/social login)
- Access tokens are short-lived (15 minutes); refresh tokens are long-lived (7 days)
- No email verification required for v1 sign-up (can be added later)
- No password reset flow in v1 scope
- Dark/light are the only theme options
- The "Cards" section is read-only for browsing; editing cards still happens within the deck detail view
- Device identification will use User-Agent string parsing — no fingerprinting
