# API Contracts: Onboarding Chat Routes

**Feature**: 009-custom-llm-toolcall
**Date**: 2026-04-13

The two chat routes (`/api/onboarding/chat/level` and `/api/onboarding/chat/goals`) share the same request/response contract. Only the tools and system prompt differ.

---

## POST /api/onboarding/chat/level

Streams Leo's English level assessment conversation.

### Request

```json
{
  "messages": [
    { "role": "user", "content": "Hello, I want to learn English" },
    { "role": "assistant", "content": "Great! Tell me about yourself..." }
  ]
}
```

### Response

- **Status**: `200 OK`
- **Content-Type**: `text/plain; charset=utf-8`
- **Body**: Raw streamed text tokens of the assistant reply (no framing, no JSON)

The stream closes when the full reply has been sent. If the LLM called the `assessLevel` tool internally, the tool has already executed (level saved to DB) before the stream starts.

### Errors

| Status | Meaning |
|--------|---------|
| 401 | Not authenticated |
| 500 | LLM API unreachable or returned an error |

---

## POST /api/onboarding/chat/goals

Streams Leo's goal extraction conversation. Accepts an optional `nativeLanguage` field to inject the user's language into the system prompt.

### Request

```json
{
  "messages": [...],
  "nativeLanguage": "es"
}
```

### Response

Same as `/chat/level` — streamed plain text.

---

## Tool Execution (internal, not exposed to client)

Both routes execute their respective tools server-side and invisibly:

| Route | Tool | What it saves |
|-------|------|---------------|
| `/chat/level` | `assessLevel(level, reaction)` | `User.englishLevel` |
| `/chat/goals` | `extractGoals(primary, secondary?, context?, urgency?)` | `User.goals` (JSON) |

The client never sees the tool call — it only receives the final text reply that follows the tool execution.
