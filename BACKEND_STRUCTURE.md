# BACKEND_STRUCTURE — GTM Cafe_Raffle

## Database Schema

PostgreSQL on Neon, managed via Prisma ORM.

### Entity Relationship Overview

```
User ──< ReferralLink ──< LinkServe ──< LinkClick
  │                          │
  │                          └── requester (User)
  │
  ├──< Account (Slack OAuth)
  ├──< Session
  └──< InviteCode (creator / redeemer)

Product ──< ReferralLink
```

### Table: User

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PK | |
| email | String | UNIQUE, NOT NULL | From Slack OAuth |
| name | String | | Display name from Slack |
| image | String | | Avatar URL from Slack |
| slackUserId | String | UNIQUE | Slack user ID (for DMs, activity checks) |
| slackUsername | String | | Slack display name |
| role | Enum: MEMBER, ADMIN | DEFAULT MEMBER | |
| status | Enum: PENDING, ACTIVE, SUSPENDED | DEFAULT PENDING | |
| revealByDefault | Boolean | DEFAULT true | Default link visibility preference |
| createdAt | DateTime | DEFAULT now() | |
| updatedAt | DateTime | @updatedAt | |

### Table: Account (NextAuth)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PK | |
| userId | String | FK → User.id, CASCADE | |
| type | String | | OAuth |
| provider | String | | "slack" |
| providerAccountId | String | | Slack user ID |
| access_token | String? | | OAuth access token |
| token_type | String? | | "bearer" |
| scope | String? | | Slack OAuth scopes |

Unique: (provider, providerAccountId)

### Table: Session (NextAuth)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PK | |
| sessionToken | String | UNIQUE | |
| userId | String | FK → User.id, CASCADE | |
| expires | DateTime | | |

### Table: VerificationToken (NextAuth)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| identifier | String | | |
| token | String | UNIQUE | |
| expires | DateTime | | |

Unique: (identifier, token)

### Table: Product

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PK | |
| name | String | NOT NULL | e.g. "HeyReach" |
| slug | String | UNIQUE, NOT NULL | e.g. "heyreach" |
| domain | String? | | Primary domain for URL matching, e.g. "heyreach.io" |
| domains | String[] | | Additional domains (some products have multiple) |
| category | String? | | e.g. "Cold Email", "Data Enrichment" |
| description | String? | | Short product description |
| logoUrl | String? | | Product logo URL |
| website | String? | | Product homepage URL |
| verified | Boolean | DEFAULT false | Admin-verified |
| suggestedBy | String? | FK → User.id | Who suggested it (null = admin-seeded) |
| createdAt | DateTime | DEFAULT now() | |
| updatedAt | DateTime | @updatedAt | |

### Table: ReferralLink

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PK | |
| userId | String | FK → User.id | Who submitted this link |
| productId | String | FK → Product.id | What product it's for |
| originalUrl | String | NOT NULL | URL as pasted by user |
| finalUrl | String | NOT NULL | URL after following redirects |
| shortCode | String | UNIQUE, NOT NULL | nanoid(10) for /r/[code] |
| status | Enum: ACTIVE, PAUSED, FLAGGED, EXPIRED | DEFAULT ACTIVE | |
| note | String? | | Optional note from submitter |
| revealed | Boolean | DEFAULT true | Show contributor identity when raffled |
| createdAt | DateTime | DEFAULT now() | |
| updatedAt | DateTime | @updatedAt | |

Unique: (userId, finalUrl) — prevents duplicate submissions

### Table: LinkServe

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PK | |
| referralLinkId | String | FK → ReferralLink.id | Which link was served |
| requesterId | String | FK → User.id | Who requested the raffle |
| createdAt | DateTime | DEFAULT now() | |

### Table: LinkClick

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PK | |
| linkServeId | String | UNIQUE, FK → LinkServe.id | One click per serve |
| userAgent | String? | | Browser user agent |
| ipHash | String? | | Hashed IP (privacy-preserving) |
| referer | String? | | HTTP referer header |
| createdAt | DateTime | DEFAULT now() | |

### Table: Notification

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (cuid) | PK | |
| userId | String | FK → User.id, CASCADE | Notification recipient |
| type | Enum: LINK_RAFFLED, ACCOUNT_APPROVED, ACCOUNT_SUSPENDED, LINK_FLAGGED, PRODUCT_APPROVED | | |
| title | String | NOT NULL | e.g. "Link Raffled!" |
| message | String | NOT NULL | e.g. "Your HeyReach link was just raffled" |
| linkId | String? | FK → ReferralLink.id, SET NULL | Related link if applicable |
| read | Boolean | DEFAULT false | Has user seen this? |
| createdAt | DateTime | DEFAULT now() | |

Indexes:
- `(userId, read)` — for fetching unread notifications
- `(userId, createdAt)` — for activity feed ordering

---

## Authentication Logic

### Slack OAuth Flow
1. User clicks "Sign in with Slack"
2. Redirect to Slack OAuth: `https://slack.com/oauth/v2/authorize` with scopes: `identity.basic`, `identity.email`, `identity.avatar`, `identity.team`
3. Slack redirects back with auth code
4. Server exchanges code for token, retrieves user identity
5. **Verify workspace**: Check `team.id` matches `SLACK_WORKSPACE_ID` env var. If not → reject.
6. Create or update User + Account in database
7. Establish session (JWT via NextAuth)

### Activity Check (on first sign-in)
After Slack OAuth succeeds and workspace is verified:
1. Use Slack Web API (`users.info`) to get user profile including `updated` timestamp
2. Check account age: `Date.now() - user.created` (Slack API `users.info` returns creation date)
3. If available, check engagement signals from accessible API data
4. **Auto-approve** if: account age > 30 days
5. **Pending review** if: account age <= 30 days or other flags
6. Admin can override any decision

### Middleware Auth Checks
```
Request to any route
    │
    ├── Public routes (/, /login, /r/[code], /api/auth/*) → Allow
    │
    ├── No session → Redirect to /login
    │
    ├── status=PENDING → Redirect to /pending
    │
    ├── status=SUSPENDED → Show error page
    │
    ├── /admin/* routes + role!=ADMIN → 403
    │
    └── status=ACTIVE → Allow through
```

---

## API Endpoint Contracts

### POST /api/links — Submit a referral link

**Auth**: Required, ACTIVE status
**Rate limit**: 10/day per user

Request:
```json
{
  "url": "https://heyreach.io/referral?ref=member123",
  "productId": "cuid_optional",
  "note": "My personal referral link",
  "revealed": true
}
```

Validation (Zod):
```
url: z.string().url().max(2048)
productId: z.string().cuid().optional()
note: z.string().max(500).optional()
revealed: z.boolean().default(true)
```

Processing:
1. Validate URL format
2. HTTP GET with `redirect: 'follow'`, capture `response.url` as `finalUrl`
3. Check duplicate: `WHERE userId = currentUser AND finalUrl = resolved`
4. If `productId` not provided, extract domain from `finalUrl`, query `Product WHERE domain LIKE '%extracted%'`
5. Generate `shortCode` via `nanoid(10)`
6. Insert ReferralLink

Response (201):
```json
{
  "id": "cuid",
  "shortCode": "abc123xyz0",
  "product": { "id": "cuid", "name": "HeyReach", "logoUrl": "..." },
  "status": "ACTIVE",
  "redirectUrl": "/r/abc123xyz0"
}
```

Errors:
- 400: Invalid URL, missing required fields
- 409: Duplicate link
- 422: URL unreachable
- 429: Rate limited

### GET /api/links — List user's links

**Auth**: Required, ACTIVE status

Response (200):
```json
{
  "links": [
    {
      "id": "cuid",
      "product": { "id": "cuid", "name": "HeyReach", "logoUrl": "..." },
      "originalUrl": "...",
      "shortCode": "abc123xyz0",
      "status": "ACTIVE",
      "revealed": true,
      "note": "...",
      "serveCount": 12,
      "clickCount": 8,
      "createdAt": "2026-03-01T..."
    }
  ]
}
```

### PATCH /api/links/[id] — Update a link

**Auth**: Required, owner only

Request:
```json
{
  "status": "PAUSED",
  "note": "Updated note",
  "revealed": false
}
```

### POST /api/request — Raffle a referral

**Auth**: Required, ACTIVE status
**Rate limit**: 3/day per user (flat cap across all products — working default, subject to change)

Request:
```json
{
  "productId": "cuid"
}
```

Processing:
1. Query `ReferralLink WHERE productId = ? AND status = ACTIVE AND userId != currentUser`
2. `ORDER BY random() LIMIT 1`
3. Create LinkServe record
4. Create Notification record for contributor (in-app)
5. Send Slack DM to contributor (best-effort, see Notification Delivery section)

Response (200):
```json
{
  "redirectUrl": "/r/abc123xyz0",
  "contributor": {
    "name": "Jane D.",
    "image": "https://...",
    "revealed": true
  },
  "product": {
    "name": "HeyReach",
    "logoUrl": "..."
  }
}
```

If `contributor.revealed` is false:
```json
{
  "contributor": {
    "name": "Anonymous",
    "image": null,
    "revealed": false
  }
}
```

Errors:
- 404: No active links for this product
- 429: Rate limited

### GET /r/[code] — Tracked redirect

**Auth**: None required

Processing:
1. Look up ReferralLink by shortCode
2. Find associated LinkServe (most recent for this shortCode)
3. Create LinkClick record (userAgent, hashed IP, referer)
4. Return 302 redirect to `finalUrl`

Errors:
- 404: Invalid or expired code → render 404 page

### GET /api/products — List products

**Auth**: Required, ACTIVE status

Query params: `?search=hey&category=Cold+Email`

Response (200):
```json
{
  "products": [
    {
      "id": "cuid",
      "name": "HeyReach",
      "slug": "heyreach",
      "category": "LinkedIn Automation",
      "logoUrl": "...",
      "verified": true,
      "linkCount": 7
    }
  ]
}
```

### POST /api/products — Suggest a product

**Auth**: Required, ACTIVE status

Request:
```json
{
  "name": "New Tool",
  "domain": "newtool.com",
  "category": "Cold Email"
}
```

Creates product with `verified: false`, `suggestedBy: currentUser.id`

### GET /api/dashboard/stats — User statistics

**Auth**: Required, ACTIVE status

Response (200):
```json
{
  "stats": {
    "linksDropped": 12,
    "timesServed": 47,
    "totalClicks": 38,
    "rafflesUsed": 2,
    "rafflesRemaining": 1
  }
}
```

**Implementation:** Aggregate counts from ReferralLink, LinkServe, LinkClick for current user.

### GET /api/dashboard/activity — Recent activity feed

**Auth**: Required, ACTIVE status

Query params: `?limit=10`

Response (200):
```json
{
  "activities": [
    {
      "id": "cuid",
      "type": "LINK_RAFFLED",
      "message": "Your HeyReach link was raffled",
      "timestamp": "2026-03-12T10:30:00Z",
      "link": {
        "id": "cuid",
        "product": { "name": "HeyReach", "logoUrl": "..." }
      }
    },
    {
      "id": "cuid",
      "type": "RAFFLE_REQUESTED",
      "message": "You raffled a Smartlead link",
      "timestamp": "2026-03-11T15:20:00Z",
      "link": {
        "id": "cuid",
        "product": { "name": "Smartlead", "logoUrl": "..." }
      }
    }
  ]
}
```

**Data Source:**
- Union of:
  - LinkServe where `referralLinkId IN (user's links)` → "Your [product] link was raffled"
  - LinkServe where `requesterId = currentUser` → "You raffled a [product] link"
  - Notification where `userId = currentUser AND type = ACCOUNT_APPROVED` → "Your account was approved"

### GET /api/notifications — Unread notifications

**Auth**: Required, ACTIVE status

Response (200):
```json
{
  "notifications": [
    {
      "id": "cuid",
      "type": "LINK_RAFFLED",
      "title": "Link Raffled!",
      "message": "Your HeyReach link was just raffled",
      "read": false,
      "createdAt": "2026-03-12T10:30:00Z",
      "link": {
        "id": "cuid",
        "product": { "name": "HeyReach" }
      }
    }
  ],
  "unreadCount": 3
}
```

### PATCH /api/notifications/[id] — Mark notification as read

**Auth**: Required, owner only

Request:
```json
{
  "read": true
}
```

Response (200):
```json
{
  "id": "cuid",
  "read": true
}
```

### POST /api/notifications/mark-all-read — Mark all as read

**Auth**: Required, ACTIVE status

Response (200):
```json
{
  "updatedCount": 3
}
```

### Admin Endpoints

All require ADMIN role.

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/admin/users | List all users with filters |
| PATCH | /api/admin/users/[id] | Update status/role |
| GET | /api/admin/links | List all links with filters |
| PATCH | /api/admin/links/[id] | Flag/remove/restore |
| GET | /api/admin/products | List all products |
| POST | /api/admin/products | Create product |
| PATCH | /api/admin/products/[id] | Update/verify product |
| DELETE | /api/admin/products/[id] | Remove product |

---

## Slack Bot Endpoints

The Slack bot runs as part of the Next.js app (API routes handle Slack events).

### Slash Command: /drop

Route: `POST /api/slack/commands/drop`

1. Verify Slack signing secret
2. Parse URL from command text
3. Run same validation pipeline as `POST /api/links`
4. Respond with ephemeral message (success or error)

### Slash Command: /raffle

Route: `POST /api/slack/commands/raffle`

1. Verify Slack signing secret
2. Parse product name from command text
3. Fuzzy match against Product catalog
4. Run same raffle logic as `POST /api/request`
5. Respond with ephemeral message (tracked URL + contributor info)

### Slash Command: /mylinks

Route: `POST /api/slack/commands/mylinks`

1. Verify Slack signing secret
2. Query user's links
3. Respond with ephemeral message (formatted link list with stats)

### Event: Interactive Messages

Route: `POST /api/slack/interactions`

Handles button clicks from bot messages (e.g., product selection during /drop, toggle anonymous)

---

## Link Validation Pipeline

```
User pastes URL
       │
       ▼
  1. Zod: valid URL format? max 2048 chars?
       │ NO → return 400 "Invalid URL"
       ▼
  2. HTTP GET (server-side fetch, redirect: 'follow', timeout: 10s)
       │ FAIL → return 422 "Couldn't reach URL"
       ▼
  3. Capture response.url as finalUrl
       │
       ▼
  4. Duplicate check: same user + same finalUrl?
       │ YES → return 409 "Already submitted"
       ▼
  5. Extract domain from finalUrl (new URL(finalUrl).hostname)
       │
       ▼
  6. Match domain against Product.domain / Product.domains[]
       │
       ├── MATCH → auto-assign productId
       └── NO MATCH → return product as null, frontend shows selector
       │
       ▼
  7. Generate shortCode: nanoid(10)
       │
       ▼
  8. Insert ReferralLink
```

---

## Notification Delivery Mechanism

**Design Decision:** Synchronous in-app + best-effort Slack DM (no background job system per TECH_STACK.md)

Since TECH_STACK.md explicitly excludes background job systems for MVP, notifications are handled as follows:

### In-App Notifications (Synchronous)

When a raffle occurs (POST /api/request):
1. Create `Notification` record in database immediately after LinkServe
2. User sees notification on next page load (query unread notifications)
3. No queue needed — database write is fast (<50ms)

```typescript
// In POST /api/request after LinkServe creation
await prisma.notification.create({
  data: {
    userId: link.userId, // contributor
    type: 'LINK_RAFFLED',
    title: 'Link Raffled!',
    message: `Your ${product.name} link was just raffled`,
    linkId: link.id,
  },
})
```

### Slack DM Notifications (Best-Effort Asynchronous)

After creating the Notification record, attempt to send a Slack DM:
- If Slack DM succeeds → great, user gets instant notification
- If Slack DM fails (rate limit, network error, token expired) → catch error, log it, continue
- User still gets in-app notification, so no data loss
- Trade-off: Some Slack DMs may be lost, but this is acceptable for MVP

```typescript
// lib/notifications.ts
import { sendSlackDM } from '@/lib/slack'
import { prisma } from '@/lib/prisma'

export async function notifyContributor(
  contributorId: string,
  contributorSlackId: string | null,
  productName: string,
  linkId: string
) {
  // 1. Always create in-app notification (primary)
  await prisma.notification.create({
    data: {
      userId: contributorId,
      type: 'LINK_RAFFLED',
      title: 'Link Raffled!',
      message: `Your ${productName} link was just raffled`,
      linkId,
    },
  })

  // 2. Best-effort Slack DM (bonus)
  if (contributorSlackId) {
    try {
      await sendSlackDM(
        contributorSlackId,
        `🎉 Your ${productName} referral link was just raffled! Check your dashboard for details.`
      )
    } catch (error) {
      console.error('Failed to send Slack DM notification:', error)
      // Don't throw — in-app notification is primary, Slack DM is bonus
    }
  }
}
```

### Future Enhancement (Post-MVP)

If Slack DM reliability becomes important:
1. Add `slackDmSent: Boolean @default(false)` to Notification model
2. Create Vercel Cron Job that queries `Notification WHERE slackDmSent = false AND createdAt > 1h ago`
3. Retry failed DMs in batch (respecting Slack rate limits)

---

## Rate Limiting

DB-based, tied to user ID (not IP).

| Action | Limit | Window | Notes |
|--------|-------|--------|-------|
| Link submission | 10 | per day | COUNT(ReferralLink WHERE userId = user AND createdAt > 24h) |
| Raffle request | 3 | per day | Flat daily cap across all products. Working default — review after launch. |
| Product suggestion | 5 | per day | COUNT(Product WHERE suggestedBy = user AND createdAt > 24h) |

Implementation: Query count of actions in last 24h for user. If >= limit, return 429.

```sql
-- Link submission rate check
SELECT COUNT(*) FROM "ReferralLink"
WHERE "userId" = $1
AND "createdAt" > NOW() - INTERVAL '24 hours'

-- Raffle rate check (flat daily cap)
SELECT COUNT(*) FROM "LinkServe"
WHERE "requesterId" = $1
AND "createdAt" > NOW() - INTERVAL '24 hours'
```

> **Design note**: The raffle rate limit (3/day) is a working default. The deeper raffle workflow — how requests are matched, what happens when no links exist, queue vs. instant model — is an open design question documented in PRD.md. Revisit this limit after observing real usage patterns.

---

## Seed Data

### Admin Setup
No admin user is hardcoded in seed data. Process:
1. First admin signs in via Slack OAuth (creates a MEMBER account)
2. Promote to ADMIN via Prisma Studio or direct SQL: `UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com'`
3. Subsequent admins can be promoted via the Admin Panel → Users → Make Admin

### Products (14 Demo Examples — NOT endorsements)
These are example product entries pre-seeded to make the app testable from day one. The platform is **community-driven** — the real catalog grows from whatever tools members actually submit links for. These 14 represent tools commonly used in GTM communities; their presence is not an endorsement or partnership.

| Name | Slug | Domain | Category |
|------|------|--------|----------|
| HeyReach | heyreach | heyreach.io | LinkedIn Automation |
| Smartlead | smartlead | smartlead.ai | Cold Email |
| OutboundSync | outboundsync | outboundsync.com | Sales Automation |
| The Deal Lab | the-deal-lab | thedeallab.io | Deal Intelligence |
| Ocean.io | ocean-io | ocean.io | Data Enrichment |
| BetterContact | bettercontact | bettercontact.io | Data Enrichment |
| IcyPeas | icypeas | icypeas.com | Lead Generation |
| Prospeo | prospeo | prospeo.io | Email Finding |
| Trigify | trigify | trigify.io | Signal-Based Selling |
| ScaledMail | scaledmail | scaledmail.com | Email Infrastructure |
| RevyOps | revyops | revyops.com | Revenue Operations |
| SaaSyDB | saasydb | saasydb.com | Database |
| TitanX | titanx | titanx.ai | Outbound Platform |
| Mailpool | mailpool | mailpool.app | Email Infrastructure |
