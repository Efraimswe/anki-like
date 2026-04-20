# Research: Onboarding Flow

**Feature**: 008-onboarding-flow  
**Date**: 2026-04-13

## AI SDK Setup for Streaming Chat

### Decision
Use Vercel AI SDK v6 (`ai`) with **AI Gateway** for all AI model calls. Pass plain `"google/gemini-2.0-flash"` strings — no provider-specific package needed for routing.

**Packages to install**:
```
ai
```
(`zod` is already in the project. `@ai-sdk/google` is NOT needed — AI Gateway handles provider routing.)

**Rationale**: AI Gateway provides failover, cost tracking, OIDC auth (no raw API keys in env), and observability at <20ms overhead. Plain `"provider/model"` strings route automatically through the gateway.

**Auth**: OIDC via `vercel env pull .env.local` — provisions `VERCEL_OIDC_TOKEN` automatically. No provider-specific API keys required.

**Alternatives considered**: Direct provider SDKs with raw API keys — rejected because they bypass Gateway auth and observability.

---

### Streaming Chat Route Pattern (App Router) — AI SDK v6

```typescript
// src/app/api/onboarding/chat/level/route.ts
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: 'google/gemini-2.0-flash', // AI Gateway routes automatically
    system: LEVEL_ASSESSMENT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      assessLevel: {
        description: 'Assess the English level after sufficient conversation',
        inputSchema: z.object({
          level: z.enum(['A1','A1 solid','A2','A2 solid','B1','B1 solid','B2','B2 solid','C1','C1 solid','C2','C2 solid','Fluent']),
          reaction: z.string().describe('What Leo says to reveal the level naturally'),
        }),
        execute: async ({ level }) => {
          // Persist level to DB here
          return { success: true };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
```

Key v6 differences:
- `UIMessage[]` type for incoming messages
- `convertToModelMessages(messages)` transforms UI messages to model format
- Tools defined inline as objects (no `tool()` wrapper needed), with `inputSchema`
- `toUIMessageStreamResponse()` replaces `toDataStreamResponse()`

---

### useChat Hook Pattern — AI SDK v6

```typescript
// src/app/onboarding/step-2/page.tsx
'use client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

export default function Step2Page() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/onboarding/chat/level',
    }),
  });
  const [input, setInput] = useState('');

  return (
    <form onSubmit={e => { e.preventDefault(); sendMessage({ text: input }); setInput(''); }}>
      <input value={input} onChange={e => setInput(e.target.value)} disabled={status !== 'ready'} />
      <button type="submit" disabled={status !== 'ready'}>Send</button>
    </form>
  );
}
```

Key v6 differences:
- `sendMessage({ text: input })` is the v6 way to submit a message
- `transport: new DefaultChatTransport({ api })` replaces the old `api` prop
- `status` values: `'ready' | 'submitted' | 'streaming' | 'error'`
- Messages have `parts` array (use `part.type === 'text'` and `part.text`)

---

### Audio Transcription — AI SDK v6

The function is exported as `experimental_transcribe`:

```typescript
import { experimental_transcribe as transcribe } from 'ai';

const transcript = await transcribe({
  model: 'openai/whisper-1', // routed through AI Gateway — no provider key needed
  audio: audioBuffer, // Uint8Array, ArrayBuffer, Buffer, base64 string, or URL
});

const text = transcript.text;
```

**Note**: `experimental_transcribe` is an experimental API. Auth is handled by AI Gateway OIDC — `vercel env pull` provisions the token. No provider-specific keys needed.

**Route**: `POST /api/onboarding/transcribe` — receives multipart audio blob, transcribes, returns `{ text }`.

---

## Middleware Strategy

### Decision
Extend the existing `middleware.ts` to decode the JWT and check `onboardingCompleted` without a DB hit.

**Rationale**: Middleware runs on every request. A DB lookup per request would be too slow. The JWT payload already contains user data — adding `onboardingCompleted: boolean` to the token payload costs nothing.

**Implementation**:
- After JWT verification, decode the payload (already done via `jwtVerify`)
- Check `payload.onboardingCompleted`
- `/onboarding` routes: if `true` → redirect `/dashboard`
- All other protected routes: if `false` → redirect `/onboarding`

**JWT re-issue**: On `POST /api/onboarding/complete`, issue a new access token with `onboardingCompleted: true` and set it as a cookie. The old token had `false`.

---

## Onboarding Route Architecture

### Decision
Single `/onboarding` route group with step sub-pages (not inside `(protected)` group).

**Rationale**: The `(protected)` layout assumes `onboardingCompleted = true`. Onboarding needs its own layout (Leo character shell). Middleware handles the redirect logic for both directions.

**Route structure**:
```
/onboarding          → redirects to /onboarding/step-1 (or current step)
/onboarding/step-1   → language selection
/onboarding/step-2   → AI level chat
/onboarding/step-3   → AI goal chat
/onboarding/step-4   → welcome + complete
```

---

## Voice Input Strategy

### Decision
Browser `MediaRecorder` API captures audio → sends blob to `/api/onboarding/transcribe` → returns text → inserted into chat input.

**Rationale**: Keeps voice as a pure progressive enhancement. If `MediaRecorder` is unavailable, the text input works alone. No additional WebSocket or streaming for audio.

**Format**: `audio/webm` (default MediaRecorder output in Chrome/Firefox). Gemini transcription accepts this via the AI SDK.

---

## Character Animation

### Decision
CSS `@keyframes float` animation only — no GSAP, no JS.

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-10px); }
}
.leo-float {
  animation: float 3s ease-in-out infinite;
}
```

**Applied to**: `<Image>` wrapper in `LeoCharacter.tsx`. Image served from `public/characterneutralsmile.png` via `next/image` (auto WebP).
