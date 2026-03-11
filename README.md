# GTM Cafe_Raffle

Member-only referral link router for the GTM Cafe community. Members drop their referral links, and when someone needs a referral, the system randomly raffles one from the pool.

**Domain**: darkalleybehindgtmcafe.xyz
**Community**: GTM Cafe (gtmcafe.com) — 1,800+ go-to-market professionals

## How It Works

1. **Drop** — A GTM Cafe member submits their referral link for a product (HeyReach, Smartlead, etc.)
2. **Raffle** — When someone needs a referral, the system randomly picks a link from the pool
3. **Reward** — The contributor benefits from the product's own referral program
4. **Track** — Every raffle and click is logged so contributors can see their impact

Two surfaces: **web app** at darkalleybehindgtmcafe.xyz + **Slack bot** with `/drop` and `/raffle` commands.

## Tech Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Neon Postgres · Prisma · Auth.js (Slack OAuth) · Slack Bolt · Vercel

## Documentation

This project follows a documentation-first system. All specs live in the repo root:

| File | Purpose |
|------|---------|
| [PRD.md](PRD.md) | Product requirements, features, non-goals, acceptance criteria |
| [APP_FLOW.md](APP_FLOW.md) | Every page, every user path, error states, navigation |
| [TECH_STACK.md](TECH_STACK.md) | Locked dependencies, versions, environment variables |
| [FRONTEND_GUIDELINES.md](FRONTEND_GUIDELINES.md) | Design system — colors, typography, spacing, components |
| [BACKEND_STRUCTURE.md](BACKEND_STRUCTURE.md) | Database schema, API contracts, auth logic, validation |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Step-by-step build sequence (9 phases, ~35 steps) |
| [CLAUDE.md](CLAUDE.md) | AI operating manual — rules, constraints, session protocol |
| [progress.txt](progress.txt) | Current project state, what's done, what's next |
| [lessons.md](lessons.md) | Self-improving rulebook, patterns, corrections |

## Status

Documentation phase complete. Ready for Phase 1: Project Foundation.
