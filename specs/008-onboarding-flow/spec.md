# Feature Specification: Onboarding Flow

**Feature Branch**: `008-onboarding-flow`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description: "Onboarding flow after registration with Leo character guide, 4 steps: native language selection, English level assessment via AI chat, goal extraction via AI chat, welcome screen. Cannot be skipped."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Complete Onboarding from Registration (Priority: P1)

A newly registered user is immediately redirected to onboarding and guided through all 4 steps by Leo the character. They cannot reach the dashboard until all steps are complete.

**Why this priority**: Core feature — without this, the app has no way to personalize content for new users.

**Independent Test**: Register a new account, verify redirect to `/onboarding/step-1`, complete all 4 steps, verify redirect to dashboard.

**Acceptance Scenarios**:

1. **Given** a user has just registered, **When** registration completes, **Then** they are immediately redirected to `/onboarding`
2. **Given** a user is on `/onboarding`, **When** they attempt to navigate to any protected route, **Then** they are redirected back to `/onboarding`
3. **Given** a user completes Step 4 and clicks "Let's go", **When** the action processes, **Then** `onboardingCompleted` is set to `true` and they are redirected to the dashboard

---

### User Story 2 — Return User Forced Back to Onboarding (Priority: P1)

A user who started but did not finish onboarding closes the tab and returns later. They are forced back to onboarding and cannot bypass it.

**Why this priority**: Ensures data integrity — the app cannot function without knowing the user's language, level, and goals.

**Independent Test**: Register, complete Step 1 only, close browser, log back in, verify redirect to `/onboarding`.

**Acceptance Scenarios**:

1. **Given** a logged-in user with `onboardingCompleted = false`, **When** they navigate to `/dashboard`, **Then** they are redirected to `/onboarding`
2. **Given** a logged-in user with `onboardingCompleted = false`, **When** they navigate to any protected route, **Then** they are redirected to `/onboarding`
3. **Given** a user with `onboardingCompleted = true`, **When** they navigate to `/dashboard`, **Then** they access it normally

---

### User Story 3 — Native Language Selection (Priority: P2)

User selects their native language via a visual picker in Step 1. Leo greets them and asks for their language.

**Why this priority**: Required input for Step 3 and all future personalization.

**Independent Test**: Complete Step 1 alone, verify language is stored in the user profile, verify Step 3 uses that language.

**Acceptance Scenarios**:

1. **Given** the user is on Step 1, **When** they select a language and confirm, **Then** the language is saved to their profile and they advance to Step 2
2. **Given** the user is on Step 1, **When** no language is selected, **Then** they cannot advance

---

### User Story 4 — English Level Assessment via AI Chat (Priority: P2)

User converses naturally with Leo (in English) for up to 8 messages or 5 minutes. Leo silently assesses their level and reveals it at the end.

**Why this priority**: Level drives all content difficulty and exercise selection in the main app.

**Independent Test**: Complete Step 2, verify a level is stored in the user profile, verify the character reveals the result naturally.

**Acceptance Scenarios**:

1. **Given** the user sends 8+ messages OR 5 minutes elapse, **When** the threshold is reached, **Then** the agent assesses and returns a level
2. **Given** the assessment completes, **When** the level is returned, **Then** Leo reveals it conversationally and advances to Step 3
3. **Given** the user sends a voice message, **When** they submit it, **Then** it is transcribed and fed into the chat as text
4. **Given** the chat is active, **When** viewing the interface, **Then** a message counter ("3/8") or timer ("4 min left") is visible

---

### User Story 5 — Goal Extraction via AI Chat (Priority: P2)

User converses with Leo in their native language about why they want to learn English. Leo extracts at least one clear, specific goal.

**Why this priority**: Goals personalize the tutor's motivation, topics, and tone throughout the app.

**Independent Test**: Complete Step 3, verify structured goals are stored in the user profile.

**Acceptance Scenarios**:

1. **Given** the user is on Step 3, **When** Leo detects clear goals, **Then** structured goals are extracted and stored in the user profile
2. **Given** the user gives a vague answer, **When** Leo processes it, **Then** Leo asks a follow-up question and does not advance until a specific goal is provided
3. **Given** 5 minutes have elapsed and at least one goal is extracted, **When** time limit is reached, **Then** the step completes automatically
4. **Given** the entire Step 3 conversation, **When** it occurs, **Then** all messages are in the user's native language

---

### User Story 6 — Welcome Screen and Completion (Priority: P3)

After goals are extracted, Leo presents a personalized welcome and the user clicks "Let's go" to enter the app.

**Why this priority**: Closes the onboarding loop, sets the emotional tone, and gates dashboard access.

**Independent Test**: Complete Steps 1–3, verify Step 4 renders, click "Let's go", verify dashboard access and `onboardingCompleted = true`.

**Acceptance Scenarios**:

1. **Given** the user is on Step 4, **When** they click "Let's go", **Then** `onboardingCompleted` is set to `true`
2. **Given** Step 4 completes, **When** the redirect happens, **Then** the user lands on the dashboard
3. **Given** the user revisits `/onboarding` after completion, **When** they load the page, **Then** they are redirected to the dashboard

---

### Edge Cases

- What happens if the user's browser does not support voice recording? → Text input must remain fully functional as a fallback; voice input button is hidden or disabled
- What happens if the AI agent fails to respond? → Show an error state and allow the user to retry without losing conversation history
- What happens if level assessment or goal extraction returns an unexpected result? → Fall back to a sensible default (B1 for level) and prompt the user to try the step again
- What happens if the user refreshes mid-chat-step? → Conversation restarts from the beginning of that step; previously completed steps are preserved

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST redirect newly registered users to `/onboarding` immediately after registration
- **FR-002**: System MUST redirect any authenticated user with `onboardingCompleted = false` from protected routes to `/onboarding`
- **FR-003**: System MUST prevent users from skipping or bypassing any onboarding step
- **FR-004**: System MUST display the Leo character illustration with a subtle floating animation on all onboarding steps
- **FR-005**: Step 1 MUST present a visual language picker and persist the selected native language to the user profile before advancing
- **FR-006**: Step 2 MUST provide a chat interface supporting both text and voice input for an English conversation with the AI agent
- **FR-007**: Step 2 MUST display a message counter ("3/8 messages") or countdown timer ("4 min left") throughout the conversation
- **FR-008**: Step 2 agent MUST behave as a natural conversationalist and MUST NOT reveal that an assessment is taking place
- **FR-009**: Step 2 agent MUST trigger level assessment after 8+ user messages or 5 minutes of conversation
- **FR-010**: Step 2 MUST store the assessed English level in the user profile
- **FR-011**: Step 3 MUST provide the same chat interface as Step 2, conducted entirely in the user's native language
- **FR-012**: Step 3 agent MUST extract at least one clear, specific goal before allowing the step to complete
- **FR-013**: Step 3 agent MUST ask follow-up questions when the user's stated goal is too vague
- **FR-014**: Step 3 MUST store structured goals (`primary`, optional `secondary[]`, `context`, `urgency`) in the user profile
- **FR-015**: Step 4 MUST display a prominent "Let's go" button that sets `onboardingCompleted = true` and redirects to the dashboard
- **FR-016**: Voice input MUST transcribe audio and insert the result as text into the chat
- **FR-017**: After `onboardingCompleted = true`, the system MUST NOT redirect the user back to `/onboarding`

### Key Entities

- **User**: Has `onboardingCompleted` (boolean, default false), `nativeLanguage`, `englishLevel`, and `goals`
- **UserGoals**: Structured data with `primary` goal (required), `secondary` goals (optional list), `context` (optional), and `urgency` level (low / medium / high, optional)
- **EnglishLevel**: One of — A1, A1 solid, A2, A2 solid, B1, B1 solid, B2, B2 solid, C1, C1 solid, C2, C2 solid, Fluent

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of users who begin onboarding complete all 4 steps in a single session
- **SC-002**: Users complete the full onboarding flow in under 15 minutes on average
- **SC-003**: 100% of users who reach the dashboard have `onboardingCompleted = true`, a stored native language, English level, and at least one goal
- **SC-004**: Zero authenticated users with `onboardingCompleted = false` are able to access any protected route
- **SC-005**: Voice transcription completes and inserts into chat in under 3 seconds in 95% of attempts
- **SC-006**: AI level assessment produces a valid level for 100% of completed Step 2 conversations

## Assumptions

- The application already has working registration and authentication
- The user table can be extended with `onboardingCompleted`, `nativeLanguage`, `englishLevel`, and `goals` fields
- The Leo character illustration is available at `public/characterneutralsmile.png`
- The native language picker covers 20–30 common languages; the exact list can be refined post-launch
- Step progress is not persisted mid-step — if a user refreshes during a chat step, that step's conversation restarts
- Voice input is a progressive enhancement; the flow is fully usable with text only
