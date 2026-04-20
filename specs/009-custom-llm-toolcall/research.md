# Research: Custom LLM Tool-Calling Engine

**Feature**: 009-custom-llm-toolcall
**Date**: 2026-04-13

---

## 1. OpenAI-Compatible Streaming with Tools

**Decision**: Use Server-Sent Events (SSE) with `stream: true` against an OpenAI-compatible `/v1/chat/completions` endpoint. Default provider: OpenRouter (`https://openrouter.ai/api/v1/chat/completions`). Provider is swappable via `LLM_BASE_URL` and `LLM_MODEL` env vars.

**Rationale**: OpenRouter (and other OpenAI-compatible providers) follow the OpenAI API format exactly. The streaming format is newline-delimited `data: {...}` JSON chunks. Tool calls are delivered inside these chunks as `delta.tool_calls` fragments that must be assembled.

**How streaming with tools works (OpenAI format)**:

```
POST /v1/chat/completions
{
  "model": "google/gemini-2.0-flash-001",
  "stream": true,
  "tools": [...],
  "messages": [...]
}
```

Response chunks (SSE):
```
data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}
data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_abc","type":"function","function":{"name":"assessLevel","arguments":""}}]},"finish_reason":null}]}
data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\"level\":"}}]},"finish_reason":null}]}
data: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}
data: [DONE]
```

**Key behaviors**:
- `finish_reason: "tool_calls"` signals the model wants to call a tool
- `finish_reason: "stop"` signals a normal text completion
- Tool call arguments arrive as JSON string fragments — must be concatenated across chunks before parsing
- Multiple tool calls can arrive in parallel (different `index` values)

---

## 2. Server-Side Tool-Call Loop

**Decision**: The tool-call loop runs entirely server-side within a single Next.js Route Handler request.

**Rationale**: The client only needs to receive the final streamed text reply. Running the tool loop server-side keeps the client simple (it just reads a stream) and avoids extra HTTP round trips.

**Loop pattern**:
```
1. Call LLM with messages + tools (streaming)
2. Collect all stream chunks
3. If finish_reason == "tool_calls":
   a. Assemble the full tool call from fragments
   b. Execute the tool function (DB write, etc.)
   c. Append assistant message with tool_calls to messages
   d. Append tool result message to messages
   e. Call LLM again (streaming) — go to step 2
4. If finish_reason == "stop":
   a. Stream the accumulated text to the client
```

**Message format for tool results** (OpenAI spec):
```json
{ "role": "assistant", "content": null, "tool_calls": [{ "id": "call_abc", "type": "function", "function": { "name": "assessLevel", "arguments": "{\"level\":\"B2\",\"reaction\":\"...\"}" } }] }
{ "role": "tool", "tool_call_id": "call_abc", "content": "{\"success\":true,\"level\":\"B2\"}" }
```

---

## 3. Streaming from Next.js Route Handler to Client

**Decision**: Return a `Response` with a `ReadableStream` body and `Content-Type: text/plain; charset=utf-8`.

**Rationale**: Simple and compatible with `fetch` on the client. No SSE framing needed — the client just reads raw text chunks from the body stream. `text/event-stream` adds complexity (framing, event parsing) without benefit since we only send one type of event (text tokens).

**Pattern**:
```ts
const stream = new TransformStream();
const writer = stream.writable.getWriter();

// After tool loop resolves, stream final LLM response:
(async () => {
  for await (const chunk of llmStream) {
    const token = chunk.choices[0]?.delta?.content ?? '';
    if (token) await writer.write(encoder.encode(token));
  }
  await writer.close();
})();

return new Response(stream.readable, {
  headers: { 'Content-Type': 'text/plain; charset=utf-8' }
});
```

---

## 4. Client-Side Chat State Management

**Decision**: Custom `useLLMChat` hook using `useState` + `fetch` with `ReadableStream` body reader.

**Rationale**: Replaces `useChat` from `@ai-sdk/react`. The hook manages:
- `messages: ChatMessage[]` — the full conversation history
- `status: 'ready' | 'streaming' | 'error'` — UI state
- `sendMessage(text: string)` — appends user message, POSTs to API, reads stream, appends assistant response token-by-token

**Client stream reading pattern**:
```ts
const res = await fetch(api, { method: 'POST', body: JSON.stringify({ messages }) });
const reader = res.body!.getReader();
const decoder = new TextDecoder();

// Append empty assistant message
setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const token = decoder.decode(value);
  setMessages(prev => {
    const last = prev[prev.length - 1];
    return [...prev.slice(0, -1), { ...last, content: last.content + token }];
  });
}
```

---

## 5. Tool Definitions Format

**Decision**: Define tools as plain TypeScript objects matching the OpenAI `tools` array schema. No Zod — use `JSON Schema` objects directly since we control the full pipeline.

**Format**:
```ts
{
  type: 'function',
  function: {
    name: 'assessLevel',
    description: 'Assess the English level after sufficient conversation',
    parameters: {
      type: 'object',
      properties: {
        level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Fluent'] },
        reaction: { type: 'string', description: 'What Leo says to reveal the level naturally' }
      },
      required: ['level', 'reaction']
    }
  }
}
```

---

## 6. Removing SDK Packages

**Decision**: Remove `ai`, `@ai-sdk/react`, `@ai-sdk/google`, `@ai-sdk/openai` from `package.json` after migrating all usages.

**Affected files** (current SDK usage):
- `src/app/api/onboarding/chat/level/route.ts` — uses `streamText`, `convertToModelMessages`, `createOpenAI`
- `src/app/api/onboarding/chat/goals/route.ts` — same
- `src/components/onboarding/OnboardingChat.tsx` — uses `useChat`, `DefaultChatTransport`, `UIMessage`
- `src/hooks/useOnboardingChat.ts` — uses `useChat`, `DefaultChatTransport`

**Not affected** (already uses direct fetch):
- `src/app/api/onboarding/transcribe/route.ts` — direct fetch, no SDK
- `src/app/api/translate/route.ts` — direct fetch, no SDK

---

## 7. Alternatives Considered

| Option | Rejected Because |
|--------|-----------------|
| Keep AI SDK but switch to `@ai-sdk/google` | Still a third-party dependency; requires Google API key setup |
| Use Vercel AI Gateway | Requires credit card / Vercel account with billing |
| Build SSE client with EventSource | EventSource doesn't support POST requests; requires server-side SSE framing |
| Run tool loop on the client | Exposes LLM_API_KEY in browser; extra round trips |
