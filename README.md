# UpMind — CP Tutor

Nền tảng luyện tập lập trình thi đấu với AI feedback tự động.

## Kiến trúc

| Service    | Mô tả                                       | Port  |
|------------|---------------------------------------------|-------|
| `web`      | Next.js app (frontend + API routes)         | 3000  |
| `judge`    | Worker chấm bài & gọi LLM feedback         | —     |
| `postgres` | PostgreSQL 16                               | 5432  |
| `redis`    | Queue & cache                               | 6379  |

---

## Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) >= 24
- Docker Compose >= 2.20 (đi kèm Docker Desktop)
- Node.js >= 20 (để chạy Next.js local)

---

## Phát triển local (Hot Reload)

Cách khuyên dùng khi phát triển: chỉ chạy DB và Redis trong Docker, Next.js chạy trực tiếp trên máy để có hot reload ngay lập tức — không cần rebuild Docker mỗi lần sửa code.

### 1. Khởi động infrastructure

```bash
docker compose up postgres redis -d
```

### 2. Cài dependency (lần đầu)

```bash
npm install
```

### 3. Chạy migration và seed (lần đầu)

```bash
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
npx tsx packages/db/prisma/seed.ts
```

### 4. Chạy Next.js local

```bash
cd apps/web && npm run dev
# hoặc từ root:
npm run dev --workspace=apps/web
```

Mở trình duyệt tại `http://localhost:3000`. Sửa bất kỳ file `.tsx`, `.ts`, `.css` nào — trang tự động reload.

> File `apps/web/.env.local` đã có sẵn với giá trị kết nối localhost DB/Redis.

### Dừng infrastructure

```bash
docker compose down
```

---

## Chạy toàn bộ bằng Docker (Production-like)

### 1. Tạo file `.env`

```bash
cp .env.example .env
```

Mở `.env` và điền API key nếu muốn dùng AI feedback:

```env
LLM_PROVIDER=openai          # openai | anthropic
LLM_API_KEY=sk-...           # bỏ trống nếu không dùng AI
LLM_MODEL=gpt-4o-mini        # hoặc claude-haiku-4-5-20251001
LLM_BASE_URL=                # tuỳ chọn: custom endpoint
```

> Nếu để trống `LLM_API_KEY`, hệ thống vẫn chạy bình thường — chỉ bỏ qua bước AI feedback.

### 2. Build và khởi động

```bash
docker compose up --build -d
```

Lần đầu sẽ mất vài phút để build image.

### 3. Chạy migration database

```bash
docker compose exec web npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
```

### 4. Seed dữ liệu mẫu

```bash
docker compose exec web npx tsx packages/db/prisma/seed.ts
```

### 5. Mở trình duyệt

```
http://localhost:3000
```

---

## Các lệnh thường dùng

### Khởi động / Dừng

```bash
# Khởi động (chạy nền)
docker compose up -d

# Dừng
docker compose down

# Dừng và xoá toàn bộ dữ liệu (database, volumes)
docker compose down -v
```

### Xem log

```bash
# Tất cả service
docker compose logs -f

# Chỉ web
docker compose logs -f web

# Chỉ judge (worker chấm bài)
docker compose logs -f judge
```

### Rebuild sau khi thay đổi code

```bash
docker compose up --build -d
```

### Truy cập shell trong container

```bash
# Shell trong web container
docker compose exec web sh

# Shell trong judge container
docker compose exec judge sh

# Kết nối trực tiếp vào PostgreSQL
docker compose exec postgres psql -U cptutor -d cptutor
```

### Prisma

```bash
# Tạo migration mới (sau khi sửa schema.prisma)
docker compose exec web npx prisma migrate dev --schema=packages/db/prisma/schema.prisma

# Mở Prisma Studio (UI quản lý database)
npx prisma studio --schema=packages/db/prisma/schema.prisma
```

---

## Tài khoản mặc định (sau seed)

| Role    | Email              | Mật khẩu |
|---------|--------------------|-----------|
| Admin   | admin@example.com  | admin123  |
| Student | user@example.com   | user123   |

> Kiểm tra file `packages/db/prisma/seed.ts` để xem tài khoản chính xác.

---

## Cấu trúc project

```
UpMind/
├── apps/
│   ├── web/          # Next.js (App Router)
│   └── judge/        # Worker chấm bài (Node.js)
├── packages/
│   └── db/           # Prisma schema & seed
├── terminal-dark/    # UI mockups (HTML)
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Troubleshooting

**Port 3000 / 5432 / 6379 đã bị chiếm:**
```bash
# Đổi port trong docker-compose.yml, ví dụ web:
ports: ["3001:3000"]
```

**Container không khởi động được:**
```bash
docker compose logs <service-name>
```

**Lỗi Prisma "table does not exist":**
```bash
docker compose exec web npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
```

**Reset toàn bộ và chạy lại từ đầu:**
```bash
docker compose down -v
docker compose up --build -d
docker compose exec web npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
docker compose exec web npx tsx packages/db/prisma/seed.ts
```
