# Quickstart: Custom LLM Tool-Calling Engine (009)

## Prerequisites

- Node.js 20+, pnpm
- `LLM_API_KEY` set in `.env` (already present from previous sessions)

## 1. No new dependencies

This feature removes packages — no `pnpm add` needed.

## 2. After migration — remove SDK packages

```bash
pnpm remove ai @ai-sdk/react @ai-sdk/google @ai-sdk/openai
```

## 3. Start the dev server

```bash
pnpm dev
```

## 4. Test the chat flow

1. Register a new account → redirected to `/onboarding/step-1`
2. Select a language → step 2
3. Chat in English — verify responses stream in word-by-word
4. After 8+ messages, verify `englishLevel` is set in DB:
   ```bash
   pnpm prisma studio
   # or
   pnpm exec prisma db execute --stdin <<< "SELECT english_level FROM users WHERE email='your@email.com';"
   ```
5. Advance to step 3 → chat about goals → verify `goals` JSON saved in DB
6. Step 4 → "Let's go" → dashboard

## 5. Verify no SDK imports remain

```bash
grep -r "@ai-sdk\|from 'ai'" src/
# Should return no results
```

## Key files changed

| File | Change |
|------|--------|
| `src/lib/llm.ts` | New — LLM client, streaming, tool-call loop |
| `src/hooks/useLLMChat.ts` | New — replaces `useChat` from `@ai-sdk/react` |
| `src/app/api/onboarding/chat/level/route.ts` | Rewritten — direct fetch |
| `src/app/api/onboarding/chat/goals/route.ts` | Rewritten — direct fetch |
| `src/components/onboarding/OnboardingChat.tsx` | Updated — uses `useLLMChat` |
| `src/hooks/useOnboardingChat.ts` | Updated — uses `useLLMChat` |
| `package.json` | SDK packages removed |
