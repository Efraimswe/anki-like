# Feature Specification: Custom LLM Tool-Calling Engine

**Feature Branch**: `009-custom-llm-toolcall`
**Created**: 2026-04-13
**Status**: Draft
**Input**: Remove all AI SDKs and replace with custom LLM tool-calling logic that calls an OpenAI-compatible chat-completions endpoint directly (OpenRouter by default; provider swappable via `LLM_BASE_URL`/`LLM_MODEL` env vars) using `LLM_API_KEY`. Implement streaming, tool calling (assessLevel, extractGoals), and chat state management manually in TypeScript — no third-party AI SDK wrappers.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Onboarding Chat Works Without SDK (Priority: P1)

A user going through the onboarding flow chats with Leo on steps 2 and 3. Responses stream in word-by-word as before. After enough conversation, Leo silently assesses the user's English level (step 2) or extracts their goals (step 3) by calling a tool — and the result is saved to the database. The user experience is identical to before.

**Why this priority**: This is the core capability being replaced. Everything else depends on the chat working correctly.

**Independent Test**: Start the dev server, register a new account, reach step 2, chat for 8+ messages — verify responses stream in real time, English level is assessed and saved to DB, and the user advances to step 3.

**Acceptance Scenarios**:

1. **Given** a user on step 2 of onboarding, **When** they type a message and send it, **Then** Leo's reply begins appearing word-by-word within 1.5 seconds
2. **Given** a user who has sent 8+ messages on step 2, **When** Leo decides to assess the level, **Then** the English level is saved in the database and the user advances to step 3
3. **Given** a user on step 3, **When** the conversation yields a clear goal, **Then** the goals are saved in the database and the user advances to step 4
4. **Given** the LLM API returns an error, **When** a user sends a message, **Then** an error message is shown and a retry or skip option is presented

---

### User Story 2 - No Third-Party AI SDK in the Project (Priority: P2)

After the migration, the project runs with no AI SDK packages installed. It builds, starts, and passes type-checking without them.

**Why this priority**: Removing the SDK dependency is the explicit goal — this validates the migration is complete.

**Independent Test**: After migration, inspect `package.json` — none of the AI SDK packages appear. Run the dev server — it starts without errors.

**Acceptance Scenarios**:

1. **Given** the migrated codebase, **When** `package.json` is inspected, **Then** none of `ai`, `@ai-sdk/react`, `@ai-sdk/google`, `@ai-sdk/openai` appear as dependencies
2. **Given** the migrated codebase, **When** the dev server is started, **Then** no import errors or missing-module errors occur

---

### User Story 3 - Voice Input Continues to Work (Priority: P3)

The voice input button on steps 2 and 3 still records audio and transcribes it into the chat input field.

**Why this priority**: Voice is a secondary, optional feature. Core chat must work first.

**Independent Test**: On step 2, press the microphone button, speak, and verify the transcribed text appears in the input within 3 seconds.

**Acceptance Scenarios**:

1. **Given** a user on step 2 or 3, **When** they press the microphone and speak, **Then** transcribed text appears in the chat input within 3 seconds

---

### Edge Cases

- What happens when the LLM returns a tool call and text in the same streamed response?
- What happens when the LLM calls a tool not defined on our side?
- What happens when streaming is interrupted mid-response (network drop)?
- What happens when the tool execution fails (e.g., database write error)?
- What happens when the LLM never calls the expected tool after many messages?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST send chat messages to the LLM API using the API key already configured in the environment, with no third-party AI SDK as intermediary
- **FR-002**: The system MUST stream responses to the browser — the user sees tokens appear progressively, not as a single block
- **FR-003**: The system MUST send tool definitions with each request so the LLM can choose to invoke `assessLevel` or `extractGoals`
- **FR-004**: The system MUST detect when the LLM outputs a tool call, execute the corresponding server-side function, and feed the result back to the LLM to continue the conversation — all within a single request cycle
- **FR-005**: The system MUST persist tool results (English level, goals) to the database identically to the current behavior
- **FR-006**: The client MUST maintain the message history locally, send the full history with each new message, and append incoming streamed tokens to the last message in real time
- **FR-007**: All AI SDK packages MUST be removed from the project after migration is complete
- **FR-008**: The system MUST surface user-friendly error messages when the LLM API is unavailable or returns an error

### Key Entities

- **ChatMessage**: A single turn in the conversation — has a role (user, assistant, or tool result) and content
- **ToolDefinition**: A schema describing a callable tool — its name, what it does, and what arguments it accepts
- **ToolCall**: The LLM's signal that it wants to invoke a tool — includes the tool name and the arguments it chose
- **StreamChunk**: A fragment of the LLM's response arriving over the streaming connection — either a text token or a piece of a tool call

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The onboarding chat (steps 2 and 3) works end-to-end with zero AI SDK packages present in the project
- **SC-002**: The first streamed token of a reply appears within 1.5 seconds of sending a message
- **SC-003**: Tool calls are detected, executed, and results fed back to the LLM automatically — no extra user action required
- **SC-004**: The project builds and starts without errors after removing all AI SDK packages
- **SC-005**: English level and goals are correctly saved to the database after their respective tool calls fire

## Assumptions

- The chat endpoint follows the OpenAI chat completions format — supporting `stream: true`, the `tools` array, and tool result messages. OpenRouter is the current default; any OpenAI-compatible provider works by setting `LLM_BASE_URL` and `LLM_MODEL`
- The tool-call loop runs entirely server-side within a single API route: the server detects the tool call, runs the function, appends the result, and calls the LLM again, all before streaming the final reply to the client
- The conversation ends (and the stream closes) when the LLM produces a plain text response with no tool call
- Voice transcription already uses a direct REST call to the transcription API (migrated in the previous session) and requires no further changes
