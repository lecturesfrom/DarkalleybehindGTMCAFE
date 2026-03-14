# Documentation Gap Action Plan — GTM Cafe_Raffle

**Purpose:** Prioritized, actionable steps to fill critical documentation gaps before proceeding with Phases 4-9.

**Created:** 2026-03-12  
**Updated:** 2026-03-12  
**Status:** ✅ TIER 1 COMPLETE — Phases 4-7 unblocked

---

## Priority Levels

- 🔴 **CRITICAL** — Blocks current/next phase implementation
- 🟡 **HIGH** — Needed within 1-2 phases, high guesswork without it
- 🟢 **MEDIUM** — Nice to have, improves consistency
- ⚪ **LOW** — Polish, can defer until Phase 8+

---

## Tier 1: Immediate Blockers (Complete Before Phase 4)

### 🔴 Action 1: Add Notification Schema to Database

**Why Critical:** Phase 7.2 (In-app notifications) is unbuildable without this. F10 (Contributor Notification) cannot be completed.

**File to Update:** `prisma/schema.prisma`

**Changes:**

```prisma
// Add this enum after the existing enums (after LinkStatus)
enum NotificationType {
  LINK_RAFFLED        // Your link was raffled by someone
  ACCOUNT_APPROVED    // Admin approved your account
  ACCOUNT_SUSPENDED   // Your account was suspended
  LINK_FLAGGED        // Admin flagged one of your links
  PRODUCT_APPROVED    // Your suggested product was approved
}

// Add this model after LinkClick
model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  message   String
  linkId    String?          // Related link ID if applicable
  link      ReferralLink?    @relation(fields: [linkId], references: [id], onDelete: SetNull)
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  @@index([userId, read])
  @@index([userId, createdAt])
}

// Update User model to add notifications relation
model User {
  // ... existing fields ...
  notifications Notification[]  // Add this line
}

// Update ReferralLink model to add notifications relation
model ReferralLink {
  // ... existing fields ...
  notifications Notification[]  // Add this line
}
```

**Next Steps After Adding:**
1. Run `npx prisma format` to format the schema
2. Run `npx prisma db push` to update Neon database
3. Run `npx prisma generate` to update Prisma client
4. Test: Create a notification in Prisma Studio to verify

**Estimated Time:** 15 minutes

---

### 🔴 Action 2: Document Notification Delivery Mechanism

**Why Critical:** TECH_STACK.md says "no background job system" but BACKEND_STRUCTURE.md says "queue contributor notification." This contradiction must be resolved.

**File to Update:** `BACKEND_STRUCTURE.md`

**Section to Add:** After the "POST /api/request" section (around line 273)

**Proposed Content:**

```markdown
### Notification Delivery Mechanism

**Design Decision:** Synchronous in-app + asynchronous Slack DM

Since TECH_STACK.md explicitly excludes background job systems for MVP, notifications are handled as follows:

1. **In-App Notifications** (synchronous):
   - When a link is raffled (POST /api/request), immediately create a `Notification` record in the database
   - The contributor sees the notification on next page load (query unread notifications)
   - No queue needed — database write is fast

2. **Slack DM Notifications** (best-effort asynchronous):
   - POST /api/request creates the Notification record, then attempts Slack DM
   - If Slack DM succeeds → great
   - If Slack DM fails (rate limit, network error) → catch error, log it, continue
   - User still gets in-app notification, so no data loss
   - Trade-off: Some Slack DMs may be lost, but this is acceptable for MVP

**Implementation Pattern (lib/slack.ts):**

```typescript
export async function notifyContributor(
  contributorSlackId: string,
  productName: string,
  linkId: string
) {
  try {
    await slackClient.chat.postMessage({
      channel: contributorSlackId,
      text: `🎉 Your ${productName} referral link was just raffled! Check your dashboard for details.`,
    })
  } catch (error) {
    console.error('Failed to send Slack DM notification:', error)
    // Don't throw — in-app notification is primary, Slack DM is bonus
  }
}
```

**Future Enhancement (Post-MVP):**
- Add Vercel Cron Job that queries Notifications where `slackDmSent = false` and retries
- Add `slackDmSent` boolean to Notification model
```

**Estimated Time:** 30 minutes

---

### 🔴 Action 3: Document Dashboard API Endpoints

**Why Critical:** APP_FLOW.md shows dashboard with "recent activity feed" and "stats" but no API endpoints are documented for fetching this data.

**File to Update:** `BACKEND_STRUCTURE.md`

**Section to Add:** After "POST /api/products" section

**Proposed Content:**

```markdown
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

---

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

**SQL Implementation Hint:**
```sql
-- Activity from raffles (both sides)
SELECT 'LINK_RAFFLED' as type, ls.createdAt, rl.productId
FROM "LinkServe" ls
JOIN "ReferralLink" rl ON ls."referralLinkId" = rl.id
WHERE rl."userId" = $currentUserId

UNION ALL

SELECT 'RAFFLE_REQUESTED' as type, ls.createdAt, rl.productId
FROM "LinkServe" ls
JOIN "ReferralLink" rl ON ls."referralLinkId" = rl.id
WHERE ls."requesterId" = $currentUserId

ORDER BY createdAt DESC
LIMIT 10
```

---

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

---

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

---

### POST /api/notifications/mark-all-read — Mark all as read

**Auth**: Required, ACTIVE status

Response (200):
```json
{
  "updatedCount": 3
}
```
```

**Estimated Time:** 45 minutes

---

## Tier 2: High Priority (Complete Before Phase 5-7)

### 🟡 Action 4: Add Component Library Section to FRONTEND_GUIDELINES.md

**Why High Priority:** Multiple pages need these components (dashboard, request, admin). Without specs, each developer will implement differently.

**File to Update:** `FRONTEND_GUIDELINES.md`

**Section to Add:** After "Component Patterns" section (before "Responsive Breakpoints")

**Proposed Content:**

````markdown
## Component Library

### Command Bar with Autocomplete

**Usage:** Request page product search

**Behavior:**
- User types → debounced search (300ms)
- Fuzzy match on product name, category, domain
- Show max 8 results
- Keyboard nav: ↑/↓ to select, Enter to choose, Esc to close
- Click outside to close

**Styling:**
```jsx
<div className="relative w-full max-w-xl">
  <input
    type="text"
    placeholder="Search for a product..."
    className="w-full bg-[#0A0A0F] border border-[#2A2A3E] rounded-lg px-4 py-3 text-[#F0F0F5] placeholder:text-[#5C5C72] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88]/30"
  />
  
  {/* Results dropdown */}
  {showResults && (
    <div className="absolute top-full mt-2 w-full bg-[#141420] border border-[#2A2A3E] rounded-lg shadow-lg overflow-hidden">
      {results.map((product, idx) => (
        <button
          key={product.id}
          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[#1C1C2E] ${idx === selectedIdx ? 'bg-[#1C1C2E]' : ''}`}
        >
          <img src={product.logoUrl} className="w-8 h-8 rounded" />
          <div>
            <div className="text-[#F0F0F5] font-medium">{product.name}</div>
            <div className="text-xs text-[#9494A8]">{product.category}</div>
          </div>
        </button>
      ))}
    </div>
  )}
</div>
```

**State Management:**
```typescript
const [query, setQuery] = useState('')
const [results, setResults] = useState<Product[]>([])
const [selectedIdx, setSelectedIdx] = useState(0)
const [showResults, setShowResults] = useState(false)

// Debounced search
useEffect(() => {
  const timer = setTimeout(async () => {
    if (query.length > 0) {
      const res = await fetch(`/api/products?search=${query}`)
      const data = await res.json()
      setResults(data.products.slice(0, 8))
      setShowResults(true)
    } else {
      setShowResults(false)
    }
  }, 300)
  return () => clearTimeout(timer)
}, [query])

// Keyboard nav
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    setSelectedIdx(prev => Math.min(prev + 1, results.length - 1))
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    setSelectedIdx(prev => Math.max(prev - 1, 0))
  } else if (e.key === 'Enter' && results[selectedIdx]) {
    selectProduct(results[selectedIdx])
  } else if (e.key === 'Escape') {
    setShowResults(false)
  }
}
```

---

### Notification Badge & Dropdown

**Usage:** Top navigation bar

**Badge (unread count):**
```jsx
<button className="relative p-2 text-[#9494A8] hover:text-[#F0F0F5]">
  <Bell className="w-5 h-5" />
  {unreadCount > 0 && (
    <span className="absolute top-0 right-0 bg-[#00FF88] text-[#0A0A0F] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</button>
```

**Dropdown:**
```jsx
<div className="absolute top-full right-0 mt-2 w-80 bg-[#141420] border border-[#2A2A3E] rounded-lg shadow-lg overflow-hidden">
  {/* Header */}
  <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A3E]">
    <h3 className="text-[#F0F0F5] font-semibold">Notifications</h3>
    <button className="text-xs text-[#00FF88] hover:underline">Mark all read</button>
  </div>
  
  {/* Notification list */}
  <div className="max-h-96 overflow-y-auto">
    {notifications.map(notif => (
      <div key={notif.id} className={`px-4 py-3 border-b border-[#1E1E30] hover:bg-[#1C1C2E] cursor-pointer ${notif.read ? 'opacity-60' : ''}`}>
        <div className="flex items-start gap-3">
          {!notif.read && (
            <div className="w-2 h-2 rounded-full bg-[#00FF88] mt-2"></div>
          )}
          <div className="flex-1">
            <div className="text-[#F0F0F5] font-medium text-sm">{notif.title}</div>
            <div className="text-[#9494A8] text-xs mt-0.5">{notif.message}</div>
            <div className="text-[#5C5C72] text-xs mt-1">{formatRelativeTime(notif.createdAt)}</div>
          </div>
        </div>
      </div>
    ))}
  </div>
  
  {/* Empty state */}
  {notifications.length === 0 && (
    <div className="px-4 py-8 text-center text-[#5C5C72]">
      No notifications yet
    </div>
  )}
</div>
```

---

### Activity Feed Item

**Usage:** Dashboard recent activity section

**Single Item:**
```jsx
<div className="flex items-start gap-3 p-3 hover:bg-[#1C1C2E] rounded-lg transition-colors">
  {/* Icon based on type */}
  <div className="w-10 h-10 rounded-full bg-[#00FF88]/10 flex items-center justify-center flex-shrink-0">
    {activity.type === 'LINK_RAFFLED' ? (
      <Zap className="w-5 h-5 text-[#00FF88]" />
    ) : (
      <Shuffle className="w-5 h-5 text-[#4A9EFF]" />
    )}
  </div>
  
  {/* Content */}
  <div className="flex-1 min-w-0">
    <p className="text-[#F0F0F5] text-sm">{activity.message}</p>
    <p className="text-[#5C5C72] text-xs mt-0.5">{formatRelativeTime(activity.timestamp)}</p>
  </div>
  
  {/* Product logo */}
  {activity.link && (
    <img src={activity.link.product.logoUrl} className="w-8 h-8 rounded flex-shrink-0" />
  )}
</div>
```

---

### Product Card

**Usage:** Request page product grid

```jsx
<button className="group relative bg-[#141420] border border-[#2A2A3E] rounded-lg p-6 text-left hover:border-[#00FF88]/30 hover:shadow-lg transition-all">
  {/* Product logo */}
  <div className="w-16 h-16 mb-4 rounded-lg overflow-hidden bg-[#0A0A0F]">
    <img src={product.logoUrl} alt={product.name} className="w-full h-full object-cover" />
  </div>
  
  {/* Product info */}
  <h3 className="text-[#F0F0F5] font-semibold text-lg mb-1">{product.name}</h3>
  <p className="text-[#9494A8] text-xs mb-3">{product.category}</p>
  
  {/* Link count */}
  <div className="flex items-center gap-2 text-xs">
    <Link2 className="w-4 h-4 text-[#00FF88]" />
    <span className="text-[#9494A8]">
      {product.linkCount} {product.linkCount === 1 ? 'link' : 'links'} available
    </span>
  </div>
  
  {/* Hover glow */}
  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{
    boxShadow: '0 0 20px rgba(0, 255, 136, 0.1)'
  }}></div>
</button>
```

---

### Admin Table with Filters

**Usage:** All admin pages (/admin/users, /admin/products, /admin/links)

**Table Container:**
```jsx
<div className="space-y-4">
  {/* Filters bar */}
  <div className="flex items-center gap-3 flex-wrap">
    {/* Search */}
    <input
      type="text"
      placeholder="Search..."
      className="flex-1 min-w-[200px] bg-[#0A0A0F] border border-[#2A2A3E] rounded-md px-3 py-2 text-sm text-[#F0F0F5]"
    />
    
    {/* Status filter */}
    <select className="bg-[#0A0A0F] border border-[#2A2A3E] rounded-md px-3 py-2 text-sm text-[#F0F0F5]">
      <option value="">All statuses</option>
      <option value="ACTIVE">Active</option>
      <option value="PENDING">Pending</option>
      <option value="SUSPENDED">Suspended</option>
    </select>
    
    {/* Sort */}
    <select className="bg-[#0A0A0F] border border-[#2A2A3E] rounded-md px-3 py-2 text-sm text-[#F0F0F5]">
      <option value="createdAt-desc">Newest first</option>
      <option value="createdAt-asc">Oldest first</option>
      <option value="name-asc">Name A-Z</option>
    </select>
  </div>
  
  {/* Table */}
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-[#141420] border-b border-[#2A2A3E]">
          <th className="px-4 py-3 text-left text-xs font-medium text-[#9494A8] uppercase tracking-wider">Name</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-[#9494A8] uppercase tracking-wider">Status</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-[#9494A8] uppercase tracking-wider">Joined</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-[#9494A8] uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#1E1E30]">
        {items.map(item => (
          <tr key={item.id} className="hover:bg-[#1C1C2E] transition-colors">
            <td className="px-4 py-3 text-sm text-[#F0F0F5]">{item.name}</td>
            <td className="px-4 py-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[item.status]}`}>
                {item.status}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-[#9494A8]">{formatDate(item.createdAt)}</td>
            <td className="px-4 py-3 text-right">
              <button className="text-[#00FF88] hover:underline text-sm">Edit</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  
  {/* Pagination */}
  <div className="flex items-center justify-between">
    <p className="text-sm text-[#9494A8]">
      Showing {start}-{end} of {total}
    </p>
    <div className="flex gap-2">
      <button className="px-3 py-1 text-sm bg-[#141420] border border-[#2A2A3E] rounded text-[#F0F0F5] hover:bg-[#1C1C2E] disabled:opacity-50" disabled={page === 1}>
        Previous
      </button>
      <button className="px-3 py-1 text-sm bg-[#141420] border border-[#2A2A3E] rounded text-[#F0F0F5] hover:bg-[#1C1C2E] disabled:opacity-50" disabled={page === totalPages}>
        Next
      </button>
    </div>
  </div>
</div>
```

---

### Toast Notification

**Usage:** Global notification system for success/error messages

**Types:**
- Success: Green border + checkmark icon
- Error: Red border + X icon
- Info: Blue border + info icon

**Component:**
```jsx
<div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-[#141420] border-2 rounded-lg p-4 shadow-lg animate-slide-in ${borderColor[type]}`}>
  <div className="flex items-start gap-3">
    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${bgColor[type]}`}>
      {icon[type]}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[#F0F0F5] font-medium text-sm">{title}</p>
      <p className="text-[#9494A8] text-xs mt-0.5">{message}</p>
    </div>
    <button onClick={onClose} className="flex-shrink-0 text-[#5C5C72] hover:text-[#F0F0F5]">
      <X className="w-4 h-4" />
    </button>
  </div>
</div>
```

**Animation (tailwind.config.ts):**
```typescript
animation: {
  'slide-in': 'slideIn 0.3s ease-out',
},
keyframes: {
  slideIn: {
    '0%': { transform: 'translateX(100%)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' },
  },
}
```

---

### Loading Skeleton (Neon Pulse)

**Usage:** Any loading state

**Pattern:**
```jsx
<div className="space-y-3">
  {[1, 2, 3].map(i => (
    <div key={i} className="h-20 bg-[#141420] border border-[#2A2A3E] rounded-lg overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#00FF88]/5 to-transparent"></div>
    </div>
  ))}
</div>
```

**Animation (tailwind.config.ts):**
```typescript
animation: {
  shimmer: 'shimmer 2s infinite',
},
keyframes: {
  shimmer: {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
}
```
````

**Estimated Time:** 3-4 hours

---

### 🟡 Action 5: Add Slack Bot Implementation Examples to BACKEND_STRUCTURE.md

**Why High Priority:** Phase 6 (entire Slack bot) lacks implementation guidance.

**File to Update:** `BACKEND_STRUCTURE.md`

**Section to Add:** After "Slack Bot Endpoints" header (before individual command descriptions)

**Proposed Content:**

````markdown
### Slack Bot Implementation Pattern

**Request Verification (Critical for Security):**

Every Slack request must be verified using the signing secret. Add this to `lib/slack.ts`:

```typescript
import crypto from 'crypto'

export function verifySlackRequest(
  req: Request,
  signingSecret: string
): boolean {
  const timestamp = req.headers.get('x-slack-request-timestamp')
  const signature = req.headers.get('x-slack-signature')
  
  if (!timestamp || !signature) return false
  
  // Reject old requests (> 5 minutes)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp)) > 300) return false
  
  const body = await req.text()
  const sigBasestring = `v0:${timestamp}:${body}`
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  )
}
```

**Use in all Slack API routes:**

```typescript
// src/app/api/slack/commands/route.ts
export async function POST(req: Request) {
  // Verify request
  if (!verifySlackRequest(req, process.env.SLACK_SIGNING_SECRET!)) {
    return new Response('Invalid signature', { status: 401 })
  }
  
  // Parse form data (Slack sends as application/x-www-form-urlencoded)
  const formData = await req.formData()
  const command = formData.get('command')
  const text = formData.get('text')
  const userId = formData.get('user_id')
  
  // Route to appropriate handler
  if (command === '/drop') {
    return handleDropCommand(text, userId)
  } else if (command === '/raffle') {
    return handleRaffleCommand(text, userId)
  }
  
  return new Response('Unknown command', { status: 400 })
}
```

**Ephemeral Message Format:**

```typescript
// Success response
return new Response(JSON.stringify({
  response_type: 'ephemeral',  // Only visible to user who ran command
  text: '✅ Dropped!',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*HeyReach* referral link is in the raffle.\n\nYour link: \`/r/abc123xyz0\``
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Visibility: Revealed • <https://darkalleybehindgtmcafe.xyz/my-links|Manage links>`
        }
      ]
    }
  ]
}), {
  headers: { 'Content-Type': 'application/json' }
})

// Error response
return new Response(JSON.stringify({
  response_type: 'ephemeral',
  text: '❌ That doesn\'t look like a valid URL. Double-check and try again?'
}), {
  headers: { 'Content-Type': 'application/json' }
})
```

**Sending Slack DM:**

```typescript
import { WebClient } from '@slack/web-api'

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN)

export async function sendSlackDM(userId: string, message: string) {
  try {
    await slackClient.chat.postMessage({
      channel: userId,  // User ID acts as DM channel ID
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }
      ]
    })
  } catch (error) {
    console.error('Failed to send Slack DM:', error)
    // Don't throw — in-app notification is primary
  }
}
```
````

**Estimated Time:** 1 hour

---

## Tier 3: Medium Priority (Phase 6-8)

### 🟢 Action 6: Centralize Error Messages

**Why Medium:** Improves consistency but not blocking.

**File to Create:** `ERROR_MESSAGES.md` (new file)

**Content:**

```markdown
# Error Messages — GTM Cafe_Raffle

Centralized error text for consistency across web + Slack.

## Link Submission Errors

| Error Type | User Message | HTTP Code | When to Show |
|------------|--------------|-----------|--------------|
| Invalid URL | "That doesn't look like a valid URL. Double-check it?" | 400 | Zod validation fails |
| URL Unreachable | "We couldn't reach that URL. Make sure it's live?" | 422 | Fetch times out or fails |
| Duplicate Link | "You've already dropped this link." | 409 | Same user + same finalUrl |
| Rate Limited | "Slow down! Max 10 links per day. Come back tomorrow?" | 429 | > 10 links in 24h |

## Raffle Errors

| Error Type | User Message | HTTP Code | When to Show |
|------------|--------------|-----------|--------------|
| No Links Available | "No referral links for [Product] yet. Be the first to drop one!" | 404 | Zero active links |
| Rate Limited | "You've used your 3 raffles for today. Come back tomorrow!" | 429 | > 3 raffles in 24h |
| Product Not Found | "Couldn't find that product. Did you mean one of these?" | 404 | Product search fails |

## Auth Errors

| Error Type | User Message | HTTP Code | When to Show |
|------------|--------------|-----------|--------------|
| Wrong Workspace | "You need to be a GTM Cafe member. Visit gtmcafe.com to join." | 403 | Workspace ID mismatch |
| Account Suspended | "Your account has been suspended. Contact an admin for help." | 403 | User.status = SUSPENDED |
| Not Authorized | "You don't have permission to do that." | 403 | Role check fails |

## Admin Errors

| Error Type | User Message | HTTP Code | When to Show |
|------------|--------------|-----------|--------------|
| Not Admin | "Admin access required." | 403 | Role != ADMIN |
| User Not Found | "That user doesn't exist." | 404 | User ID invalid |
| Cannot Delete Self | "You can't suspend your own account." | 400 | Admin tries to suspend self |
```

**Estimated Time:** 30 minutes

---

### 🟢 Action 7: Add Landing Page Content Spec

**Why Medium:** Needed for Step 8.4 but can use placeholder initially.

**File to Update:** `APP_FLOW.md`

**Section to Add:** After "Navigation Structure" section

**Proposed Content:**

```markdown
## Landing Page Content ("/")

**Hero Section:**
- Headline: "The Dark Alley Behind GTM Cafe"
- Subheadline: "Community-powered referral link router. Drop your links. Raffle theirs. Everyone wins."
- CTA Button: "Enter the Alley" (links to /login)
- Background: Dark gradient with subtle brick texture, neon green glow on CTA

**How It Works (3 Steps):**
1. **Drop Your Links**
   - "Got a referral link for a tool you use? Share it with the community."
   - Icon: Plus circle (neon green)

2. **Raffle for Links**
   - "Need a referral? The system randomly picks a link from the pool."
   - Icon: Shuffle (amber)

3. **Track Your Impact**
   - "See when your links are raffled and how many clicks they get."
   - Icon: Bar chart (blue)

**Who Is This For:**
- "GTM Cafe is a private community for go-to-market professionals. This referral router is exclusively for verified members."
- Link to gtmcafe.com

**Footer:**
- "Sign in with Slack to get started"
- Link to Privacy Policy (TBD)
```

**Estimated Time:** 20 minutes

---

## Tier 4: Low Priority (Polish Phase)

### ⚪ Action 8: Add Accessibility Checklist

**File to Update:** `FRONTEND_GUIDELINES.md`

**Section to Add:** After "Accessibility" section

**Content:**

```markdown
### Accessibility Testing Checklist

Before marking a page complete, verify:

- [ ] All interactive elements reachable via keyboard (Tab, Enter, Escape)
- [ ] Focus visible on all interactive elements (ring-2 ring-[#00FF88]/50)
- [ ] All images have alt text
- [ ] Form inputs have associated labels (explicit or aria-label)
- [ ] Error messages announced to screen readers (aria-live="polite")
- [ ] Color contrast meets WCAG AA (4.5:1 for body text)
- [ ] Modals trap focus and return focus on close
- [ ] Loading states announced (aria-busy="true")
- [ ] Success/error toasts announced (aria-live="assertive" for errors)
```

**Estimated Time:** 15 minutes

---

## Summary by Phase

| Phase | Blockers | Actions Needed | Estimated Total Time |
|-------|----------|----------------|----------------------|
| Phase 4 | None | Actions 1-3 (Tier 1) | 1.5 hours |
| Phase 5 | Component specs | Action 4 (Tier 2) | 3-4 hours |
| Phase 6 | Slack app creation (external) | Action 5 (Tier 2) | 1 hour |
| Phase 7 | Actions 1, 3 | Already in Tier 1 | — |
| Phase 8 | None | Actions 6-7 (Tier 3) | 1 hour |
| Phase 9 | Vercel setup (external) | None | — |

**Total Documentation Work: ~7 hours**

---

## Execution Order

**Day 1 (Morning - 2 hours):**
1. ✅ Action 1: Add Notification schema → 15 min
2. ✅ Action 2: Document notification mechanism → 30 min
3. ✅ Action 3: Document dashboard APIs → 45 min
4. ✅ Run `npx prisma db push` and test → 15 min
5. ✅ Update progress.txt to mark Tier 1 complete → 5 min

**After Day 1 Morning → Phase 4-7 are unblocked!**

**Day 1 (Afternoon - 4 hours):**
6. ✅ Action 4: Add component library to FRONTEND_GUIDELINES → 3-4 hours

**Between Phases (As Needed - 2 hours):**
7. ✅ Action 5: Slack bot examples → 1 hour (before Phase 6)
8. ✅ Action 6: Centralize error messages → 30 min (before Phase 8)
9. ✅ Action 7: Landing page content → 20 min (before Step 8.4)
10. ✅ Action 8: Accessibility checklist → 15 min (before Phase 9)

---

## Post-Action Validation

After completing all Tier 1 actions, verify:
- [ ] `npx prisma generate` runs without errors
- [ ] Can create a Notification in Prisma Studio
- [ ] Dashboard API endpoint contracts match IMPLEMENTATION_PLAN.md Step 7.1
- [ ] Notification system design doesn't contradict TECH_STACK.md

After completing all Tier 2 actions, verify:
- [ ] All components in APP_FLOW.md now have specs in FRONTEND_GUIDELINES.md
- [ ] Slack bot routes have example code in BACKEND_STRUCTURE.md

---

## Final State

After completing this action plan, documentation coverage will be:

| Category | Before | After |
|----------|--------|-------|
| Database Schema | 90% | 100% ✅ |
| API Endpoints | 80% | 100% ✅ |
| Component Library | 50% | 95% ✅ |
| Slack Bot | 30% | 85% ✅ |
| Error Handling | 40% | 90% ✅ |
| Landing Page | 20% | 80% ✅ |

**Overall Documentation Completeness: 95%+**

**Result:** Implementation can proceed through Phases 4-9 with minimal guesswork.

