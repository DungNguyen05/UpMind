# CP-Tutor — Build Plan for Claude Code

> **Cách dùng tài liệu này:**  
> Đây là prompt tổng hợp đưa cho **Claude Code** để build toàn bộ dự án CP-Tutor từ đầu.  
> Claude Code sẽ đọc tài liệu này, hỏi lại nếu cần, rồi tự động tạo toàn bộ file theo thứ tự các step bên dưới.  
> Tài liệu đính kèm cần có trong cùng thư mục: `CP-Tutor_Project_Document.docx`, `CP_Tutor_Dark_terminal.zip`

---

## Ngữ cảnh dự án

CP-Tutor là một **Online Judge tích hợp AI Mentor** để học sinh tự học C++ Competitive Programming.  
Tech stack đã chọn: **Next.js 14 (App Router) + Tailwind CSS + PostgreSQL + Prisma + BullMQ (Redis) + Docker**.  
Mục tiêu hiện tại: **chạy được trên local bằng `docker-compose up`**.

---

## Tài liệu tham chiếu

| File | Nội dung |
|------|---------|
| `CP-Tutor_Project_Document.docx` | Tài liệu dự án đầy đủ: tính năng, kiến trúc, database schema, API endpoints |
| `CP_Tutor_Dark_terminal.zip` | 10 file HTML thiết kế sẵn — dùng làm **nguồn CSS và layout chính xác** |

> **Quan trọng:** Mọi giao diện phải được implement **trung thành theo file HTML thiết kế** trong zip. Không tự sáng tạo UI mới.

---

## Design Tokens (trích từ thiết kế)

```css
--bg: #0f1117;
--bg-soft: #121622;
--surface: #1a1d27;
--surface-2: #21263a;
--fg: #e8eaf0;
--muted: #8b92a8;
--faint: #555b70;
--border: #2e3348;
--accent: #6c63ff;
--accent-2: #00d2a0;
--danger: #ff5c6c;
--warning: #ffb340;
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--font-display: 'JetBrains Mono', monospace;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

Các class tái sử dụng từ thiết kế: `.badge.ac/wa/tle/mle/ce/re`, `.pill`, `.tag`, `.avatar`, `.mono`, `.muted`, `.primary-btn`, `.secondary-btn`, `.ghost-btn`, `.icon-btn`, `.search`, `.table-card`, `.app-shell`, `.topbar`, `.solve-shell`, `.solve-col`.

---

## Cấu trúc thư mục mục tiêu

```
cp-tutor/
├── apps/
│   ├── web/                        # Next.js 14 App
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── problems/
│   │   │   │   ├── page.tsx        # danh sách bài
│   │   │   │   └── [slug]/page.tsx # trang giải bài
│   │   │   ├── submissions/
│   │   │   │   ├── page.tsx        # lịch sử
│   │   │   │   └── [id]/page.tsx   # chi tiết
│   │   │   ├── admin/
│   │   │   │   ├── problems/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [slug]/edit/page.tsx
│   │   │   │   └── users/page.tsx
│   │   │   ├── api/                # Next.js API Routes
│   │   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   │   ├── problems/route.ts
│   │   │   │   ├── problems/[slug]/route.ts
│   │   │   │   ├── submissions/route.ts
│   │   │   │   ├── submissions/[id]/route.ts
│   │   │   │   ├── chat/route.ts
│   │   │   │   └── walkthrough/route.ts
│   │   │   ├── not-found.tsx
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── layout/Navbar.tsx
│   │   │   ├── ui/Badge.tsx
│   │   │   ├── ui/Toast.tsx
│   │   │   ├── problems/ProblemTable.tsx
│   │   │   ├── solve/Editor.tsx
│   │   │   ├── solve/AiPanel.tsx
│   │   │   ├── solve/StatusBar.tsx
│   │   │   └── admin/TestCaseEditor.tsx
│   │   ├── lib/
│   │   │   ├── auth.ts             # NextAuth config
│   │   │   ├── prisma.ts           # Prisma client singleton
│   │   │   ├── llm.ts              # LLM Adapter Service
│   │   │   ├── queue.ts            # BullMQ producer
│   │   │   └── prompts.ts          # LLM prompt templates
│   │   ├── types/index.ts
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   └── package.json
│   └── judge/
│       ├── worker.js               # BullMQ consumer
│       ├── sandbox.js              # Docker exec wrapper
│       ├── Dockerfile
│       └── package.json
├── packages/
│   └── db/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       └── package.json
├── docker-compose.yml
├── docker-compose.override.yml     # dev overrides
├── .env.example
└── package.json                    # root workspace
```

---

## Database Schema (Prisma)

Implement **chính xác** schema sau trong `packages/db/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
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

model User {
  id           String    @id @default(uuid())
  username     String    @unique @db.VarChar(50)
  email        String    @unique @db.VarChar(255)
  passwordHash String    @map("password_hash")
  role         Role      @default(student)
  createdAt    DateTime  @default(now()) @map("created_at")

  submissions  Submission[]
  chatMessages ChatMessage[]
  createdProblems Problem[] @relation("CreatedBy")

  @@map("users")
}

model Problem {
  id             String     @id @default(uuid())
  title          String     @db.VarChar(200)
  slug           String     @unique @db.VarChar(200)
  description    String
  difficulty     Difficulty
  timeLimitMs    Int        @default(1000) @map("time_limit_ms")
  memoryLimitMb  Int        @default(256) @map("memory_limit_mb")
  isPublished    Boolean    @default(false) @map("is_published")
  createdById    String     @map("created_by")
  createdAt      DateTime   @default(now()) @map("created_at")

  createdBy    User           @relation("CreatedBy", fields: [createdById], references: [id])
  testCases    TestCase[]
  submissions  Submission[]
  topics       ProblemTopic[]

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
  orderIndex     Int     @default(0) @map("order_index")

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

  user        User         @relation(fields: [userId], references: [id])
  problem     Problem      @relation(fields: [problemId], references: [id])
  aiFeedback  AiFeedback?
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

  user       User        @relation(fields: [userId], references: [id])
  submission Submission? @relation(fields: [submissionId], references: [id])

  @@map("chat_messages")
}
```

---

## Docker Compose

`docker-compose.yml` phải định nghĩa **5 services**:

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

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  judge:
    build: ./apps/judge
    depends_on: [redis]
    environment:
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgresql://cptutor:cptutor_dev@postgres:5432/cptutor
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # judge tạo container con
    privileged: true

  web:
    build: ./apps/web
    depends_on: [postgres, redis]
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://cptutor:cptutor_dev@postgres:5432/cptutor
      REDIS_URL: redis://redis:6379
      NEXTAUTH_SECRET: dev_secret_change_in_prod
      NEXTAUTH_URL: http://localhost:3000
      LLM_PROVIDER: openai
      LLM_API_KEY: ${LLM_API_KEY}
      LLM_MODEL: gpt-4o-mini

volumes:
  postgres_data:
```

---

## Env File

Tạo `.env.example`:
```bash
DATABASE_URL=postgresql://cptutor:cptutor_dev@localhost:5432/cptutor
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=dev_secret_change_in_prod
NEXTAUTH_URL=http://localhost:3000
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
LLM_BASE_URL=                    # optional override
```

---

## Build Steps — Thứ tự implement

> Claude Code phải thực hiện **theo đúng thứ tự** các step sau. Hoàn thành và verify mỗi step trước khi sang step tiếp theo.

---

### STEP 1 — Khởi tạo monorepo & cấu hình

**Việc cần làm:**
1. Khởi tạo npm workspace tại root với `package.json` workspaces `["apps/*", "packages/*"]`
2. Tạo `apps/web/` bằng `create-next-app` với App Router, TypeScript, Tailwind
3. Tạo `packages/db/` với Prisma, copy schema ở trên vào
4. Tạo `apps/judge/` — Node.js thuần (không Next.js), chỉ cần `package.json` + file trống
5. Tạo `docker-compose.yml` theo spec trên
6. Tạo `.env.example` và `.env` (copy từ example, điền giá trị dev)
7. Tạo `apps/web/tailwind.config.js` — extend theme với design tokens từ thiết kế:
   ```js
   colors: {
     bg: '#0f1117', 'bg-soft': '#121622',
     surface: '#1a1d27', 'surface-2': '#21263a',
     fg: '#e8eaf0', muted: '#8b92a8', faint: '#555b70',
     border: '#2e3348', accent: '#6c63ff', 'accent-2': '#00d2a0',
     danger: '#ff5c6c', warning: '#ffb340'
   },
   fontFamily: {
     mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
     body: ['Inter', 'system-ui', 'sans-serif']
   }
   ```
8. Tạo `apps/web/app/globals.css` — import Google Fonts (Inter, JetBrains Mono) và định nghĩa CSS variables + base styles từ thiết kế HTML

**Verify:** `docker-compose up postgres redis` chạy được, không có lỗi

---

### STEP 2 — Database migration & seed

**Việc cần làm:**
1. Chạy `prisma migrate dev --name init` để tạo migration đầu tiên
2. Tạo `packages/db/prisma/seed.ts` với dữ liệu mẫu:
   - 1 user admin: `{ username: "admin", email: "admin@cptutor.dev", password: bcrypt("admin123"), role: "admin" }`
   - 1 user student: `{ username: "student01", email: "student01@cptutor.dev", password: bcrypt("student123"), role: "student" }`
   - 13 topics: Brute Force, Sorting, Binary Search, Two Pointers, Prefix Sum, Stack & Queue, Backtracking, Greedy, Dynamic Programming, Graph, Math, String (slug: lowercase-hyphen)
   - 3 bài tập mẫu published:
     - "Two Sum" — easy — tags: Array, Hash Map — time: 1000ms — mem: 256MB — 3 test cases (1 sample)
     - "LIS" (Longest Increasing Subsequence) — medium — tags: DP, Binary Search — 3 test cases
     - "Shortest Path Queries" — hard — tags: Graph — 3 test cases
3. Chạy seed, verify data trong DB

**Verify:** `prisma studio` mở được, thấy đủ tables và seed data

---

### STEP 3 — Auth (NextAuth.js)

**Việc cần làm:**
1. Cài `next-auth`, `bcryptjs`, `@auth/prisma-adapter`
2. Tạo `apps/web/lib/auth.ts` — NextAuth config với:
   - Credentials provider (username/password, so sánh bcrypt)
   - PrismaAdapter
   - JWT strategy
   - Session callback: đưa `id`, `role`, `username` vào session
3. Tạo `apps/web/app/api/auth/[...nextauth]/route.ts`
4. Tạo `apps/web/middleware.ts` — protect routes:
   - `/problems`, `/submissions`, `/admin/*` → yêu cầu đăng nhập
   - `/admin/*` → yêu cầu role = admin
   - Redirect về `/login` nếu chưa auth
5. Tạo API route `POST /api/auth/register` — tạo user mới (validate, hash password, insert)

**Verify:** Đăng nhập với `student01 / student123` qua NextAuth hoạt động, session có `id` + `role`

---

### STEP 4 — UI Foundation: Layout, Navbar, shared components

**Việc cần làm:**

Đây là bước quan trọng nhất về UI — tất cả styles phải lấy từ file thiết kế.

1. **Extract và convert CSS từ file thiết kế:**  
   Mở từng file HTML trong `CP_Tutor_Dark_terminal.zip`, copy toàn bộ CSS trong thẻ `<style>` vào `globals.css` (loại bỏ trùng lặp). Đây là nguồn CSS chính thức — **không tự viết lại**.

2. **`components/layout/Navbar.tsx`** — implement theo `topbar` class trong thiết kế:
   - Logo + tên "CP-Tutor" (trái)
   - Nav links: "Bài tập" → `/problems`, "Nộp bài của tôi" → `/submissions`
   - Nếu role = admin: thêm link "Admin" → `/admin/problems`
   - Phải (right): username + avatar initials + dropdown (Đăng xuất)
   - Variant `compact` cho trang giải bài (thấp hơn)

3. **`components/ui/Badge.tsx`** — verdict badges: `ac`, `wa`, `tle`, `mle`, `ce`, `re`, `pending`. Màu sắc theo thiết kế.

4. **`components/ui/Toast.tsx`** — toast notification (top-right, fade in/out, 3s)

5. **`app/layout.tsx`** — root layout với SessionProvider, font imports, dark background

6. **`app/(auth)/layout.tsx`** — layout không có Navbar cho trang login/register

**Verify:** Chạy `npm run dev`, mở localhost:3000, thấy background đúng màu `#0f1117`

---

### STEP 5 — Trang Auth: Login & Register

**Source HTML:** `login.html`, `register.html` từ zip

**Việc cần làm:**

**`app/(auth)/login/page.tsx`:**
- Layout `auth-shell` + `auth-center` theo thiết kế
- Form: Email/username + Password (toggle show/hide)
- Submit → `signIn('credentials', ...)` từ NextAuth
- Error state: border đỏ input + message "Sai tên đăng nhập hoặc mật khẩu"
- Loading state: button disabled + spinner
- Success: redirect → `/problems`
- Link "Đăng ký" → `/register`
- Nền có pattern ASCII mờ (các ký tự `{ } ; // #include` lặp lại, opacity 0.03)

**`app/(auth)/register/page.tsx`:**
- Form: username + email + password + confirm password
- Validation inline:
  - Username: chỉ `[a-zA-Z0-9_]`, min 3 ký tự — hiện `✓` xanh / `✗` đỏ khi blur
  - Password strength bar (weak/medium/strong) — 3 màu: đỏ/vàng/xanh
  - Confirm password: lỗi ngay nếu không khớp
- Submit → `POST /api/auth/register` → rồi auto login → redirect `/problems`

**Verify:** Đăng ký user mới, đăng nhập thành công, redirect đúng

---

### STEP 6 — Trang Danh sách bài (`/problems`)

**Source HTML:** `problems.html` từ zip

**Việc cần làm:**

**`app/api/problems/route.ts` (GET):**
- Query params: `search`, `difficulty`, `topics` (comma-separated slugs), `page`, `limit=20`
- Trả về: `{ problems: [...], total, page, totalPages }`
- Mỗi problem object: `id, title, slug, difficulty, topics[], acceptedCount, submissionCount`
- JOIN với submissions của user hiện tại để biết trạng thái (AC / đã thử / chưa)

**`app/problems/page.tsx`:**
- Server component fetch data, pass xuống client components
- Layout `wide-main` theo thiết kế

**`components/problems/ProblemTable.tsx`** (Client Component):
- Bảng `table-card` theo thiết kế — đủ columns: TT icon, #, Tên bài + sub-tags, Độ khó badge, %AC
- Search bar: debounce 300ms, update URL params
- Filter difficulty: 4 pill buttons (Tất cả/Dễ/Vừa/Khó)
- Tag filter bar: scrollable chip row, click tag → filter
- Skeleton loading (shimmer) khi fetching
- Empty state: "Không tìm thấy bài nào phù hợp" + nút xóa filter
- Pagination: previous/next + page numbers
- Stat chips header: tổng bài, số AC, số đang làm

**Verify:** Hiển thị 3 bài seed, filter hoạt động, search hoạt động

---

### STEP 7 — Trang Giải bài (`/problems/[slug]`)

**Source HTML:** `problem-solve.html` từ zip

Đây là trang phức tạp nhất — implement từng phần một.

**`app/api/problems/[slug]/route.ts` (GET):**
- Trả về problem detail + sample test cases + submission count của user

**`app/problems/[slug]/page.tsx`:**
- Layout `solve-page` + `solve-shell` (3 cột) theo thiết kế
- Full viewport height, không scroll toàn trang

**7a. Cột trái — `components/solve/ProblemPanel.tsx`:**
- Tab "Đề bài" / "Submission" (theo `data-tab-group` pattern trong thiết kế)
- Tab Đề bài: render Markdown của description (dùng `react-markdown` + `rehype-highlight`)
- Sample test cases: code block với nút Copy
- Tab Submission: danh sách submissions của user với bài này

**7b. Cột giữa — `components/solve/Editor.tsx`:**
- Dùng `@monaco-editor/react`
- Theme custom dark matching thiết kế (`#0f1117` background)
- Default template C++ (như trong thiết kế)
- Toolbar: "solution.cpp" label, "C++17" pill, nút Reset (confirm dialog), nút Format
- Click dòng code (gutter icon khi hover) → emit event sang AI Panel Walkthrough tab
- Font: JetBrains Mono 14px

**7c. Cột phải — `components/solve/AiPanel.tsx`:**
- Tab "AI Feedback" / "Chat" / "Walkthrough"
- **Tab Feedback:** placeholder khi chưa nộp; hiển thị feedback sau khi có verdict
- **Tab Chat:**
  - Message list (scroll bottom)
  - User bubble (phải) / AI bubble (trái, có icon sparkle)
  - Textarea input + send button
  - Stream response (SSE) — hiển thị từng token
  - Context indicator chip hiện tên bài + submission gần nhất
- **Tab Walkthrough:**
  - Nhận dòng code được click từ Editor
  - Hiển thị snippet + giải thích AI (stream)
  - Nút "Hỏi thêm" → chuyển sang Chat tab

**7d. Status Bar — `components/solve/StatusBar.tsx`:**
- Fixed bottom, full width
- Trái: verdict badge gần nhất + runtime + memory
- Giữa: trạng thái judge realtime (WebSocket)
- Phải: nút "Nộp bài" (primary, prominent)

**`app/api/submissions/route.ts` (POST):**
- Nhận `{ problemId, code }`
- Tạo submission record (verdict: pending)
- Đẩy job vào BullMQ queue `judge-queue`
- Trả về `{ submissionId }`

**WebSocket cho realtime verdict:**
- Dùng Next.js Server-Sent Events (SSE): `GET /api/submissions/[id]/stream`
- Client poll hoặc SSE nhận update khi verdict thay đổi

**Verify:** Nộp bài, thấy verdict pending → cập nhật khi judge xử lý

---

### STEP 8 — Judge Worker

**Source:** `apps/judge/`

**Việc cần làm:**

**`apps/judge/Dockerfile`:**
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache g++ make linux-headers
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
CMD ["node", "worker.js"]
```

**`apps/judge/sandbox.js`:**
- Hàm `runInSandbox(code, input, timeLimitMs, memoryLimitMb)`:
  1. Tạo temp dir `/tmp/judge/{uuid}/`
  2. Write `solution.cpp` vào temp dir
  3. Compile: `g++ -O2 -std=c++17 -o solution solution.cpp 2>&1` — timeout 10s
  4. Nếu compile lỗi → return `{ verdict: 'CE', compileError: stderr }`
  5. Run với input: `echo "{input}" | timeout {timeLimit/1000}s ./solution` — giới hạn memory bằng `ulimit -v {memoryLimitMb * 1024}`
  6. So sánh output (trim whitespace) với expected
  7. Return `{ verdict, runtimeMs, memoryKb, actualOutput }`
  8. Cleanup temp dir

> **Note cho local dev:** Không dùng Docker-in-Docker trong dev — chạy g++ trực tiếp trong container judge. Production mới cần isolate.

**`apps/judge/worker.js`:**
- BullMQ Worker lắng nghe queue `judge-queue`
- Mỗi job nhận `{ submissionId }`
- Lấy submission + problem + all test cases từ DB
- Chạy từng test case qua `sandbox.js`
- Verdict logic:
  - Nếu có CE → `{ verdict: CE, compileError }`
  - Duyệt từng test case: nếu TLE → verdict TLE (lưu test case số mấy), nếu output sai → WA + lưu `failedTestInput` + `failedTestOutput`
  - Tất cả pass → AC
- Update submission trong DB
- Sau khi có verdict: đẩy job vào queue `ai-queue` (`{ submissionId, verdict, code, problemDescription }`)
- Notify SSE endpoint (update Redis key `submission:{id}:status`)

**Verify:** Nộp bài "Two Sum" với code đúng → AC; code sai → WA; vòng lặp O(n²) với test lớn → TLE

---

### STEP 9 — LLM Adapter & AI Feedback

**Việc cần làm:**

**`apps/web/lib/llm.ts`** — LLM Adapter:
```typescript
interface LLMRequest {
  systemPrompt: string
  userMessage: string
  stream?: boolean
}

async function callLLM(req: LLMRequest): Promise<string>
async function streamLLM(req: LLMRequest): AsyncIterable<string>
```
- Đọc `process.env.LLM_PROVIDER` để route đến provider
- Support: `openai` (dùng `openai` npm package), `anthropic` (dùng `@anthropic-ai/sdk`)
- Fallback: nếu provider call thất bại sau 15s → thử provider còn lại nếu có API key

**`apps/web/lib/prompts.ts`** — Prompt templates:

```typescript
// WA prompt
export function waPrompt(problemDesc: string, code: string, failedInput: string, actualOutput: string, expectedOutput: string): string

// TLE prompt  
export function tlePrompt(problemDesc: string, code: string, timeLimitMs: number): string

// AC prompt
export function acPrompt(problemDesc: string, code: string): string

// CE prompt
export function cePrompt(code: string, compileError: string): string

// Chat prompt (system)
export function chatSystemPrompt(problemDesc: string, code: string, verdict: string): string

// Walkthrough prompt
export function walkthroughPrompt(problemDesc: string, fullCode: string, selectedLine: string, lineNumber: number): string
```

**Nguyên tắc prompt:**
- WA/TLE: **không đưa lời giải**, chỉ gợi ý hướng suy nghĩ
- AC: review style C++, gợi ý readability + efficiency
- Chat: có đủ context (đề bài + code + verdict) trong system prompt
- Tất cả trả lời bằng **tiếng Việt**
- Format output: Markdown

**AI Worker trong `apps/judge/worker.js`** (hoặc tách file riêng):
- Lắng nghe queue `ai-queue`
- Gọi `callLLM` với prompt phù hợp
- Lưu kết quả vào bảng `ai_feedbacks`
- Notify SSE về ai feedback available

**`app/api/chat/route.ts` (POST, streaming):**
- Nhận `{ problemSlug, submissionId, messages: [{role, content}] }`
- Lấy context (problem + code + verdict)
- Stream response từ LLM qua SSE (`text/event-stream`)

**`app/api/walkthrough/route.ts` (POST, streaming):**
- Nhận `{ problemSlug, fullCode, selectedLine, lineNumber }`
- Stream giải thích từ LLM

**Verify:** Sau khi nộp bài WA, thấy AI feedback hiện ra trong panel (dù stream hay không)

---

### STEP 10 — Trang Lịch sử & Chi tiết Submission

**Source HTML:** `submissions.html`, `submission-detail.html` từ zip

**`app/api/submissions/route.ts` (GET):**
- Query: `problemId`, `verdict`, `page`
- Trả về submissions của user hiện tại + problem name + aiFeedback

**`app/submissions/page.tsx`:**
- Bảng `table-card` theo thiết kế
- Columns: Thời gian (relative), Bài (link), Verdict badge, Runtime, Memory, nút Xem chi tiết
- Filter: dropdown bài + dropdown verdict
- Relative time: dùng `date-fns` (`formatDistanceToNow`)

**`app/submissions/[id]/page.tsx`:**
- Layout `split-2` theo thiết kế: code trái, AI feedback phải
- Monaco Editor read-only cho code đã nộp
- Metric grid: Runtime, Memory, Ngôn ngữ, Thời gian
- AI Feedback panel: render Markdown + badge feedback type
- Nút "Dùng code này": lưu code vào localStorage → prefill editor khi vào trang bài

**Verify:** Xem lại submission, thấy đủ code + AI feedback

---

### STEP 11 — Admin Pages

**Source HTML:** `admin-problems.html`, `admin-editor.html`, `admin-users.html` từ zip

**`app/admin/problems/page.tsx`:**
- Route protection: middleware đã handle, nhưng thêm server-side check role
- Bảng `table-card` admin view theo thiết kế
- Toggle Published/Draft **inline** (PATCH `/api/problems/[slug]` chỉ field `isPublished`)
- Nút Edit → `/admin/problems/[slug]/edit`
- Nút Delete → confirm dialog → DELETE `/api/problems/[slug]`
- Nút "+ Tạo bài mới" → `/admin/problems/new`

**`app/admin/problems/new/page.tsx`** và **`[slug]/edit/page.tsx`:**
- Layout `admin-grid` với form trái + preview phải (theo thiết kế)
- **Section 1 — Thông tin cơ bản:** Tên bài, Slug (auto-generate từ tên, có thể edit), Độ khó (select), Tags (multi-tag picker từ danh sách topics)
- **Section 2 — Đề bài:** Textarea Markdown lớn, live preview bên phải (dùng `react-markdown`)
- **Section 3 — Ràng buộc:** Time limit (ms), Memory limit (MB)
- **Section 4 — Test cases:**
  - Tab "Nhập thủ công": list cặp input/output, mỗi cặp có checkbox "Là ví dụ mẫu", nút xóa, nút "+ Thêm test case"
  - Tab "Upload ZIP": drag-and-drop zone, parse ZIP client-side, hiện danh sách file để confirm
- Auto-save draft mỗi 30s (localStorage hoặc PATCH draft)
- Nút "Lưu nháp" + "Publish" ở top action bar
- Unsaved indicator

**API routes cần thêm:**
- `POST /api/problems` — tạo bài mới (admin only)
- `PATCH /api/problems/[slug]` — update bài (admin only)
- `DELETE /api/problems/[slug]` — xóa bài (admin only)
- `POST /api/problems/[slug]/testcases` — upload test cases

**`app/admin/users/page.tsx`:**
- Bảng users theo thiết kế: Avatar initials, Username, Email, Role dropdown, Ngày tham gia, Tổng submissions
- Search theo tên/email (client-side filter)
- Role dropdown inline → PATCH `/api/admin/users/[id]/role`
- API: `GET /api/admin/users`, `PATCH /api/admin/users/[id]/role`

**Verify:** Admin tạo bài mới với 3 test cases, publish, thấy bài xuất hiện ở `/problems`

---

### STEP 12 — Trang 404 & Error handling

**Source HTML:** `error-404.html` từ zip

**`app/not-found.tsx`:**
- Layout centered full viewport
- `404` lớn font mono màu accent
- "Trang không tồn tại"
- Nút "← Về trang chủ" → `/problems`

**`app/error.tsx`:**
- Tương tự nhưng cho lỗi runtime
- Nút "Thử lại" + "Về trang chủ"

**Global error handling:**
- API routes đều return đúng HTTP status + `{ error: string }` JSON
- Frontend hiển thị toast khi API lỗi

---

### STEP 13 — Polish & Integration test

**Việc cần làm:**

1. **End-to-end flow test:**
   - Đăng ký user mới → đăng nhập → xem danh sách bài → vào bài Two Sum → viết code đúng → nộp → nhận AC + AI feedback → xem trong lịch sử
   - Nộp code sai → nhận WA + AI hint → chat hỏi AI → nhận trả lời có context
   - Click dòng code → Walkthrough giải thích

2. **Admin flow test:**
   - Login admin → tạo bài mới → upload test cases → publish → bài xuất hiện ở danh sách

3. **Responsive check:** Kiểm tra tablet 768px — trang giải bài chuyển sang layout 2 tab

4. **Loading states:** Tất cả fetch đều có skeleton / spinner

5. **Empty states:** Tất cả list đều có empty state message

6. **Toast notifications:** Tất cả action thành công/thất bại đều hiện toast

7. **`README.md`** tại root:
   ```markdown
   ## Chạy dự án
   1. cp .env.example .env — điền LLM_API_KEY
   2. docker-compose up --build
   3. docker-compose exec web npx prisma migrate deploy
   4. docker-compose exec web npx prisma db seed
   5. Mở http://localhost:3000
   
   ## Tài khoản mặc định
   - Admin: admin / admin123
   - Student: student01 / student123
   ```

---

## Dependency list tham khảo

```json
{
  "apps/web": {
    "dependencies": {
      "next": "14.x",
      "react": "18.x",
      "next-auth": "^4.x",
      "@auth/prisma-adapter": "latest",
      "bcryptjs": "latest",
      "@prisma/client": "latest",
      "bullmq": "latest",
      "ioredis": "latest",
      "@monaco-editor/react": "latest",
      "react-markdown": "latest",
      "rehype-highlight": "latest",
      "date-fns": "latest",
      "openai": "latest",
      "@anthropic-ai/sdk": "latest",
      "jszip": "latest"
    }
  },
  "apps/judge": {
    "dependencies": {
      "bullmq": "latest",
      "ioredis": "latest",
      "@prisma/client": "latest",
      "uuid": "latest"
    }
  }
}
```

---

## Lưu ý quan trọng cho Claude Code

1. **UI phải trung thành với thiết kế:** Extract CSS từ các file HTML trong zip, không tự sáng tạo style mới. Class names trong thiết kế (`app-shell`, `topbar`, `solve-shell`, `solve-col`, `table-card`, `badge`, `pill`, `tag`, `avatar`, `mono`, `primary-btn`, `secondary-btn`, `ghost-btn`...) phải được giữ nguyên hoặc convert sang Tailwind equivalent.

2. **Làm theo thứ tự step:** Mỗi step sau phụ thuộc vào step trước. Không skip.

3. **Verify sau mỗi step:** Chạy dev server, kiểm tra không có lỗi compile trước khi sang step tiếp.

4. **Judge sandbox đơn giản cho local:** Không cần Docker-in-Docker hay `isolate` cho local dev — dùng `child_process.exec` với `timeout` và `ulimit` là đủ.

5. **LLM là optional:** Nếu không có API key, hệ thống vẫn hoạt động bình thường — AI feedback sẽ hiển thị "Không thể kết nối AI lúc này".

6. **TypeScript strict:** Tất cả API routes phải có type cho request/response body. Prisma tự generate types — dùng chúng.

7. **Seed data:** Bài "Two Sum" phải có đủ test case để verify judge hoạt động đúng cả 3 verdict (AC, WA, TLE).
