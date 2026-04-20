# Tasks: Custom LLM Tool-Calling Engine

**Input**: Design documents from `/specs/009-custom-llm-toolcall/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/chat-api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- No test tasks — not requested in spec

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new shared LLM module that all routes will use.

- [X] T001 Create `src/lib/llm.ts` — define shared TypeScript types from data-model.md: `ChatMessage`, `ToolCall`, `ToolDefinition`, `LLMStreamChunk`, `ClientChatMessage`; export a `callLLMStream(messages, options)` function stub that calls an OpenAI-compatible `/v1/chat/completions` endpoint (default: `https://openrouter.ai/api/v1/chat/completions`, overridable via `LLM_BASE_URL`) with `stream: true` using `LLM_API_KEY` from `process.env`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the streaming + tool-call loop in `src/lib/llm.ts` — everything else builds on this.

**⚠️ CRITICAL**: No route or hook work can begin until this phase is complete.

- [X] T002 Implement streaming response parser in `src/lib/llm.ts` — read the `fetch` response body as a `ReadableStream`, split on newlines, parse `data: {...}` SSE chunks into `LLMStreamChunk` objects; accumulate `delta.content` tokens and `delta.tool_calls` fragments (assembling partial JSON arguments across chunks)
- [X] T003 Implement the tool-call loop in `src/lib/llm.ts` — after collecting all chunks: if `finish_reason === 'tool_calls'`, assemble the full `ToolCall`, invoke the matching executor from a provided `executors: Record<string, (args: unknown) => Promise<unknown>>` map, append `{ role: 'assistant', content: null, tool_calls: [...] }` and `{ role: 'tool', tool_call_id, content: JSON.stringify(result) }` to messages, then call the LLM again; loop until `finish_reason === 'stop'`
- [X] T004 Implement `streamToClient(llmFetchResponse, writer)` helper in `src/lib/llm.ts` — pipes the final LLM text stream into a `TransformStream` writer, forwarding only `delta.content` tokens; used by route handlers to return a streaming `Response` to the browser

**Checkpoint**: After T004, `src/lib/llm.ts` is fully functional. Test manually by calling it in isolation with a hardcoded message and logging output.

---

## Phase 3: User Story 1 — Onboarding Chat Works Without SDK (Priority: P1) 🎯 MVP

**Goal**: Steps 2 and 3 of onboarding stream responses, execute tool calls server-side, and save results to DB — all via direct `fetch`, no SDK.

**Independent Test**: Register a new account, reach step 2, send 8+ messages — verify streaming works, `englishLevel` is saved in DB, user advances to step 3. Repeat for step 3 with goals.

- [X] T005 [P] [US1] Rewrite `src/app/api/onboarding/chat/level/route.ts` — remove all `@ai-sdk/openai` / `ai` imports; use `callLLMStream` from `src/lib/llm.ts` with the `LEVEL_ASSESSMENT_PROMPT` system prompt and `assessLevel` tool definition (JSON Schema format per research.md); pass `execute: async (args) => { await prisma.user.update(...englishLevel) }` as the executor; return `new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })`
- [X] T006 [P] [US1] Rewrite `src/app/api/onboarding/chat/goals/route.ts` — same pattern as T005; use `getGoalExtractionPrompt(lang)` and `extractGoals` tool definition; executor writes `goals` JSON to DB
- [X] T007 [US1] Create `src/hooks/useLLMChat.ts` — custom hook replacing `useChat` from `@ai-sdk/react`; state: `messages: ClientChatMessage[]`, `status: 'ready' | 'streaming' | 'error'`, `error: Error | undefined`; `sendMessage(text: string)`: appends user message, POSTs `{ messages }` to `api`, reads `response.body` as `ReadableStream` with `TextDecoder`, appends empty assistant message, updates last message content token-by-token as chunks arrive, sets status to `ready` on stream close; `onComplete` called when status transitions to `ready` if a flag is set
- [X] T008 [US1] Update `src/components/onboarding/OnboardingChat.tsx` — replace `useChat` / `DefaultChatTransport` / `UIMessage` imports with `useLLMChat` from `src/hooks/useLLMChat.ts`; update `messages` rendering to use `ClientChatMessage` shape (no `parts` — just `content` string); update `status` comparisons if needed; remove all `ai` / `@ai-sdk/*` imports from this file
- [X] T009 [US1] Update `src/hooks/useOnboardingChat.ts` — replace `useChat` / `DefaultChatTransport` imports with `useLLMChat`; remove `UseChatOptions` type import; align return type with `useLLMChat` return shape

**Checkpoint**: Steps 2 and 3 of onboarding work end-to-end. Streaming visible in browser. DB records updated after tool calls.

---

## Phase 4: User Story 2 — No SDK Dependency (Priority: P2)

**Goal**: Remove all 4 AI SDK packages from `package.json` and verify the project builds cleanly.

**Independent Test**: `grep -r "@ai-sdk\|from 'ai'" src/` returns no results. `pnpm dev` starts without errors. `npx tsc --noEmit` passes.

- [X] T010 [US2] Audit all remaining SDK imports — run `grep -r "from 'ai'\|from '@ai-sdk" src/` and list every file still importing from SDK packages; fix any remaining usages not covered by T005–T009
- [X] T011 [US2] Remove SDK packages — run `pnpm remove ai @ai-sdk/react @ai-sdk/google @ai-sdk/openai`; verify `package.json` no longer lists them
- [X] T012 [US2] Run `npx tsc --noEmit` and fix any type errors introduced by package removal

**Checkpoint**: Project builds with zero AI SDK packages. `grep` confirms no remaining imports.

---

## Phase 5: User Story 3 — Voice Input Continues to Work (Priority: P3)

**Goal**: Voice transcription on steps 2 and 3 still works after SDK removal.

**Independent Test**: On step 2, click the microphone, speak, verify transcribed text appears in input within 3 seconds.

- [X] T013 [US3] Verify `src/app/api/onboarding/transcribe/route.ts` — confirm it uses direct `fetch` to a Whisper-compatible transcription endpoint (currently hardcoded to `https://api.llmapi.ai/v1/audio/transcriptions`; OpenRouter does **not** offer transcription, so this route needs its own provider/key if moving off llmapi.ai); no SDK imports remain
- [X] T014 [US3] Verify `src/components/onboarding/VoiceInput.tsx` — confirm it POSTs `FormData` to `/api/onboarding/transcribe` and calls `onTranscript(text)` with the response; no SDK references; no changes needed if clean

**Checkpoint**: Voice input functional. Microphone → transcript → chat input works on step 2 and 3.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T015 [P] Run `npx tsc --noEmit` final check — zero errors required
- [X] T016 [P] Run `grep -r "from 'ai'\|from '@ai-sdk'" src/` — must return no results
- [ ] T017 Run full onboarding flow end-to-end per `quickstart.md` checklist — register → step 1 → step 2 (8 messages, verify `englishLevel` in DB) → step 3 (goals, verify `goals` in DB) → step 4 → dashboard

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user story phases**
- **Phase 3 (US1)**: Depends on Phase 2 — T005 and T006 can start in parallel; T007 depends on none; T008 depends on T007; T009 depends on T007
- **Phase 4 (US2)**: Depends on Phase 3 — SDK can only be removed after all usages are replaced
- **Phase 5 (US3)**: Depends on Phase 4 — verify transcription still works after package removal
- **Polish (Phase 6)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Foundational only
- **US2 (P2)**: Requires US1 complete (all SDK usages replaced before removal)
- **US3 (P3)**: Requires US2 complete (verify voice after package removal)

### Parallel Opportunities Within Phases

**Phase 3**: T005 and T006 are parallel (different files). T007, T008, T009 are sequential (T008/T009 depend on T007).

---

## Parallel Example: Phase 3 (US1)

```bash
# These 3 tasks have no dependencies on each other — launch together:
Task T005: "Rewrite src/app/api/onboarding/chat/level/route.ts"
Task T006: "Rewrite src/app/api/onboarding/chat/goals/route.ts"
Task T007: "Create src/hooks/useLLMChat.ts"

# Then sequentially:
Task T008: "Update OnboardingChat.tsx" (depends on T007)
Task T009: "Update useOnboardingChat.ts" (depends on T007)
```

---

## Implementation Strategy

### MVP First (US1 — Working Chat Only)

1. Complete Phase 1: Create `llm.ts` stub
2. Complete Phase 2: Implement streaming + tool-call loop
3. Complete Phase 3: Rewrite routes + hook + component
4. **STOP and VALIDATE**: Verify streaming chat and tool calls work in browser
5. Then remove packages (Phase 4) — only after chat is confirmed working

### Incremental Delivery

1. Phase 1 + 2 → `llm.ts` ready, manually testable
2. Phase 3 → Chat routes and UI working without SDK
3. Phase 4 → Packages removed, clean build
4. Phase 5 → Voice verified
5. Phase 6 → Final validation pass

---

## Notes

- [P] tasks = different files, no shared state dependencies — safe to run in parallel
- Do NOT remove SDK packages (Phase 4) until Phase 3 is confirmed working — removal is irreversible without `pnpm add`
- `src/lib/llm.ts` is the single point of contact with the LLM API — keep it focused; routes should not call `fetch` directly
- `ClientChatMessage` on the client is simpler than server-side `ChatMessage` — no `tool_calls` or `tool_call_id` needed in browser state
- Voice transcription (`transcribe/route.ts`) was already migrated to direct fetch in the previous session — T013/T014 are verification-only tasks

---

## Implementation Status

**Completed**: 16/17 tasks (94%) — T017 (manual e2e test) remains
**Remaining**: All tasks
