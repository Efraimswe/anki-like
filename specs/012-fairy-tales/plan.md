# Plan: FairyTales page — character form + streaming Gemini story generation

## Note on this file's location

This file lives at `/home/skaylet/.claude/plans/ok-then-there-is-zazzy-goblet.md` because plan-mode constraints required it. **Sonnet's first action**: copy this file into the repo at `specs/012-fairy-tales/plan.md` (untracked, do not commit) and work from there. Per the user, no plan content should remain only in the shared global plans dir.

---

## Context

The user wants a small experimental feature on the existing empty `/fairy-tales` page. They:
- Call it "StoryTales" colloquially, but the route is `/fairy-tales` (already created, already in nav).
- Want a form: a Characters section (Add button → name + description fields, up to 15) and a "Tale brief" section based on a simple storytelling framework.
- Want a Generate button that streams an LLM response chunk-by-chunk into the page.
- The LLM is Gemini 2.0 Flash via OpenRouter — **already configured** in `.env`.
- Want this run **locally only**: new branch, **no commits, no pushes**, dev server on a non-3000 port (port 3000 is already in use by another agent).

---

## Onboarding for Sonnet (you have zero context)

**Repo**: `/home/skaylet/dev/anki-like` — Next.js 15 App Router, React 19, TanStack Query v5, Prisma 6, JWT auth via `jose`, TailwindCSS 4 (no shadcn).

**Pages under `src/app/(protected)/**` are auto-protected** by `src/middleware.ts` (verifies `access_token` cookie). API routes use `requireAuth()` from `src/lib/api-utils.ts`.

**Existing LLM helper**: `src/lib/llm.ts` exports `callLLMCompletion(messages)` — non-streaming. It hits `LLM_BASE_URL` (`https://openrouter.ai/api/v1/chat/completions`) with `LLM_API_KEY` and `LLM_MODEL=google/gemini-2.0-flash-001`. OpenRouter is OpenAI-compatible, so streaming = add `stream: true` to the body and parse SSE. Reference usage: `src/app/api/translate/route.ts`.

**Form/UI pattern to copy**: `src/components/onboarding/GoalsForm.tsx`. Tailwind + CSS variables like `bg-(--color-bg-surface)`, `text-(--color-text-primary)`. Vars are defined in `src/app/globals.css`.

**i18n is enforced by tests across 30 locales** but per user instruction we are NOT committing, NOT pushing, NOT running the i18n test suite. **Hardcode English strings directly in JSX** — do not call `useTranslations`. This avoids triggering the i18n parity tests.

**Dev server**: `pnpm dev`. Port 3000 is taken by another agent. Run on **3001**: `PORT=3001 pnpm dev`.

---

## Setup steps (run before coding)

1. **Copy this plan into the repo**:
   ```bash
   mkdir -p specs/012-fairy-tales
   cp /home/skaylet/.claude/plans/ok-then-there-is-zazzy-goblet.md specs/012-fairy-tales/plan.md
   # do NOT git add this file
   ```

2. **Create a new branch off master** (whichever worktree you're in):
   ```bash
   git checkout master
   git pull
   git checkout -b feat/fairy-tales
   ```

3. **Install deps if needed** (probably already installed, but if it's a fresh worktree):
   ```bash
   pnpm install
   ```

4. **Copy `.env`** if you're in a fresh worktree (it's gitignored):
   ```bash
   # if .env is missing, copy from /home/skaylet/dev/anki-like/.env
   ```

5. **Start dev server on 3001**:
   ```bash
   PORT=3001 pnpm dev
   ```

---

## Implementation

### Storytelling framework (chosen)

Use a minimal 4-field "tale brief" — derived from the classic premise/logline structure used in screenwriting (setting → conflict → tone → theme). Keep the labels plain English:

- **Setting** (textarea, where/when the story takes place)
- **Premise / gist** (textarea, 1–3 sentences: what is the story about?)
- **Main conflict** (textarea, what's the central problem)
- **Tone / vibe** (text input, e.g. "whimsical", "dark fairy tale", "adventurous")

Plus the dynamic **Characters** list (each: name + description, max 15).

### Files to create

**1. `src/app/(protected)/fairy-tales/page.tsx`** — replace `return null` with a client component (mark `"use client"` at top). It renders:

- Header: "Fairy Tales" title, short subtitle.
- Characters section:
  - List of character rows, each with `name` (text input) and `description` (textarea), plus a remove (×) button.
  - "Add character" button (disabled when count ≥ 15). Show `n/15` counter.
- Tale brief section: 4 fields (setting, premise, conflict, tone) — see framework above.
- "Generate story" primary button (disabled if 0 characters or premise empty, or while streaming).
- Output area: a scrollable panel that appends streamed chunks as they arrive. Show a placeholder when empty.
- Local state (useState): `characters: {name, description}[]`, `brief: {setting, premise, conflict, tone}`, `output: string`, `isStreaming: boolean`, `error: string | null`.
- An AbortController so the user can cancel a stream (Stop button shown while streaming).

Style: copy the conventions from `src/components/onboarding/GoalsForm.tsx` — same color tokens, rounded corners, button states.

**2. `src/lib/llmStream.ts`** (new) — streaming version of the LLM helper.

Export `streamLLMCompletion(messages: LLMMessage[], signal?: AbortSignal): AsyncIterable<string>`:
- Call OpenRouter `chat/completions` with `stream: true` and `Authorization: Bearer ${process.env.LLM_API_KEY}`.
- Read response body as SSE. For each `data: {...}` line, parse JSON, extract `choices[0].delta.content`, yield it. Stop on `data: [DONE]`.
- Use the existing `LLM_BASE_URL` / `LLM_MODEL` env vars (mirror `src/lib/llm.ts`).
- Reuse the same `LLMMessage` type — re-export from `src/lib/llm.ts` if needed.

**3. `src/app/api/fairy-tales/generate/route.ts`** (new) — POST handler:
- `import { requireAuth } from "@/lib/api-utils"` — call it first.
- Parse and validate body with Zod: `{ characters: { name: string; description: string }[] (1..15), brief: { setting, premise, conflict, tone } (premise required, others optional strings) }`.
- Build a system + user prompt (see "Prompt sketch" below).
- Return `new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } })` where `stream` is a `ReadableStream` that pulls from `streamLLMCompletion` and enqueues raw text chunks.
- Forward `request.signal` so client abort propagates to OpenRouter.
- On error mid-stream, write an error sentinel chunk and close the stream.

**4. Client streaming consumption** in `page.tsx`:
- `fetch("/api/fairy-tales/generate", { method: "POST", body: JSON.stringify(payload), signal: abortController.signal })`.
- Read `response.body!.getReader()`, decode chunks with `TextDecoder`, append to `output` state via `setOutput(prev => prev + chunk)`.
- Handle abort, network errors, and non-2xx status (read `response.text()` for error message).

### Prompt sketch (in API route)

```
System: You are a creative storyteller. Write a complete fairy tale based on the user's brief.
Use the provided characters as the main cast. Match the requested tone. Keep paragraphs short
and readable. End with a clear resolution.

User: 
Setting: {setting or "(unspecified)"}
Premise: {premise}
Main conflict: {conflict or "(unspecified)"}
Tone: {tone or "whimsical"}

Characters:
- {name}: {description}
- {name}: {description}
...

Write the story now.
```

---

## Verification

1. **Type check + build**: `pnpm build` should succeed. (Don't run `pnpm test` — i18n tests will likely fail since this is uncommitted experimental work.)
2. **Manual smoke test in browser** at `http://localhost:3001/fairy-tales`:
   - Sign in if redirected (the page is protected).
   - Add 3 characters, fill premise, click Generate. Confirm tokens stream in (visible word-by-word, not all-at-once).
   - Click Stop mid-stream → output stops growing, button states reset.
   - Try with 0 characters → Generate is disabled.
   - Try adding 15 characters → Add button disables.
   - Submit with empty premise → button stays disabled.
3. **Network inspection** (DevTools → Network → the `/api/fairy-tales/generate` request): response should arrive as a streaming `text/plain` body, not a single JSON blob. Confirm `Transfer-Encoding: chunked` or progressive payload.

---

## Constraints (must follow)

- **DO NOT `git commit`**. **DO NOT `git push`**. Local working-tree only.
- **DO NOT** add new npm dependencies — everything needed is already installed (Zod, fetch, Next.js streaming primitives).
- **DO NOT** call `useTranslations` or touch `messages/*.json`. Hardcode English strings.
- **Run on port 3001** (`PORT=3001 pnpm dev`). Port 3000 is taken.
- Plan file stays in `specs/012-fairy-tales/plan.md` (untracked).

---

## Critical files reference

| Purpose | Path |
|---|---|
| Empty page to fill in | `src/app/(protected)/fairy-tales/page.tsx` |
| Existing non-streaming LLM helper | `src/lib/llm.ts` |
| Existing LLM consumer (non-streaming reference) | `src/app/api/translate/route.ts` |
| Auth helper for API routes | `src/lib/api-utils.ts` (`requireAuth`) |
| JWT verification | `src/lib/auth.ts` (`getAuthUser`) |
| Form styling pattern | `src/components/onboarding/GoalsForm.tsx` |
| Color tokens | `src/app/globals.css` |
| Middleware | `src/middleware.ts` |
| Env file (gitignored, already populated) | `.env` |
