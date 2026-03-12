# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

This is a Next.js 14 (App Router) web app with a Slack bot backend, backed by PostgreSQL via Prisma. There is a single service — the Next.js dev server — which serves both the web UI and all API routes (including Slack bot endpoints).

### Database

A local PostgreSQL 16 instance is pre-installed. To start it and prepare the database:

```bash
sudo pg_ctlcluster 16 main start
sudo -u postgres psql -c "CREATE USER devuser WITH PASSWORD 'devpass' CREATEDB;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE gtmcafe OWNER devuser;" 2>/dev/null || true
```

The `.env` file should set `DATABASE_URL=postgresql://devuser:devpass@localhost:5432/gtmcafe`.

After the database is running, push the schema and generate the client:

```bash
npx prisma generate
npx prisma db push
```

### Environment variables

Copy `.env.example` to `.env` and fill in values. For local dev without real Slack OAuth, use placeholder values for `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN`, and `SLACK_WORKSPACE_ID`. Generate `AUTH_SECRET` with `openssl rand -base64 32`. Set `NEXTAUTH_URL=http://localhost:3000`.

### Running the app

- Dev server: `npm run dev` (port 3000)
- Build: `npm run build`
- Lint: `npm run lint`
- Prisma Studio: `npm run db:studio`

### Gotchas

- Slack OAuth is the **only** auth method. Without real Slack app credentials, you cannot log in — but the app still starts, serves pages, and responds to API routes.
- Most pages (`/login`, `/dashboard`, `/submit`, etc.) are intentional `return null` stubs. The project is in early Phase 1. The homepage at `/` renders the landing page.
- `next.config` must be `.mjs` (not `.ts`) — Next.js 14 does not support TypeScript config files.
- The `db:seed` script in `package.json` references `prisma/seed.ts` which does not exist yet.
- Always read `CLAUDE.md` for project rules and `progress.txt` for current state before making changes.
