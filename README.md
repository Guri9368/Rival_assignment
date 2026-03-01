# Blog Platform — Full-Stack Assessment

A production-ready blog platform built with NestJS, Next.js 15, PostgreSQL, and Prisma.

---

1.Login:
<img width="1895" height="875" alt="image" src="https://github.com/user-attachments/assets/69564219-ca4b-468c-8c47-7d8f877c2e44" />

2. Dashboard
   <img width="1918" height="849" alt="image" src="https://github.com/user-attachments/assets/c7e5c186-d5c6-4bf8-9cda-1fa5d33ffe2d" />
3. New Post
   <img width="1918" height="882" alt="image" src="https://github.com/user-attachments/assets/723110f5-42b3-4c83-b4a2-297a6c64b1d6" />
4. Feed
   <img width="1919" height="870" alt="image" src="https://github.com/user-attachments/assets/1ca5be7f-6543-475e-a1f8-920ae7810b00" />
5. my first-blog
   <img width="1919" height="834" alt="image" src="https://github.com/user-attachments/assets/45da095e-330f-48b0-b142-39048a418ee9" />
6.Like and comment added
<img width="1919" height="869" alt="image" src="https://github.com/user-attachments/assets/1b28cb54-97dd-4da7-a7f6-11931fa0e6e3" />







---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (for async job queue)
- Docker (optional, for local services)

### 1. Start infrastructure
```bash
# From blog-platform-backend/
docker compose up -d   # starts PostgreSQL + Redis
```

### 2. Backend setup
```bash
cd blog-platform-backend
cp .env.example .env   # fill in your values

npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev      # runs on http://localhost:3001
```

### 3. Frontend setup
```bash
cd frontend
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL

npm install
npm run dev            # runs on http://localhost:3000
```

---

## Environment Variables

### Backend `.env`
```env
DATABASE_URL=postgresql://user:password@localhost:5432/blog_platform
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## Architecture

### Backend (NestJS)

```
src/
├── auth/           JWT auth, bcrypt, refresh tokens, guards
├── blogs/          CRUD, slug generation, feed with N+1 prevention
├── likes/          Atomic like/unlike with DB uniqueness constraint
├── comments/       Threaded comments with pagination
├── queue/          BullMQ async job processing (blog summaries)
├── common/         Global exception filters, rate limiting
└── prisma/         Database service
```

**Key design decisions:**

**Repository pattern** — `BlogsRepository` separates Prisma queries from business logic in `BlogsService`. Service handles ownership checks, slug generation, and job enqueueing. Repository handles all DB queries.

**N+1 prevention** — The public feed uses a single Prisma query with `include: { author: { select: {...} } }` and denormalized `likeCount`/`commentCount` counters. No additional queries per blog post.

**Atomic likes** — Like/Unlike uses Prisma `$transaction` to update both the `Like` table and the denormalized `likeCount` counter atomically. A DB-level `@@unique([userId, blogId])` constraint prevents duplicates at the database level.

**Async job processing** — When a blog is published, a BullMQ job is enqueued with a 1-second delay (ensures DB write commits before worker reads it). The HTTP response returns immediately — the summary generation never blocks the user.

**Refresh token security** — Refresh tokens are hashed with bcrypt before storage. On reuse detection (valid token submitted but hash doesn't match), all refresh tokens for that user are immediately revoked.

### Frontend (Next.js 15 App Router)

```
src/
├── app/
│   ├── (auth)/         login, register — no navbar
│   ├── (public)/       feed, blog detail — SSR/ISR
│   └── (protected)/    dashboard — auth-gated CSR
├── components/
│   ├── ui/             Button, Input, Textarea, Badge, Spinner, EmptyState
│   ├── BlogCard        Feed item — pure presentational
│   ├── LikeButton      Optimistic update with server-confirmed sync
│   ├── CommentItem     Pure presentational
│   ├── CommentList     Client-side paginated comments
│   └── Navbar          Server component — reads session server-side
├── features/
│   ├── auth/           Server Actions + Zod schemas
│   └── blogs/          Server Actions + Zod schemas
└── lib/
    ├── api/client.ts   Typed fetch wrapper, auto token refresh on 401
    ├── session.ts      Cookie management (access: readable, refresh: httpOnly)
    └── constants.ts    API URL, routes, cookie keys
```

**Rendering strategy:**

| Route | Strategy | Reason |
|-------|----------|--------|
| `/feed` | SSR revalidate:30s | SEO + fresh content |
| `/blogs/[slug]` | ISR revalidate:60s | Static speed + auto-update |
| `/dashboard` | CSR | Auth-gated, no SEO needed |
| `/login` `/register` | CSR | Form-only pages |

**Cookie strategy** — Access tokens are stored as non-httpOnly cookies (JS-readable) so `client.ts` can attach them to API requests as `Authorization: Bearer` headers. Refresh tokens are httpOnly (never readable by JS). When a request gets a 401, `client.ts` calls the Next.js `/api/auth/refresh` route which reads the httpOnly refresh token server-side and returns a new access token.

**Optimistic UI for likes** — `LikeButton` updates the count and heart state immediately on click, then confirms/reverts based on the API response. `useTransition` prevents blocking React renders during the async call.

---

## API Endpoints

### Auth
```
POST   /api/v1/auth/register     Register new user
POST   /api/v1/auth/login        Login
POST   /api/v1/auth/refresh      Refresh access token
POST   /api/v1/auth/logout       Logout (invalidate refresh token)
```

### Blogs (authenticated)
```
POST   /api/v1/blogs             Create blog post
PATCH  /api/v1/blogs/:id         Update blog post (owner only)
DELETE /api/v1/blogs/:id         Delete blog post (owner only)
```

### Public
```
GET    /api/v1/public/feed              Paginated published feed
GET    /api/v1/public/blogs/:slug       Blog detail by slug
```

### Social (authenticated)
```
POST   /api/v1/blogs/:id/like          Like a post
DELETE /api/v1/blogs/:id/like          Unlike a post
POST   /api/v1/blogs/:id/comments      Add comment
GET    /api/v1/blogs/:id/comments      Get comments (public)
```

---

## Bonus Features Implemented

### ✅ Async Job Processing (BullMQ + Redis)
When a blog is published, a background job automatically generates an AI summary:
1. HTTP response returns immediately (non-blocking)
2. BullMQ worker picks up the job 1 second later
3. Summary is generated and stored in `blog.summary`
4. Visible on the blog detail page as "AI Summary"

### ✅ Rate Limiting (@nestjs/throttler)
- Auth endpoints: 10 requests / 60 seconds per IP
- Write endpoints: 60 requests / 60 seconds per IP
- Public feed/detail: exempt (Next.js SSR hits from server IP)
- Returns proper `429 Too Many Requests` with `retryAfter` field

### ✅ Structured Logging (Pino)
- Every request logged with: method, URL, status, response time, request ID
- Sensitive fields redacted: authorization header, password, refreshToken
- Development: colorized pretty-print via pino-pretty
- Production: raw JSON for log aggregators (Loki, CloudWatch, Datadog)
- Async job logs include: jobId, blogId, attempt number, duration

---

## Database Schema

```prisma
model User {
  id               String    @id @default(uuid())
  email            String    @unique
  username         String    @unique
  passwordHash     String
  displayName      String?
  role             Role      @default(USER)
  refreshTokenHash String?   // hashed, null after logout
  // ...
}

model Blog {
  id          String     @id @default(uuid())
  slug        String     @unique
  status      BlogStatus @default(DRAFT)
  likeCount   Int        @default(0)    // denormalized for feed performance
  commentCount Int       @default(0)   // denormalized for feed performance
  summary     String?                  // generated by async job
  // ...
}

model Like {
  userId  String
  blogId  String
  @@unique([userId, blogId])            // DB-level duplicate prevention
}

model Comment {
  body     String
  parentId String?   // supports threaded comments (1 level)
  @@index([blogId, createdAt])
}
```

---

## Tradeoffs Made

**Denormalized like/comment counts** — Storing counts directly on the `Blog` row means feed queries are a single JOIN-free read. The tradeoff is that counts can drift if the update transaction fails. Mitigated by using `$transaction` for atomic updates.

**Access token in non-httpOnly cookie** — Necessary for the client-side `fetch` wrapper to read and attach the token. The risk is XSS exposure. Mitigated by: short 15-minute expiry, refresh token remaining httpOnly, Content Security Policy headers in production.

**Mock AI summary** — The async job generates a summary by extracting sentences from the content rather than calling a real LLM. A real implementation would call OpenAI or Anthropic here.

**No email verification** — Users are active immediately after registration. Production would send a verification email.

---

## What I Would Improve

1. **Real AI summaries** — Replace mock with OpenAI/Anthropic API call in the BullMQ processor
2. **Image upload** — Replace URL input with direct file upload to S3/R2
3. **Search** — The schema already has `fullTextSearchPostgres` enabled; add a `/public/search?q=` endpoint
4. **Email notifications** — Notify authors on new comments/likes using a second BullMQ queue
5. **Infinite scroll** — Replace pagination on feed with intersection observer
6. **Draft autosave** — Debounced autosave in the blog editor
7. **E2E tests** — Add Playwright tests for the full user journey

---

## Scaling to 1M Users

**Database:**
- Read replicas for all `SELECT` queries (feed, blog detail)
- Connection pooling via PgBouncer
- Materialized views for the feed, refreshed every 30 seconds
- Redis cache for hot blog posts (cache-aside pattern, 60s TTL)

**Backend:**
- Horizontal scaling behind a load balancer (stateless — JWT auth)
- BullMQ workers scaled independently from API servers
- Rate limiting moved to Redis-backed store (currently in-memory, doesn't share across instances)

**Frontend:**
- CDN for ISR pages (already using Next.js ISR)
- Edge middleware for auth checks (already implemented)
- Image optimization via Next.js Image component

**Infrastructure:**
- Blog feed: pre-compute and cache in Redis on publish event
- Like counts: batch update every 30 seconds rather than on every click
- Database sharding by `userId` if write throughput becomes the bottleneck
