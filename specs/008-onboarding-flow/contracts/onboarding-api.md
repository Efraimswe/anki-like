# API Contracts: Onboarding

**Feature**: 008-onboarding-flow  
**Date**: 2026-04-13

All endpoints require a valid `access_token` cookie. All responses are JSON unless noted.

---

## POST /api/onboarding/language

Save the user's selected native language (Step 1).

**Request**
```json
{
  "language": "ru"
}
```
`language`: BCP-47 code (e.g. `"ru"`, `"fr"`, `"es"`).

**Response 200**
```json
{
  "ok": true
}
```

**Errors**
- `400` — missing or invalid language code
- `401` — unauthenticated

---

## POST /api/onboarding/chat/level

Streaming AI chat for English level assessment (Step 2). Returns a UI message stream.

**Request**
```json
{
  "messages": [ /* UIMessage[] — AI SDK v6 format */ ]
}
```

**Response**: `text/event-stream` — AI SDK `toUIMessageStreamResponse()` format.

The agent will call the `assessLevel` tool internally when the threshold is reached. The tool execution persists the level to DB automatically.

**Tool call (server-side, auto-executed)**
```
assessLevel({ level: "B1 solid", reaction: "You're B1 solid! Great foundation..." })
```

**Errors**
- `401` — unauthenticated
- `500` — AI provider error

---

## POST /api/onboarding/chat/goals

Streaming AI chat for goal extraction (Step 3). Same shape as level chat.

**Request**
```json
{
  "messages": [ /* UIMessage[] */ ]
}
```

**Response**: `text/event-stream` — AI SDK `toUIMessageStreamResponse()` format.

The agent calls `extractGoals` internally when goals are clear enough. Tool execution persists goals to DB.

**Tool call (server-side, auto-executed)**
```
extractGoals({
  primary: "Get a remote job in tech",
  secondary: ["Watch Netflix without subtitles"],
  context: "Living in Belgium",
  urgency: "high"
})
```

**Errors**
- `401` — unauthenticated
- `500` — AI provider error

---

## POST /api/onboarding/transcribe

Transcribe a voice recording to text.

**Request**: `multipart/form-data`
- `audio` — audio blob (`audio/webm`)

**Response 200**
```json
{
  "text": "I want to get a job in tech"
}
```

**Errors**
- `400` — missing audio
- `401` — unauthenticated
- `500` — transcription failed

---

## POST /api/onboarding/complete

Mark onboarding as complete (Step 4). Issues a new access token with `onboardingCompleted: true`.

**Request**: empty body

**Response 200**
```json
{
  "ok": true
}
```
Sets a new `access_token` cookie with `onboardingCompleted: true` in the JWT payload.

**Errors**
- `401` — unauthenticated
- `409` — onboarding already completed
