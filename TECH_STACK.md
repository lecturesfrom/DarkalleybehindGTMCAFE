# TECH_STACK — GTM Cafe_Raffle

## Core Stack

| Category | Package | Version | Purpose |
|----------|---------|---------|---------|
| Framework | Next.js (App Router) | 14.x | Server components, API routes, middleware, Vercel-native |
| Language | TypeScript | 5.x | Type safety across full stack |
| Styling | Tailwind CSS | 3.x | Utility-first CSS, no runtime cost |
| Database | Neon Postgres | — | Serverless Postgres, scales to zero, free tier |
| ORM | Prisma | 5.x | Type-safe client, migrations, seeding |
| Auth | Auth.js (NextAuth v5) | next-auth@beta | Slack OAuth provider + Prisma adapter |
| Validation | Zod | 3.x | Schema validation, client + server |
| Short IDs | nanoid | 5.x | URL-safe short codes for tracked redirects |
| Icons | Lucide React | latest | Consistent, lightweight icon set |

## Slack Integration

| Package | Version | Purpose |
|---------|---------|---------|
| @slack/bolt | 3.x | Slack bot framework (slash commands, interactive messages) |
| @slack/web-api | 7.x | Slack API client (user info, activity checks) |

## Infrastructure

| Service | Tier | Purpose |
|---------|------|---------|
| Vercel | Free / Pro | Hosting, deployment, edge functions |
| Neon | Free | Postgres database |
| Slack API | Free | OAuth, bot commands, user activity |

## Dev Tools

| Tool | Purpose |
|------|---------|
| ESLint | Linting |
| Prettier | Code formatting |
| prisma studio | Database GUI (dev only) |

## Explicitly NOT Using

- **State management libraries** (Zustand, Jotai, Redux) — Server components + React hooks cover everything
- **CSS-in-JS** (styled-components, Emotion) — Tailwind only
- **UI component library** (shadcn/ui, Radix) — Not in MVP. Can add later for polish.
- **Background job system** (BullMQ, Inngest) — Not needed until periodic link re-validation
- **Email service** (Resend, SendGrid) — Slack DMs replace email notifications for MVP
- **Separate API server** (Express, Fastify) — Next.js API routes handle everything

## Environment Variables

```
DATABASE_URL=               # Neon Postgres connection string
NEXTAUTH_URL=               # https://darkalleybehindgtmcafe.xyz (or http://localhost:3000)
NEXTAUTH_SECRET=            # Random secret for JWT signing (openssl rand -base64 32)
SLACK_CLIENT_ID=            # Slack app OAuth client ID
SLACK_CLIENT_SECRET=        # Slack app OAuth client secret
SLACK_SIGNING_SECRET=       # Slack app signing secret (for verifying requests)
SLACK_BOT_TOKEN=            # Slack bot user OAuth token (xoxb-...)
SLACK_WORKSPACE_ID=         # GTM Cafe workspace ID (for membership verification)
```

## Version Locking Rules

- Do not add packages not listed here without explicit approval
- Pin major versions in package.json
- Run `npm audit` before deploying
- Update dependencies monthly, test before merging
