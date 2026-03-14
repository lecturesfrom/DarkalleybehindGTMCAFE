# Document Interconnections Map — GTM Cafe_Raffle

**Visual guide showing how the 6 canonical documents interconnect and feed into implementation**

---

## High-Level Flow

```
User Need → PRD → Design → Implementation Docs → Code

     │          │       │              │           │
     │          │       │              │           │
     ▼          ▼       ▼              ▼           ▼
Requirements  What    How It        How to      Files in
  & Goals    Looks    Works         Build       src/
```

---

## Document Dependency Tree

```
                           ┌─────────────────┐
                           │     PRD.md      │
                           │                 │
                           │ • Features F1-F11
                           │ • Acceptance     │
                           │ • Non-goals      │
                           │ • Success metrics│
                           └────────┬─────────┘
                                    │
                        ┌───────────┼──────────────┐
                        │           │              │
                        ▼           ▼              ▼
              ┌──────────────┐  ┌──────────┐  ┌─────────────────┐
              │ APP_FLOW.md  │  │TECH_STACK│  │FRONTEND_        │
              │              │  │.md       │  │GUIDELINES.md    │
              │ • 12 screens │  │          │  │                 │
              │ • 12 flows   │  │ • Locked │  │ • Color palette │
              │ • Error      │  │   deps   │  │ • Typography    │
              │   states     │  │ • Env    │  │ • Components    │
              │ • Navigation │  │   vars   │  │ • Mobile rules  │
              └──────┬───────┘  └────┬─────┘  └────────┬────────┘
                     │               │                  │
                     │       ┌───────┴──────────┐       │
                     │       │                  │       │
                     ▼       ▼                  ▼       ▼
              ┌─────────────────────────────────────────────┐
              │       BACKEND_STRUCTURE.md                  │
              │                                             │
              │  • Database schema (Prisma)                 │
              │  • API contracts (request/response)         │
              │  • Auth flow (Slack OAuth + middleware)     │
              │  • Validation pipeline                      │
              │  • Rate limiting SQL                        │
              │  • Seed data                                │
              └────────────────────┬────────────────────────┘
                                   │
                                   ▼
                        ┌────────────────────┐
                        │ IMPLEMENTATION_    │
                        │ PLAN.md            │
                        │                    │
                        │ • 9 phases         │
                        │ • 35 steps         │
                        │ • Dependencies     │
                        │ • Parallel work    │
                        └────────────────────┘
                                   │
                                   ▼
                        ┌────────────────────┐
                        │  CODE IN src/      │
                        │                    │
                        │ • Components       │
                        │ • API routes       │
                        │ • Pages            │
                        │ • Lib utilities    │
                        └────────────────────┘
```

---

## Feature → Implementation Traceability

### Example: F3 (Submit Referral Link)

```
PRD.md (F3) ─────────────────────────────────────────────┐
  "Member pastes URL, system validates,                  │
   auto-detects product, generates short code"           │
                                                          │
                          ┌───────────────────────────────┘
                          │
                          ├─► APP_FLOW.md (Flow 3)
                          │    "/submit page: URL input → detect → confirm"
                          │    + Flow 4 (Slack: /drop command)
                          │
                          ├─► FRONTEND_GUIDELINES.md
                          │    Input styling, button patterns, card layout
                          │
                          ├─► BACKEND_STRUCTURE.md
                          │    • POST /api/links (validation pipeline)
                          │    • Link validation pipeline (8 steps)
                          │    • ReferralLink table schema
                          │
                          └─► IMPLEMENTATION_PLAN.md
                               • Step 3.1: lib/links.ts
                               • Step 3.2: POST /api/links
                               • Step 3.5: /submit page
                               • Step 6.3: Slack /drop command
                                    │
                                    ▼
                          ┌─────────────────────────────┐
                          │  Actual Implementation:     │
                          │                             │
                          │  • src/lib/links.ts         │
                          │  • src/app/api/links/       │
                          │    route.ts                 │
                          │  • src/app/(app)/submit/    │
                          │    page.tsx                 │
                          │  • src/components/submit/   │
                          │    SubmitForm.tsx           │
                          │  • src/app/api/slack/       │
                          │    commands/route.ts        │
                          └─────────────────────────────┘
```

---

## Cross-Reference Matrix

| PRD Feature | APP_FLOW | FRONTEND_GUIDELINES | BACKEND_STRUCTURE | IMPLEMENTATION_PLAN |
|-------------|----------|---------------------|-------------------|---------------------|
| F1: Slack OAuth | Flow 1 | Button pattern | Auth.js config, middleware | Phase 1 (1.7, 1.8) |
| F2: Activity Gate | Flow 1 | Pending page card | Slack API check, User.status | Step 2.3 |
| F3: Submit Link | Flow 3, 4 | Input, card, button | POST /api/links, validation pipeline | Phase 3 (3.1-3.5) |
| F4: Raffle | Flow 5, 6 | Command bar, result card | POST /api/request, random selection | Phase 4 (4.3, 4.5) |
| F5: Tracked Redirect | Flow 7 | N/A (redirect only) | GET /r/[code], LinkClick logging | Step 4.4 |
| F6: My Links | Flow 8 | Table/card list | GET /api/links, stats aggregation | Step 3.6 |
| F7: Slack Bot | Flow 4, 6 | N/A (Slack UI) | /api/slack/commands, interactions | Phase 6 (all) |
| F8: Product Catalog | Flow 5 | Product grid | Product table, GET /api/products | Phase 4 (4.1, 4.5) |
| F9: Admin Panel | Flow 10-12 | Admin layout, tables | /api/admin/*, role gates | Phase 5 (all) |
| F10: Notifications | — | Badge, dropdown | ⚠️ Missing schema! | Step 7.2 |
| F11: Onboarding | Flow 9 | Banner, dismiss | localStorage (client-side) | Step 7.1 |

**Legend:**
- ✅ = Fully specified
- ⚠️ = Partially specified or gaps
- ❌ = Missing

---

## Data Flow: Link Submission

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Input (Frontend)                                        │
│    src/components/submit/SubmitForm.tsx                         │
│    • User pastes URL                                            │
│    • State: url, note, revealed                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Pre-Detection (API)                                          │
│    POST /api/links/detect                                       │
│    • Validate URL format (Zod)                                  │
│    • Resolve redirects (lib/links.ts: resolveUrl)               │
│    • Infer product (lib/links.ts: inferProduct)                 │
│    • Return: { finalUrl, product }                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. User Confirmation (Frontend)                                 │
│    SubmitForm.tsx                                               │
│    • Show detected product                                      │
│    • User confirms or selects different product                 │
│    • User adds optional note                                    │
│    • User sets visibility toggle                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Link Creation (API)                                          │
│    POST /api/links                                              │
│    • Validate input (Zod schema from lib/links.ts)              │
│    • Re-resolve URL (security: don't trust client)              │
│    • Check duplicate (Prisma query)                             │
│    • Check rate limit (COUNT last 24h)                          │
│    • Generate shortCode (nanoid)                                │
│    • Insert ReferralLink (Prisma)                               │
│    • Return: { id, shortCode, redirectUrl }                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Success Response (Frontend)                                  │
│    SubmitForm.tsx                                               │
│    • Show success toast                                         │
│    • Redirect to /my-links                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Documents Referenced:**
- APP_FLOW.md → Flow 3 (defines this user journey)
- BACKEND_STRUCTURE.md → POST /api/links (API contract), Link Validation Pipeline (8 steps)
- FRONTEND_GUIDELINES.md → Input styling, toast notification
- IMPLEMENTATION_PLAN.md → Steps 3.1, 3.2, 3.5

---

## Data Flow: Raffle Request

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Product Selection (Frontend)                                 │
│    src/app/(app)/request/page.tsx                               │
│    • User searches/browses products                             │
│    • Clicks "Raffle!" button                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Raffle Logic (API)                                           │
│    POST /api/request                                            │
│    • Check rate limit (COUNT LinkServe last 24h)                │
│    • Query active links for product (exclude own)               │
│    • Random selection: ORDER BY random() LIMIT 1                │
│    • Create LinkServe record                                    │
│    • ⚠️ Queue notification (mechanism undefined!)               │
│    • Return: { redirectUrl, contributor, product }              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Result Display (Frontend)                                    │
│    request/page.tsx                                             │
│    • Show result card with tracked URL                          │
│    • Show contributor (if revealed)                             │
│    • Copy button with checkmark animation                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Contributor Notification (Backend) ⚠️                        │
│    ❌ Mechanism undefined!                                      │
│    • Should: Create Notification record                         │
│    • Should: Send Slack DM via bot                              │
│    • Issue: No background job system per TECH_STACK             │
└─────────────────────────────────────────────────────────────────┘
```

**Gap Identified:** Notification delivery mechanism conflicts with "no background job system" in TECH_STACK.md.

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Clicks "Sign in with Slack"                            │
│    src/app/(auth)/login/page.tsx                                │
│    • SignInButton component                                     │
│    • Triggers: signIn('slack')                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Slack OAuth (External)                                       │
│    • Redirect to Slack                                          │
│    • User authorizes                                            │
│    • Slack redirects back with code                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Auth.js Callback (Backend)                                   │
│    src/lib/auth.ts                                              │
│    • Exchange code for token                                    │
│    • Get user profile from Slack                                │
│    • signIn event: Check workspace ID                           │
│    • ⚠️ Activity check (blocked: needs SLACK_BOT_TOKEN)         │
│    • Create/update User + Account (Prisma)                      │
│    • Set user.status (ACTIVE or PENDING)                        │
│    • Create session (JWT)                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Middleware Auth Check                                        │
│    src/middleware.ts                                            │
│    • Check session exists                                       │
│    • Check user.status:                                         │
│      - PENDING → /pending                                       │
│      - SUSPENDED → error page                                   │
│      - ACTIVE → allow through                                   │
│    • Check admin role for /admin/*                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Redirect to Appropriate Page                                 │
│    • ACTIVE → /dashboard                                        │
│    • PENDING → /pending                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Documents Referenced:**
- PRD.md → F1 (Slack OAuth), F2 (Activity Gate)
- APP_FLOW.md → Flow 1 (Onboarding), Flow 2 (Returning User)
- BACKEND_STRUCTURE.md → Slack OAuth Flow, Middleware Auth Checks
- IMPLEMENTATION_PLAN.md → Steps 1.7 (Auth.js config), 1.8 (middleware), 2.3 (activity check)
- TECH_STACK.md → Auth.js version, env vars

---

## Phase Dependencies Visualization

```
Phase 1: Foundation
├─ 1.1-1.8: All foundation steps
└─ ✅ COMPLETE

Phase 2: Auth + Onboarding
├─ 2.1-2.2: Login/pending pages ✅
├─ 2.3: Activity check ⚠️ (blocked: Slack app)
├─ 2.4: Seed data ✅
├─ 2.5-2.6: Layouts ✅
└─ ⚠️ MOSTLY COMPLETE

Phase 3: Link Submission
├─ 3.1-3.6: All complete ✅
└─ ✅ COMPLETE

Phase 4: Request + Redirect ◄── NEXT
├─ 4.1: GET /api/products
├─ 4.2: POST /api/products
├─ 4.3: POST /api/request
├─ 4.4: GET /r/[code]
└─ 4.5: /request page
     │
     └─ Needs: Command bar component spec ⚠️

Phase 5: Admin Panel
├─ 5.1: Admin API routes
├─ 5.2-5.4: Admin pages
└─ Needs: Table component spec ⚠️

Phase 6: Slack Bot
├─ 6.1-6.7: All Slack features
└─ ❌ BLOCKED: Slack app not created

Phase 7: Dashboard + Notifications
├─ 7.1: Dashboard
└─ 7.2: Notification system
     │
     └─ ❌ BLOCKED: Missing Notification schema

Phase 8: Polish
├─ 8.1: Rate limiting
├─ 8.2: Loading/error states
├─ 8.3: Mobile responsive
└─ 8.4: Landing page
     │
     └─ Needs: Landing page copy ⚠️

Phase 9: Deploy
└─ All deployment tasks
```

---

## Gap Summary by Document

### PRD.md
- ⚠️ F11 (Onboarding nudge) - localStorage mechanism not in PRD
- ⚠️ Open questions still marked as open but implemented in other docs
- ⚠️ Link adoption flywheel - no concrete plan

### APP_FLOW.md
- ❌ Dashboard activity feed - no data source specified
- ❌ Admin panels - minimal UI details (pagination, filters, bulk actions)
- ❌ Command bar autocomplete - no algorithm/UX spec
- ❌ Notification dropdown - no spec at all
- ⚠️ Error states - scattered, not centralized

### FRONTEND_GUIDELINES.md
- ❌ Command bar component - missing
- ❌ Notification badge/dropdown - missing
- ❌ Activity feed item - missing
- ❌ Product card - minimal
- ❌ Admin table - minimal
- ❌ Loading skeleton - "pulsing neon" but no exact spec
- ⚠️ Form validation visual patterns - incomplete
- ⚠️ Modal patterns - minimal

### BACKEND_STRUCTURE.md
- ❌ Notification table - missing from schema!
- ❌ Dashboard API endpoints - not documented
- ❌ Notification queue - contradicts TECH_STACK ("no background jobs")
- ⚠️ Slack bot endpoints - minimal implementation details
- ⚠️ Product auto-detection - domain matching algorithm unclear

### TECH_STACK.md
- ✅ Complete

### IMPLEMENTATION_PLAN.md
- ❌ Step 7.2 (Notifications) - references missing schema
- ⚠️ Phase 6 (Slack) - no code examples
- ⚠️ Step 8.1 (Rate limiting) - no implementation pattern
- ⚠️ Step 8.4 (Landing page) - no content spec

---

## Recommended Reading Order for New Developer

1. **Start: CLAUDE.md** (this project's operating manual)
2. **Then: PRD.md** (understand what and why)
3. **Then: APP_FLOW.md** (understand user journeys)
4. **Then: TECH_STACK.md** (understand tools and constraints)
5. **Then: BACKEND_STRUCTURE.md** (understand data and APIs)
6. **Then: FRONTEND_GUIDELINES.md** (understand look and feel)
7. **Finally: IMPLEMENTATION_PLAN.md** (understand build sequence)
8. **Reference: progress.txt + lessons.md** (understand current state)

For implementing a specific feature:
1. Find feature in PRD.md (e.g., F3: Submit Link)
2. Read corresponding flow in APP_FLOW.md (e.g., Flow 3)
3. Check BACKEND_STRUCTURE.md for API contract
4. Check FRONTEND_GUIDELINES.md for component styling
5. Find implementation step in IMPLEMENTATION_PLAN.md
6. Check progress.txt to see if dependencies are complete

---

## Document Update Protocol

**When adding a new feature:**
1. Add to PRD.md (feature description, acceptance criteria)
2. Add to APP_FLOW.md (user flow, screen layout)
3. Add to BACKEND_STRUCTURE.md (schema changes, API endpoints)
4. Add to FRONTEND_GUIDELINES.md (if new component pattern needed)
5. Add to IMPLEMENTATION_PLAN.md (build steps)
6. Update TODO.md (checkboxes)

**When completing a feature:**
1. Update progress.txt (mark step complete)
2. Update lessons.md (if any patterns discovered)
3. Check off TODO.md

**When discovering a bug or pattern:**
1. Update lessons.md immediately
2. If it changes approach: update relevant canonical doc

---

## Conclusion

The 6 canonical documents form a **well-structured but incomplete** specification system. The main interconnection pattern is:

**PRD → (APP_FLOW + TECH_STACK + FRONTEND_GUIDELINES) → BACKEND_STRUCTURE → IMPLEMENTATION_PLAN → Code**

Key gaps requiring immediate attention:
1. **Notification system**: Missing schema + delivery mechanism
2. **Component library**: Missing detailed UI specs for complex components
3. **Dashboard APIs**: Not documented
4. **Slack bot**: Minimal implementation guidance

Once these gaps are filled, the documentation will provide **end-to-end traceability** from user need to working code.

