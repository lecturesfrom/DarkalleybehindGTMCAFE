# Lessons Learned — GTM Cafe_Raffle

Updated after every correction or discovered pattern.

## Project-Specific

### Auth.js v5 + Prisma + Edge Middleware: Two-File Pattern
**Problem**: PrismaClient is NOT edge-runtime compatible, but middleware runs on the edge.
**Solution**: Split into two files:
- `src/lib/auth.config.ts` — edge-safe: providers, JWT/session callbacks, session strategy. Used by middleware.
- `src/lib/auth.ts` — full server config: spreads authConfig + PrismaAdapter + signIn callbacks + events. Used by API routes and Server Components.
- `src/middleware.ts` imports `NextAuth(authConfig)` (NOT from auth.ts)

### Slack User ID is in `account.providerAccountId`
The `profile` object in Auth.js callbacks is the normalized provider profile. For Slack, `account.providerAccountId` is always the Slack user ID (`U1234567890`). Do not try to get it from `profile.sub` or `profile.user.id` — those may vary by scope.

### DB Credentials Stay in .env Only
**Never paste DATABASE_URL in chat.** The credential leaked into conversation history cannot be unlearned — rotate it immediately after any accidental exposure. The `.gitignore` already excludes `.env`, but the chat transcript is another leak vector.

### Next.js 14 Config Must Be .mjs
`next.config.ts` is NOT supported in Next.js 14.x — only Next.js 15+ added TypeScript config support. Always use `.mjs` or `.js`.

### API Route Stubs Need Valid Exports
Empty `.ts` route files with only comments or `export {}` will fail `next build` if they're in the `app/api/` directory and Next.js tries to verify them. Stubs need at least a minimal valid export like `export async function GET() {}`.

### JWT Strategy Required When Mixing Prisma Adapter + Middleware
With `adapter` set, Auth.js defaults to `database` sessions. You MUST explicitly set `session: { strategy: 'jwt' }` in `auth.config.ts` to enable JWT-based sessions — required for edge middleware to decode sessions without DB access.

## Architecture Decisions
- Slack OAuth is the ONLY auth method. No Google OAuth, no magic links. Slack workspace ID = membership gate.
- Activity check happens on first sign-in only, not on every login.
- Web app and Slack bot share the same backend — don't duplicate business logic.
- Raffle is simple random (ORDER BY random() LIMIT 1). No weighting, no round-robin in MVP.
- Contributors choose visibility at link submission time, not at raffle time.

## General Patterns
- Always read CLAUDE.md and progress.txt at session start
- Reference canonical docs before implementing any feature
- Update progress.txt after completing each step
- Test on mobile after every UI change
- When in doubt, check the canonical doc — don't guess
