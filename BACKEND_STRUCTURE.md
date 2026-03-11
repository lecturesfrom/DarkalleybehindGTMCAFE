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
**Rate limit**: 20/day per user

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
4. Queue contributor notification (in-app + Slack DM)

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

## Rate Limiting

DB-based, tied to user ID (not IP).

| Action | Limit | Window |
|--------|-------|--------|
| Link submission | 10 | per day |
| Raffle request | 20 | per day |
| Product suggestion | 5 | per day |

Implementation: Query count of actions in last 24h for user. If >= limit, return 429.

```sql
SELECT COUNT(*) FROM "ReferralLink"
WHERE "userId" = $1
AND "createdAt" > NOW() - INTERVAL '24 hours'
```

---

## Seed Data

### Admin User
- Kellen Casebeer — role: ADMIN, status: ACTIVE

### Products (14 GTM Cafe Partners)
| Name | Slug | Category |
|------|------|----------|
| HeyReach | heyreach | LinkedIn Automation |
| Smartlead | smartlead | Cold Email |
| OutboundSync | outboundsync | Sales Automation |
| The Deal Lab | the-deal-lab | Deal Intelligence |
| Ocean.io | ocean-io | Data Enrichment |
| BetterContact | bettercontact | Data Enrichment |
| IcyPeas | icypeas | Lead Generation |
| Prospeo | prospeo | Email Finding |
| Trigify | trigify | Signal-Based Selling |
| ScaledMail | scaledmail | Email Infrastructure |
| RevyOps | revyops | Revenue Operations |
| SaaSyDB | saasydb | Database |
| TitanX | titanx | Outbound Platform |
| Mailpool | mailpool | Email Infrastructure |
