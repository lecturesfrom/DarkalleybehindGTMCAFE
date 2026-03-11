# APP_FLOW — GTM Cafe_Raffle

## Screen Inventory

| Route | Page | Auth Required | Role |
|-------|------|---------------|------|
| `/` | Public landing | No | — |
| `/login` | Sign in with Slack | No | — |
| `/pending` | Account pending review | Yes | PENDING |
| `/dashboard` | Member home | Yes | ACTIVE |
| `/submit` | Drop a referral link | Yes | ACTIVE |
| `/request` | Raffle a referral | Yes | ACTIVE |
| `/my-links` | Your links + stats | Yes | ACTIVE |
| `/profile` | Profile settings | Yes | ACTIVE |
| `/admin/users` | Manage users | Yes | ADMIN |
| `/admin/products` | Manage products | Yes | ADMIN |
| `/admin/links` | Manage all links | Yes | ADMIN |
| `/r/[code]` | Tracked redirect | No | — |

## Flow 1: New User Onboarding

```
User visits darkalleybehindgtmcafe.xyz
       │
       ▼
  Landing page — "Enter the dark alley" CTA
       │
       ▼
  /login — "Sign in with Slack" button
       │
       ▼
  Slack OAuth consent screen
       │
       ▼ (authorized)
  System checks: Is this the GTM Cafe workspace?
       │
       ├── NO → Error: "You need to be a GTM Cafe member"
       │         Show link to gtmcafe.com. Dead end.
       │
       └── YES → System checks Slack activity
                    │
                    ├── Active member (meets threshold)
                    │   → Account created, status=ACTIVE
                    │   → Redirect to /dashboard
                    │
                    └── Low activity / new account
                        → Account created, status=PENDING
                        → Redirect to /pending
                        → "Your account is pending review. An admin will review shortly."
                        → Admin gets notification
```

## Flow 2: Returning User

```
User visits any protected page
       │
       ▼
  Middleware checks session
       │
       ├── No session → Redirect to /login
       │
       ├── Session + status=PENDING → Redirect to /pending
       │
       ├── Session + status=SUSPENDED → Show "Account suspended" error page
       │
       └── Session + status=ACTIVE → Allow through to requested page
```

## Flow 3: Submit Referral Link (Web — "/submit")

```
Member navigates to /submit (or clicks "Drop a Link" from dashboard)
       │
       ▼
  URL input field (large, prominent — "Paste your referral link")
       │
       ▼
  Member pastes URL, hits Enter or clicks Submit
       │
       ▼
  System processes (loading state shown):
    1. Validate URL format (Zod)
    2. HTTP fetch — follow redirects, capture final URL
    3. Check for duplicates (same user + same finalUrl)
    4. Extract domain from finalUrl
    5. Match domain against Product catalog
       │
       ├── Match found → Auto-fill product name + logo
       │
       └── No match → Show product selector dropdown
       │              + "Suggest new product" option
       │
       ▼
  Confirmation screen:
    - Product: [detected/selected product with logo]
    - URL: [final resolved URL]
    - Note: [optional text input]
    - Visibility: [toggle] "Show my name when this link is raffled"
    - [Confirm] [Cancel]
       │
       ▼ (Confirm)
  Link saved. Short code generated.
  Toast: "Link dropped! It's in the raffle."
  Redirect to /my-links
       │
  ERROR STATES:
    - Invalid URL format → "That doesn't look like a valid URL"
    - URL unreachable → "We couldn't reach that URL. Double-check it?"
    - Duplicate → "You've already dropped this link"
    - Rate limited → "Slow down! Max 10 links per day."
```

## Flow 4: Submit Referral Link (Slack — "/drop")

```
Member types: /drop https://heyreach.io/referral?ref=member123
       │
       ▼
  Bot responds (ephemeral):
    "Processing your link..."
       │
       ▼
  System runs same validation pipeline as web
       │
       ├── Success + product detected:
       │   Bot responds: "Dropped! HeyReach referral link is in the raffle."
       │   Includes: product name, link status, visibility setting (defaults to revealed)
       │   Action button: "Change to anonymous" (optional)
       │
       ├── Success + no product match:
       │   Bot responds with product selector (Slack interactive message)
       │   "What product is this for?" + dropdown of known products + "Other"
       │
       └── Error:
           Bot responds with error message (same as web error states)
```

## Flow 5: Request Referral (Web — "/request")

```
Member navigates to /request (or clicks "Raffle" from dashboard)
       │
       ▼
  Command bar at top: "Search for a product..." (autocomplete)
  Below: Browse product grid (all products with link counts)
       │
       ▼
  Member selects a product (via search or browse)
       │
       ▼
  Product detail shown:
    - Product name + logo
    - "[N] referral links available"
    - [Raffle!] button (prominent, animated)
       │
       ▼ (Click "Raffle!")
  System:
    1. Query ACTIVE links for this product
    2. Exclude requester's own links
    3. Random selection (ORDER BY random() LIMIT 1)
    4. Create LinkServe record
    5. Notify contributor (in-app + Slack DM)
       │
       ├── Link found:
       │   Show result card:
       │     - Tracked redirect URL (with copy button)
       │     - Contributor name + avatar (if opted in) or "Anonymous contributor"
       │     - "Click to use this referral"
       │     - Animation: card slides in, subtle glow
       │
       └── No links available:
           "No referral links yet for [Product]."
           "Be the first to drop one!" → links to /submit

  ERROR STATES:
    - Rate limited → "You've hit the daily limit. Come back tomorrow."
    - Product has no active links → graceful empty state (above)
```

## Flow 6: Request Referral (Slack — "/raffle")

```
Member types: /raffle HeyReach
       │
       ▼
  Bot responds (ephemeral):
       │
       ├── Match found:
       │   "Here's a HeyReach referral link:"
       │   [tracked redirect URL]
       │   "Contributed by @membername" (if opted in) or "Anonymous contributor"
       │   Action button: "Copy link"
       │
       ├── No links available:
       │   "No referral links for HeyReach yet. Drop one with /drop!"
       │
       └── Product not found:
           "Couldn't find that product. Did you mean one of these?"
           [list of closest matches]
```

## Flow 7: Tracked Redirect ("/r/[code]")

```
Anyone clicks a tracked redirect URL
       │
       ▼
  GET /r/[code]
       │
       ├── Valid code:
       │   1. Log LinkClick (user agent, hashed IP, timestamp)
       │   2. 302 redirect to real referral URL
       │   (No UI rendered — instant redirect)
       │
       └── Invalid/expired code:
           404 page: "This referral link is no longer active."
           Link to darkalleybehindgtmcafe.xyz
```

## Flow 8: My Links ("/my-links")

```
Member navigates to /my-links
       │
       ▼
  Table/card list of all their submitted links:
    Per link:
      - Product name + logo
      - Original URL (truncated)
      - Status badge (Active / Paused / Flagged)
      - Times served (raffled count)
      - Times clicked
      - Visibility (Revealed / Anonymous)
      - Date submitted
      - Actions: [Pause/Resume] [Edit Note] [Deactivate]
       │
  Empty state (no links yet):
    "You haven't dropped any links yet."
    [Drop your first link] → /submit
```

## Flow 9: Dashboard ("/dashboard")

```
Member lands on dashboard after login or navigation
       │
       ▼
  Layout:
    - Greeting: "Back in the alley, [Name]"
    - Quick actions: [Drop a Link] [Raffle a Referral]
    - Recent activity:
      - "Your HeyReach link was raffled 3 hours ago"
      - "You raffled a Smartlead link yesterday"
    - Your stats:
      - Total links dropped
      - Total times your links were served
      - Total clicks on your links
    - Products needing referrals (products with 0 links)
```

## Flow 10: Admin — Users ("/admin/users")

```
Admin navigates to /admin/users
       │
       ▼
  Table of all users:
    - Name, email, Slack username
    - Status (Active / Pending / Suspended)
    - Role (Member / Admin)
    - Joined date
    - Links count
    - Activity score from Slack
    - Actions: [Approve] [Suspend] [Make Admin]
       │
  Pending users highlighted at top with approve/reject actions
```

## Flow 11: Admin — Products ("/admin/products")

```
Admin navigates to /admin/products
       │
       ▼
  Table of all products:
    - Name, domain, category
    - Verified status
    - Active link count
    - Actions: [Edit] [Verify] [Remove]

  + [Add Product] button

  "Suggested products" section:
    - Member-suggested products pending verification
    - [Approve] [Reject] actions
```

## Flow 12: Admin — Links ("/admin/links")

```
Admin navigates to /admin/links
       │
       ▼
  Table of all links across all users:
    - Product, user, URL, status
    - Serve count, click count
    - Actions: [Flag] [Remove] [Restore]
```

## Navigation Structure

### Web App Nav (Authenticated)
```
┌──────────────────────────────────────────┐
│ [Logo] Dark Alley   [Dashboard] [My Links]│
│                     [Drop] [Raffle] [User]│
└──────────────────────────────────────────┘
```

- Logo/name: links to /dashboard
- Dashboard: /dashboard
- Drop a Link: /submit
- Raffle: /request
- My Links: /my-links
- User menu: Profile, Settings, Logout
- Admin badge (if admin): links to /admin/users

### Mobile Nav
- Hamburger menu for top nav items
- Bottom bar with 4 icons: Dashboard, Drop, Raffle, My Links
