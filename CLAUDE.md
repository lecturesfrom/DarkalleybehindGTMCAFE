# GTM Cafe_Raffle — CLAUDE.md

## Project
GTM Cafe_Raffle: member-only referral link router for GTM Cafe community (~1,800 members).
Domain: darkalleybehindgtmcafe.xyz
Repo: DarkalleybehindGTMCAFE

Two surfaces, one backend: web app + Slack bot.

## Tech Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Neon Postgres via Prisma 5
- Auth.js v5 (Slack OAuth + Prisma adapter)
- Zod for validation, nanoid for short codes
- @slack/bolt + @slack/web-api for Slack bot
- Lucide React for icons
- Deployed on Vercel

## File Structure Rules
- Components: `src/components/` — functional components only, no class components
- API routes: `src/app/api/`
- Shared utilities: `src/lib/`
- Styles: `src/styles/` + Tailwind classes
- Pages follow Next.js App Router conventions with route groups: `(auth)`, `(app)`, `(admin)`

## Coding Rules
- Server components by default. Client components (`'use client'`) only when interactivity requires it.
- Always use Tailwind. Never inline styles. Never use CSS-in-JS.
- Mobile-first responsive approach.
- Dark mode is the primary theme (see FRONTEND_GUIDELINES.md for palette).
- Validate all API inputs with Zod schemas.
- Never expose secrets in frontend code.
- Use `nanoid(10)` for short codes.
- All database access through Prisma client singleton (`lib/prisma.ts`).
- Rate limiting is DB-based, tied to user ID.

## Forbidden
- Do not add packages not listed in TECH_STACK.md without asking.
- Do not build features not listed in PRD.md without asking.
- Do not use `any` type in TypeScript.
- Do not use inline styles.
- Do not commit .env files.
- Do not use class components.
- Do not add shadcn/ui or other UI libraries (MVP uses custom Tailwind components).

## Design Tokens (Quick Reference)
See FRONTEND_GUIDELINES.md for full palette. Key values:
- Background: `#0A0A0F` (page), `#141420` (surface), `#222238` (elevated)
- Text: `#F0F0F5` (primary), `#9494A8` (secondary), `#5C5C72` (muted)
- Accent: `#00FF88` (neon green), `#FFB800` (amber), `#FF4757` (red)
- Border: `#2A2A3E` (default)
- Font: Inter (body), JetBrains Mono (code/URLs)

## Reference Docs
- **PRD.md** — what we're building, features, non-goals, acceptance criteria
- **APP_FLOW.md** — every page, every user path, error states, navigation
- **TECH_STACK.md** — locked dependencies and versions
- **FRONTEND_GUIDELINES.md** — full design system, colors, spacing, components
- **BACKEND_STRUCTURE.md** — database schema, API contracts, auth logic, validation pipeline
- **IMPLEMENTATION_PLAN.md** — numbered build sequence, phase by phase

## Session Protocol
1. Read this file (CLAUDE.md) first — you're doing it now
2. Read `progress.txt` for current project state
3. Review `lessons.md` for known patterns and past corrections
4. Reference canonical docs for any implementation question
5. After completing any feature: update `progress.txt`
6. After any correction or discovered pattern: update `lessons.md`
7. When implementing a step: say "Building step X.Y from IMPLEMENTATION_PLAN.md"

## Demo Products (Example Seed Data — Not Endorsements)
The platform is community-driven. These 14 are pre-seeded as examples representing tools commonly used in GTM — not partnerships or endorsements. Members bring their own referral links for any tool they use.

HeyReach, Smartlead, OutboundSync, The Deal Lab, Ocean.io, BetterContact, IcyPeas, Prospeo, Trigify, ScaledMail, RevyOps, SaaSyDB, TitanX, Mailpool
