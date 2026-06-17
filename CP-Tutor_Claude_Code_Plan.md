# CP-Tutor — Build Plan for Claude Code (v2)

> **Cách dùng:**  
> Đây là prompt đưa thẳng cho **Claude Code** để build toàn bộ dự án.  
> Claude Code đọc tài liệu này và implement theo đúng thứ tự 13 steps.  
> Đặt 2 file sau vào cùng thư mục trước khi bắt đầu:
> - `CP-Tutor_Project_Document.docx` — tài liệu dự án đầy đủ
> - Folder `terminal-dark/` chứa 10 file HTML thiết kế — nguồn CSS chính thức

---

## Ngữ cảnh dự án

CP-Tutor là **Online Judge tích hợp AI Mentor** để học sinh tự học C++ Competitive Programming.  
Stack: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + PostgreSQL + Prisma + BullMQ + Redis + Docker**.  
Mục tiêu: **chạy hoàn chỉnh trên local bằng `docker-compose up --build`**, sau đó `docker-compose exec web npx prisma migrate deploy && npx prisma db seed`.

---

## Design tokens (trích từ file thiết kế)

```css
--bg: #0f1117;        --bg-soft: #121622;   --surface: #1a1d27;
--surface-2: #21263a; --fg: #e8eaf0;        --muted: #8b92a8;
--faint: #555b70;     --border: #2e3348;    --accent: #6c63ff;
--accent-2: #00d2a0;  --danger: #ff5c6c;    --warning: #ffb340;
--radius-sm: 4px;     --radius-md: 8px;     --radius-lg: 12px;
--font-display: 'JetBrains Mono', monospace;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

Class names tái sử dụng từ HTML thiết kế (giữ nguyên trong globals.css):  
`.app-shell` `.topbar` `.compact-topbar` `.nav-links` `.nav-user` `.avatar`  
`.solve-shell` `.solve-col` `.solve-col.ai` `.editor-head` `.ai-input`  
`.table-card` `.page-head` `.wide-main` `.main` `.split-2` `.admin-grid`  
`.badge.ac/wa/tle/mle/ce/re/pending` `.pill` `.tag` `.chip-row`  
`.primary-btn` `.secondary-btn` `.ghost-btn` `.icon-btn` `.search`  
`.mono` `.muted` `.metric-grid` `.code-block` `.snippet`

> **Quy tắc UI:** Extract toàn bộ CSS từ thẻ `<style>` của các file HTML trong `terminal-dark/` vào `globals.css`. Tất cả 10 file dùng chung 1 style block giống hệt nhau — chỉ cần extract 1 lần từ file bất kỳ. **Không tự viết lại CSS. Không copy JS demo từ HTML vào production.**

---

## Cấu trúc thư mục mục tiêu

```
cp-tutor/
├── apps/
│   ├── web/                            # Next.js 14
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── layout.tsx          # layout không Navbar
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── problems/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── submissions/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx          # guard: role=admin
│   │   │   │   ├── problems/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [slug]/edit/page.tsx
│   │   │   │   └── users/page.tsx
│   │   │   ├── api/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── [...nextauth]/route.ts
│   │   │   │   │   └── register/route.ts
│   │   │   │   ├── problems/
│   │   │   │   │   ├── route.ts        # GET list, POST create
│   │   │   │   │   └── [slug]/
│   │   │   │   │       ├── route.ts    # GET detail, PATCH, DELETE
│   │   │   │   │       └── testcases/route.ts
│   │   │   │   ├── submissions/
│   │   │   │   │   ├── route.ts        # GET list, POST submit
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── route.ts    # GET detail
│   │   │   │   │       └── stream/route.ts  # GET SSE stream
│   │   │   │   ├── chat/route.ts       # POST streaming SSE
│   │   │   │   ├── walkthrough/route.ts # POST streaming SSE
│   │   │   │   └── admin/
│   │   │   │       └── users/
│   │   │   │           ├── route.ts    # GET list
│   │   │   │           └── [id]/role/route.ts  # PATCH role
│   │   │   ├── not-found.tsx
│   │   │   ├── error.tsx
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Navbar.tsx
│   │   │   ├── ui/
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── Toast.tsx
│   │   │   ├── problems/
│   │   │   │   └── ProblemTable.tsx
│   │   │   ├── solve/
│   │   │   │   ├── ProblemPanel.tsx
│   │   │   │   ├── Editor.tsx
│   │   │   │   ├── AiPanel.tsx
│   │   │   │   └── StatusBar.tsx
│   │   │   └── admin/
│   │   │       └── TestCaseEditor.tsx
│   │   ├── lib/
│   │   │   ├── auth.ts       # NextAuth config (Credentials-only)
│   │   │   ├── prisma.ts     # Prisma client singleton
│   │   │   ├── queue.ts      # BullMQ producer
│   │   │   ├── llm.ts        # LLM Adapter
│   │   │   └── prompts.ts    # Prompt templates
│   │   ├── types/index.ts
│   │   ├── middleware.ts
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── Dockerfile
│   │   └── package.json
│   └── judge/
│       ├── worker.js
│       ├── sandbox.js
│       ├── llm-worker.js
│       ├── Dockerfile
│       └── package.json
├── packages/
│   └── db/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       └── package.json
├── docker-compose.yml
├── .env.example
├── .env                        # gitignored
├── README.md
└── package.json                # root workspace
```

---

## Database Schema (Prisma — implement chính xác)

File: `packages/db/prisma/schema.prisma`

```prisma
generator client {
  provider      = "prisma-client-js"
  output        = "../../../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  student
  admin
}

enum Difficulty {
  easy
  medium
  hard
}

enum Verdict {
  pending
  AC
  WA
  TLE
  MLE
  RE
  CE
}

enum FeedbackType {
  wa_hint
  tle_hint
  ac_review
  ce_explain
}

enum MessageRole {
  user
  assistant
}

// ─── Auth: Credentials-only, KHÔNG dùng PrismaAdapter ───────────────────────
// Không cần Account, Session, VerificationToken models.
// NextAuth dùng JWT strategy thuần — session lưu trong cookie.

model User {
  id           String   @id @default(uuid())
  username     String   @unique @db.VarChar(50)
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash")
  role         Role     @default(student)
  createdAt    DateTime @default(now()) @map("created_at")

  submissions     Submission[]
  chatMessages    ChatMessage[]
  createdProblems Problem[]    @relation("CreatedBy")

  @@map("users")
}

model Problem {
  id            String     @id @default(uuid())
  title         String     @db.VarChar(200)
  slug          String     @unique @db.VarChar(200)
  description   String
  difficulty    Difficulty
  timeLimitMs   Int        @default(1000) @map("time_limit_ms")
  memoryLimitMb Int        @default(256)  @map("memory_limit_mb")
  isPublished   Boolean    @default(false) @map("is_published")
  createdById   String     @map("created_by")
  createdAt     DateTime   @default(now()) @map("created_at")

  createdBy  User           @relation("CreatedBy", fields: [createdById], references: [id])
  testCases  TestCase[]
  submissions Submission[]
  topics     ProblemTopic[]
  chatMessages ChatMessage[]

  @@map("problems")
}

model Topic {
  id       String         @id @default(uuid())
  name     String         @unique @db.VarChar(100)
  slug     String         @unique @db.VarChar(100)
  problems ProblemTopic[]

  @@map("topics")
}

model ProblemTopic {
  problemId String  @map("problem_id")
  topicId   String  @map("topic_id")
  problem   Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  topic     Topic   @relation(fields: [topicId], references: [id])

  @@id([problemId, topicId])
  @@map("problem_topics")
}

model TestCase {
  id             String  @id @default(uuid())
  problemId      String  @map("problem_id")
  input          String
  expectedOutput String  @map("expected_output")
  isSample       Boolean @default(false) @map("is_sample")
  orderIndex     Int     @default(0)     @map("order_index")

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@map("test_cases")
}

model Submission {
  id               String   @id @default(uuid())
  userId           String   @map("user_id")
  problemId        String   @map("problem_id")
  code             String
  language         String   @default("cpp17") @db.VarChar(20)
  verdict          Verdict  @default(pending)
  runtimeMs        Int?     @map("runtime_ms")
  memoryKb         Int?     @map("memory_kb")
  compileError     String?  @map("compile_error")
  failedTestInput  String?  @map("failed_test_input")
  failedTestOutput String?  @map("failed_test_output")
  submittedAt      DateTime @default(now()) @map("submitted_at")

  user         User         @relation(fields: [userId],     references: [id])
  problem      Problem      @relation(fields: [problemId],  references: [id])
  aiFeedback   AiFeedback?
  chatMessages ChatMessage[]

  @@map("submissions")
}

model AiFeedback {
  id           String       @id @default(uuid())
  submissionId String       @unique @map("submission_id")
  feedbackType FeedbackType @map("feedback_type")
  content      String
  llmProvider  String       @map("llm_provider") @db.VarChar(50)
  createdAt    DateTime     @default(now()) @map("created_at")

  submission Submission @relation(fields: [submissionId], references: [id])

  @@map("ai_feedbacks")
}

model ChatMessage {
  id           String      @id @default(uuid())
  userId       String      @map("user_id")
  problemId    String      @map("problem_id")
  submissionId String?     @map("submission_id")
  role         MessageRole
  content      String
  createdAt    DateTime    @default(now()) @map("created_at")

  user       User        @relation(fields: [userId],       references: [id])
  problem    Problem     @relation(fields: [problemId],    references: [id])
  submission Submission? @relation(fields: [submissionId], references: [id])

  @@map("chat_messages")
}
```

---

## Docker Compose (4 services — đúng số lượng thực tế)

File: `docker-compose.yml`

```yaml
version: "3.9"
services:

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: cptutor
      POSTGRES_USER: cptutor
      POSTGRES_PASSWORD: cptutor_dev
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cptutor"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      retries: 10

  judge:
    build: ./apps/judge
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }
    environment:
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgresql://cptutor:cptutor_dev@postgres:5432/cptutor
    # Không mount docker.sock — judge dùng child_process trực tiếp trong container

  web:
    build: ./apps/web
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://cptutor:cptutor_dev@postgres:5432/cptutor
      REDIS_URL: redis://redis:6379
      NEXTAUTH_SECRET: dev_secret_change_in_prod
      NEXTAUTH_URL: http://localhost:3000
      LLM_PROVIDER: ${LLM_PROVIDER:-openai}
      LLM_API_KEY: ${LLM_API_KEY:-}
      LLM_MODEL: ${LLM_MODEL:-gpt-4o-mini}
      LLM_BASE_URL: ${LLM_BASE_URL:-}

volumes:
  postgres_data:
```

---

## Dockerfiles

**`apps/web/Dockerfile`:**
```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma
RUN npm run build --workspace=apps/web

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY apps/web/package.json ./apps/web/
COPY package.json ./
CMD ["npm", "run", "start", "--workspace=apps/web"]
```

**`apps/judge/Dockerfile`:**
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache g++ make linux-headers coreutils
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npx prisma generate --schema=../../packages/db/prisma/schema.prisma || true
CMD ["node", "worker.js"]
```

---

## Root package.json

```json
{
  "name": "cp-tutor",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "npm run dev --workspace=apps/web",
    "build": "npm run build --workspace=apps/web",
    "db:generate": "prisma generate --schema=packages/db/prisma/schema.prisma",
    "db:migrate": "prisma migrate dev --schema=packages/db/prisma/schema.prisma",
    "db:seed": "tsx packages/db/prisma/seed.ts",
    "db:studio": "prisma studio --schema=packages/db/prisma/schema.prisma"
  }
}
```

---

## Env File

`.env.example`:
```bash
# Database
DATABASE_URL=postgresql://cptutor:cptutor_dev@localhost:5432/cptutor

# Redis
REDIS_URL=redis://localhost:6379

# NextAuth — Credentials-only (không cần OAuth)
NEXTAUTH_SECRET=dev_secret_change_in_prod_min_32_chars
NEXTAUTH_URL=http://localhost:3000

# LLM Adapter — chọn 1 provider, điền key tương ứng
# Nếu để trống LLM_API_KEY, AI feedback sẽ bị skip (hệ thống vẫn chạy bình thường)
LLM_PROVIDER=openai               # openai | anthropic
LLM_API_KEY=                      # sk-... hoặc sk-ant-...
LLM_MODEL=gpt-4o-mini             # hoặc claude-haiku-4-5-20251001
LLM_BASE_URL=                     # optional: custom endpoint
```

---

## Dependencies đầy đủ

**`apps/web/package.json`:**
```json
{
  "name": "@cp-tutor/web",
  "dependencies": {
    "next": "14.2.29",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next-auth": "^4.24.11",
    "bcryptjs": "^2.4.3",
    "@prisma/client": "^5.22.0",
    "bullmq": "^5.30.1",
    "ioredis": "^5.4.2",
    "@monaco-editor/react": "^4.7.0",
    "react-markdown": "^9.0.1",
    "rehype-highlight": "^7.0.1",
    "highlight.js": "^11.11.1",
    "date-fns": "^4.1.0",
    "openai": "^4.85.4",
    "@anthropic-ai/sdk": "^0.39.0",
    "jszip": "^3.10.1"
  },
  "devDependencies": {
    "typescript": "^5.7.3",
    "@types/node": "^22.13.10",
    "@types/react": "^18.3.18",
    "@types/bcryptjs": "^2.4.6",
    "prisma": "^5.22.0",
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.3",
    "tsx": "^4.19.2"
  }
}
```

**`apps/judge/package.json`:**
```json
{
  "name": "@cp-tutor/judge",
  "dependencies": {
    "bullmq": "^5.30.1",
    "ioredis": "^5.4.2",
    "@prisma/client": "^5.22.0",
    "uuid": "^11.1.0",
    "openai": "^4.85.4",
    "@anthropic-ai/sdk": "^0.39.0"
  },
  "devDependencies": {
    "prisma": "^5.22.0"
  }
}
```

**`packages/db/package.json`:**
```json
{
  "name": "@cp-tutor/db",
  "devDependencies": {
    "prisma": "^5.22.0",
    "tsx": "^4.19.2",
    "@types/bcryptjs": "^2.4.6",
    "bcryptjs": "^2.4.3",
    "@prisma/client": "^5.22.0"
  }
}
```

---

## Realtime: Server-Sent Events (SSE) — cơ chế duy nhất

> **Quyết định kiến trúc:** Dùng **SSE** (Server-Sent Events) cho tất cả realtime — không dùng WebSocket. Next.js App Router hỗ trợ SSE tốt qua `ReadableStream`. Không gọi là "WebSocket" ở bất kỳ đâu trong code.

**Cơ chế hoạt động:**

```
Judge worker xử lý xong
  → UPDATE submissions SET verdict=... trong DB
  → PUBLISH tới Redis channel "submission:{id}"

Frontend mở GET /api/submissions/{id}/stream (SSE)
  → Route handler SUBSCRIBE Redis channel "submission:{id}"
  → Khi nhận message → gửi SSE event tới client
  → Client nhận event → update UI verdict + AI feedback
  → Đóng SSE sau khi verdict không phải "pending"
```

**`app/api/submissions/[id]/stream/route.ts`:**
```typescript
import { Redis } from 'ioredis'
export async function GET(req, { params }) {
  const redis = new Redis(process.env.REDIS_URL)
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      await redis.subscribe(`submission:${params.id}`)
      redis.on('message', (channel, message) => {
        const payload = JSON.parse(message)
        send(payload)
        if (payload.verdict !== 'pending') {
          redis.unsubscribe()
          redis.quit()
          controller.close()
        }
      })

      // Cleanup nếu client disconnect
      req.signal.addEventListener('abort', () => {
        redis.unsubscribe()
        redis.quit()
        controller.close()
      })
    }
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
```

**Judge worker publish:**
```javascript
// Sau khi update DB
await redisPublisher.publish(`submission:${submissionId}`, JSON.stringify({
  verdict, runtimeMs, memoryKb, compileError: compileError || null
}))
// Sau khi AI feedback xong
await redisPublisher.publish(`submission:${submissionId}`, JSON.stringify({
  aiFeedbackReady: true, feedbackType
}))
```

**Frontend client:**
```typescript
// Trong StatusBar hoặc AiPanel
const es = new EventSource(`/api/submissions/${submissionId}/stream`)
es.onmessage = (e) => {
  const data = JSON.parse(e.data)
  if (data.verdict) setVerdict(data.verdict)
  if (data.aiFeedbackReady) refetchFeedback()
  if (data.verdict && data.verdict !== 'pending') es.close()
}
es.onerror = () => es.close()
```

---

## Auth: Credentials-only (không PrismaAdapter)

> **Quyết định kiến trúc:** Dùng NextAuth Credentials provider + JWT strategy thuần. **Không dùng `@auth/prisma-adapter`** — adapter yêu cầu thêm models Account/Session/VerificationToken vào schema mà không cần thiết cho use case này.

**`apps/web/lib/auth.ts`:**
```typescript
import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Username hoặc Email', type: 'text' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: credentials.identifier },
              { email: credentials.identifier },
            ],
          },
        })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null
        return { id: user.id, name: user.username, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.username = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.username = token.username as string
      }
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
}
```

**`apps/web/types/index.ts`** — extend NextAuth types:
```typescript
import 'next-auth'
declare module 'next-auth' {
  interface Session {
    user: { id: string; username: string; email: string; role: string }
  }
}
declare module 'next-auth/jwt' {
  interface JWT { id: string; role: string; username: string }
}
```

---

## Judge Sandbox — spec đầy đủ

**`apps/judge/sandbox.js`:**

```javascript
const { execFile, spawn } = require('child_process')
const { writeFileSync, mkdirSync, rmSync } = require('fs')
const { join } = require('path')
const { v4: uuidv4 } = require('uuid')

/**
 * @param {object} params
 * @param {string} params.code          - C++ source code
 * @param {string} params.input         - stdin input (có thể nhiều dòng)
 * @param {string} params.expectedOutput - expected stdout (dùng để so sánh)
 * @param {number} params.timeLimitMs   - giới hạn thời gian (ms)
 * @param {number} params.memoryLimitMb - giới hạn bộ nhớ (MB)
 * @returns {Promise<{verdict, runtimeMs, memoryKb, actualOutput, compileError}>}
 */
async function runInSandbox({ code, input, expectedOutput, timeLimitMs, memoryLimitMb }) {
  const dir = join('/tmp', 'judge', uuidv4())
  mkdirSync(dir, { recursive: true })
  const srcPath = join(dir, 'solution.cpp')
  const binPath = join(dir, 'solution')
  const inputPath = join(dir, 'input.txt')

  try {
    writeFileSync(srcPath, code)
    writeFileSync(inputPath, input)

    // 1. Compile
    const compileResult = await new Promise((resolve) => {
      execFile('g++', ['-O2', '-std=c++17', '-o', binPath, srcPath],
        { timeout: 10000 },
        (err, stdout, stderr) => resolve({ err, stderr })
      )
    })
    if (compileResult.err) {
      return { verdict: 'CE', compileError: compileResult.stderr, runtimeMs: null, memoryKb: null, actualOutput: null }
    }

    // 2. Run với stdin từ file, giới hạn time + memory
    const timeLimitSec = Math.ceil(timeLimitMs / 1000)
    const memLimitKb = memoryLimitMb * 1024

    const runResult = await new Promise((resolve) => {
      const startTime = Date.now()
      // Dùng bash wrapper để set ulimit memory
      const child = spawn('bash', [
        '-c',
        `ulimit -v ${memLimitKb}; ulimit -t ${timeLimitSec}; "${binPath}" < "${inputPath}"`
      ], { timeout: timeLimitMs + 1000 })

      let stdout = '', stderr = ''
      child.stdout.on('data', (d) => { stdout += d; if (stdout.length > 1_000_000) child.kill('SIGKILL') })
      child.stderr.on('data', (d) => { stderr += d })

      child.on('close', (code, signal) => {
        const runtimeMs = Date.now() - startTime
        if (signal === 'SIGKILL' || runtimeMs >= timeLimitMs) {
          resolve({ verdict: 'TLE', runtimeMs, memoryKb: null, actualOutput: stdout })
        } else if (code !== 0) {
          // Phân biệt MLE (exit 137 do ulimit) vs RE
          const verdict = code === 137 ? 'MLE' : 'RE'
          resolve({ verdict, runtimeMs, memoryKb: null, actualOutput: stdout })
        } else {
          resolve({ verdict: null, runtimeMs, memoryKb: null, actualOutput: stdout.trimEnd() })
        }
      })

      child.on('error', (err) => resolve({ verdict: 'RE', runtimeMs: 0, memoryKb: null, actualOutput: '' }))
    })

    if (runResult.verdict) return runResult

    // 3. So sánh output
    const normalize = (s) => s.replace(/\r\n/g, '\n').trimEnd()
    const verdict = normalize(runResult.actualOutput) === normalize(expectedOutput) ? 'AC' : 'WA'
    return { verdict, runtimeMs: runResult.runtimeMs, memoryKb: runResult.memoryKb, actualOutput: runResult.actualOutput }

  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

module.exports = { runInSandbox }
```

**`apps/judge/worker.js`:**

```javascript
const { Worker } = require('bullmq')
const { Redis } = require('ioredis')
const { PrismaClient } = require('@prisma/client')
const { runInSandbox } = require('./sandbox')

const prisma = new PrismaClient()
const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
const redisPublisher = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })

const judgeWorker = new Worker('judge-queue', async (job) => {
  const { submissionId } = job.data
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { problem: { include: { testCases: { orderBy: { orderIndex: 'asc' } } } } }
  })
  if (!submission) return

  const { problem } = submission
  let finalVerdict = 'AC'
  let finalRuntimeMs = 0, finalMemoryKb = 0
  let failedTestInput = null, failedTestOutput = null, compileError = null

  for (const tc of problem.testCases) {
    const result = await runInSandbox({
      code: submission.code,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      timeLimitMs: problem.timeLimitMs,
      memoryLimitMb: problem.memoryLimitMb,
    })

    if (result.verdict === 'CE') {
      finalVerdict = 'CE'
      compileError = result.compileError
      break
    }
    finalRuntimeMs = Math.max(finalRuntimeMs, result.runtimeMs || 0)

    if (result.verdict !== 'AC') {
      finalVerdict = result.verdict  // WA | TLE | MLE | RE
      failedTestInput = tc.isSample ? tc.input : '(hidden)'
      failedTestOutput = result.actualOutput
      break
    }
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      verdict: finalVerdict,
      runtimeMs: finalRuntimeMs || null,
      memoryKb: finalMemoryKb || null,
      compileError,
      failedTestInput,
      failedTestOutput,
    }
  })

  // Notify frontend qua Redis pub/sub
  await redisPublisher.publish(`submission:${submissionId}`, JSON.stringify({
    verdict: finalVerdict, runtimeMs: finalRuntimeMs, memoryKb: finalMemoryKb
  }))

  // Đẩy job AI (nếu có LLM config)
  if (process.env.LLM_API_KEY) {
    const { Queue } = require('bullmq')
    const aiQueue = new Queue('ai-queue', { connection: redis })
    await aiQueue.add('analyze', {
      submissionId,
      verdict: finalVerdict,
      code: submission.code,
      problemDescription: problem.description,
      timeLimitMs: problem.timeLimitMs,
      failedTestInput,
      failedTestOutput,
      compileError,
    })
  }
}, { connection: redis })

judgeWorker.on('failed', (job, err) => console.error('Judge job failed:', job?.id, err))
console.log('Judge worker started')
```

**`apps/judge/llm-worker.js`:**

```javascript
const { Worker, Queue } = require('bullmq')
const { Redis } = require('ioredis')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
const redisPublisher = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })

// Khởi tạo LLM client theo provider
function createLLMClient() {
  const provider = process.env.LLM_PROVIDER || 'openai'
  if (provider === 'anthropic') {
    const Anthropic = require('@anthropic-ai/sdk')
    return { provider: 'anthropic', client: new Anthropic.Anthropic({ apiKey: process.env.LLM_API_KEY }) }
  }
  const OpenAI = require('openai')
  return { provider: 'openai', client: new OpenAI.OpenAI({
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL || undefined,
  })}
}

async function callLLM(systemPrompt, userMessage) {
  const { provider, client } = createLLMClient()
  const model = process.env.LLM_MODEL || 'gpt-4o-mini'
  if (provider === 'anthropic') {
    const res = await client.messages.create({
      model, max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
    return res.content[0].text
  }
  const res = await client.chat.completions.create({
    model, max_tokens: 1024,
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }]
  })
  return res.choices[0].message.content
}

function buildPrompt(data) {
  const base = `Bạn là AI Mentor cho học sinh học C++ Competitive Programming. Trả lời bằng tiếng Việt, format Markdown.`
  switch (data.verdict) {
    case 'WA': return {
      system: base + ' Với Wrong Answer: chỉ ra logic sai, KHÔNG đưa lời giải hoàn chỉnh.',
      user: `Bài: ${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\`\n\nInput bị sai:\n${data.failedTestInput}\nOutput của code:\n${data.failedTestOutput}`
    }
    case 'TLE': return {
      system: base + ' Với TLE: chỉ ra đoạn code gây chậm, gợi ý cải thiện độ phức tạp, KHÔNG đưa lời giải.',
      user: `Bài: ${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\`\n\nTime limit: ${data.timeLimitMs}ms`
    }
    case 'MLE': return {
      system: base + ' Với MLE: chỉ ra chỗ dùng nhiều bộ nhớ, gợi ý tối ưu.',
      user: `Bài: ${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\``
    }
    case 'RE': return {
      system: base + ' Với Runtime Error: phân tích nguyên nhân (out-of-bound, null ptr, overflow...).',
      user: `Bài: ${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\``
    }
    case 'CE': return {
      system: base + ' Với Compile Error: giải thích lỗi compile rõ ràng cho học sinh.',
      user: `Code:\n\`\`\`cpp\n${data.code}\n\`\`\`\n\nLỗi compile:\n${data.compileError}`
    }
    case 'AC': return {
      system: base + ' Với Accepted: review code style C++, gợi ý cải thiện readability và efficiency.',
      user: `Bài: ${data.problemDescription}\n\nCode:\n\`\`\`cpp\n${data.code}\n\`\`\``
    }
    default: return null
  }
}

const feedbackTypeMap = {
  WA: 'wa_hint', TLE: 'tle_hint', MLE: 'tle_hint',
  RE: 'wa_hint', CE: 'ce_explain', AC: 'ac_review'
}

const aiWorker = new Worker('ai-queue', async (job) => {
  const data = job.data
  const prompt = buildPrompt(data)
  if (!prompt) return

  try {
    const content = await callLLM(prompt.system, prompt.user)
    await prisma.aiFeedback.upsert({
      where: { submissionId: data.submissionId },
      create: {
        submissionId: data.submissionId,
        feedbackType: feedbackTypeMap[data.verdict] || 'wa_hint',
        content,
        llmProvider: process.env.LLM_PROVIDER || 'openai',
      },
      update: { content }
    })
    await redisPublisher.publish(`submission:${data.submissionId}`, JSON.stringify({
      aiFeedbackReady: true, feedbackType: feedbackTypeMap[data.verdict]
    }))
  } catch (err) {
    console.error('AI feedback failed:', err.message)
    // Không crash worker — AI là optional
  }
}, { connection: redis })

// Chỉ start nếu có LLM key
if (process.env.LLM_API_KEY) {
  console.log('AI feedback worker started')
} else {
  console.log('LLM_API_KEY not set — AI feedback worker skipped')
}
```

---

## Seed Data đầy đủ (14 topics, đúng slug)

File: `packages/db/prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cptutor.dev' },
    update: {},
    create: { username: 'admin', email: 'admin@cptutor.dev',
      passwordHash: await bcrypt.hash('admin123', 12), role: 'admin' }
  })
  const student = await prisma.user.upsert({
    where: { email: 'student01@cptutor.dev' },
    update: {},
    create: { username: 'student01', email: 'student01@cptutor.dev',
      passwordHash: await bcrypt.hash('student123', 12), role: 'student' }
  })

  // 14 Topics (bao gồm cả Array và Hash Map dùng cho bài Two Sum)
  const topicData = [
    { name: 'Array',                slug: 'array' },
    { name: 'Hash Map',             slug: 'hash-map' },
    { name: 'Brute Force',          slug: 'brute-force' },
    { name: 'Sorting',              slug: 'sorting' },
    { name: 'Binary Search',        slug: 'binary-search' },
    { name: 'Two Pointers',         slug: 'two-pointers' },
    { name: 'Prefix Sum',           slug: 'prefix-sum' },
    { name: 'Stack & Queue',        slug: 'stack-queue' },
    { name: 'Backtracking',         slug: 'backtracking' },
    { name: 'Greedy',               slug: 'greedy' },
    { name: 'Dynamic Programming',  slug: 'dp' },
    { name: 'Graph',                slug: 'graph' },
    { name: 'Math',                 slug: 'math' },
    { name: 'String',               slug: 'string' },
  ]
  const topics: Record<string, { id: string }> = {}
  for (const t of topicData) {
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug }, update: {}, create: t
    })
    topics[t.slug] = topic
  }

  // Bài 1: Two Sum — easy
  // Test case 3: input lớn để tạo TLE với brute-force O(n²)
  const twoSum = await prisma.problem.upsert({
    where: { slug: 'two-sum' }, update: {}, create: {
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'easy',
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      isPublished: true,
      createdById: admin.id,
      description: `## Mô tả
Cho mảng số nguyên \`a\` gồm \`n\` phần tử và số nguyên \`target\`.  
Tìm **hai chỉ số** \`i\`, \`j\` (i < j) sao cho \`a[i] + a[j] = target\`.  
Đảm bảo luôn tồn tại đúng một cặp đáp án.

## Input
- Dòng 1: hai số nguyên \`n\` và \`target\` (2 ≤ n ≤ 200000, -10⁹ ≤ target ≤ 10⁹)
- Dòng 2: \`n\` số nguyên \`a[i]\` (-10⁹ ≤ a[i] ≤ 10⁹)

## Output
Hai chỉ số \`i j\` (0-indexed), cách nhau dấu cách.

## Ràng buộc
\`\`\`
2 ≤ n ≤ 200000
-10⁹ ≤ a[i], target ≤ 10⁹
\`\`\``,
    }
  })
  await prisma.problemTopic.createMany({
    data: [
      { problemId: twoSum.id, topicId: topics['array'].id },
      { problemId: twoSum.id, topicId: topics['hash-map'].id },
    ],
    skipDuplicates: true
  })
  // Tạo test cases riêng để có thể kiểm tra từng verdict:
  const twoSumTests = [
    // Test 1 (sample): AC với hash map, WA với code sai
    { input: '4 9\n2 7 11 15', expectedOutput: '0 1', isSample: true, orderIndex: 0 },
    // Test 2: AC với hash map  
    { input: '3 6\n3 2 4',     expectedOutput: '1 2', isSample: false, orderIndex: 1 },
    // Test 3: n=200000 → TLE với O(n²), AC với O(n) hash map
    { input: (() => {
        const n = 200000; const a = Array.from({length: n}, (_, i) => i + 1)
        return `${n} ${n + (n-1)}\n${a.join(' ')}`
      })(),
      expectedOutput: `${200000-2} ${200000-1}`, isSample: false, orderIndex: 2 },
  ]
  await prisma.testCase.createMany({
    data: twoSumTests.map(t => ({ ...t, problemId: twoSum.id })),
    skipDuplicates: true
  })

  // Bài 2: LIS — medium
  const lis = await prisma.problem.upsert({
    where: { slug: 'lis' }, update: {}, create: {
      title: 'Longest Increasing Subsequence',
      slug: 'lis',
      difficulty: 'medium',
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      isPublished: true,
      createdById: admin.id,
      description: `## Mô tả
Cho dãy số nguyên \`a\` gồm \`n\` phần tử. Tìm độ dài dãy con tăng dài nhất (LIS).

## Input
- Dòng 1: n (1 ≤ n ≤ 100000)
- Dòng 2: n số nguyên

## Output
Một số nguyên — độ dài LIS.

## Ràng buộc
\`\`\`
1 ≤ n ≤ 100000
-10⁹ ≤ a[i] ≤ 10⁹
\`\`\``,
    }
  })
  await prisma.problemTopic.createMany({
    data: [
      { problemId: lis.id, topicId: topics['dp'].id },
      { problemId: lis.id, topicId: topics['binary-search'].id },
    ],
    skipDuplicates: true
  })
  await prisma.testCase.createMany({
    data: [
      { problemId: lis.id, input: '6\n3 1 2 1 8 5', expectedOutput: '3', isSample: true, orderIndex: 0 },
      { problemId: lis.id, input: '1\n5',           expectedOutput: '1', isSample: false, orderIndex: 1 },
      { problemId: lis.id, input: '5\n5 4 3 2 1',   expectedOutput: '1', isSample: false, orderIndex: 2 },
    ],
    skipDuplicates: true
  })

  // Bài 3: Shortest Path — hard
  const sp = await prisma.problem.upsert({
    where: { slug: 'shortest-path-queries' }, update: {}, create: {
      title: 'Shortest Path Queries',
      slug: 'shortest-path-queries',
      difficulty: 'hard',
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      isPublished: true,
      createdById: admin.id,
      description: `## Mô tả
Cho đồ thị có hướng \`n\` đỉnh, \`m\` cạnh có trọng số. Trả lời \`q\` truy vấn, mỗi truy vấn hỏi đường đi ngắn nhất từ \`s\` đến \`t\`.

## Input
- Dòng 1: n m (1 ≤ n,m ≤ 100000)
- m dòng tiếp: u v w (cạnh từ u tới v, trọng số w ≥ 0)
- Dòng tiếp: q
- q dòng tiếp: s t

## Output
q dòng, mỗi dòng in đường đi ngắn nhất hoặc -1 nếu không tồn tại.`,
    }
  })
  await prisma.problemTopic.createMany({
    data: [{ problemId: sp.id, topicId: topics['graph'].id }],
    skipDuplicates: true
  })
  await prisma.testCase.createMany({
    data: [
      { problemId: sp.id, input: '4 4\n1 2 1\n2 3 2\n3 4 3\n1 4 10\n1\n1 4', expectedOutput: '6', isSample: true, orderIndex: 0 },
      { problemId: sp.id, input: '2 1\n1 2 5\n1\n2 1', expectedOutput: '-1', isSample: false, orderIndex: 1 },
    ],
    skipDuplicates: true
  })

  console.log('Seed complete:', { admin: admin.username, student: student.username, problems: 3, topics: topicData.length })
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

---

## API naming convention — thống nhất

> Tất cả API body và response dùng **camelCase** (TypeScript convention). Không dùng snake_case trong JSON body.

| Endpoint | Method | Body / Query | Response |
|----------|--------|--------------|----------|
| `/api/auth/register` | POST | `{ username, email, password }` | `{ id, username }` |
| `/api/problems` | GET | `?search=&difficulty=&topics=&page=&limit=` | `{ problems[], total, page, totalPages }` |
| `/api/problems` | POST | `{ title, slug, difficulty, description, timeLimitMs, memoryLimitMb, topicSlugs[] }` | problem object |
| `/api/problems/[slug]` | GET | — | problem + testCases (sample only) + userStatus |
| `/api/problems/[slug]` | PATCH | partial problem fields | updated problem |
| `/api/problems/[slug]` | DELETE | — | `{ success: true }` |
| `/api/problems/[slug]/testcases` | POST | `{ testCases: [{input, expectedOutput, isSample}] }` | `{ created: n }` |
| `/api/submissions` | POST | `{ problemId, code }` | `{ submissionId }` |
| `/api/submissions` | GET | `?problemId=&verdict=&page=` | `{ submissions[], total }` |
| `/api/submissions/[id]` | GET | — | submission + aiFeedback |
| `/api/submissions/[id]/stream` | GET | — | SSE stream |
| `/api/chat` | POST | `{ problemSlug, submissionId?, messages[] }` | SSE stream |
| `/api/walkthrough` | POST | `{ problemSlug, fullCode, selectedLine, lineNumber }` | SSE stream |
| `/api/admin/users` | GET | `?search=` | `{ users[] }` |
| `/api/admin/users/[id]/role` | PATCH | `{ role }` | updated user |

---

## Build Steps — implement theo thứ tự

---

### STEP 1 — Monorepo scaffold & cấu hình

1. Tạo root `package.json` (workspaces, scripts như ở trên)
2. `create-next-app apps/web` với TypeScript + Tailwind + App Router + src=false
3. Tạo `packages/db/` với `package.json` + `prisma/schema.prisma` (copy schema ở trên)
4. Tạo `apps/judge/` với `package.json` + placeholder files
5. Viết `docker-compose.yml`, `.env.example`, `.env` (copy từ example)
6. Viết `apps/web/tailwind.config.js` — extend colors + fontFamily theo tokens
7. Viết `apps/web/app/globals.css`:
   - Import Google Fonts: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap')`
   - Copy toàn bộ CSS block từ file `terminal-dark/login.html` (tất cả 10 file dùng chung block này)
   - Thêm Tailwind directives `@tailwind base/components/utilities`
8. Chạy `npm install` tại root

**Verify:** `docker-compose up postgres redis` healthy. `npx next dev` trong `apps/web` start không lỗi.

---

### STEP 2 — Database

1. Tạo `packages/db/prisma/schema.prisma` theo spec ở trên
2. Tạo `apps/web/lib/prisma.ts`:
   ```typescript
   import { PrismaClient } from '@prisma/client'
   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
   export const prisma = globalForPrisma.prisma ?? new PrismaClient()
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
   ```
3. Chạy `npm run db:generate` (prisma generate)
4. Chạy `npm run db:migrate` (prisma migrate dev --name init) — cần postgres đang chạy
5. Tạo `packages/db/prisma/seed.ts` theo spec ở trên
6. Chạy `npm run db:seed`

**Verify:** `npm run db:studio` → thấy 3 tables có data: 2 users, 14 topics, 3 problems với test cases.

---

### STEP 3 — Auth (Credentials + JWT)

1. Cài deps: `next-auth bcryptjs @types/bcryptjs`
2. Tạo `apps/web/types/index.ts` — extend NextAuth types (như spec ở trên)
3. Tạo `apps/web/lib/auth.ts` — authOptions (như spec ở trên, **không dùng PrismaAdapter**)
4. Tạo `apps/web/app/api/auth/[...nextauth]/route.ts`:
   ```typescript
   import NextAuth from 'next-auth'
   import { authOptions } from '@/lib/auth'
   const handler = NextAuth(authOptions)
   export { handler as GET, handler as POST }
   ```
5. Tạo `apps/web/app/api/auth/register/route.ts` — validate + bcrypt hash + prisma.user.create
6. Tạo `apps/web/middleware.ts`:
   ```typescript
   export { default } from 'next-auth/middleware'
   export const config = {
     matcher: ['/problems/:path*', '/submissions/:path*', '/admin/:path*']
   }
   ```
7. Tạo `apps/web/app/admin/layout.tsx` — server component kiểm tra `session.user.role === 'admin'`, redirect nếu không đủ quyền

**Verify:** Truy cập `/problems` khi chưa login → redirect `/login`. Sau login → vào được.

---

### STEP 4 — UI Foundation

1. Extract CSS từ `terminal-dark/login.html` (khối `<style>`) vào `globals.css` (đã làm ở Step 1)
2. Tạo `apps/web/app/layout.tsx` — root layout với `SessionProvider`, `<html lang="vi">`, font classes
3. Tạo `apps/web/app/(auth)/layout.tsx` — layout không có Navbar (chỉ render `{children}`)
4. Tạo `components/layout/Navbar.tsx`:
   - Logo `>_` + "CP-Tutor" → `/problems`
   - Nav: "Bài tập", "Bài nộp của tôi", [Admin nếu role=admin]
   - Right: username + avatar (initials) + dropdown "Đăng xuất" (`signOut()`)
   - Variant: class `compact-topbar` cho trang giải bài
5. Tạo `components/ui/Badge.tsx` — verdict badges theo class `.badge.ac/wa/tle/mle/ce/re/pending`
6. Tạo `components/ui/Toast.tsx` — context + hook `useToast()`, stack top-right, auto-dismiss 3s

**Verify:** Navbar hiển thị đúng trên trang bất kỳ sau login. Background `#0f1117`.

---

### STEP 5 — Login & Register pages

**Source:** `terminal-dark/login.html`, `terminal-dark/register.html`

**`app/(auth)/login/page.tsx`** (Client Component):
- Class `auth-shell` + `auth-center` theo thiết kế
- Form: identifier (username/email) + password (toggle hiện/ẩn)
- Submit: `signIn('credentials', { identifier, password, redirect: false })` → check error → redirect `/problems`
- Error state: border đỏ + message
- Loading: button disabled + spinner text "Đang đăng nhập..."
- Nền: pattern ASCII mờ (copy từ HTML thiết kế)

**`app/(auth)/register/page.tsx`** (Client Component):
- Form: username + email + password + confirmPassword
- Validation theo đúng logic HTML thiết kế:
  - Username: `/^[a-zA-Z0-9_]{4,}$/` — **min 4 ký tự** (theo file register.html dòng 447)
  - Password strength: `score = length*10 + (uppercase?20:0) + (digit?15:0)` — bar đỏ/vàng/xanh
  - Confirm: border đỏ nếu không khớp (real-time, không cần submit)
- Submit: `POST /api/auth/register` → nếu thành công → `signIn(...)` → redirect `/problems`

**Verify:** Đăng ký → đăng nhập thành công. Validation username min 4 ký tự hoạt động đúng.

---

### STEP 6 — Danh sách bài (`/problems`)

**Source:** `terminal-dark/problems.html`

**`app/api/problems/route.ts` (GET):**
- Prisma query với where clause: `isPublished: true`, full-text search title, filter difficulty, filter topics
- Include: `topics.topic`, `_count.submissions`
- Thêm userStatus: join submissions của session.user để check AC/tried/none
- Trả về `{ problems: ProblemListItem[], total, page, totalPages }`

**`app/problems/page.tsx`** — Server Component, fetch initial data, pass xuống `ProblemTable`

**`components/problems/ProblemTable.tsx`** — Client Component:
- Bảng `table-card` đúng theo thiết kế (columns: TT, #, Tên+tags, Độ khó, %AC)
- Search debounce 300ms → update URL searchParams
- Difficulty pills: Tất cả/Dễ/Vừa/Khó
- Topic tag bar: horizontal scroll, click toggle filter
- Skeleton (shimmer) khi loading
- Empty state với nút "Xóa filter"
- Pagination
- Stat chips: tổng bài, số AC, số đang làm

**Verify:** 3 bài seed hiển thị. Filter và search hoạt động. Trạng thái đúng (AC/tried/none).

---

### STEP 7 — Trang giải bài (`/problems/[slug]`)

**Source:** `terminal-dark/problem-solve.html`

**Layout:** `solve-page` → `compact-topbar` + `solve-shell` (3 cột CSS Grid) + `status-bar` fixed bottom

**`app/api/problems/[slug]/route.ts` (GET):** problem + sample test cases + user's submissions for this problem

**`app/problems/[slug]/page.tsx`:** Server component, truyền data xuống. Dùng class `solve-page` để tắt body scroll.

**7a. `components/solve/ProblemPanel.tsx`:**
- Tab "Đề bài": render markdown, ràng buộc, sample I/O (nút copy)
- Tab "Submission": list submissions của user với bài này (verdict badge + time)

**7b. `components/solve/Editor.tsx`:**
- `@monaco-editor/react`, theme dark custom (`#0f1117` bg, JetBrains Mono 14px)
- Default template C++ như trong thiết kế
- `onMount`: set theme, font
- Toolbar: label "solution.cpp", pill "C++17", nút Reset (dialog confirm), nút Format (monaco format)
- Hover line → gutter decoration (icon `?`) → click → gọi `onWalkthroughLine(lineNumber, lineContent)`
- Expose `getValue()` cho parent qua `useImperativeHandle`

**7c. `components/solve/AiPanel.tsx`:**
- Tab "AI Feedback": placeholder → loading → content (render markdown)
- Tab "Chat":
  - Message list, scroll to bottom khi có message mới
  - User bubble (phải) / AI bubble (trái + sparkle icon)
  - Textarea + send button (Enter gửi, Shift+Enter xuống dòng)
  - `POST /api/chat` → nhận SSE stream → append từng token vào message đang build
  - Context chip: "ngữ cảnh: [tên bài] + submission [#id]"
- Tab "Walkthrough":
  - Nhận `{ lineNumber, lineContent }` từ Editor qua props/callback
  - `POST /api/walkthrough` → stream giải thích
  - Nút "Hỏi thêm" → chuyển tab Chat + prefill câu hỏi

**7d. `components/solve/StatusBar.tsx`:**
- Fixed bottom bar (`status-bar` class từ thiết kế)
- Left: verdict badge + runtime + memory (gần nhất)
- Center: trạng thái judge ("Đang chờ...", "Đang chấm...", "Hoàn thành") — update qua SSE
- Right: nút "Nộp bài" → gọi submit

**`app/api/submissions/route.ts` (POST):**
```typescript
// Nhận { problemId, code }
// 1. Tạo submission (verdict: pending)
// 2. Queue.add('judge', { submissionId }) vào 'judge-queue'
// 3. Return { submissionId }
```

**`app/api/submissions/[id]/stream/route.ts`:** SSE theo spec ở trên

**`apps/web/lib/queue.ts`:**
```typescript
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
const connection = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
export const judgeQueue = new Queue('judge-queue', { connection })
```

**Responsive:** Theo CSS thiết kế tại `@media (max-width: 980px)`:
- `solve-shell` → 2 cột (42% / 58%)
- `.solve-col.ai` → off-canvas, toggle bằng nút "AI" floating

**Verify:** Nộp bài → SSE nhận verdict → StatusBar cập nhật. AI Feedback xuất hiện sau verdict.

---

### STEP 8 — Judge Worker

**`apps/judge/sandbox.js`:** Implement đầy đủ theo spec ở trên (spawn + stdin file + ulimit + normalize output)

**`apps/judge/worker.js`:** Implement theo spec ở trên

**`apps/judge/llm-worker.js`:** Implement theo spec ở trên (start cả 2 worker từ 1 process)

**`apps/judge/Dockerfile`:** Theo spec ở trên

**Entry point `apps/judge/worker.js`** — require cả llm-worker:
```javascript
require('./worker')     // judge worker
require('./llm-worker') // ai worker (noop nếu không có key)
```

**Verify:** `docker-compose up --build judge` → submit Two Sum code đúng → AC. Code sai → WA. Code O(n²) với n=200000 → TLE.

---

### STEP 9 — LLM Adapter & Chat/Walkthrough API

**`apps/web/lib/llm.ts`:**
```typescript
// Streaming SSE helper cho Next.js API Routes
export async function streamLLMResponse(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<ReadableStream>
```
- Đọc `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`
- Nếu không có `LLM_API_KEY`: return stream với message "AI không khả dụng lúc này"
- OpenAI: dùng `openai.chat.completions.create({ stream: true })`
- Anthropic: dùng `anthropic.messages.stream(...)`
- Convert sang `ReadableStream` với `text/event-stream` format: `data: {token}\n\n`

**`apps/web/lib/prompts.ts`:** Export các hàm buildSystemPrompt cho chat và walkthrough (bằng tiếng Việt, không spoil lời giải)

**`app/api/chat/route.ts`:**
```typescript
// POST { problemSlug, submissionId?, messages: [{role, content}] }
// 1. Lấy problem + submission (nếu có) từ DB
// 2. Build system prompt có context
// 3. Lưu user message vào chat_messages
// 4. Stream LLM response
// 5. Sau khi stream xong: lưu assistant message vào chat_messages
```

**`app/api/walkthrough/route.ts`:**
```typescript
// POST { problemSlug, fullCode, selectedLine, lineNumber }
// 1. Lấy problem từ DB
// 2. Stream giải thích dòng code trong context bài toán
```

**Verify:** Chat hoạt động với stream, AI trả lời đúng context bài. Nếu không có key → "AI không khả dụng" thay vì crash.

---

### STEP 10 — Submissions pages

**Source:** `terminal-dark/submissions.html`, `terminal-dark/submission-detail.html`

**`app/submissions/page.tsx`** + **`app/api/submissions/route.ts` (GET)**:
- Filter `problemId`, `verdict`, `page`
- Relative time với `date-fns` (`formatDistanceToNow(..., { locale: vi, addSuffix: true })`)
- Columns theo thiết kế: time, bài, verdict badge, runtime, memory, "Xem chi tiết"

**`app/submissions/[id]/page.tsx`** + **`app/api/submissions/[id]/route.ts` (GET)**:
- Layout `split-2`: Monaco read-only (trái) + AI Feedback (phải)
- Metric grid: Runtime, Memory, Ngôn ngữ, Thời gian
- Nút "Dùng code này" → `localStorage.setItem('prefillCode:${problemSlug}', code)` → navigate `/problems/${slug}`
- `Editor.tsx` ở trang `/problems/[slug]` check `localStorage` khi mount để prefill

**Verify:** Xem lại submission, thấy code đúng + AI feedback (nếu có).

---

### STEP 11 — Admin pages

**Source:** `terminal-dark/admin-problems.html`, `terminal-dark/admin-editor.html`, `terminal-dark/admin-users.html`

**`app/admin/problems/page.tsx`:** Bảng admin, toggle published inline, edit/delete

**`app/admin/problems/new/page.tsx`** và **`[slug]/edit/page.tsx`:**
- Layout `admin-grid`: form (trái, scroll) + live preview Markdown (phải, sticky)
- Section: Thông tin cơ bản → Đề bài → Ràng buộc → Test cases
- `components/admin/TestCaseEditor.tsx`: 2 tabs (manual nhập / upload ZIP dùng `jszip`)
- Auto-save localStorage mỗi 30s
- "Lưu nháp" (isPublished=false) + "Publish" (isPublished=true)

**`app/admin/users/page.tsx`:** Bảng users, client-side search, role dropdown inline

**APIs admin:** Đều check `session.user.role === 'admin'`, trả 403 nếu không đủ quyền

**Verify:** Admin tạo bài → publish → bài xuất hiện ở `/problems`.

---

### STEP 12 — Error pages & global error handling

**`app/not-found.tsx`:** 404 centered — `>_` icon + `404` mono lớn + nút về trang chủ  
**`app/error.tsx`:** Runtime error — nút "Thử lại" + "Về trang chủ"  
**API convention:** Tất cả route handler bọc trong try/catch, return `NextResponse.json({ error: message }, { status: N })`

---

### STEP 13 — README & final checklist

**`README.md`:**

```markdown
# CP-Tutor

Online Judge + AI Mentor cho học C++ Competitive Programming.

## Yêu cầu
- Docker & Docker Compose
- Node.js 20+ (chỉ cần cho dev local)

## Chạy local

```bash
# 1. Copy env và điền LLM key (có thể để trống để chạy không có AI)
cp .env.example .env

# 2. Build và start toàn bộ services
docker-compose up --build

# 3. Trong terminal khác: migrate DB và seed
docker-compose exec web npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
docker-compose exec web npx tsx packages/db/prisma/seed.ts

# 4. Mở http://localhost:3000
```

## Tài khoản mặc định

| Role    | Username   | Password    |
|---------|------------|-------------|
| Admin   | admin      | admin123    |
| Student | student01  | student123  |

## Test judge (không cần LLM)

Bài **Two Sum** có 3 test cases để kiểm tra judge:
- Code đúng (hash map O(n)) → **AC**
- Code sai output → **WA**  
- Code O(n²) brute force → **TLE** (test case n=200000)

## LLM là optional

Nếu `LLM_API_KEY` để trống, AI feedback bị skip.  
Hệ thống vẫn chấm bài bình thường.  
Providers hỗ trợ: `openai`, `anthropic`.
```

**Final checklist trước khi giao:**

- [ ] `docker-compose up --build` không có lỗi build
- [ ] Migrate + seed chạy thành công, 3 bài hiện ở `/problems`
- [ ] Login/register hoạt động (min username 4 ký tự)
- [ ] Nộp bài Two Sum code đúng → AC
- [ ] Nộp bài Two Sum code O(n²) → TLE
- [ ] SSE stream cập nhật verdict realtime trên StatusBar
- [ ] AI feedback xuất hiện sau verdict (nếu có LLM key)
- [ ] AI Chat stream từng token
- [ ] Walkthrough click dòng → AI giải thích
- [ ] Admin tạo bài → publish → bài xuất hiện
- [ ] Không có lỗi TypeScript (`tsc --noEmit`)
- [ ] Không có console.error không xử lý

---

## Lưu ý cuối cho Claude Code

1. **Auth:** Dùng **Credentials-only + JWT**. **Không cài `@auth/prisma-adapter`**. Không cần Account/Session/VerificationToken models.

2. **Realtime: SSE duy nhất.** Không dùng WebSocket. Route SSE tại `/api/submissions/[id]/stream`. Worker publish Redis → route handler subscribe và forward.

3. **CSS từ thiết kế:** Extract 1 lần từ `terminal-dark/login.html` (hoặc bất kỳ file nào — cùng style block). Không copy JS demo. Không tự viết CSS mới cho components đã có trong thiết kế.

4. **Judge local:** Dùng `child_process.spawn` + stdin file + `ulimit` trong container. Không Docker-in-Docker. Không cần `isolate`.

5. **LLM optional:** Kiểm tra `process.env.LLM_API_KEY` trước khi gọi. Nếu không có → skip AI, không crash. Cả judge worker lẫn web API đều phải graceful degrade.

6. **Prisma từ packages/db:** `generator client` output `../../../node_modules/.prisma/client` để cả `apps/web` và `apps/judge` cùng import được từ `@prisma/client`.

7. **Username validation:** min **4 ký tự** (theo file thiết kế register.html), pattern `[a-zA-Z0-9_]`.

8. **Responsive:** Theo CSS `@media (max-width: 980px)` trong thiết kế — AI panel là off-canvas drawer, không phải 2-tab layout.