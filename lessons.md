# Lessons Learned — GTM Cafe_Raffle

Updated after every correction or discovered pattern.

## Project-Specific
- Admin role gate must protect BOTH page routes (`/admin/*`) and API routes (`/api/admin/*`). The original check `pathname.startsWith("/admin")` only caught pages; `/api/admin/users` starts with `/api/`, not `/admin`, so it bypassed the gate. For API routes, return 403 JSON; for page routes, redirect to dashboard.

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
- In middleware, evaluate status-based access rules before generic auth-route redirects to avoid redirect loops and dead branches
