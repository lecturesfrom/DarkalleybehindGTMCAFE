# PRD — GTM Cafe_Raffle

## Product Summary

GTM Cafe_Raffle is a member-only referral link router for the GTM Cafe community (~1,800 members). It democratizes referral distribution — instead of all referral links flowing through one person, any verified community member can contribute their own referral links. When someone needs a referral, the system randomly "raffles" a link from the pool, rewarding the contributor (via the product's own referral program) and giving the requester a useful link.

**Domain**: darkalleybehindgtmcafe.xyz
**Parent community**: GTM Cafe (gtmcafe.com) — a private, invite-only Slack community for go-to-market professionals run by Kellen Casebeer.

## Problem Statement

GTM Cafe members frequently ask in Slack for referral links to tools they use — "Anyone have a referral for [tool]?" There's no structured way to route those requests or share referral value across the community. Referral benefit flows to one person or disappears into chat history. Members who have referral links for tools they use have no easy way to put those links to work for the community.

## Target Users

- **Primary**: Verified GTM Cafe Slack members (GTM operators, sales/marketing professionals, revenue leaders)
- **Admin**: Kellen Casebeer (community owner) + designated moderators
- **Not in scope**: General public, non-GTM Cafe members

## Product Surfaces (MVP)

GTM Cafe_Raffle ships with two surfaces sharing one backend:

1. **Web app** at darkalleybehindgtmcafe.xyz — full-featured interface for browsing products, dropping links, raffling referrals, and viewing stats
2. **Slack bot** — slash commands (`/drop`, `/raffle`) integrated into the GTM Cafe Slack workspace for zero-friction usage without leaving Slack

Both surfaces authenticate via Slack OAuth, proving GTM Cafe membership.

## Core Features (MVP)

### F1: Authentication via Slack OAuth
- Members sign in with their Slack account from the GTM Cafe workspace
- Slack workspace ID is the primary membership gate
- On first sign-in, system checks Slack API for activity (account age, engagement indicators)
- Admin can override: approve, suspend, or flag any user
- **Acceptance criteria**: User clicks "Sign in with Slack" → redirected to Slack OAuth → authorized → returned to app with session. Non-GTM-Cafe Slack users are rejected.

### F2: Activity-Based Access Gate
- After Slack OAuth, system queries Slack API for:
  - When the user joined the workspace
  - Basic engagement signals (message count if available, channel membership)
- Users meeting the activity threshold are auto-approved
- Users below the threshold enter a "pending review" state for admin approval
- **Acceptance criteria**: Active members get instant access. New/lurker accounts see "Your account is pending review" and cannot submit or raffle until approved.

### F3: Submit Referral Link ("Drop a Link")
- Member pastes a referral URL
- System validates the URL, follows redirects to resolve the final destination
- System auto-detects the product from the domain (matched against known products catalog)
- If no match, member manually selects or suggests a new product
- Member optionally adds a note
- Member chooses visibility: reveal identity when link is raffled, or stay anonymous
- System generates a tracked short code (nanoid)
- Duplicate detection: same user + same final URL = rejected with message
- **Acceptance criteria**: Member pastes URL → sees auto-detected product → confirms → link appears in "My Links" with status ACTIVE.

### F4: Request Referral ("Raffle")
- Member searches/browses the product catalog or uses command bar
- Selects a product and hits "Raffle"
- System queries all ACTIVE links for that product, excludes the requester's own links
- Randomly selects one link (simple random: ORDER BY random() LIMIT 1)
- Returns a tracked redirect URL (`/r/[code]`) and, if the contributor opted in, their name/avatar
- If no links exist for the product, show "No referrals available yet — be the first to drop one!"
- **Acceptance criteria**: Member selects product → clicks Raffle → sees tracked redirect URL (+ contributor info if opted in) → can copy link with one click.

### F5: Tracked Redirect
- When someone visits `/r/[code]`, system:
  - Logs a LinkClick (user agent, timestamp, hashed IP)
  - 302 redirects to the real referral URL
- Lightweight, fast — no rendering, just a redirect
- **Acceptance criteria**: Click tracked redirect URL → arrives at actual referral destination. Click is logged in database.

### F6: My Links Dashboard
- Member sees all their submitted links
- Per-link stats: number of times served (raffled), number of clicks
- Can pause, edit note, or deactivate links
- **Acceptance criteria**: Member visits My Links → sees table of links with serve/click counts → can toggle link status.

### F7: Slack Bot Commands
- `/drop [url]` — submit a referral link directly from Slack. Bot auto-detects product, confirms, and stores.
- `/raffle [product]` — request a referral. Bot responds with tracked redirect URL (+ contributor info if opted in).
- `/mylinks` — view your submitted links and stats in Slack
- Bot responses are ephemeral (only visible to the user who ran the command) to avoid cluttering channels
- **Acceptance criteria**: Member types `/drop https://heyreach.io?ref=me` → bot confirms product detection → link stored. Member types `/raffle HeyReach` → bot responds with tracked URL.

### F8: Product Catalog
- Fully community-driven. The catalog grows from what members actually submit links for.
- Pre-seeded with 14 example products representing tools commonly used in GTM communities — these are **demo data only, not endorsements or partnerships**.
- Members can suggest any new product (submitted for admin verification before it appears in the catalog)
- Each product has: name, slug, domain(s), category, description, logo URL, verified status
- **Acceptance criteria**: Product catalog shows all verified products with active link counts. Members can suggest additions. Admin can approve/edit/remove.

### F11: First-Login Onboarding Nudge
- The raffle pool only works if members contribute links. New ACTIVE members see a one-time prompt on their first dashboard visit.
- Banner: "The raffle only works if people drop links. Drop your first referral link now." → CTA to /submit
- Dismissible (stored in localStorage — does not re-appear after dismiss)
- Empty state on /request (no links for a product): "No referrals yet for [Product]. Be the first to drop one!" → CTA to /submit
- **Acceptance criteria**: New member lands on /dashboard → sees onboarding banner. Dismisses → banner gone. Submits a link → banner gone. Empty product on /request → sees drop-link CTA.

### F9: Admin Panel (Web)
- Manage users: view all, approve/suspend, change roles
- Manage links: view all, flag/remove problematic links
- Manage products: full CRUD, verify new suggestions
- Manage invite activity: view who joined, when, activity status
- **Acceptance criteria**: Admin can perform all management actions listed above.

### F10: Contributor Notification
- When a member's link is raffled, they receive an in-app notification
- Web app: notification badge/toast on next visit
- Slack bot: DM to the contributor ("Your HeyReach link was just raffled!")
- **Acceptance criteria**: After a raffle, contributor sees notification on web and/or receives Slack DM.

## Non-Goals (Explicitly Out of Scope for MVP)

- Weighted/fair randomization (round-robin, decay)
- NLP or fuzzy product matching
- Public-facing marketing pages
- Analytics dashboards beyond personal My Links stats
- Email notifications (beyond what Slack covers)
- Thank-you / connection messaging flow between requester and contributor
- Domain allowlist for link validation
- Link expiry / periodic re-validation
- Chrome extension or bookmarklet (future surface)
- Payment processing or commission handling

## Success Criteria

1. A verified GTM Cafe member can submit a referral link in under 30 seconds (web or Slack)
2. A member can raffle a referral link in under 10 seconds (web or Slack)
3. Tracked redirects log 100% of clicks
4. Contributors are notified when their link is raffled
5. The system is live and usable within 7 build-days
6. Zero referral links are served from suspended or flagged users

## Open Design Questions

> These require more thought before finalizing. Document decisions in BACKEND_STRUCTURE.md when resolved.

- **Raffle mechanics**: Is the current on-demand raffle model (member requests → random link returned instantly) the right UX? Or should there be a queue/request flow ("I'm looking for a HeyReach referral") that gets matched asynchronously? Consider edge cases: what if no links exist? What if the only link belongs to the requester?
- **Raffle rate limit**: Current working default is 3 raffles/day per member (flat cap). This may need adjustment based on real usage patterns. The goal is preventing gaming while allowing legitimate multi-product exploration.
- **Link adoption flywheel**: How do we get the first 100 links into the system? Consider: admin outreach, Slack bot announcement, bulk-import from members who already have referral links.

---

## Risks + Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low link density early | Empty results for most products | Graceful "no referrals yet" UX; seed popular products; encourage drops |
| Referral link rot | Broken redirects over time | Post-MVP: periodic re-validation |
| Self-referral gaming | Undermines fairness | Auto-exclude own links from raffle results |
| Exploitation by lurkers | Bad actors farming referral value | Slack activity gate + admin approval for low-activity accounts |
| Slack app approval | Kellen needs to install bot in workspace | Web app works independently; Slack bot is additive |
| Rate limit bypass | Abuse via rapid submissions/requests | DB-based rate limiting tied to user ID |
