# Data Model: Custom LLM Tool-Calling Engine

**Feature**: 009-custom-llm-toolcall
**Date**: 2026-04-13

No database schema changes in this feature. The existing `User` model fields (`englishLevel`, `goals`, `nativeLanguage`) are written by tool executions as before.

---

## Runtime Types (TypeScript — no DB schema change)

### ChatMessage

Represents a single turn in the conversation sent to the LLM.

```ts
type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

interface ChatMessage {
  role: ChatRole;
  content: string | null;
  tool_calls?: ToolCall[];     // only when role === 'assistant' and LLM called a tool
  tool_call_id?: string;       // only when role === 'tool'
  name?: string;               // optional tool name for role === 'tool'
}
```

### ToolCall

The LLM's signal to invoke a server-side function.

```ts
interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}
```

### ToolDefinition

Sent to the LLM with each request so it knows what tools are available.

```ts
interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: JSONSchema; // standard JSON Schema object
  };
}
```

### LLMStreamChunk

A fragment arriving from the streaming API response.

```ts
interface LLMStreamChunk {
  choices: Array<{
    delta: {
      content?: string | null;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: 'function';
        function?: {
          name?: string;
          arguments?: string; // partial JSON — accumulate across chunks
        };
      }>;
    };
    finish_reason: 'stop' | 'tool_calls' | null;
  }>;
}
```

### ClientChatMessage

The shape managed in React state on the client. Simpler than `ChatMessage` — no tool metadata needed on the client.

```ts
interface ClientChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
```
