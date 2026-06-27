# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev                    # Start Next.js dev server (apps/web)
npm run build                  # Build Next.js app
npm run lint                   # ESLint via next lint

# Database (requires postgres running)
npm run db:generate            # prisma generate (run after schema changes)
npm run db:migrate             # prisma migrate dev
npm run db:seed                # Seed 4 problems, 14 topics, 2 users
npm run db:studio              # Open Prisma Studio GUI

# Docker (full stack)
docker-compose up --build -d
docker-compose exec web npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
docker-compose exec web npx tsx packages/db/prisma/seed.ts
docker-compose logs -f judge   # Tail judge worker logs
```

Default accounts after seed: `admin / admin123` and `student01 / student123`.

**Local dev without Docker** (run postgres + redis externally, then):
```bash
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
npx tsx packages/db/prisma/seed.ts
npm run dev
```

There are no automated tests in this project.

## Architecture

### Monorepo (npm workspaces)

- **`apps/web/`** — Next.js 14 (App Router) frontend + all API routes
- **`apps/judge/`** — Standalone Node.js process with two BullMQ workers
- **`packages/db/`** — Prisma schema shared between both apps; client outputs to `node_modules/.prisma/client` so both workspaces can `require('@prisma/client')`

### Database schema

Key models and their relations:

- **User** — id, username, email, passwordHash, role (`student`|`admin`)
- **Problem** — slug (unique), title, description, difficulty, timeLimitMs (default 1000), memoryLimitMb (default 256), isPublished
- **Topic** — M2M with Problem via `ProblemTopic` join table
- **TestCase** — belongs to Problem, has `isSample` flag (samples shown to users, full set used for judging)
- **Submission** — belongs to User + Problem; stores code, verdict, runtimeMs, memoryKb, compileError, failedTestInput/Output
- **AiFeedback** — one-to-one with Submission; stores verdict-specific LLM feedback and `feedbackType` (`wa_hint`, `tle_hint`, `ac_review`, `ce_explain`, etc.)
- **ChatMessage** — belongs to User + Problem, optionally linked to a Submission for context

Verdict enum: `pending | AC | WA | TLE | MLE | RE | CE`

### Submission pipeline

```
POST /api/submissions
  → creates Submission(verdict=pending) in DB
  → enqueues { submissionId } onto BullMQ "judge-queue"

judge/worker.js (BullMQ consumer)
  → for each TestCase: runInSandbox() (g++ compile + ulimit-bounded run)
  → publishes progress events to Redis pub/sub channel "submission:{id}"
  → updates DB verdict, then enqueues { submissionId } onto "ai-queue"

judge/llm-worker.js (BullMQ consumer, same process)
  → calls LLM (OpenAI or Anthropic), upserts AiFeedback row
  → publishes { aiFeedbackReady: true } to same Redis channel

GET /api/submissions/[id]/stream
  → SSE route: subscribes to Redis channel, forwards every message to client
  → closes after receiving aiFeedbackReady or on client disconnect
```

The frontend opens an `EventSource` to the stream route immediately after submitting and updates UI reactively from each SSE payload.

### AI mentor features

Three distinct AI surfaces, all reply in Vietnamese and never give full solutions:

1. **Post-judge feedback** (`judge/llm-worker.js`) — Non-streaming; verdict-specific prompts (WA hints logic errors, TLE suggests complexity improvements, CE explains compile errors, AC reviews code style). Stored as `AiFeedback`.
2. **Chat** (`POST /api/chat`) — Streaming; system prompt includes problem description, current code, and submission context (verdict + failed test). Saves both user and assistant messages to `ChatMessage`.
3. **Walkthrough** (`POST /api/chat/walkthrough`) — Streaming; explains a selected code segment in context of the problem and identifies potential issues.

System prompts are in `apps/web/lib/prompts.ts`.

### Frontend pages

- `/` — Landing page
- `/problems` — Filterable problem list (difficulty, topics, search)
- `/problems/[slug]` — Solve workspace: Monaco editor + problem description + AI panel (off-canvas on mobile)
- `/submissions` — User's submission history
- `/submissions/[id]` — Submission detail with code diff, verdict, AI feedback
- `/admin/problems` — Problem CRUD (admin only)
- `/admin/users` — User role management (admin only)

Key components in `apps/web/components/`:
- `SolveWorkspace.tsx` — Orchestrates the three-panel solve UI
- `AiPanel.tsx` — Renders AI feedback, walkthrough, and chat
- `ProblemPanel.tsx` — Problem description + sample test cases
- `TestCaseEditor.tsx` — Admin interface for managing test cases

### Auth

NextAuth v4 with Credentials provider + JWT strategy. **No PrismaAdapter** — the DB has no `Account`, `Session`, or `VerificationToken` tables. Session data (id, username, role) is embedded in the JWT cookie via `jwt`/`session` callbacks in `apps/web/lib/auth.ts`.

Route protection is in `apps/web/middleware.ts`: all `/problems`, `/submissions`, and `/admin` paths require a valid token; `/admin` additionally requires `token.role === 'admin'`.

### LLM adapter

`apps/web/lib/llm.ts` exports `streamLLMResponse(systemPrompt, messages)` which returns a `ReadableStream` of SSE-encoded tokens. Provider is selected at runtime via `LLM_PROVIDER` env var (`openai` or `anthropic`). If `LLM_API_KEY` is absent the stream returns a single error message — it never throws. Chat and walkthrough API routes pipe this stream directly to the response.

`apps/judge/llm-worker.js` uses a separate non-streaming call with the same provider logic for post-judge AI feedback.

### Judge sandbox (`apps/judge/sandbox.js`)

- Writes source to `/tmp/judge/<uuid>/solution.cpp`, compiles with `g++ -O2 -std=c++17`
- Runs binary via `bash -c "ulimit -v <memKb>; ulimit -t <timeSec>; ./solution < input.txt"`
- Exit code 137 → MLE, non-zero → RE, SIGKILL / elapsed ≥ limit → TLE
- Output comparison normalises `\r\n` and trailing whitespace
- Directory is always deleted in the `finally` block

### Key env vars

| Var | Used in |
|-----|---------|
| `DATABASE_URL` | web + judge |
| `REDIS_URL` | web + judge |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | web only |
| `LLM_PROVIDER` | web + judge (`openai` or `anthropic`) |
| `LLM_API_KEY` | web + judge (omit to disable AI) |
| `LLM_MODEL` | web + judge (e.g. `gpt-4o-mini`, `claude-haiku-4-5-20251001`) |
| `LLM_BASE_URL` | web + judge (optional custom endpoint) |

### API conventions

- All request/response bodies use **camelCase**
- Admin endpoints return 403 if `session.user.role !== 'admin'`
- All route handlers are wrapped in try/catch and return `NextResponse.json({ error }, { status })`
- SSE routes set `Content-Type: text/event-stream`, `Cache-Control: no-cache`

### CSS / Design system

Global styles are in `apps/web/app/globals.css` (extracted from `terminal-dark/` HTML prototypes). Use existing utility classes rather than writing new CSS:

```
.solve-shell  .compact-topbar  .table-card  .page-head
.badge.ac / .badge.wa / .badge.tle / .badge.mle / .badge.ce / .badge.re / .badge.pending
.primary-btn  .secondary-btn  .ghost-btn  .icon-btn
.panel  .panel-head  .metric-grid
```

Design tokens: `--bg: #0f1117`, `--accent: #6c63ff`, `--accent-2: #00d2a0`, `--danger: #ff5c6c`, `--font-display: 'JetBrains Mono'`.

Responsive breakpoint for the solve workspace: `@media (max-width: 980px)` — AI panel becomes off-canvas.
