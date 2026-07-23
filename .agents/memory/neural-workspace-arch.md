---
name: Neural Workspace Architecture
description: Key architectural decisions, known issues, and patterns for the Neural Workspace project.
---

# Neural Workspace Architecture

## Stack
- **Frontend**: React + Vite at `/` (`artifacts/neural-workspace`)
- **Backend**: Express 5 at port 8080 (`artifacts/api-server`)
- **DB**: PostgreSQL via Drizzle ORM (`lib/db`)
- **AI**: `@google/genai` with `GEMINI_API_KEY` secret — model `gemini-2.5-flash`
- **Codegen**: Orval generates React Query hooks into `lib/api-client-react` and Zod schemas into `lib/api-zod` from `lib/api-spec/openapi.yaml`

## Lucide-react Icon Gotchas
`MessageSquareTerminal` does NOT exist in the installed version — use `MessageSquare` instead.
`TerminalTerminal` does NOT exist — use `Terminal`.
Always verify new icon names before using them.

## Streaming AI Chat
SSE streaming is NOT in the OpenAPI spec and has no generated hook.
Frontend calls `fetch('/api/conversations/{id}/stream', { method: 'POST', body: JSON.stringify({ content }) })` directly.
Parse `data: {"content":"..."}` for tokens, `data: {"done":true}` for completion.
Invalidate `getListMessagesQueryKey(id)` after stream ends.

## Seeding
Seed data was inserted via HTTP calls to the running API (not via a direct DB script), because the monorepo workspace resolution doesn't work with `npx tsx`.
To re-seed: call the API endpoints directly or add a seed script inside `artifacts/api-server/src/seed.ts` with `pnpm --filter @workspace/api-server tsx src/seed.ts`.

## PromptInputCategory type
Does NOT exist as an export from `@workspace/api-client-react`. Use plain `string` type instead for category state.

**Why:** The generated client only exports response/param types, not enum-like input types from the spec.
