# IMPLEMENTATION_PLAN — GTM Cafe_Raffle

## Build Sequence

Each step is one task. Execute in order. Reference the canonical doc noted in parentheses for specs.

---

## Phase 1: Project Foundation

### 1.1 Initialize Next.js project
`npx create-next-app@latest` with TypeScript, Tailwind CSS, App Router, ESLint, src/ directory

### 1.2 Install dependencies
From TECH_STACK.md:
```
npm install prisma @prisma/client next-auth@beta zod nanoid lucide-react
npm install @slack/bolt @slack/web-api
npm install -D @types/node
```

### 1.3 Create folder structure
```
src/
├── app/
│   ├── (auth)/login/
│   ├── (auth)/pending/
│   ├── (app)/dashboard/
│   ├── (app)/submit/
│   ├── (app)/request/
│   ├── (app)/my-links/
│   ├── (app)/profile/
│   ├── (admin)/admin/users/
│   ├── (admin)/admin/products/
│   ├── (admin)/admin/links/
│   ├── r/[code]/
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── links/
│       ├── request/
│       ├── products/
│       ├── admin/
│       └── slack/
│           ├── commands/
│           └── interactions/
├── components/
├── lib/
└── styles/
```

### 1.4 Set up Prisma
Initialize Prisma, copy full schema from BACKEND_STRUCTURE.md, run `prisma db push`

### 1.5 Create .env.example
All variables from TECH_STACK.md — Environment Variables section

### 1.6 Create lib/prisma.ts
Prisma client singleton with connection pooling for serverless

### 1.7 Configure Auth.js
Slack OAuth provider + Prisma adapter. Custom callbacks:
- signIn: verify workspace ID, check activity, set initial status
- session: include user role and status
- jwt: include user ID, role, status
(Reference: BACKEND_STRUCTURE.md — Authentication Logic)

### 1.8 Create middleware.ts
Route protection per BACKEND_STRUCTURE.md — Middleware Auth Checks

---

## Phase 2: Auth + Onboarding

### 2.1 Build /login page
"Sign in with Slack" button. Dark alley landing vibe.
(Reference: APP_FLOW.md — Flow 1, FRONTEND_GUIDELINES.md)

### 2.2 Build /pending page
"Your account is pending review" message for low-activity users.
(Reference: APP_FLOW.md — Flow 1)

### 2.3 Build Slack activity check
lib/slack.ts — function to check user activity via Slack Web API on first sign-in.
(Reference: BACKEND_STRUCTURE.md — Activity Check)

### 2.4 Create seed script
prisma/seed.ts — admin user (Kellen), 14 GTM Cafe partner products with domains.
(Reference: BACKEND_STRUCTURE.md — Seed Data)

### 2.5 Build app layout shell
(app)/layout.tsx — nav bar, user menu, mobile bottom bar.
(Reference: APP_FLOW.md — Navigation Structure, FRONTEND_GUIDELINES.md — Layout Rules)

### 2.6 Build admin layout
(admin)/layout.tsx — admin nav, role gate.
(Reference: APP_FLOW.md — Flow 10-12)

---

## Phase 3: Link Submission

### 3.1 Create lib/links.ts
URL validation, redirect resolution (server-side fetch with follow), domain extraction, shortCode generation (nanoid).
(Reference: BACKEND_STRUCTURE.md — Link Validation Pipeline)

### 3.2 Build POST /api/links
Full validation pipeline: Zod → fetch → dedupe → product inference → store.
(Reference: BACKEND_STRUCTURE.md — POST /api/links)

### 3.3 Build GET /api/links
User's links with aggregated serve/click counts via Prisma.
(Reference: BACKEND_STRUCTURE.md — GET /api/links)

### 3.4 Build PATCH /api/links/[id]
Update status, note, revealed. Owner-only.
(Reference: BACKEND_STRUCTURE.md — PATCH /api/links/[id])

### 3.5 Build /submit page
URL input, auto-detect product display, product selector fallback, note field, visibility toggle, confirmation.
(Reference: APP_FLOW.md — Flow 3, FRONTEND_GUIDELINES.md)

### 3.6 Build /my-links page
Table/cards with per-link stats, status badges, action buttons.
(Reference: APP_FLOW.md — Flow 8, FRONTEND_GUIDELINES.md)

---

## Phase 4: Request + Redirect

### 4.1 Build GET /api/products
List/search products with active link counts.
(Reference: BACKEND_STRUCTURE.md — GET /api/products)

### 4.2 Build POST /api/products
Member product suggestion (creates unverified product).
(Reference: BACKEND_STRUCTURE.md — POST /api/products)

### 4.3 Build POST /api/request
Random selection logic, self-exclusion, LinkServe creation, contributor notification trigger.
(Reference: BACKEND_STRUCTURE.md — POST /api/request)

### 4.4 Build GET /r/[code]/route.ts
Click logging (user agent, hashed IP, referer), 302 redirect.
(Reference: BACKEND_STRUCTURE.md — GET /r/[code])

### 4.5 Build /request page
Command bar + product grid, raffle button, result card with tracked URL + contributor info.
(Reference: APP_FLOW.md — Flow 5, FRONTEND_GUIDELINES.md)

---

## Phase 5: Admin Panel

### 5.1 Build admin API routes
GET/PATCH /api/admin/users, GET/PATCH /api/admin/links, full CRUD /api/admin/products.
(Reference: BACKEND_STRUCTURE.md — Admin Endpoints)

### 5.2 Build /admin/users page
User list with status management, pending users highlighted.
(Reference: APP_FLOW.md — Flow 10)

### 5.3 Build /admin/products page
Product list with CRUD, suggested products section.
(Reference: APP_FLOW.md — Flow 11)

### 5.4 Build /admin/links page
All links across users, flag/remove actions.
(Reference: APP_FLOW.md — Flow 12)

---

## Phase 6: Slack Bot

### 6.1 Set up Slack app configuration
Create Slack app, configure slash commands (/drop, /raffle, /mylinks), set request URLs, install to workspace.

### 6.2 Build Slack request verification
lib/slack.ts — verify Slack signing secret on all incoming requests.
(Reference: BACKEND_STRUCTURE.md — Slack Bot Endpoints)

### 6.3 Build /api/slack/commands/drop
Parse URL from command text, run link validation pipeline, respond with ephemeral message.
(Reference: APP_FLOW.md — Flow 4)

### 6.4 Build /api/slack/commands/raffle
Parse product name, fuzzy match, run raffle logic, respond with ephemeral message.
(Reference: APP_FLOW.md — Flow 6)

### 6.5 Build /api/slack/commands/mylinks
Query user's links, format as Slack blocks, respond with ephemeral message.

### 6.6 Build /api/slack/interactions
Handle interactive messages (product selection buttons, toggle anonymous).

### 6.7 Build contributor Slack DM notification
When a link is raffled, send DM to contributor via Slack bot.
(Reference: PRD.md — F10)

---

## Phase 7: Dashboard + Notifications

### 7.1 Build /dashboard page
Greeting, quick actions, recent activity feed, personal stats, products needing referrals.
(Reference: APP_FLOW.md — Flow 9, FRONTEND_GUIDELINES.md)

### 7.2 Build in-app notification system
Notification badge on nav, notification list/dropdown, mark as read.
(Reference: PRD.md — F10)

---

## Phase 8: Polish + Rate Limiting

### 8.1 Add rate limiting
lib/rate-limit.ts — DB-based rate limiter.
(Reference: BACKEND_STRUCTURE.md — Rate Limiting)

### 8.2 Error states and loading skeletons
Neon-pulsing skeleton loaders, error boundaries, empty states across all pages.
(Reference: FRONTEND_GUIDELINES.md — Micro-Interactions)

### 8.3 Mobile responsive pass
Test and fix all pages on mobile. Bottom bar, hamburger nav, card stacking.
(Reference: FRONTEND_GUIDELINES.md — Responsive Breakpoints)

### 8.4 Landing page
Public landing at `/`. Dark alley atmosphere, "Enter the alley" CTA, what this is, sign in with Slack.
(Reference: FRONTEND_GUIDELINES.md — Texture + Atmosphere)

---

## Phase 9: Deploy + Test

### 9.1 Set up Vercel project
Connect GitHub repo, configure all environment variables.

### 9.2 Deploy and smoke test
All flows end-to-end on production URL.

### 9.3 Test edge cases
- Non-GTM-Cafe Slack user tries to sign in → rejected
- Low-activity user → pending state
- No links available for a product → graceful empty state
- Suspended user → blocked
- Duplicate link submission → rejected with message
- Rate limit exceeded → 429 error shown
- Invalid /r/[code] → 404 page

### 9.4 Seed demo data
Realistic data for walkthrough/demo with Kellen.

---

## Dependencies Between Phases

```
Phase 1 (Foundation) → everything
Phase 2 (Auth) → Phase 3, 4, 5, 6, 7
Phase 3 (Links) → Phase 4 (Raffle needs links to exist)
Phase 4 (Request) → Phase 7 (Dashboard shows activity)
Phase 6 (Slack) can run in parallel with Phase 5 (Admin) and Phase 7 (Dashboard)
Phase 8 (Polish) → after all features are functional
Phase 9 (Deploy) → after all phases
```

Phases 5, 6, and 7 can be built in parallel once Phases 1-4 are complete.
