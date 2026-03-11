# GTM Cafe_Raffle — Master TODO

Track every step from IMPLEMENTATION_PLAN.md. Check off as completed.

## Blockers
- [ ] **Slack app not created** → blocks: 2.3 (activity check), 6.x (bot commands), OAuth testing
- [ ] **SLACK_WORKSPACE_ID unknown** → workspace gate is currently skipped (safe default)
- [ ] **Vercel project not set up** → blocks: 9.1+

---

## Phase 1: Project Foundation

- [x] 1.1 Initialize Next.js project (TypeScript, Tailwind, App Router, src/ dir)
- [x] 1.2 Install all dependencies from TECH_STACK.md
- [x] 1.3 Create full src/ folder structure
- [x] 1.4 Set up Prisma (schema → prisma generate → db push to Neon)
- [x] 1.5 Create .env.example (all vars documented)
- [x] 1.6 Create src/lib/prisma.ts (Prisma client singleton)
- [x] 1.7 Configure Auth.js (auth.config.ts + auth.ts + route wired)
- [x] 1.8 Create src/middleware.ts (route protection, status redirects, RBAC)

---

## Phase 2: Auth + Onboarding

- [ ] 2.1 Build /login page ("Sign in with Slack" button, dark alley vibe)
- [ ] 2.2 Build /pending page ("Your account is pending review")
- [ ] 2.3 Build Slack activity check (lib/slack.ts, users.info, account age > 30 days) ⚠️ needs SLACK_BOT_TOKEN
- [ ] 2.4 Create seed script (prisma/seed.ts — Kellen as admin, 14 partner products)
- [ ] 2.5 Build app layout shell ((app)/layout.tsx — nav, user menu, mobile bottom bar)
- [ ] 2.6 Build admin layout ((admin)/layout.tsx — admin nav, role gate)

---

## Phase 3: Link Submission

- [ ] 3.1 Create lib/links.ts (URL validation, redirect resolution, domain extraction, nanoid shortCode)
- [ ] 3.2 Build POST /api/links (full validation pipeline: Zod → fetch → dedupe → product inference → store)
- [ ] 3.3 Build GET /api/links (user's links with serve/click counts)
- [ ] 3.4 Build PATCH /api/links/[id] (update status/note/revealed, owner-only)
- [ ] 3.5 Build /submit page (URL input, product detection, note, visibility toggle)
- [ ] 3.6 Build /my-links page (table/cards, per-link stats, status badges, actions)

---

## Phase 4: Request + Redirect

- [ ] 4.1 Build GET /api/products (list/search with active link counts)
- [ ] 4.2 Build POST /api/products (member product suggestion)
- [ ] 4.3 Build POST /api/request (random selection, self-exclusion, LinkServe creation)
- [ ] 4.4 Build GET /r/[code]/route.ts (click logging, 302 redirect)
- [ ] 4.5 Build /request page (command bar, product grid, raffle button, result card)

---

## Phase 5: Admin Panel

- [ ] 5.1 Build admin API routes (GET/PATCH users, GET/PATCH links, full CRUD products)
- [ ] 5.2 Build /admin/users page (user list, status management, pending highlighted)
- [ ] 5.3 Build /admin/products page (product CRUD, suggested products section)
- [ ] 5.4 Build /admin/links page (all links, flag/remove actions)

---

## Phase 6: Slack Bot ⚠️ ALL steps need Slack app credentials

- [ ] 6.1 Set up Slack app (slash commands, request URLs, install to workspace)
- [ ] 6.2 Build Slack request verification (lib/slack.ts signing secret check)
- [ ] 6.3 Build /api/slack/commands/drop
- [ ] 6.4 Build /api/slack/commands/raffle
- [ ] 6.5 Build /api/slack/commands/mylinks
- [ ] 6.6 Build /api/slack/interactions (interactive message handlers)
- [ ] 6.7 Build contributor Slack DM notification

---

## Phase 7: Dashboard + Notifications

- [ ] 7.1 Build /dashboard page (greeting, quick actions, activity feed, stats, products needing referrals)
- [ ] 7.2 Build in-app notification system (badge, list/dropdown, mark as read)

---

## Phase 8: Polish + Rate Limiting

- [ ] 8.1 Add rate limiting (lib/rate-limit.ts, DB-based, per-user per-day)
- [ ] 8.2 Error states and loading skeletons (all pages)
- [ ] 8.3 Mobile responsive pass (test + fix all pages)
- [ ] 8.4 Landing page (public /, dark alley atmosphere, "Enter the alley" CTA)

---

## Phase 9: Deploy + Test

- [ ] 9.1 Set up Vercel project (connect repo, configure env vars)
- [ ] 9.2 Deploy and smoke test (all flows end-to-end on production URL)
- [ ] 9.3 Test edge cases (non-member login, low-activity user, no links, suspended, duplicate, rate limit, bad /r/code)
- [ ] 9.4 Seed demo data (realistic data for walkthrough with Kellen)
